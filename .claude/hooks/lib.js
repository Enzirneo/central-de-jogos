// Utilidades compartilhadas pelos hooks. Sem dependências externas (Node puro).
// Adaptado do projeto commission-insight para o monorepo TypeScript Central de Jogos:
//   - só existe TypeScript (sem backend Python / venv);
//   - testes rodam com `node:test` via `tsx --test` dentro de cada pacote;
//   - "lint" é `tsc --noEmit` (não há eslint configurado);
//   - o enforcement de TDD cobre só a LÓGICA DE JOGO em packages/games/*/src,
//     que o CLAUDE.md já exige testar (applyAction / isGameOver).
const { execSync } = require("child_process");
const fs = require("fs");
const path = require("path");

const ROOT = process.env.CLAUDE_PROJECT_DIR || process.cwd();

function readStdin() {
  try {
    return JSON.parse(fs.readFileSync(0, "utf8") || "{}");
  } catch {
    return {};
  }
}

// cmd.exe pode estar desativado por política nesta máquina — usa PowerShell como
// shell dos hooks. Sobrescrevível via env CLAUDE_HOOK_SHELL.
const HOOK_SHELL =
  process.env.CLAUDE_HOOK_SHELL ||
  (process.platform === "win32" ? "powershell.exe" : "/bin/sh");

function sh(cmd, opts = {}) {
  return execSync(cmd, {
    cwd: ROOT,
    encoding: "utf8",
    shell: HOOK_SHELL,
    stdio: ["ignore", "pipe", "pipe"],
    ...opts,
  });
}

function currentBranch() {
  // Lê .git/HEAD direto — não depende do binário git estar no PATH do shell
  // que executa o hook (importante no Windows).
  try {
    let gitPath = path.join(ROOT, ".git");
    const st = fs.statSync(gitPath);
    if (st.isFile()) {
      const gd = fs
        .readFileSync(gitPath, "utf8")
        .trim()
        .replace(/^gitdir:\s*/, "");
      gitPath = path.isAbsolute(gd) ? gd : path.resolve(ROOT, gd);
    }
    const head = fs.readFileSync(path.join(gitPath, "HEAD"), "utf8").trim();
    const m = head.match(/^ref:\s*refs\/heads\/(.+)$/);
    if (m) return m[1];
  } catch {}
  try {
    return sh("git branch --show-current").trim();
  } catch {}
  return "";
}

