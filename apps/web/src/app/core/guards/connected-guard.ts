import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { RoomStore } from '../colyseus/room.store';

/** Só entra em /sala se houver uma sala conectada; senão volta pra home. */
export const connectedGuard: CanActivateFn = () => {
  const store = inject(RoomStore);
  const router = inject(Router);
  return store.connected() ? true : router.createUrlTree(['/']);
};
