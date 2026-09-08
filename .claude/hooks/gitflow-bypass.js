#!/usr/bin/env node
// Arma um bypass PONTUAL do hook pre-bash-gitflow.js criando .claude/gitflow-bypass.json.
//
//   node .claude/hooks/gitflow-bypass.js "<motivo>" [--uses N] [--minutes M]
//
// Padrão: 1 uso, expira em 15 min. Cada comando git/gh que SERIA bloqueado
// consome 1 uso; ao zerar (ou expirar) o token se apaga sozinho.
// NÃO é env var: não herda para outros processos nem para a próxima sessão.
// Confirme com o usuário antes de usar (ex: branch de tooling dependabot/..., revert-...).
require("./lib").runArmCli("gitflow");
