#!/usr/bin/env node
// HOOK: PreToolUse / matcher "Bash"
// Enforcement do fluxo de Git do Central de Jogos (ver .claude/rules/gitflow.md).
//
// Fluxo do projeto: só duas branches permanentes — `master` (produção) e `dev`
// (integração). Trabalho vai em branches curtas a partir de `dev`, volta pra
// `dev`, e `dev` é promovida pra `master` quando está tudo certo.
//
// BLOQUEIA (exit 2):
//   1. `git commit` quando a branch atual é `master` / `main`.
//      -> Nunca commite trabalho direto em produção. Promova via merge de `dev`.
//   2. Criar branch (`git checkout -b`, `git switch -c`, `git branch <nome>`)
//      cujo nome NÃO é `dev`/`master`/`main` e NÃO casa
//        tipo/<descricao-kebab>   com tipo ∈ {feat, fix, chore, refactor, docs, test}
//   3. `gh pr create` com --base master/main a partir de uma branch que não é
//      `dev` -> PR de trabalho vai pra `dev`; só `dev` abre PR pra `master`.
//
// Não bloqueia nada além de git/gh. Exceção pontual (token de arquivo, nunca env):
//   node .claude/hooks/gitflow-bypass.js "<motivo>" [--uses N] [--minutes M]
const {
  readStdin, currentBranch, consumeBypass, recordBypass, bypassBanner,
  emitJson, activeBypassKinds, block,
} = require("./lib");

const PROTECTED = ["master", "main"];
const PERMANENT = ["master", "main", "dev"];
const BRANCH_RE = /^(feat|fix|chore|refactor|docs|test)\/[a-z0-9][a-z0-9-]*$/;

const input = readStdin();
const cmd = (input.tool_input && input.tool_input.command) || "";
const parts = cmd.split(/&&|\|\||;|\n/).map((s) => s.trim());

function pendingBlockMessage() {
  for (const c of parts) {
    // 1. commit direto em master/main
    if (/^git\s+(-C\s+\S+\s+)?commit\b/.test(c) && !/--dry-run/.test(c)) {
      const b = currentBranch();
      if (PROTECTED.includes(b)) {
        return (
          `[Gitflow] Commit bloqueado: você está em "${b}", branch de produção.\n` +
          `Nunca commite trabalho direto nela. Crie uma branch a partir de dev atualizado:\n` +
          `  git checkout dev && git pull\n` +
          `  git checkout -b feat/<descricao-curta>   (ou fix/ chore/ refactor/ docs/ test/)\n` +
          `A promoção pra master é o merge de dev, feito quando estiver tudo certo.\n` +
          `Regra: .claude/rules/gitflow.md. PARE e alinhe com o usuário antes de contornar.`
        );
      }
    }

    // 2. criação de branch fora do formato
    let name = null;
    const m =
      c.match(/^git\s+checkout\s+-b\s+(\S+)/) || c.match(/^git\s+switch\s+-c\s+(\S+)/);
    if (m) name = m[1];
    else {
      const bm = c.match(/^git\s+branch\s+([^-]\S*)\s*$/);
      if (bm) name = bm[1];
    }
    if (name) {
      name = name.replace(/^['"]|['"]$/g, "");
      if (!PERMANENT.includes(name) && !BRANCH_RE.test(name)) {
        return (
          `[Gitflow] Nome de branch inválido: "${name}".\n` +
          `Formato exigido:  tipo/<descricao-kebab>\n` +
          `  tipo ∈ feat | fix | chore | refactor | docs | test\n` +
          `  <descricao> = minúsculas, dígitos e hífens, sem acento/espaço\n` +
          `Ex: git checkout -b feat/tela-de-ranking\n` +
          `Regra: .claude/rules/gitflow.md. PARE e confirme com o usuário\n` +
          `(bypass de tooling: node .claude/hooks/gitflow-bypass.js "<motivo>").`
        );
      }
    }

    // 3. gh pr create --base master/main a partir de branch que não é dev
    if (/^gh\s+pr\s+create\b/.test(c)) {
      const baseMatch = c.match(/--base[=\s]+(\S+)/) || c.match(/-B[=\s]+(\S+)/);
      const base = baseMatch ? baseMatch[1].replace(/^['"]|['"]$/g, "") : null;
      if (base && ["master", "main"].includes(base)) {
        const b = currentBranch();
        if (b !== "dev") {
          return (
            `[Gitflow] PR bloqueado: base "--base ${base}" a partir de "${b}".\n` +
            `PR de trabalho vai SEMPRE para "dev". Só "dev" abre PR para "master".\n` +
            `Corrija para:  gh pr create --base dev ...\n` +
            `Regra: .claude/rules/gitflow.md. PARE e confirme com o usuário se for um caso legítimo.`
          );
        }
      }
    }
  }
  return null;
}

const pending = pendingBlockMessage();

if (!pending) {
  const isCommit = parts.some(
    (c) => /^git\s+(-C\s+\S+\s+)?commit\b/.test(c) && !/--dry-run/.test(c)
  );
  const active = activeBypassKinds();
  if (isCommit && active.length) {
    emitJson({
      systemMessage:
        `⚠  Commit com token(s) de bypass ativo(s): ${active
          .map((k) => `.claude/${k}-bypass.json`)
          .join(", ")}.\n` +
        `   Confirme que é intencional e apague o token se não for mais usar.`,
    });
  }
  process.exit(0);
}

const bp = consumeBypass("gitflow");
if (bp.state === "granted") {
  const count = recordBypass("gitflow", input.session_id, (cmd || "").slice(0, 120));
  const banner = bypassBanner("gitflow", bp, count) + `\n   comando: ${(cmd || "").slice(0, 120)}`;
  process.stderr.write("[Gitflow] " + banner + "\n");
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
  process.stderr.write("[Gitflow] token de bypass expirado/esgotado — ignorado e removido. Bloqueio normal aplicado.\n");
} else if (bp.state === "invalid") {
  process.stderr.write(`[Gitflow] token de bypass ${bp.detail}. Bloqueio normal aplicado.\n`);
}
block(pending);
