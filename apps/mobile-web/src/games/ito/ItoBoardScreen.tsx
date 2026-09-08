import { FlatList, Pressable, StyleSheet, Text, View } from "react-native";
import type { ItoStateForPlayer } from "@central-de-jogos/game-ito";
import type { LobbyPlayer } from "../../types";

interface ItoBoardScreenProps {
  state: ItoStateForPlayer;
  players: LobbyPlayer[];
  mySessionId: string;
  onReorder: (order: string[]) => void;
  onToggleReady: () => void;
}

function nicknameOf(players: LobbyPlayer[], playerId: string): string {
  return players.find((p) => p.id === playerId)?.nickname ?? "?";
}

export function ItoBoardScreen({
  state,
  players,
  mySessionId,
  onReorder,
  onToggleReady,
}: ItoBoardScreenProps) {
  const board = state.board;
  const iAmReady = state.readyToReveal.includes(mySessionId);

  const move = (index: number, direction: -1 | 1) => {
    const target = index + direction;
    if (target < 0 || target >= board.length) return;
    const next = [...board];
    [next[index], next[target]] = [next[target], next[index]];
    onReorder(next);
  };

  return (
    <View style={styles.container}>
      <Text style={styles.round}>
        Rodada {state.round}
        {state.roundsConfig.type === "fixed" ? ` / ${state.roundsConfig.totalRounds}` : ""}
      </Text>
      <Text style={styles.theme}>{state.theme}</Text>
      <Text style={styles.hint}>
        {state.mode === "consensus"
          ? "Use as setas pra reordenar juntos do menor pro maior número."
          : "Use as setas pra montar o SEU palpite. Só você vê essa lista."}
      </Text>

      <FlatList
        style={styles.listWrapper}
        contentContainerStyle={styles.listContent}
        data={board}
        keyExtractor={(playerId) => playerId}
        renderItem={({ item: playerId, index }) => {
          const card = state.cards[playerId];
          return (
            <View style={styles.card}>
              <Text style={styles.cardPosition}>{index + 1}º</Text>
              <View style={styles.cardBody}>
                <Text style={styles.cardClue}>"{card?.clue}"</Text>
                <Text style={styles.cardAuthor}>{nicknameOf(players, playerId)}</Text>
              </View>
              <View style={styles.moves}>
                <Pressable
                  style={[styles.moveButton, index === 0 && styles.moveButtonDisabled]}
                  disabled={index === 0}
                  onPress={() => move(index, -1)}
                  hitSlop={8}
                >
                  <Text style={styles.moveButtonText}>↑</Text>
                </Pressable>
                <Pressable
                  style={[styles.moveButton, index === board.length - 1 && styles.moveButtonDisabled]}
                  disabled={index === board.length - 1}
                  onPress={() => move(index, 1)}
                  hitSlop={8}
                >
                  <Text style={styles.moveButtonText}>↓</Text>
                </Pressable>
              </View>
            </View>
          );
        }}
      />

      <View style={styles.footer}>
        <Text style={styles.readyCount}>
          {state.readyToReveal.length}/{players.length} prontos pra revelar
        </Text>
        <Pressable
          style={[styles.buttonReveal, iAmReady && styles.buttonReadyActive]}
          onPress={onToggleReady}
        >
          <Text style={styles.buttonRevealText}>{iAmReady ? "Cancelar pronto" : "Pronto pra revelar"}</Text>
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#fff",
    alignItems: "center",
    paddingTop: 48,
    paddingHorizontal: 24,
  },
  round: {
    fontSize: 12,
    color: "#888",
  },
  theme: {
    fontSize: 22,
    fontWeight: "bold",
    marginBottom: 4,
    textAlign: "center",
  },
  hint: {
    fontSize: 12,
    color: "#888",
    textAlign: "center",
    marginBottom: 16,
    maxWidth: 340,
  },
  listWrapper: {
    flex: 1,
    width: "100%",
    maxWidth: 420,
  },
  listContent: {
    paddingBottom: 8,
  },
  card: {
    flexDirection: "row",
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#eee",
    borderRadius: 8,
    padding: 10,
    marginBottom: 8,
    gap: 8,
  },
  cardPosition: {
    fontWeight: "bold",
    color: "#4f46e5",
    width: 28,
  },
  cardBody: {
    flex: 1,
  },
  cardClue: {
    fontSize: 16,
    fontWeight: "600",
  },
  cardAuthor: {
    fontSize: 12,
    color: "#888",
  },
  moves: {
    gap: 4,
  },
  moveButton: {
    width: 32,
    height: 28,
    backgroundColor: "#eee",
    borderRadius: 6,
    alignItems: "center",
    justifyContent: "center",
  },
  moveButtonDisabled: {
    opacity: 0.3,
  },
  moveButtonText: {
    fontWeight: "bold",
  },
  footer: {
    width: "100%",
    maxWidth: 320,
    alignItems: "center",
    paddingTop: 8,
    paddingBottom: 16,
  },
  readyCount: {
    marginBottom: 8,
    fontSize: 12,
    color: "#666",
  },
  buttonReveal: {
    width: "100%",
    backgroundColor: "#4f46e5",
    borderRadius: 8,
    paddingVertical: 14,
    alignItems: "center",
  },
  buttonReadyActive: {
    backgroundColor: "#22c55e",
  },
  buttonRevealText: {
    color: "#fff",
    fontWeight: "700",
    fontSize: 16,
  },
});
