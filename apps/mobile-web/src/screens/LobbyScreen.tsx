import { FlatList, Pressable, StyleSheet, Text, View } from "react-native";
import type { GameCatalogEntry, GameResults } from "@central-de-jogos/shared-types";
import type { LobbyPlayer } from "../types";

interface LobbyScreenProps {
  code: string;
  players: LobbyPlayer[];
  mySessionId: string;
  isHost: boolean;
  catalog: GameCatalogEntry[];
  startGameError: string | null;
  lastResults: GameResults | null;
  onLeave: () => void;
  onSelectGame: (gameId: string) => void;
}

function renderResultsSummary(results: GameResults, players: LobbyPlayer[]): string[] {
  // Formato do jogo _template: { counters, target }
  if (typeof results.target === "number" && results.counters && typeof results.counters === "object") {
    const counters = results.counters as Record<string, number>;
    return players.map((player) => `${player.nickname}: ${counters[player.id] ?? 0} / ${results.target}`);
  }

  // Formato do ITO no modo consenso: { mode: "consensus", teamScore, rounds }
  if (results.mode === "consensus" && typeof results.teamScore === "number") {
    return [`Placar de equipe: ${results.teamScore} posições certas em ${results.rounds} rodada(s)`];
  }

  // Formato do ITO no modo individual: { mode: "individual", wins, rounds }
  if (results.mode === "individual" && results.wins && typeof results.wins === "object") {
    const wins = results.wins as Record<string, number>;
    return players.map((player) => `${player.nickname}: ${wins[player.id] ?? 0} rodada(s) vencida(s)`);
  }

  return [];
}

export function LobbyScreen({
  code,
  players,
  mySessionId,
  isHost,
  catalog,
  startGameError,
  lastResults,
  onLeave,
  onSelectGame,
}: LobbyScreenProps) {
  const resultsLines = lastResults ? renderResultsSummary(lastResults, players) : [];

  return (
    <View style={styles.container}>
      <Text style={styles.label}>Código da sala</Text>
      <Text style={styles.code}>{code || "----"}</Text>
      <Text style={styles.subtitle}>Compartilhe esse código com seus amigos</Text>

      {resultsLines.length > 0 && (
        <View style={styles.resultsBox}>
          <Text style={styles.resultsTitle}>Resultado da última partida</Text>
          {resultsLines.map((line, index) => (
            <Text key={index} style={styles.resultsLine}>
              {line}
            </Text>
          ))}
        </View>
      )}

      <FlatList
        style={styles.list}
        data={players}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <View style={styles.playerRow}>
            <View style={[styles.dot, item.connected ? styles.dotOnline : styles.dotOffline]} />
            <Text style={styles.playerName}>
              {item.nickname}
              {item.id === mySessionId ? " (você)" : ""}
            </Text>
            {!item.connected && <Text style={styles.reconnecting}>reconectando…</Text>}
          </View>
        )}
      />

      <Text style={styles.count}>
        {players.length} {players.length === 1 ? "jogador" : "jogadores"} na sala
      </Text>

      {isHost ? (
        <View style={styles.catalog}>
          <Text style={styles.label}>Escolha um jogo</Text>
          {catalog.map((game) => {
            const disabled = players.length < game.minPlayers || players.length > game.maxPlayers;
            return (
              <Pressable
                key={game.id}
                style={[styles.buttonStart, disabled && styles.buttonDisabled]}
                disabled={disabled}
                onPress={() => onSelectGame(game.id)}
              >
                <Text style={styles.buttonStartText}>Iniciar {game.displayName}</Text>
                {disabled && (
                  <Text style={styles.buttonStartHint}>
                    precisa de {game.minPlayers} a {game.maxPlayers} jogadores
                  </Text>
                )}
              </Pressable>
            );
          })}
        </View>
      ) : (
        <Text style={styles.waitingHost}>Esperando o host escolher um jogo…</Text>
      )}

      {startGameError && <Text style={styles.error}>{startGameError}</Text>}

      <Pressable style={styles.buttonLeave} onPress={onLeave}>
        <Text style={styles.buttonLeaveText}>Sair da sala</Text>
      </Pressable>
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
  label: {
    fontSize: 14,
    color: "#666",
  },
  code: {
    fontSize: 40,
    fontWeight: "bold",
    letterSpacing: 8,
  },
  subtitle: {
    fontSize: 13,
    color: "#888",
    marginBottom: 24,
  },
  list: {
    width: "100%",
    maxWidth: 400,
  },
  playerRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: "#eee",
    gap: 8,
  },
  dot: {
    width: 10,
    height: 10,
    borderRadius: 5,
  },
  dotOnline: {
    backgroundColor: "#22c55e",
  },
  dotOffline: {
    backgroundColor: "#f59e0b",
  },
  playerName: {
    fontSize: 16,
  },
  reconnecting: {
    fontSize: 12,
    color: "#f59e0b",
    marginLeft: "auto",
  },
  count: {
    marginTop: 16,
    color: "#666",
  },
  buttonLeave: {
    marginTop: 24,
    marginBottom: 24,
    paddingVertical: 12,
    paddingHorizontal: 24,
  },
  buttonLeaveText: {
    color: "crimson",
    fontWeight: "600",
  },
  catalog: {
    marginTop: 24,
    width: "100%",
    maxWidth: 320,
    gap: 8,
    alignItems: "center",
  },
  buttonStart: {
    width: "100%",
    backgroundColor: "#4f46e5",
    borderRadius: 8,
    paddingVertical: 12,
    alignItems: "center",
  },
  buttonDisabled: {
    opacity: 0.4,
  },
  buttonStartText: {
    color: "#fff",
    fontWeight: "600",
    fontSize: 16,
  },
  buttonStartHint: {
    color: "#e0e0ff",
    fontSize: 11,
    marginTop: 2,
  },
  waitingHost: {
    marginTop: 24,
    color: "#888",
    fontSize: 13,
  },
  error: {
    color: "crimson",
    marginTop: 8,
    textAlign: "center",
  },
  resultsBox: {
    width: "100%",
    maxWidth: 400,
    backgroundColor: "#f5f5ff",
    borderRadius: 8,
    padding: 12,
    marginBottom: 16,
  },
  resultsTitle: {
    fontWeight: "600",
    marginBottom: 4,
  },
  resultsLine: {
    fontSize: 13,
    color: "#333",
  },
});
