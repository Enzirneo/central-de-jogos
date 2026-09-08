#!/usr/bin/env node
// HOOK: PreToolUse / matcher "Edit|Write"
// Só age em LÓGICA DE JOGO de produção: packages/games/<nome>/src/**.ts,
// excluindo *.test.ts / *.spec.ts / __tests__/ / index.ts / types.ts / themes.ts.
// (apps/* e os demais packages ficam fora do enforcement — ver .claude/rules/tdd.md.)
//
// BLOQUEIA (exit 2) em 3 casos:
//   A. Lógica nova (função/const=()/método novo, ou arquivo novo) e NÃO existe
//      arquivo de teste correspondente. -> "crie o teste primeiro" (Red).
//   B. O último resultado em .claude/tdd-state.json foi FALHA e o arquivo que
//      você vai editar agora é DIFERENTE do que quebrou.
//      -> "conserte o vermelho antes de seguir para outro arquivo".
//   C. O último resultado foi SUCESSO, mas o diff acumulado desde a última
//      verificação já passa de 40 linhas OU 2 arquivos sem teste no meio.
//
// EXCEÇÃO PONTUAL: arme um token de arquivo (nunca env var):
//   node .claude/hooks/tdd-bypass.js "<motivo>" [--uses N] [--minutes M]
// Peça confirmação ao usuário antes. Serve para renomear arquivo, mexer só em
// tipagem/config, ou spike que vai ser jogado fora.
const path = require("path");
const {
  readStdin, classify, candidateTestPaths, anyExists, introducesNewLogic,
  readState, sh, consumeBypass, recordBypass, bypassBanner, emitJson, block, ROOT,
} = require("./lib");

const input = readStdin();
const ti = input.tool_input || {};
const fp = ti.file_path || "";
const { kind } = classify(fp);

if (kind !== "prod") process.exit(0);

const rel = path.relative(ROOT, fp).replace(/\\/g, "/");

function pendingBlockMessage() {
  // --- A. exige teste antes de lógica nova ---
  if (introducesNewLogic(ti) && !anyExists(candidateTestPaths(fp))) {
    const cands = candidateTestPaths(fp)
      .map((x) => "  " + path.relative(ROOT, x).replace(/\\/g, "/"))
      .join("\n");
    return (
      `[TDD] Não existe teste para "${rel}" ainda e esta edição introduz lógica nova.\n` +
      `Crie o teste primeiro (Red), veja-o falhar pelo motivo certo, depois implemente (Green).\n` +
      `Caminhos de teste aceitos (crie um deles):\n${cands}\n` +
      `Regra: .claude/rules/tdd.md. PARE e proponha o teste ao usuário.`
    );
  }

  // --- B / C. passos pequenos e verificados ---
  const st = readState();
  if (st.lastResult === "fail" && st.file && path.resolve(ROOT, st.file) !== path.resolve(fp)) {
    return (
      `[TDD] Há teste falhando em "${st.file}" (verificado ${st.at || "?"}).\n` +
      `Resolva o vermelho nesse arquivo antes de editar "${rel}".\n` +
      `Regra: .claude/rules/tdd.md.`
    );
  }

  if (st.lastResult === "pass") {
    let stat = "";
    try {
      stat = sh("git diff --stat -- packages/games");
    } catch {}
    const lines = stat.trim().split("\n").filter(Boolean);
    const summary = lines[lines.length - 1] || "";
    const filesChanged = parseInt((summary.match(/(\d+)\s+files?\s+changed/) || [])[1] || "0", 10);
    const insertions = parseInt((summary.match(/(\d+)\s+insertions?/) || [])[1] || "0", 10);
    const deletions = parseInt((summary.match(/(\d+)\s+deletions?/) || [])[1] || "0", 10);
    const churn = insertions + deletions;
    const since = st.churnAtCheck || 0;
    if (churn - since > 40 || filesChanged > 2) {
      return (
        `[TDD] Muita mudança acumulada sem verificar (${churn} linhas / ${filesChanged} arquivos ` +
        `desde a última rodada de testes). Rode os testes do pacote afetado antes de continuar:\n` +
        `  cd packages/games/<nome> && npm test\n` +
        `Depois disso o estado é regravado e a edição é liberada. Regra: .claude/rules/tdd.md.`
      );
    }
  }

  return null;
}

const pending = pendingBlockMessage();
if (!pending) process.exit(0);

const bp = consumeBypass("tdd");
if (bp.state === "granted") {
  const count = recordBypass("tdd", input.session_id, rel);
  const banner = bypassBanner("tdd", bp, count) + `\n   arquivo: ${rel}`;
  process.stderr.write("[TDD] " + banner + "\n");
  emitJson({
    systemMessage: banner,
    hookSpecificOutput: {
      hookEventName: "PreToolUse",
      permissionDecision: "allow",
      permissionDecisionReason: banner,
    },
  });
  process.exit(0);
}
if (bp.state === "expired") {
  process.stderr.write("[TDD] token de bypass expirado/esgotado — ignorado e removido. Bloqueio normal aplicado.\n");
} else if (bp.state === "invalid") {
  process.stderr.write(`[TDD] token de bypass ${bp.detail}. Bloqueio normal aplicado.\n`);
}
block(pending);
