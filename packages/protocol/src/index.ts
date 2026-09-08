export * from "./game-plugin";
export * from "./catalog";
export * from "./events";

// Este pacote é só o CONTRATO — tipos + nomes de evento, zero dependência de
// runtime. A validação de entrada (zod) é detalhe do servidor e mora em
// apps/server/src/protocol-validation.ts, pra não entrar no bundle dos clientes.
