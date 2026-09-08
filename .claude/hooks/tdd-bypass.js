#!/usr/bin/env node
// Arma um bypass PONTUAL do hook pre-edit-tdd.js criando .claude/tdd-bypass.json.
//
//   node .claude/hooks/tdd-bypass.js "<motivo>" [--uses N] [--minutes M]
//
// Padrão: 1 uso, expira em 15 min. Cada Edit/Write em lógica de jogo que SERIA
// bloqueado consome 1 uso; ao zerar (ou expirar) o token se apaga sozinho.
// NÃO é env var: não herda para outros processos nem para a próxima sessão.
// Confirme com o usuário antes de usar.
require("./lib").runArmCli("tdd");
