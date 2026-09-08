/// Interface fina sobre uma sala conectada. O `RoomController` só fala com isto;
/// a implementação real (`ColyseusRoom`) fica em `colyseus_client.dart` e os
/// testes usam um fake. Espelha o `RoomHandle` da web.
abstract interface class RoomHandle {
  String get sessionId;

  /// Formato `roomId:token` — guardar pra reconectar depois de uma queda.
  String get reconnectionToken;

  /// Registra um handler para mensagens JSON de um tipo (`lobby_state`, etc.).
  void onMessage(String type, void Function(Object? payload) handler);

  /// Envia um evento pro servidor. `payload` vira msgpack; null = sem payload.
  void send(String type, [Object? payload]);

  /// Chamado quando a sala fecha. `code` 1000 = saída limpa; outro = queda.
  void onLeave(void Function(int code) handler);

  void onError(void Function(int code, String? message) handler);

  /// Sai da sala de propósito (envia LEAVE_ROOM).
  Future<void> leave();
}
