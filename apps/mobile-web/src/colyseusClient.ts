import { Platform } from "react-native";
import { Client } from "colyseus.js";

// No navegador (web), "localhost" funciona direto.
// No celular físico, troque pelo IP local do seu computador na rede
// (ex: "192.168.0.10"), pois o celular não enxerga "localhost" do PC.
// Pode também ser sobrescrito com a variável de ambiente EXPO_PUBLIC_SERVER_URL.
const DEFAULT_HOST = Platform.OS === "web" ? "localhost" : "192.168.68.52";
const SERVER_URL = process.env.EXPO_PUBLIC_SERVER_URL ?? `ws://${DEFAULT_HOST}:2567`;

export const client = new Client(SERVER_URL);

function extractMessage(err: unknown): string {
  if (err instanceof Error) return err.message;
  if (typeof err === "string") return err;
  if (err && typeof err === "object") {
    // Erros de WebSocket/rede costumam chegar como objetos sem `.message`
    // (ex: CloseEvent), então `String(err)` viraria "[object Object]".
    const anyErr = err as Record<string, unknown>;
    if (typeof anyErr.message === "string") return anyErr.message;
    if (typeof anyErr.reason === "string" && anyErr.reason) return anyErr.reason;
    try {
      return JSON.stringify(err);
    } catch {
      return Object.prototype.toString.call(err);
    }
  }
  return String(err);
}

export function matchMakeErrorToMessage(err: unknown): string {
  const message = extractMessage(err);

  if (message.includes("no rooms found")) {
    return "Sala não encontrada (ou já está cheia). Confira o código.";
  }

  if (message === "{}" || message === "[object Object]" || message.length === 0) {
    return `Não foi possível conectar ao servidor em ${SERVER_URL}. Confira se o servidor está rodando e se o celular está na mesma rede Wi-Fi do computador.`;
  }

  return `Não foi possível conectar: ${message}`;
}