// Pasta do pacote workspace que contém o arquivo (…/packages/games/ito), ou null.
function packageDirOf(fp) {
  const p = fp.replace(/\\/g, "/");
  const m = p.match(/^(.*?\/?packages\/games\/[^/]+)\/src\//);
  return m ? m[1] : null;
}

// Classifica um caminho de arquivo. Retorna { kind, area } onde:
//   kind: "prod" | "test" | "other"
//   area: "game" | null
// Só a lógica de jogo (packages/games/<nome>/src/**.ts, fora de testes e index.ts)
// entra no enforcement de TDD. apps/* e os demais packages ficam de fora.
function classify(fp) {
  if (!fp) return { kind: "other", area: null };
  const p = fp.replace(/\\/g, "/");
  if (!/(^|\/)packages\/games\/[^/]+\/src\/.+\.ts$/.test(p)) {
    return { kind: "other", area: null };
  }
  const isTestName = /(\.test\.ts$|\.spec\.ts$|\/__tests__\/)/.test(p);
  if (isTestName) return { kind: "test", area: "game" };
  if (/\/(index|types|themes)\.ts$/.test(p)) return { kind: "other", area: "game" };
  return { kind: "prod", area: "game" };
}

// Possíveis caminhos de teste para um arquivo de produção.
function candidateTestPaths(fp) {
  const p = fp.replace(/\\/g, "/");
  const dir = path.posix.dirname(p);
  const base = path.posix.basename(p).replace(/\.ts$/, "");
  const out = [
    `${dir}/${base}.test.ts`,
    `${dir}/${base}.spec.ts`,
    `${dir}/__tests__/${base}.test.ts`,
  ];
  return [...new Set(out)].map((x) => (path.isAbsolute(x) ? x : path.join(ROOT, x)));
}

function anyExists(paths) {
  return paths.some((x) => {
    try {
      return fs.statSync(x).isFile();
    } catch {
      return false;
    }
  });
}

// Heurística: o conteúdo introduz uma função/método/def nova que não existia antes?
function introducesNewLogic(input) {
  const after = input.content ?? input.new_string ?? "";
  const before = input.old_string ?? "";
  const isWriteNewFile = input.content !== undefined;
  const names = new Set();
  const re =
    /(?:^|\s)(?:export\s+)?(?:async\s+)?function\s+([A-Za-z_$][\w$]*)|(?:^|\s)(?:export\s+)?const\s+([A-Za-z_$][\w$]*)\s*=\s*(?:async\s*)?(?:\([^)]*\)|[A-Za-z_$][\w$]*)\s*=>|(?:^|\s)(?:public|private|protected|static)?\s*([A-Za-z_$][\w$]*)\s*\([^)]*\)\s*[:{]/gm;
  let m;
  while ((m = re.exec(after))) names.add(m[1] || m[2] || m[3]);
  if (isWriteNewFile) {
    try {
      fs.statSync(input.file_path);
    } catch {
      return names.size > 0 || after.trim().length > 0;
    }
  }
  for (const n of names) {
    if (n && !new RegExp(`\\b${n}\\b`).test(before)) return true;
  }
  return false;
}

const STATE_PATH = path.join(ROOT, ".claude", "tdd-state.json");
function readState() {
  try {
    return JSON.parse(fs.readFileSync(STATE_PATH, "utf8"));
  } catch {
    return {};
  }
}
function writeState(s) {
  try {
    fs.writeFileSync(STATE_PATH, JSON.stringify(s, null, 2));
  } catch {}
}

function block(msg) {
  process.stderr.write(msg + "\n");
  process.exit(2);
}

// ---------------------------------------------------------------------------
// Bypass PONTUAL por token de arquivo (nunca env var — env var vaza entre
// sessões por ser herdada pelos processos filhos).
//
// Token: .claude/<kind>-bypass.json  ->  { reason, expiresAt (ISO), usesLeft }
//   - ausente          -> SEM bypass (estado seguro padrão)
//   - expirado / zerado -> SEM bypass; o arquivo é removido
//   - válido           -> concede 1 uso e decrementa usesLeft
// `kind` ∈ {"tdd", "gitflow"}.
// ---------------------------------------------------------------------------
const BYPASS_FILE = (kind) => path.join(ROOT, ".claude", `${kind}-bypass.json`);

function consumeBypass(kind) {
  const p = BYPASS_FILE(kind);
  let tok;
  try {
    tok = JSON.parse(fs.readFileSync(p, "utf8"));
  } catch (e) {
    if (e && e.code === "ENOENT") return { state: "absent" };
    try {
      fs.unlinkSync(p);
    } catch {}
    return { state: "invalid", detail: "arquivo ilegível — removido" };
  }
  const exp = Date.parse(tok && tok.expiresAt);
  const uses = Number.isInteger(tok && tok.usesLeft) ? tok.usesLeft : 0;
  if (!Number.isFinite(exp) || exp <= Date.now() || uses <= 0) {
    try {
      fs.unlinkSync(p);
    } catch {}
    return { state: "expired", reason: tok && tok.reason, expiresAt: tok && tok.expiresAt };
  }
  const usesLeft = uses - 1;
  if (usesLeft <= 0) {
    try {
      fs.unlinkSync(p);
    } catch {}
  } else {
    try {
      fs.writeFileSync(p, JSON.stringify({ ...tok, usesLeft }, null, 2) + "\n");
    } catch {}
  }
  return {
    state: "granted",
    reason: (tok && tok.reason) || "(sem motivo)",
    expiresAt: tok && tok.expiresAt,
    usesLeft,
  };
}

