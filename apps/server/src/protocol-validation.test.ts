import { test } from "node:test";
import assert from "node:assert/strict";
import {
  joinOptionsSchema,
  selectGamePayloadSchema,
  gameActionPayloadSchema,
} from "./protocol-validation";

test("joinOptionsSchema aceita vazio e descarta campos extras", () => {
  assert.deepEqual(joinOptionsSchema.parse({ nickname: "Ana", lixo: 1 }), { nickname: "Ana" });
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
