#!/usr/bin/env node
// HOOK: Stop — resumo ao fim de cada resposta se houve bypass nesta sessão.
// Não bloqueia nada; só emite um systemMessage lembrando que N ações driblaram
// as checagens e/ou que ainda há token de bypass no disco.
const { readStdin, readAudit, activeBypassKinds } = require("./lib");

const input = readStdin();
const a = readAudit();
const active = activeBypassKinds();

const sameSession = a.sessionId && a.sessionId === input.session_id;
const n = sameSession ? a.count || 0 : 0;

if (!n && active.length === 0) process.exit(0);

const lines = [];
if (n) {
  lines.push(
    `⚠  ${n} ação(ões) rodaram sob BYPASS de TDD/Gitflow nesta sessão — ` +
      `não passaram pelas checagens (teste antes da lógica, passos pequenos, Gitflow).`
  );
}
if (active.length) {
  lines.push(
    `Token(s) de bypass ainda no disco: ${active
      .map((k) => `.claude/${k}-bypass.json`)
      .join(", ")} — apague se não for mais usar (senão o próximo edit/comando ` +
      `que seria bloqueado passa em silêncio).`
  );
}

process.stdout.write(JSON.stringify({ systemMessage: lines.join("\n") }));
process.exit(0);
