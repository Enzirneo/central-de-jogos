import { FlatList, Pressable, StyleSheet, Text, View } from "react-native";
import type { LobbyPlayer } from "../types";

interface ReadyCheckScreenProps {
  gameLabel: string;
  players: LobbyPlayer[];
  mySessionId: string;
  isHost: boolean;
  onToggleReady: () => void;
  onCancel: () => void;
}

export function ReadyCheckScreen({
  gameLabel,
  players,
  mySessionId,
  isHost,
  onToggleReady,
  onCancel,
}: ReadyCheckScreenProps) {
  const me = players.find((p) => p.id === mySessionId);
  const readyCount = players.filter((p) => p.ready).length;

  return (
    <View style={styles.container}>
      <Text style={styles.title}>{gameLabel}</Text>
      <Text style={styles.subtitle}>
        Todo mundo precisa confirmar pra começar ({readyCount}/{players.length})
      </Text>

      <FlatList
        style={styles.list}
        data={players}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <View style={styles.playerRow}>
            <Text style={styles.playerName}>
              {item.nickname}
              {item.id === mySessionId ? " (você)" : ""}
            </Text>
            <Text style={item.ready ? styles.ready : styles.waiting}>
              {item.ready ? "✓ pronto" : "aguardando…"}
            </Text>
          </View>
        )}
      />

      <Pressable style={[styles.buttonReady, me?.ready && styles.buttonReadyActive]} onPress={onToggleReady}>
        <Text style={styles.buttonReadyText}>{me?.ready ? "Cancelar pronto" : "Estou pronto"}</Text>
      </Pressable>

      {isHost && (
        <Pressable style={styles.buttonCancel} onPress={onCancel}>
          <Text style={styles.buttonCancelText}>Cancelar</Text>
        </Pressable>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#fff",
    alignItems: "center",
    paddingTop: 64,
    paddingHorizontal: 24,
    gap: 4,
  },
  title: {
    fontSize: 24,
    fontWeight: "bold",
  },
  subtitle: {
    fontSize: 13,
    color: "#888",
    marginBottom: 16,
    textAlign: "center",
  },
  list: {
    width: "100%",
    maxWidth: 360,
  },
  playerRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: "#eee",
  },
  playerName: {
    fontSize: 16,
  },
  ready: {
    fontSize: 13,
    color: "#22c55e",
    fontWeight: "600",
  },
  waiting: {
    fontSize: 13,
    color: "#aaa",
  },
  buttonReady: {
    marginTop: 24,
    width: "100%",
    maxWidth: 320,
    backgroundColor: "#4f46e5",
    borderRadius: 8,
    paddingVertical: 14,
    alignItems: "center",
  },
  buttonReadyActive: {
    backgroundColor: "#22c55e",
  },
  buttonReadyText: {
    color: "#fff",
    fontWeight: "700",
    fontSize: 16,
  },
  buttonCancel: {
    marginTop: 16,
    paddingVertical: 8,
  },
  buttonCancelText: {
    color: "crimson",
    fontWeight: "600",
  },
});
