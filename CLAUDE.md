# CLAUDE.md — Central de Jogos

Este arquivo é a referência de arquitetura do projeto. Leia-o no início de qualquer sessão antes de gerar código. Qualquer decisão que conflite com o que está aqui deve ser discutida com o time antes de ser implementada.

## 1. Visão geral

**Central de Jogos** é uma plataforma multiplayer local/remoto no estilo Jackbox Games: um grupo de amigos cria uma sala, cada pessoa entra pelo próprio celular, e dentro dessa sala eles jogam jogos do estilo trivia/cartas com bastante interação entre os jogadores.

Características centrais do produto:
- O número de jogos disponíveis na plataforma é **indefinido e crescente** — a arquitetura precisa suportar adicionar jogos novos sem retrabalho na Central.
- Cada jogador usa o **próprio celular como hub individual** dentro da sala (não há necessariamente uma "tela mestre" compartilhada tipo TV).
- Precisa rodar em **iOS, Android e Web** a partir da mesma base de código.
- Precisa ser **escalável** (múltiplas salas simultâneas, muitos jogadores).

> ⚠️ **Decisões ainda em aberto** (assumções abaixo até serem confirmadas pelo time):
> 1. Existe uma tela mestre/TV compartilhada em algum modo de jogo, ou é sempre celular-a-celular? *(assumindo: sempre celular-a-celular por enquanto)*
> 2. Partidas toleram desconexão/reconexão do jogador no meio do jogo? *(assumindo: sim, precisa tolerar)*
> 3. Limite máximo de jogadores por sala? *(assumindo: até 12 por sala inicialmente, revisar depois)*

## 2. Stack tecnológica

| Camada | Escolha | Motivo |
|---|---|---|
| Cliente (mobile + web) | **React Native + Expo** (TypeScript) | Um código só gera iOS, Android e Web (via `expo export --platform web`) |
| Servidor de jogo / real-time | **Node.js + Colyseus** (TypeScript) | Framework feito para "salas" multiplayer, com sincronização de estado e escalabilidade horizontal nativas |
| Estado efêmero de sala | **Redis** | Rápido, expira sozinho, permite múltiplas instâncias do servidor via pub/sub |
| Dados persistentes | **PostgreSQL** | Usuários, histórico de partidas, ranking, amizades |
| Autenticação | **A definir** — candidatos: Firebase Auth, Auth0, ou JWT próprio | — |
| Deploy do servidor | **Docker**, hospedado em Fly.io/Railway/AWS (a definir) | Facilita escalar horizontalmente depois |
| Monorepo | **Turborepo** | Compartilhar tipos e lógica entre app e servidor |

## 3. Estrutura do monorepo

```
central-de-jogos/
├── apps/
│   ├── mobile-web/          # App Expo (iOS + Android + Web)
│   └── server/               # Servidor Colyseus (Node.js)
├── packages/
│   ├── shared-types/         # Tipos TS compartilhados entre cliente e servidor
│   ├── ui/                   # Componentes visuais reutilizáveis (botões, cards, etc.)
│   └── games/
│       ├── _template/        # Esqueleto para começar um jogo novo
│       ├── trivia-classico/  # Cada jogo é uma pasta isolada
│       └── ...
├── CLAUDE.md
├── turbo.json
└── package.json
```

Regra geral: **nenhum código de um jogo específico deve viver fora de `packages/games/<nome-do-jogo>`.** A Central (lobby, autenticação, navegação entre salas) nunca deve importar lógica interna de um jogo — só a interface padrão descrita abaixo.

## 4. Arquitetura de "jogo plugável"

Esse é o contrato mais importante do projeto. Todo jogo novo implementa a mesma interface, para que a Central saiba iniciar, alimentar e encerrar qualquer jogo sem conhecer suas regras internas.

```typescript
// packages/shared-types/src/game-plugin.ts

export interface GamePlugin<TState = unknown, TAction = unknown, TOptions = unknown> {
  /** Identificador único do jogo, usado no catálogo */
  id: string;

  /** Nome exibido ao usuário */
  displayName: string;

  /** Mínimo e máximo de jogadores suportados */
  minPlayers: number;
  maxPlayers: number;

  /**
   * Cria o estado inicial do jogo quando a sala decide iniciá-lo.
   * `options` carrega configurações escolhidas pelo host antes de começar
   * (ex: modo de jogo, número de rodadas) — cada jogo define seu próprio
   * formato e deve validar o que recebe, pois chega direto do cliente.
   */
  createInitialState(players: PlayerId[], options?: TOptions): TState;

  /** Processa uma ação de um jogador e retorna o novo estado */
  applyAction(state: TState, playerId: PlayerId, action: TAction): TState;

  /** Indica se o jogo terminou, dado o estado atual */
  isGameOver(state: TState): boolean;

  /** Retorna o placar final quando o jogo termina */
  getResults(state: TState): GameResults;

  /** Estado que deve ser enviado a um jogador específico (permite esconder info, ex: cartas de outros) */
  getStateForPlayer(state: TState, playerId: PlayerId): unknown;
}
```

