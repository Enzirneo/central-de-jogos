import { test } from "node:test";
import assert from "node:assert/strict";
import { itoGame } from "./ito-game";
import type { ItoAction, ItoState } from "./types";

const PLAYERS = ["p1", "p2", "p3"];

function fixedState(mode: "consensus" | "individual" = "consensus", totalRounds = 5): ItoState {
  return itoGame.createInitialState(PLAYERS, { mode, rounds: { type: "fixed", totalRounds } });
}

function submitAllClues(state: ItoState): ItoState {
  let next = state;
  for (const playerId of PLAYERS) {
    next = itoGame.applyAction(next, playerId, { type: "submit_clue", clue: `dica-${playerId}` });
  }
  return next;
}

function allReadyToReveal(state: ItoState): ItoState {
  let next = state;
  for (const playerId of PLAYERS) {
    next = itoGame.applyAction(next, playerId, { type: "ready_to_reveal" });
  }
  return next;
}

function allReadyForNextRound(state: ItoState): ItoState {
  let next = state;
  for (const playerId of PLAYERS) {
    next = itoGame.applyAction(next, playerId, { type: "ready_for_next_round" });
  }
  return next;
}

function correctOrderFor(state: ItoState): string[] {
  return [...state.players].sort((a, b) => state.roundData[a].secretNumber - state.roundData[b].secretNumber);
}

test("createInitialState sorteia números únicos entre 1 e 100 e um tema", () => {
  const state = fixedState();
  const numbers = PLAYERS.map((p) => state.roundData[p].secretNumber);

  assert.equal(new Set(numbers).size, PLAYERS.length, "números devem ser únicos");
  for (const n of numbers) {
    assert.ok(n >= 1 && n <= 100, `número ${n} fora do intervalo 1-100`);
  }
  assert.ok(state.theme.length > 0);
  assert.equal(state.phase, "giving_clues");
  assert.equal(state.round, 1);
});

test("getStateForPlayer NUNCA revela o número de outro jogador antes de revelar", () => {
  let state = fixedState();
  state = submitAllClues(state); // agora está em "organizing"

  for (const playerId of PLAYERS) {
    const view = itoGame.getStateForPlayer(state, playerId);
    for (const otherId of PLAYERS) {
      if (otherId === playerId) continue;
      assert.equal(view.cards[otherId].number, null, `${playerId} não deveria ver o número de ${otherId}`);
    }
    // o próprio número sempre é visível pro dono
    assert.equal(view.myNumber, state.roundData[playerId].secretNumber);
  }
});

test("getStateForPlayer esconde a dica de outros jogadores enquanto ainda estão dando dicas", () => {
  let state = fixedState();
  state = itoGame.applyAction(state, "p1", { type: "submit_clue", clue: "dica-p1" });

  const viewP1 = itoGame.getStateForPlayer(state, "p1");
  const viewP2 = itoGame.getStateForPlayer(state, "p2");

  assert.equal(viewP1.cards.p1.clue, "dica-p1", "o próprio jogador vê sua própria dica");
  assert.equal(viewP2.cards.p1.clue, null, "outro jogador não vê a dica antes de todos enviarem");
  assert.equal(viewP2.cards.p1.hasSubmittedClue, true, "mas sabe que já foi enviada");
});

test("fase avança pra 'organizing' só depois que todos enviam a dica", () => {
  let state = fixedState();
  state = itoGame.applyAction(state, "p1", { type: "submit_clue", clue: "a" });
  assert.equal(state.phase, "giving_clues");

  state = itoGame.applyAction(state, "p2", { type: "submit_clue", clue: "b" });
  assert.equal(state.phase, "giving_clues");

  state = itoGame.applyAction(state, "p3", { type: "submit_clue", clue: "c" });
  assert.equal(state.phase, "organizing");
});

test("depois de todos darem a dica, ela fica visível pra todo mundo", () => {
  let state = fixedState();
  state = submitAllClues(state);

  const view = itoGame.getStateForPlayer(state, "p2");
  assert.equal(view.cards.p1.clue, "dica-p1");
  assert.equal(view.cards.p3.clue, "dica-p3");
});

test("modo consensus: reorder_board de qualquer jogador atualiza o quadro compartilhado pra todos", () => {
  let state = fixedState("consensus");
  state = submitAllClues(state);

  const newOrder = ["p3", "p1", "p2"];
  state = itoGame.applyAction(state, "p2", { type: "reorder_board", order: newOrder });

  assert.deepEqual(state.sharedBoard, newOrder);
  for (const playerId of PLAYERS) {
    assert.deepEqual(itoGame.getStateForPlayer(state, playerId).board, newOrder);
  }
});

