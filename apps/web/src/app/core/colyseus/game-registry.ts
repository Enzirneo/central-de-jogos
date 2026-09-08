import type { Type } from '@angular/core';

/**
 * Mapa `id do jogo → função que carrega o componente dinamicamente`.
 * Espelha o registry.ts do servidor: a Central nunca importa um jogo
 * específico diretamente — sempre por meio deste registro.
 *
 * Adicionar jogo novo:
 * - Criar `features/games/<jogo>/<jogo>.ts` (standalone component)
 * - Registrar aqui: `[itoGame.id]: () => import(...)`
 */
export const GAME_REGISTRY: Record<string, () => Promise<Type<unknown>>> = {
  _template: () => import('../../features/games/_template/template-counter').then(m => m.TemplateCounter),
  ito: () => import('../../features/games/ito/ito-host').then(m => m.ItoHost),
};

/**
 * Telas de configuração pré-jogo (opcionais). Se um jogo tem opções que o host
 * escolhe antes de começar (modo, rodadas), registra o componente aqui — ele
 * aparece na tela de "pronto".
 */
export const GAME_CONFIG_REGISTRY: Record<string, () => Promise<Type<unknown>>> = {
  ito: () => import('../../features/games/ito/ito-config').then(m => m.ItoConfig),
};

export async function loadGameComponent(gameId: string): Promise<Type<unknown> | undefined> {
  return GAME_REGISTRY[gameId]?.();
}

export async function loadGameConfigComponent(gameId: string): Promise<Type<unknown> | undefined> {
  return GAME_CONFIG_REGISTRY[gameId]?.();
}
