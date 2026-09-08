# Clean Code — regras de execução

> **Fonte:** estudo de *Clean Code* (Robert C. Martin et al.), caps. 1–13 + o
> catálogo de smells do cap. 17. Checklist operacional: serve para conferir
> enquanto se escreve e antes de dar um passo como pronto. Adaptado do projeto
> commission-insight — aqui a base é **TypeScript estrito em todo o monorepo**
> (CLAUDE.md §6).

---

## 0. O que "código limpo" significa

Qualidades que se somam: elegância, legibilidade tipo prosa, **testabilidade**
("código sem testes não é limpo, por mais elegante que seja"), cuidado,
simplicidade, previsibilidade ("cada rotina é mais ou menos o que você
esperava").

- **Regra do Escoteiro:** deixe o código um pouco mais limpo do que encontrou, a
  cada mudança.
- **Janelas quebradas:** código ruim convida mais código ruim. Não deixe a
  primeira sujeira passar "só dessa vez".

## 1. Nomes (smells N1–N7)

- **Revela a intenção:** se precisa de comentário ao lado, o nome falhou.
- **Sem desinformação:** não chame de `...List` o que não é lista; nunca `l`/`O`
  como variável.
- **Distinções com significado:** proibido `a1, a2`; proibido ruído (`Info`,
  `Data`, `Object`, `Manager`).
- **Pronunciável e pesquisável:** número mágico vira constante nomeada (o
  `TARGET_COUNT` do `_template` é o exemplo certo). Nome de uma letra só em loop
  de escopo curtíssimo.
- **Sem encoding:** nada de notação húngara, `strNome`, `IShape`. O type system
  já sabe o tipo.
- **Classe = substantivo** (`LobbyRoom`, `RoomCode`); **método = verbo**
  (`applyAction`, `isGameOver`). Acessor/predicado: `get`/`is`.
- **Uma palavra por conceito:** não misture `fetch`/`get`/`retrieve`.
- **Contexto:** `state` solto é ambíguo; dentro de `ItoGameState` é claro.
- Nome longo para escopo longo; nome no nível de abstração certo (interface tem
  nome genérico, sem revelar implementação).

## 2. Funções (smells F1–F4, G30–G34)

- **Pequenas — e menores que isso.** Padrão-ouro: 2–4 linhas. Blocos dentro de
  `if`/`for` têm ~1 linha (uma chamada nomeada). Indentação de 1–2 níveis.
- **Faz UMA coisa:** todos os passos um nível de abstração abaixo do nome da
  função.
- **Stepdown Rule:** o arquivo lê como narrativa de cima para baixo.
- **`switch`:** tolerável só se aparece uma vez, cria objetos polimórficos e fica
  atrás de uma Factory — como o `registry.ts` mapeia `id → GamePlugin`. Em geral:
  **prefira polimorfismo a `if/else`/`switch` sobre tipo** (G23). No `applyAction`
  o `switch (action.type)` é aceitável — é despacho de mensagem, não de tipo de
  objeto — mas mantenha cada `case` com uma linha chamando um helper nomeado.
- **Argumentos:** 0 ideal, 1 ótimo, 2 cuidado, 3 evite, 4+ não. Grupo que anda
  junto vira Argument Object.
- **Sem flag booleana** (`render(true)`) → divida em duas funções.
- **Sem efeito colateral escondido:** `applyAction` não pode logar, mandar evento
  de socket ou mutar o `state` recebido por baixo.
- **Command/Query Separation:** ou muda estado, ou responde — nunca os dois.
- **DRY:** duplicação é a raiz de quase todo problema de manutenção.

## 3. Comentários (smells C1–C5)

- **Comentário não compensa código ruim.** `// checa se o jogo acabou` →
  `if (isGameOver(state))`.
- **Aceitáveis:** legal/licença; explicação de **intenção** (por que esta
  decisão); aviso de consequência; `TODO` rastreável.
- **Ruins (remova):** redundante; **enganoso/obsoleto** (pior que nenhum);
  ruído; **código comentado** (apague — o git guarda); changelog em comentário.
- Os comentários do CLAUDE.md e dos arquivos existentes (ex: `catalog.ts`,
  `_template`) explicam **intenção de arquitetura** — esses são os bons; siga o
  mesmo tom quando escrever os seus.

## 4. Formatação (smells G10, G11)

- **Metáfora do jornal:** conceitos de alto nível no topo; detalhe crescendo até
  o fim. Arquivo curto (a maioria < 200 linhas).
- **Vertical:** linha em branco separa conceitos; linhas relacionadas ficam
  densas juntas; função que chama fica **acima** da chamada.
- **Declaração perto do uso.**
- **Team Rules vence preferência pessoal.** Siga o estilo já presente no
  arquivo/módulo e o que o `tsc`/formatter decide.

## 5. Objetos vs. estruturas de dados (smells G14, G36)

- **Objeto:** esconde dados, expõe **comportamento**. **Estrutura de dados** (o
  `TState`/`TAction` de um jogo, os schemas do Colyseus, os tipos de
  `shared-types`): expõe dados, sem comportamento. **Nunca faça híbrido.**
- **Anti-simetria:** procedural facilita **nova função** sem mexer nos tipos; OO
  facilita **novo tipo** sem mexer nas funções. O `GamePlugin` é deliberadamente
  procedural-sobre-dados: adicionar um jogo é adicionar um módulo, não editar a
  Central.
- **Lei de Deméter:** evite `a.getB().getC().doD()` (train wreck). **Tell, don't
  ask.**

## 6. Tratamento de erro (smell G26)

- **Exceções, não códigos de erro** — separa o caminho feliz da reação a
  incidente.
- **Escreva o `try/catch/finally` primeiro** — ele define o escopo transacional.
- **Contexto na exceção:** operação que falhou + causa. Defina exceções pelo que
  o **chamador** precisa tratar.
- **Isole API de terceiros** (Colyseus, ioredis, pg) num wrapper que traduz N
  exceções da lib para 1 exceção de domínio sua.
- **Não retorne `null`, não passe `null`:** prefira lançar, retornar coleção
  vazia, ou Null Object. Em TS, use tipos precisos em vez de `any`/`undefined`
  solto.
- Ação inválida de jogador **não é exceção** — é caso previsto: `applyAction`
  ignora e retorna o estado inalterado (é o que o `_template` faz).

## 7. Boundaries / fronteiras

- **Isole código de terceiros atrás de uma classe do seu domínio.** Não deixe um
  tipo de `colyseus.js` ou `ioredis` vazar pela base — quando a lib mudar, o
  estrago fica contido.
- **Learning tests:** para aprender uma lib nova (Colyseus schema, Redis pub/sub),
  escreva testes que exercitam o comportamento que você espera dela.
- **Código que ainda não existe:** defina a **interface dos seus sonhos**,
  programe contra ela, escreva um Adapter depois. Foi assim que o `GamePlugin`
  nasceu antes dos jogos.

## 8. Testes de unidade (smells T1–T9)

- **As 3 leis do TDD** e o ciclo Red-Green-Refactor: ver [tdd.md](tdd.md).
- **Código de teste é de primeira classe** — mesma limpeza que produção.
- **Legibilidade acima de tudo.** Padrão **Build-Operate-Check**
  (Arrange-Act-Assert) visível; crie helpers que escondem o setup sórdido.
- **Um conceito por teste**, poucos asserts; nome = cenário + esperado (os testes
  do `_template` são o modelo: `"applyAction incrementa só o contador de quem
  agiu"`).
- **F.I.R.S.T.:** Fast · Independent · Repeatable · Self-validating · Timely.
- Não pule teste trivial; teste exaustivamente as **condições de borda** (0
  jogadores, `minPlayers`, `maxPlayers`, ação repetida, jogo já terminado).

## 9. Classes / módulos (smells G6–G8, G17, G18)

- **Pequenas — medidas por responsabilidade, não por linhas.** Se você só
  descreve o módulo com "e"/"ou", ou o nome é vago (`Manager`, `Helper`,
  `Utils`), ele acumula responsabilidade.
- **SRP:** um módulo, uma razão para mudar. Lógica de jogo em
  `packages/games/*`; rede/sala em `apps/server`; tela em `apps/mobile-web` —
  nunca misturados (CLAUDE.md §3).
- **Coesão:** os métodos usam a maioria dos campos.
- **OCP:** jogo novo entra como **novo pacote**, sem editar código estável da
  Central.
- **DIP:** módulo de negócio depende de **abstração** (`GamePlugin`), nunca de um
  jogo concreto — e aí dá para injetar um stub e testar rápido.

## 10. Sistemas

- **Separe construção de uso.** Montagem de objetos e resolução de dependências
  fica no `index.ts` / factories, longe da lógica de runtime. Anti-padrão: lazy
  init acoplando a classe concreta dentro de um getter.
- **Cross-cutting concerns** (persistência, log, reconexão) cortam fronteiras —
  resolva de forma transversal e mantenha o `GamePlugin` como função pura
  testável.

## 11. Design Emergente — as 4 regras de Kent Beck, em ordem

1. **Roda todos os testes.** Buscar testabilidade força módulos pequenos, baixo
   acoplamento, DI.
2. **Sem duplicação (DRY).** Duplicação = abstração ainda não percebida.
3. **Expressa a intenção.** Nomes bons, funções pequenas, vocabulário de padrões
   conhecido.
4. **Mínimo de classes e métodos.** Contrapeso pragmático — não crie entidades
   sem propósito só por dogma de "pequeno".

## 12. Concorrência — quando aplicável

- No servidor, cada sala do Colyseus tem seu próprio loop — mantenha o estado do
  jogo **imutável** (`applyAction` retorna cópia nova) e não compartilhe estado
  mutável entre salas.
- Prefira cópias imutáveis; mantenha seções sincronizadas pequenas; teste o fluxo
  sequencial primeiro.

## 13. Catálogo de smells (cap. 17) — gatilhos de revisão

- **Comentários** C1 informação inapropriada · C2 obsoleto · C3 redundante ·
  C5 código comentado.
- **Ambiente** E1 build em >1 passo · E2 testes em >1 passo (`npm test` e pronto).
- **Funções** F1 muitos args · F2 arg de saída · F3 arg de flag · F4 função morta.
- **Geral** G5 duplicação · G6 nível de abstração errado · G9 código morto ·
  G14 feature envy · G23 polimorfismo > switch · G25 número mágico → constante ·
  G28 encapsule condicional · G29 evite condição negativa · G30 função faz uma
  coisa · G31 acoplamento temporal explícito · G36 evite navegação transitiva.
- **Nomes** N1 descritivo · N2 nível de abstração certo · N3 nomenclatura padrão
  (Factory, Adapter) · N4 não ambíguo · N5 nome longo p/ escopo longo ·
  N6 sem encoding · N7 nome descreve efeito colateral.
- **Testes** T1 cobertura insuficiente · T3 não pule teste trivial · T5 teste
  condições de borda · T9 testes rápidos.

---

## Aplicação neste repo

- **Não há eslint** — o "lint" é `tsc --noEmit` (`npm run lint`). TypeScript
  estrito é a primeira linha de defesa: nada de `any`, `as` sem necessidade, ou
  `@ts-ignore` (o `@ts-expect-error` nos testes, com comentário, é ok).
- Siga o tom dos arquivos existentes: comentários curtos de **intenção de
  arquitetura**, nomes em pt-BR ou inglês consistentes com o arquivo, funções
  pequenas.
- A **Regra do Escoteiro** vale a cada PR — mas mudança de estrutura é passo
  separado de mudança de comportamento (ver [tdd.md](tdd.md) → Refactor).