test("ready_to_reveal: ninguém revela sozinho — só quando TODOS confirmam", () => {
  let state = fixedState("consensus");
  state = submitAllClues(state);

  state = itoGame.applyAction(state, "p1", { type: "ready_to_reveal" });
  assert.equal(state.phase, "organizing", "1 de 3 prontos não deveria revelar");
  assert.deepEqual(state.readyToReveal, ["p1"]);

  state = itoGame.applyAction(state, "p2", { type: "ready_to_reveal" });
  assert.equal(state.phase, "organizing", "2 de 3 prontos não deveria revelar");

  state = itoGame.applyAction(state, "p3", { type: "ready_to_reveal" });
  assert.equal(state.phase, "revealed", "3 de 3 prontos deveria revelar");
});

test("ready_to_reveal é um alternador — clicar de novo desmarca", () => {
  let state = fixedState("consensus");
  state = submitAllClues(state);
  state = itoGame.applyAction(state, "p1", { type: "ready_to_reveal" });
  assert.deepEqual(state.readyToReveal, ["p1"]);

  state = itoGame.applyAction(state, "p1", { type: "ready_to_reveal" });
  assert.deepEqual(state.readyToReveal, []);
});

test("modo consensus: reordenar o quadro depois de alguém confirmar limpa as confirmações de todos", () => {
  let state = fixedState("consensus");
  state = submitAllClues(state);
  state = itoGame.applyAction(state, "p1", { type: "ready_to_reveal" });
  state = itoGame.applyAction(state, "p2", { type: "ready_to_reveal" });
  assert.deepEqual(state.readyToReveal, ["p1", "p2"]);

  state = itoGame.applyAction(state, "p3", { type: "reorder_board", order: [...state.sharedBoard].reverse() });
  assert.deepEqual(state.readyToReveal, [], "mudar o quadro deveria invalidar as confirmações antigas");
});

test("modo individual: reordenar o PRÓPRIO palpite só desmarca o próprio 'pronto', não o dos outros", () => {
  let state = fixedState("individual");
  state = submitAllClues(state);
  state = itoGame.applyAction(state, "p1", { type: "ready_to_reveal" });
  state = itoGame.applyAction(state, "p2", { type: "ready_to_reveal" });
  assert.deepEqual(state.readyToReveal, ["p1", "p2"]);

  state = itoGame.applyAction(state, "p1", { type: "reorder_board", order: ["p3", "p2", "p1"] });
  assert.deepEqual(state.readyToReveal, ["p2"], "só p1 deveria perder a confirmação");
});

test("modo consensus: reveal calcula posições corretas e soma no placar de equipe", () => {
  let state = fixedState("consensus");
  state = submitAllClues(state);

  const correctOrder = correctOrderFor(state);
  state = itoGame.applyAction(state, "p1", { type: "reorder_board", order: correctOrder });
  state = allReadyToReveal(state);

  assert.equal(state.phase, "revealed");
  assert.equal(state.lastRoundResult?.correctPositions, 3);
  assert.equal(state.teamScore, 3);

  // agora sim os números aparecem pra todo mundo
  const view = itoGame.getStateForPlayer(state, "p2");
  for (const playerId of PLAYERS) {
    assert.equal(view.cards[playerId].number, state.roundData[playerId].secretNumber);
  }
});

test("modo individual: cada jogador só enxerga e reordena o próprio palpite", () => {
  let state = fixedState("individual");
  state = submitAllClues(state);

  state = itoGame.applyAction(state, "p1", { type: "reorder_board", order: ["p2", "p1", "p3"] });
  state = itoGame.applyAction(state, "p2", { type: "reorder_board", order: ["p1", "p2", "p3"] });

  const viewP1 = itoGame.getStateForPlayer(state, "p1");
  const viewP2 = itoGame.getStateForPlayer(state, "p2");

  assert.deepEqual(viewP1.board, ["p2", "p1", "p3"]);
  assert.deepEqual(viewP2.board, ["p1", "p2", "p3"], "o palpite de p1 não deve vazar pro board de p2");
});

test("modo individual: só pontua (vence a rodada) quem acerta 100% da ordem", () => {
  let state = fixedState("individual");
  state = submitAllClues(state);
  const correctOrder = correctOrderFor(state);
  // Ordem invertida de uma permutação de 3 elementos distintos nunca é igual
  // à original (o 1º e o 3º elemento sempre trocam de lugar) — garante que
  // p2 e p3 erram de propósito, não por sorte do sorteio dos números.
  const wrongOrder = [...correctOrder].reverse();

  state = itoGame.applyAction(state, "p1", { type: "reorder_board", order: correctOrder });
  state = itoGame.applyAction(state, "p2", { type: "reorder_board", order: wrongOrder });
  state = itoGame.applyAction(state, "p3", { type: "reorder_board", order: wrongOrder });

  state = allReadyToReveal(state);

  assert.deepEqual(state.lastRoundResult?.winners, ["p1"]);
  assert.equal(state.individualWins.p1, 1);
  assert.equal(state.individualWins.p2, 0);
  assert.equal(state.individualWins.p3, 0);
});

