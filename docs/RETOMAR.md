# Prompt para retomar — Central de Jogos, Fase 3 (Flutter)

Cole no início da conversa nova:

---

Continuando a migração do **Central de Jogos**. Leia `CLAUDE.md` e
`docs/PLANO_MIGRACAO_ANGULAR_FLUTTER.md` (seção 12 = progresso; procure "RETOMAR").

**Estado:** branch `dev`. Fases 0, 1 e 2 concluídas — servidor Colyseus + web
Angular (`apps/web`) funcionando ponta a ponta: criar/entrar sala, lobby,
ready-check, jogos Contador e ITO, reconexão. `chore/web-deploy` foi adiado pra
Fase 4.

**Próximo: Fase 3 — Flutter (`apps/mobile`).** Espelha a web:
- `feat/mobile-scaffold`: `flutter create apps/mobile` (só Android), deps
  (Riverpod, go_router, freezed), `flutter test` no CI.
- Estrutura igual à web: `core/` (colyseus client + room store), `features/`,
  `features/games/` com registry. Contrato do protocolo espelhado à mão de
  `docs/contrato-wire.md` (Dart não importa TS).
- Tipos do ITO: espelhar `apps/web/src/app/features/games/ito/ito.types.ts`.
- Design: `ThemeData` a partir de `apps/web/src/styles/_tokens.scss` /
  `docs/preview-visual.html`.

**Pré-requisito do usuário:** Android Studio + Flutter SDK instalados,
`flutter doctor` com a toolchain Android verde. Não começar o scaffold sem isso.

**Regras:** branch por passo a partir de `dev`, merge `--no-ff`, nunca `master`.
`npm run lint` + `npm test` verdes antes de cada merge (o web entra no turbo).
Conventional Commits.