function armBypass(kind, { reason, uses = 1, minutes = 15 } = {}) {
  if (!reason || !String(reason).trim()) {
    throw new Error(
      `motivo obrigatório: node .claude/hooks/${kind}-bypass.js "<motivo>" [--uses N] [--minutes M]`
    );
  }
  const mins = parseInt(minutes, 10) || 15;
  const tok = {
    reason: String(reason).trim(),
    expiresAt: new Date(Date.now() + mins * 60_000).toISOString(),
    usesLeft: Math.max(1, parseInt(uses, 10) || 1),
  };
  fs.writeFileSync(BYPASS_FILE(kind), JSON.stringify(tok, null, 2) + "\n");
  return tok;
}

function activeBypassKinds() {
  return ["tdd", "gitflow"].filter((k) => {
    try {
      return fs.statSync(BYPASS_FILE(k)).isFile();
    } catch {
      return false;
    }
  });
}

const AUDIT_PATH = path.join(ROOT, ".claude", "bypass-audit.json");
function readAudit() {
  try {
    return JSON.parse(fs.readFileSync(AUDIT_PATH, "utf8"));
  } catch {
    return {};
  }
}
function writeAudit(a) {
  try {
    fs.writeFileSync(AUDIT_PATH, JSON.stringify(a, null, 2) + "\n");
  } catch {}
}

function recordBypass(kind, sessionId, target) {
  const a = readAudit();
  const sid = sessionId || "?";
  if (a.sessionId !== sid) {
    a.sessionId = sid;
    a.count = 0;
    a.events = [];
  }
  a.count = (a.count || 0) + 1;
  const ev = { at: new Date().toISOString(), kind, target: target || "?" };
  a.events = (a.events || []).slice(-19).concat(ev);
  if (kind === "tdd") a.pending = ev;
  writeAudit(a);
  return a.count;
}

function bypassBanner(kind, bp, count) {
  const K = kind === "tdd" ? "TDD" : "Gitflow";
  return (
    `⚠  BYPASS DE ${K} ATIVO — esta ação NÃO passou pelas checagens de ${K}.\n` +
    `   motivo: ${bp.reason}\n` +
    `   token: ${bp.usesLeft} uso(s) restante(s) · expira ${bp.expiresAt}\n` +
    `   ações sob bypass nesta sessão até agora: ${count}`
  );
}

function emitJson(obj) {
  process.stdout.write(JSON.stringify(obj));
}

function runArmCli(kind) {
  const argv = process.argv.slice(2);
  const opts = { reason: "", uses: 1, minutes: 15 };
  for (let i = 0; i < argv.length; i++) {
    if (argv[i] === "--uses") opts.uses = argv[++i];
    else if (argv[i] === "--minutes") opts.minutes = argv[++i];
    else if (!opts.reason && !argv[i].startsWith("--")) opts.reason = argv[i];
  }
  try {
    const tok = armBypass(kind, opts);
    process.stdout.write(
      `[${kind}] bypass ARMADO — ${tok.usesLeft} uso(s), expira ${tok.expiresAt}\n` +
        `  motivo: ${tok.reason}\n` +
        `  cancele antes da hora apagando .claude/${kind}-bypass.json\n`
    );
  } catch (e) {
    process.stderr.write(String((e && e.message) || e) + "\n");
    process.exit(1);
  }
}

module.exports = {
  ROOT,
  readStdin,
  sh,
  currentBranch,
  packageDirOf,
  classify,
  candidateTestPaths,
  anyExists,
  introducesNewLogic,
  readState,
  writeState,
  STATE_PATH,
  block,
  BYPASS_FILE,
  consumeBypass,
  armBypass,
  runArmCli,
  activeBypassKinds,
  readAudit,
  writeAudit,
  recordBypass,
  bypassBanner,
  emitJson,
  AUDIT_PATH,
};
