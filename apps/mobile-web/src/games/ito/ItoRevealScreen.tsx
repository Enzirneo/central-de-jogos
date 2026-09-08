import { Pressable, StyleSheet, Text, View } from "react-native";
import type { ItoStateForPlayer } from "@central-de-jogos/game-ito";
import type { LobbyPlayer } from "../../types";

interface ItoRevealScreenProps {
  state: ItoStateForPlayer;
  players: LobbyPlayer[];
  mySessionId: string;
  onToggleReadyForNextRound: () => void;
  onEndGame: () => void;
}

function nicknameOf(players: LobbyPlayer[], playerId: string): string {
  return players.find((p) => p.id === playerId)?.nickname ?? "?";
}

export function ItoRevealScreen({
  state,
  players,
  mySessionId,
  onToggleReadyForNextRound,
  onEndGame,
}: ItoRevealScreenProps) {
  const result = state.lastRoundResult;
  const isLastFixedRound =
    state.roundsConfig.type === "fixed" && state.round >= state.roundsConfig.totalRounds;
  const iAmReady = state.readyForNextRound.includes(mySessionId);

  return (
    <View style={styles.container}>
      <Text style={styles.round}>
        Rodada {state.round}
        {state.roundsConfig.type === "fixed" ? ` / ${state.roundsConfig.totalRounds}` : ""}
      </Text>
      <Text style={styles.theme}>{state.theme}</Text>

      {state.mode === "consensus" ? (
        <ConsensusResult state={state} players={players} />
      ) : (
        <IndividualResult state={state} players={players} />
      )}

      <View style={styles.actions}>
        {!isLastFixedRound && (
          <>
            <Text style={styles.hint}>
              {state.readyForNextRound.length}/{players.length} prontos pra próxima rodada
            </Text>
            <Pressable
              style={[styles.buttonPrimary, iAmReady && styles.buttonReadyActive]}
              onPress={onToggleReadyForNextRound}
            >
              <Text style={styles.buttonPrimaryText}>
                {iAmReady ? "Cancelar pronto" : "Pronto pra próxima rodada"}
              </Text>
            </Pressable>
          </>
        )}
        {state.roundsConfig.type === "endless" && (
          <Pressable style={styles.buttonSecondary} onPress={onEndGame}>
            <Text style={styles.buttonSecondaryText}>Encerrar jogo</Text>
          </Pressable>
        )}
      </View>

      {result === null && <Text style={styles.hint}>Carregando resultado…</Text>}
    </View>
  );
}

function ConsensusResult({ state, players }: { state: ItoStateForPlayer; players: LobbyPlayer[] }) {
  const result = state.lastRoundResult;
  if (!result?.finalBoard) return null;

  return (
    <View style={styles.resultBox}>
      <Text style={styles.resultHeadline}>
        {result.correctPositions} de {result.finalBoard.length} posições certas
      </Text>
      <Text style={styles.hint}>Placar de equipe acumulado: {state.teamScore}</Text>

      {result.finalBoard.map((playerId, index) => {
        const card = state.cards[playerId];
        const correct = result.correctOrder[index] === playerId;
        return (
          <View key={playerId} style={[styles.row, correct ? styles.rowCorrect : styles.rowWrong]}>
            <Text style={styles.rowPosition}>{index + 1}º</Text>
            <View style={styles.rowBody}>
              <Text style={styles.rowClue}>
                "{card?.clue}" — {nicknameOf(players, playerId)}
              </Text>
            </View>
            <Text style={styles.rowNumber}>{card?.number}</Text>
          </View>
        );
      })}
    </View>
  );
}

function IndividualResult({ state, players }: { state: ItoStateForPlayer; players: LobbyPlayer[] }) {
  const result = state.lastRoundResult;
  if (!result) return null;

  const winners = result.winners ?? [];
  const hasWinners = winners.length > 0;

  return (
    <View style={styles.resultBox}>
      <Text style={styles.resultHeadline}>
        {hasWinners
          ? winners.length === 1
            ? `${nicknameOf(players, winners[0])} acertou 100%! 🎉`
            : `${winners.map((id) => nicknameOf(players, id)).join(", ")} acertaram 100%! 🎉`
          : "Ninguém acertou a ordem certa dessa vez."}
      </Text>
      <Text style={styles.hint}>
        {hasWinners ? "A ordem vencedora era:" : "A ordem certa era:"}
      </Text>

      {result.correctOrder.map((playerId, index) => {
        const card = state.cards[playerId];
        return (
          <View key={playerId} style={styles.row}>
            <Text style={styles.rowPosition}>{index + 1}º</Text>
            <View style={styles.rowBody}>
              <Text style={styles.rowClue}>
                "{card?.clue}" — {nicknameOf(players, playerId)}
              </Text>
            </View>
            <Text style={styles.rowNumber}>{card?.number}</Text>
          </View>
        );
      })}

      <Text style={[styles.hint, { marginTop: 12 }]}>Vitórias acumuladas:</Text>
      {players.map((player) => (
        <Text key={player.id} style={styles.winsLine}>
          {player.nickname}: {state.individualWins?.[player.id] ?? 0}
        </Text>
      ))}
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
    gap: 4,
  },
  round: {
    fontSize: 12,
    color: "#888",
  },
  theme: {
    fontSize: 22,
    fontWeight: "bold",
    marginBottom: 12,
    textAlign: "center",
  },
  resultBox: {
    width: "100%",
    maxWidth: 420,
  },
  resultHeadline: {
    fontSize: 18,
    fontWeight: "700",
    textAlign: "center",
    marginBottom: 8,
  },
  hint: {
    fontSize: 12,
    color: "#888",
    textAlign: "center",
    marginBottom: 8,
  },
  row: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 8,
    paddingHorizontal: 10,
    borderRadius: 8,
    gap: 8,
    marginBottom: 4,
  },
  rowCorrect: {
    backgroundColor: "#dcfce7",
  },
  rowWrong: {
    backgroundColor: "#fef2f2",
  },
  rowPosition: {
    fontWeight: "bold",
    width: 28,
  },
  rowBody: {
    flex: 1,
  },
  rowClue: {
    fontSize: 14,
  },
  rowNumber: {
    fontWeight: "bold",
    color: "#4f46e5",
    fontSize: 16,
  },
  winsLine: {
    fontSize: 13,
    color: "#333",
    textAlign: "center",
  },
  actions: {
    marginTop: 24,
    marginBottom: 24,
    width: "100%",
    maxWidth: 320,
    gap: 8,
  },
  buttonPrimary: {
    backgroundColor: "#4f46e5",
    borderRadius: 8,
    paddingVertical: 14,
    alignItems: "center",
  },
  buttonPrimaryText: {
    color: "#fff",
    fontWeight: "700",
    fontSize: 16,
  },
  buttonReadyActive: {
    backgroundColor: "#22c55e",
  },
  buttonSecondary: {
    paddingVertical: 10,
    alignItems: "center",
  },
  buttonSecondaryText: {
    color: "crimson",
    fontWeight: "600",
  },
});
