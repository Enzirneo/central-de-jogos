/**
 * Interface fina sobre uma sala conectada. O `RoomStore` só fala com isto —
 * o wrapper real (colyseus.js) fica em colyseus.service.ts e os testes usam um
 * fake que implementa a mesma interface.
 */
export interface RoomHandle {
  readonly sessionId: string;
  readonly reconnectionToken: string;
  onMessage<T = unknown>(type: string, cb: (payload: T) => void): void;
  send(type: string, payload?: unknown): void;
  onLeave(cb: (code: number) => void): void;
  onError(cb: (code: number, message?: string) => void): void;
  leave(): void;
}
