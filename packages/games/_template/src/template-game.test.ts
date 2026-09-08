import { test } from "node:test";
import assert from "node:assert/strict";
import { templateGame, TARGET_COUNT } from "./template-game";

test("createInitialState começa todo mundo com contador zerado", () => {
  const state = templateGame.createInitialState(["p1", "p2"]);
  assert.deepEqual(state.counters, { p1: 0, p2: 0 });
});

test("applyAction incrementa só o contador de quem agiu", () => {
  const state = templateGame.createInitialState(["p1", "p2"]);
  const next = templateGame.applyAction(state, "p1", { type: "increment" });
  assert.equal(next.counters.p1, 1);
  assert.equal(next.counters.p2, 0);
});

test("applyAction não passa do TARGET_COUNT", () => {
  let state = templateGame.createInitialState(["p1"]);
  for (let i = 0; i < TARGET_COUNT + 5; i++) {
    state = templateGame.applyAction(state, "p1", { type: "increment" });
  }
  assert.equal(state.counters.p1, TARGET_COUNT);
});

test("applyAction ignora ações com type desconhecido", () => {
  const state = templateGame.createInitialState(["p1"]);
  // @ts-expect-error testando entrada inválida de propósito
  const next = templateGame.applyAction(state, "p1", { type: "invalido" });
  assert.deepEqual(next, state);
});

test("isGameOver é falso até todo mundo bater o alvo", () => {
  let state = templateGame.createInitialState(["p1", "p2"]);
  for (let i = 0; i < TARGET_COUNT; i++) {
    state = templateGame.applyAction(state, "p1", { type: "increment" });
  }
  assert.equal(templateGame.isGameOver(state), false);
});

test("isGameOver é verdadeiro quando todos batem o alvo", () => {
  let state = templateGame.createInitialState(["p1", "p2"]);
  for (const playerId of ["p1", "p2"]) {
    for (let i = 0; i < TARGET_COUNT; i++) {
      state = templateGame.applyAction(state, playerId, { type: "increment" });
    }
  }
  assert.equal(templateGame.isGameOver(state), true);
});

test("isGameOver é falso com zero jogadores (evita every() vazio = true)", () => {
  const state = templateGame.createInitialState([]);
  assert.equal(templateGame.isGameOver(state), false);
});

test("getResults e getStateForPlayer refletem o estado atual", () => {
  const state = templateGame.applyAction(
    templateGame.createInitialState(["p1", "p2"]),
    "p1",
    { type: "increment" }
  );

  assert.deepEqual(templateGame.getResults(state), {
    target: TARGET_COUNT,
    counters: { p1: 1, p2: 0 },
  });

  assert.deepEqual(templateGame.getStateForPlayer(state, "p1"), {
    myCount: 1,
    target: TARGET_COUNT,
    counters: { p1: 1, p2: 0 },
  });
});
