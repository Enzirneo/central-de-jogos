#!/usr/bin/env node
// HOOK: PostToolUse / matcher "Edit|Write"
// Depois de QUALQUER edição em lógica de jogo (produção OU teste) sob
// packages/games/<nome>/src:
//   1. Roda `tsc --noEmit` no pacote afetado (o "lint" deste monorepo).
//      Erros de tipo são reportados ao Claude via stderr (exit 2).
//   2. Roda a suíte de teste do pacote afetado (`tsx --test src/*.test.ts`).
//      Falhas são reportadas via stderr (exit 2).
//   3. Grava .claude/tdd-state.json { file, lastResult, at, churnAtCheck } para
//      o pre-edit-tdd.js forçar passos pequenos.
// Se `tsx`/deps não estiverem instalados, apenas avisa (não marca falha).
const path = require("path");
const {
  readStdin, classify, packageDirOf, sh, writeState, ROOT,
  readAudit, writeAudit, emitJson,
} = require("./lib");

const input = readStdin();
const ti = input.tool_input || {};
const fp = ti.file_path || "";
const { kind, area } = classify(fp);
if (kind === "other" || area !== "game") process.exit(0);

const pkgDir = packageDirOf(fp);
if (!pkgDir) process.exit(0);
const pkgRel = path.relative(ROOT, pkgDir).replace(/\\/g, "/");
const rel = path.relative(ROOT, fp).replace(/\\/g, "/");
const msgs = [];
let testResult = null; // "pass" | "fail" | null

function run(cmd, cwd) {
  try {
    return { ok: true, out: sh(cmd, { cwd, timeout: 120000 }) };
  } catch (e) {
    return { ok: false, out: (e.stdout || "") + (e.stderr || ""), code: e.status };
  }
}
const missing = (o) =>
  /not found|is not recognized|Cannot find module|command not found|could not determine executable|npm error/i.test(o);

// 1. checagem de tipos
const tsc = run(`npx --no-install tsc --noEmit -p tsconfig.json`, pkgDir);
if (!tsc.ok && !missing(tsc.out)) {
  msgs.push("[tsc] erros de tipo:\n" + tsc.out.trim().slice(-3000));
}

// 2. testes do pacote
const t = run(`npm test --silent`, pkgDir);
if (missing(t.out)) {
  msgs.push(`[test] runner não instalado em ${pkgRel} — rode \`npm install\` na raiz.`);
} else if (/no test files|matches no files/i.test(t.out)) {
  msgs.push(`[test] (${pkgRel}) nenhum arquivo de teste encontrado.`);
} else {
  testResult = t.ok ? "pass" : "fail";
  if (!t.ok) msgs.push(`[test] (${pkgRel}) FALHOU:\n` + t.out.trim().slice(-3000));
}

// 3. estado
let churn = 0;
try {
  const stat = sh("git diff --stat -- packages/games").trim().split("\n").pop() || "";
  churn =
    parseInt((stat.match(/(\d+)\s+insertions?/) || [])[1] || "0", 10) +
    parseInt((stat.match(/(\d+)\s+deletions?/) || [])[1] || "0", 10);
} catch {}

if (testResult) {
  writeState({
    file: rel,
    lastResult: testResult,
    at: new Date().toISOString(),
    churnAtCheck: testResult === "pass" ? churn : 0,
  });
}

// Aviso de bypass: o pre-hook deixou um "pending" se este edit driblou o TDD.
const audit = readAudit();
let bypassNote = "";
if (audit.pending) {
  bypassNote =
    `⚠  O edit em "${audit.pending.target}" rodou sob BYPASS de ${String(audit.pending.kind).toUpperCase()} — ` +
    `NÃO foi coberto pelo ciclo red-green. (${audit.count} ação(ões) sob bypass nesta sessão.)`;
  audit.pending = null;
  writeAudit(audit);
}

if (msgs.length) {
  if (bypassNote) msgs.push(bypassNote);
  process.stderr.write(msgs.join("\n\n") + "\n");
  process.exit(2);
}
if (bypassNote) {
  emitJson({ hookSpecificOutput: { hookEventName: "PostToolUse", additionalContext: bypassNote } });
}
process.exit(0);
