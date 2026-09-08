import { test } from "node:test";
import assert from "node:assert/strict";
import { CLIENT_EVENTS, SERVER_EVENTS, ROOM_PHASES } from "./events";

test("nomes de evento são snake_case e batem com a chave", () => {
  for (const value of [...Object.values(CLIENT_EVENTS), ...Object.values(SERVER_EVENTS)]) {
    assert.match(value, /^[a-z]+(_[a-z]+)*$/);
  }
});

test("as fases da sala são exatamente lobby/starting/playing", () => {
  assert.deepEqual([...ROOM_PHASES], ["lobby", "starting", "playing"]);
});
