import { FlatList, Pressable, StyleSheet, Text, View } from "react-native";
import type { LobbyPlayer, TemplateGameState } from "../types";

interface GameScreenProps {
  gameState: TemplateGameState | null;
  players: LobbyPlayer[];
  mySessionId: string;
  onIncrement: () => void;
}

export function GameScreen({
  gameState,
  players,
  mySessionId,
  onIncrement,
}: GameScreenProps) {
  if (!gameState) {
    return (
      <View style={styles.container}>
        <Text>Carregando jogo…</Text>
      </View>
    );
  }

  const finished = gameState.myCount >= gameState.target;

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Jogo de teste</Text>
      <Text style={styles.subtitle}>
        Clique até chegar em {gameState.target} — só pra validar a arquitetura
      </Text>

      <Text style={styles.counter}>
        {gameState.myCount} / {gameState.target}
      </Text>

      <Pressable
        style={[styles.button, finished && styles.buttonDisabled]}
        disabled={finished}
        onPress={onIncrement}
      >
        <Text style={styles.buttonText}>
          {finished ? "Você terminou! Aguardando os outros…" : "Incrementar"}
        </Text>
      </Pressable>

      <Text style={styles.label}>Todo mundo</Text>
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
            <Text style={styles.playerCount}>
              {gameState.counters[item.id] ?? 0} / {gameState.target}
            </Text>
          </View>
        )}
      />
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
    gap: 8,
  },
  title: {
    fontSize: 24,
    fontWeight: "bold",
  },
  subtitle: {
    fontSize: 13,
    color: "#888",
    textAlign: "center",
    marginBottom: 16,
  },
  counter: {
    fontSize: 48,
    fontWeight: "bold",
    marginVertical: 16,
  },
  button: {
    width: "100%",
    maxWidth: 320,
    backgroundColor: "#4f46e5",
    borderRadius: 8,
    paddingVertical: 14,
    alignItems: "center",
  },
  buttonDisabled: {
    opacity: 0.4,
  },
  buttonText: {
    color: "#fff",
    fontWeight: "600",
    fontSize: 16,
  },
  label: {
    marginTop: 32,
    fontSize: 13,
    color: "#666",
    alignSelf: "flex-start",
  },
  list: {
    width: "100%",
    maxWidth: 400,
  },
  playerRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: "#eee",
  },
  playerName: {
    fontSize: 15,
  },
  playerCount: {
    fontSize: 15,
    color: "#4f46e5",
    fontWeight: "600",
  },
});