Checklist para adicionar um jogo novo:
1. Criar pasta em `packages/games/<nome-do-jogo>`.
2. Implementar `GamePlugin` com o estado e as ações específicas do jogo.
3. Criar as telas React Native correspondentes em `apps/mobile-web`, isoladas em sua própria rota.
4. Registrar o jogo no catálogo central (`packages/shared-types/src/catalog.ts`).
5. Testar isoladamente antes de expor na Central.

## 5. Fluxo de sala (lobby)

1. Jogador cria uma sala → servidor gera um código curto (ex: `ABCD`) e cria uma instância de sala no Colyseus.
2. Outros jogadores entram digitando o código.
3. Dentro da sala, qualquer jogador (ou só o "host", a definir) escolhe qual jogo do catálogo iniciar.
4. A sala instancia o `GamePlugin` correspondente e passa a rotear ações dos jogadores para `applyAction`.
5. Ao final (`isGameOver`), a sala volta ao estado de lobby, pronta para escolher o próximo jogo — permitindo maratonas de vários jogos na mesma sala.
6. Se um jogador desconectar, a sala mantém seu estado por um tempo de tolerância (ex: 60s) antes de removê-lo, para permitir reconexão.

## 6. Convenções de código

- TypeScript estrito (`strict: true`) em todo o monorepo.
- Nomes de eventos de WebSocket em `snake_case` (ex: `player_joined`, `action_submitted`).
- Nenhum estado de jogo deve ser guardado só no cliente — o servidor é sempre a fonte da verdade (evita trapaça e problemas de sincronização).
- Todo `GamePlugin` novo precisa de testes unitários cobrindo `applyAction` e `isGameOver` antes de ser exposto na Central.

## 7. Build e deploy

Nem toda parte do projeto usa a mesma estratégia de build — cada peça tem a ferramenta certa pra ela.

| Peça | Local (desenvolvimento) | Produção |
|---|---|---|
| Servidor (`apps/server`) | `docker compose up` (sobe servidor + Postgres + Redis) | Railway builda o mesmo `Dockerfile`, sem alterações |
| App Web (`apps/mobile-web`) | `expo export --platform web` | Vercel builda direto do repositório — **sem Docker** |
| App iOS/Android | Expo Go, pra testar rápido no celular | EAS Build (serviço de build em nuvem do Expo) — **sem Docker** |

Regras importantes:
- **Docker existe apenas para o servidor.** Ele empacota o Colyseus + dependências em uma imagem que roda igual local e em produção. O `Dockerfile` fica em `apps/server`, com build multi-stage (uma etapa de instalação/compilação, outra enxuta só com o necessário para rodar).
- **`docker-compose.yml` na raiz é só para desenvolvimento local**: sobe servidor + Postgres + Redis juntos com um comando. Em produção, o Railway builda apenas o `Dockerfile` do servidor e usa Postgres/Redis gerenciados por ele — o compose não é usado em produção.
- **Nunca containerizar `apps/mobile-web`.** Apps iOS só compilam em ambiente com Xcode (regra da Apple, Docker não contorna isso); a versão web é só HTML/JS/CSS estático, que o Vercel builda de forma mais simples e rápida sem Docker.
- Variáveis sensíveis (strings de conexão, chaves) ficam em `.env` (nunca commitado), com um `.env.example` documentando as chaves necessárias sem os valores reais.

## 8. Roadmap de implementação

1. Monorepo + esqueleto do app Expo + esqueleto do servidor Colyseus, com um "echo" simples entre os dois.
2. Central/lobby funcional: criar sala, entrar por código, lista de jogadores em tempo real. Sem nenhum jogo ainda.
3. Definir e travar a interface `GamePlugin`.
4. Implementar um primeiro jogo simples de ponta a ponta como prova de conceito.
5. Testar múltiplas salas simultâneas e ajustar uso de Redis.
6. Deploy inicial (staging) e testes com usuários reais entre vários celulares.
7. A partir daí, adicionar jogos novos incrementalmente.
