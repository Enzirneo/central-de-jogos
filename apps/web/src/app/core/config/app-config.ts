/**
 * URL do servidor Colyseus.
 *
 * Em dev, o servidor roda em ws://localhost:2567. A URL de produção é definida
 * na Fase 4 (deploy) — provavelmente via `fileReplacements` de environment ou
 * um `<meta>` no index.html. Por ora: localhost, com um override opcional por
 * `window.__CJ_SERVER_URL__` para testar de outro dispositivo na mesma rede.
 */
declare global {
  interface Window {
    __CJ_SERVER_URL__?: string;
  }
}

export function serverUrl(): string {
  if (typeof window !== 'undefined' && window.__CJ_SERVER_URL__) {
    return window.__CJ_SERVER_URL__;
  }
  return 'ws://localhost:2567';
}