test("modo individual: ninguém acerta 100% -> sem vencedores, e o resultado mostra a ordem correta", () => {
  let state = fixedState("individual");
  state = submitAllClues(state);
  const correctOrder = correctOrderFor(state);
  const wrongOrder = [...correctOrder].reverse();

  for (const playerId of PLAYERS) {
    state = itoGame.applyAction(state, playerId, { type: "reorder_board", order: wrongOrder });
  }
  state = allReadyToReveal(state);

  assert.deepEqual(state.lastRoundResult?.winners, []);
  assert.deepEqual(state.lastRoundResult?.correctOrder, correctOrder);
  for (const playerId of PLAYERS) {
    assert.equal(state.individualWins[playerId], 0);
  }
});

test("reorder_board ignora uma ordem inválida (jogador repetido ou faltando)", () => {
  let state = fixedState("consensus");
  state = submitAllClues(state);

  const before = state.sharedBoard;
  const invalid = itoGame.applyAction(state, "p1", {
    type: "reorder_board",
    order: ["p1", "p1", "p3"],
  } as ItoAction);

  assert.deepEqual(invalid.sharedBoard, before);
});

test("ready_to_reveal só funciona na fase 'organizing'", () => {
  const state = fixedState(); // ainda em "giving_clues"
  const after = itoGame.applyAction(state, "p1", { type: "ready_to_reveal" });
  assert.equal(after.phase, "giving_clues");
  assert.deepEqual(after.readyToReveal, []);
});

test("ready_for_next_round: ninguém avança sozinho — só quando TODOS confirmam", () => {
  let state = fixedState("consensus", 3);
  state = submitAllClues(state);
  state = allReadyToReveal(state);
  assert.equal(state.phase, "revealed");

  state = itoGame.applyAction(state, "p1", { type: "ready_for_next_round" });
  assert.equal(state.round, 1, "1 de 3 prontos não deveria avançar de rodada");

  state = itoGame.applyAction(state, "p2", { type: "ready_for_next_round" });
  assert.equal(state.round, 1, "2 de 3 prontos não deveria avançar de rodada");

  state = itoGame.applyAction(state, "p3", { type: "ready_for_next_round" });
  assert.equal(state.round, 2, "3 de 3 prontos deveria avançar de rodada");
  assert.equal(state.phase, "giving_clues");
});

test("isGameOver com rodadas fixas: só termina depois da última rodada revelada", () => {
  let state = fixedState("consensus", 2);

  for (let round = 1; round <= 2; round++) {
    state = submitAllClues(state);
    state = allReadyToReveal(state);

    if (round < 2) {
      assert.equal(itoGame.isGameOver(state), false);
      state = allReadyForNextRound(state);
      assert.equal(state.round, round + 1);
    }
  }

  assert.equal(itoGame.isGameOver(state), true);
});

test("ready_for_next_round não faz nada além do total de rodadas fixas (o jogo já terminou)", () => {
  let state = fixedState("consensus", 1);
  state = submitAllClues(state);
  state = allReadyToReveal(state);

  const after = itoGame.applyAction(state, "p1", { type: "ready_for_next_round" });
  assert.equal(after.round, 1, "não deveria criar uma rodada 2 além do limite");
  assert.deepEqual(after.readyForNextRound, [], "nem deveria registrar a confirmação");
});

test("modo endless: só termina quando alguém envia end_game (e depois de revelar)", () => {
  let state = itoGame.createInitialState(PLAYERS, { mode: "consensus", rounds: { type: "endless" } });

  state = submitAllClues(state);
  assert.equal(itoGame.isGameOver(state), false);

  // end_game antes de revelar não faz nada
  const tooEarly = itoGame.applyAction(state, "p1", { type: "end_game" });
  assert.equal(tooEarly.endedManually, false);

  state = allReadyToReveal(state);
  assert.equal(itoGame.isGameOver(state), false);

  state = itoGame.applyAction(state, "p2", { type: "end_game" });
  assert.equal(itoGame.isGameOver(state), true);
});

test("getResults reflete o modo do jogo", () => {
  let consensusState = fixedState("consensus");
  consensusState = submitAllClues(consensusState);
  consensusState = allReadyToReveal(consensusState);
  const consensusResults = itoGame.getResults(consensusState) as { mode: string; teamScore: number };
  assert.equal(consensusResults.mode, "consensus");
  assert.equal(typeof consensusResults.teamScore, "number");

  let individualState = fixedState("individual");
  individualState = submitAllClues(individualState);
  individualState = allReadyToReveal(individualState);
  const individualResults = itoGame.getResults(individualState) as { mode: string; wins: Record<string, number> };
  assert.equal(individualResults.mode, "individual");
  assert.equal(typeof individualResults.wins.p1, "number");
});

test("createInitialState normaliza opções inválidas em vez de quebrar", () => {
  // @ts-expect-error testando entrada inválida de propósito (vem direto do cliente)
  const state = itoGame.createInitialState(PLAYERS, { mode: "chaos", rounds: { totalRounds: -5 } });
  assert.equal(state.mode, "consensus");
  assert.deepEqual(state.roundsConfig, { type: "fixed", totalRounds: 5 });
});
