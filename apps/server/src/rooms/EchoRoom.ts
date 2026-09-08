import { Room, Client } from "@colyseus/core";

export class EchoRoom extends Room {
  maxClients = 12;

  onCreate() {
    this.onMessage("echo", (client: Client, message: unknown) => {
      client.send("echo", message);
    });
  }

  onJoin(client: Client) {
    console.log(`[EchoRoom] cliente entrou: ${client.sessionId}`);
  }

  onLeave(client: Client) {
    console.log(`[EchoRoom] cliente saiu: ${client.sessionId}`);
  }
}
