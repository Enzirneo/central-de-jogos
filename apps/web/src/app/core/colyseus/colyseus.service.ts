import { Injectable } from '@angular/core';
import { Client, type Room } from 'colyseus.js';
import { serverUrl } from '../config/app-config';
import type { RoomHandle } from './room-handle';

const LOBBY = 'lobby';

/**
 * Conexão com o servidor Colyseus. Cria/entra em salas e devolve um `RoomHandle`.
 * Toda a leitura de estado (mensagens JSON) é responsabilidade do `RoomStore`.
 */
@Injectable({ providedIn: 'root' })
export class ColyseusService {
  private readonly client = new Client(serverUrl());

  /** Cria uma sala nova. O servidor gera o código. */
  async create(nickname: string): Promise<RoomHandle> {
    return wrap(await this.client.create(LOBBY, { nickname }));
  }

  /** Entra numa sala existente pelo código (erro se não existe). */
  async join(code: string, nickname: string): Promise<RoomHandle> {
    return wrap(await this.client.join(LOBBY, { code: code.trim().toUpperCase(), nickname }));
  }

  /** Reconecta a uma sala da qual o jogador caiu, com o token guardado. */
  async reconnect(token: string): Promise<RoomHandle> {
    return wrap(await this.client.reconnect(token));
  }
}

function wrap(room: Room): RoomHandle {
  return {
    get sessionId() {
      return room.sessionId;
    },
    get reconnectionToken() {
      return room.reconnectionToken;
    },
    onMessage: (type, cb) => {
      room.onMessage(type, cb as (m: unknown) => void);
    },
    send: (type, payload) => room.send(type, payload),
    onLeave: (cb) => room.onLeave(cb),
    onError: (cb) => room.onError(cb),
    leave: () => void room.leave(),
  };
}
