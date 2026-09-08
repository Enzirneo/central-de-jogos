/// URL base do servidor Colyseus (HTTP; o WebSocket é derivado dela).
///
/// Default: `10.0.2.2:2567` — no emulador Android, `localhost` é o próprio
/// emulador; `10.0.2.2` é o loopback da máquina host. Num aparelho físico use
/// o IP da máquina na rede local:
///   flutter run --dart-define=CJ_SERVER_URL=http://192.168.0.10:2567
const String serverBaseUrl = String.fromEnvironment(
  'CJ_SERVER_URL',
  defaultValue: 'http://10.0.2.2:2567',
);
