import { test } from "node:test";
import assert from "node:assert/strict";
import { CLIENT_EVENTS, SERVER_EVENTS, ROOM_PHASES } from "./events";
import {
  joinOptionsSchema,
  selectGamePayloadSchema,
  gameActionPayloadSchema,
} from "./events.schema";

test("nomes de evento são snake_case e batem com a chave", () => {
  for (const value of [...Object.values(CLIENT_EVENTS), ...Object.values(SERVER_EVENTS)]) {
    assert.match(value, /^[a-z]+(_[a-z]+)*$/);
  }
});

test("as fases da sala são exatamente lobby/starting/playing", () => {
  assert.deepEqual([...ROOM_PHASES], ["lobby", "starting", "playing"]);
});

test("joinOptionsSchema aceita vazio e descarta campos extras", () => {
  const parsed = joinOptionsSchema.parse({ nickname: "Ana", lixo: 1 });
  assert.deepEqual(parsed, { nickname: "Ana" });
  assert.deepEqual(joinOptionsSchema.parse({}), {});
});

test("joinOptionsSchema rejeita tipo errado", () => {
  assert.throws(() => joinOptionsSchema.parse({ nickname: 42 }));
});

test("selectGamePayloadSchema exige gameId não-vazio", () => {
  assert.throws(() => selectGamePayloadSchema.parse({}));
  assert.throws(() => selectGamePayloadSchema.parse({ gameId: "" }));
  assert.deepEqual(selectGamePayloadSchema.parse({ gameId: "ito" }), { gameId: "ito" });
});

test("selectGamePayloadSchema deixa options passar opaco", () => {
  const parsed = selectGamePayloadSchema.parse({ gameId: "ito", options: { modo: "x" } });
  assert.deepEqual(parsed.options, { modo: "x" });
});

test("gameActionPayloadSchema aceita qualquer coisa (o jogo valida)", () => {
  assert.doesNotThrow(() => gameActionPayloadSchema.parse({ type: "qualquer" }));
  assert.doesNotThrow(() => gameActionPayloadSchema.parse(null));
});
