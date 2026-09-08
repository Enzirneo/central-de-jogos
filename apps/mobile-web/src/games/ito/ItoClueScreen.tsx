import { useState } from "react";
import { FlatList, Pressable, StyleSheet, Text, TextInput, View } from "react-native";
import type { ItoStateForPlayer } from "@central-de-jogos/game-ito";
import type { LobbyPlayer } from "../../types";

interface ItoClueScreenProps {
  state: ItoStateForPlayer;
  players: LobbyPlayer[];
  mySessionId: string;
  onSubmitClue: (clue: string) => void;
}

export function ItoClueScreen({ state, players, mySessionId, onSubmitClue }: ItoClueScreenProps) {
  const [clue, setClue] = useState("");
  const myCard = state.cards[mySessionId];
  const submitted = myCard?.hasSubmittedClue ?? false;

  return (
    <View style={styles.container}>
      <Text style={styles.round}>
        Rodada {state.round}
        {state.roundsConfig.type === "fixed" ? ` / ${state.roundsConfig.totalRounds}` : ""}
      </Text>
      <Text style={styles.theme}>{state.theme}</Text>

      <Text style={styles.label}>Seu número secreto</Text>
      <Text style={styles.number}>{state.myNumber}</Text>
      <Text style={styles.hint}>Pense numa dica que represente esse número de 1 a 100 no tema acima.</Text>

      {submitted ? (
        <View style={styles.submittedBox}>
          <Text style={styles.submittedLabel}>Sua dica:</Text>
          <Text style={styles.submittedClue}>"{myCard?.clue}"</Text>
          <Text style={styles.hint}>Aguardando os outros jogadores…</Text>
        </View>
      ) : (
        <View style={styles.form}>
          <TextInput
            style={styles.input}
            placeholder="Sua dica (ex: Pizza)"
            value={clue}
            onChangeText={setClue}
            maxLength={60}
          />
          <Pressable
            style={[styles.button, clue.trim().length === 0 && styles.buttonDisabled]}
            disabled={clue.trim().length === 0}
            onPress={() => onSubmitClue(clue.trim())}
          >
            <Text style={styles.buttonText}>Enviar dica</Text>
          </Pressable>
        </View>
      )}

      <Text style={styles.label}>Quem já mandou a dica</Text>
      <FlatList
        style={styles.list}
        data={players}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <View style={styles.playerRow}>
            <Text style={styles.playerName}>{item.nickname}</Text>
            <Text style={state.cards[item.id]?.hasSubmittedClue ? styles.ready : styles.waiting}>
              {state.cards[item.id]?.hasSubmittedClue ? "✓ pronto" : "aguardando…"}
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
  label: {
    alignSelf: "flex-start",
    fontSize: 13,
    color: "#666",
    marginTop: 16,
  },
  number: {
    fontSize: 56,
    fontWeight: "bold",
    color: "#4f46e5",
  },
  hint: {
    fontSize: 12,
    color: "#888",
    textAlign: "center",
    marginBottom: 8,
  },
  form: {
    width: "100%",
    maxWidth: 360,
    gap: 8,
    marginTop: 8,
  },
  input: {
    borderWidth: 1,
    borderColor: "#ccc",
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 16,
  },
  button: {
    backgroundColor: "#4f46e5",
    borderRadius: 8,
    paddingVertical: 12,
    alignItems: "center",
  },
  buttonDisabled: {
    opacity: 0.4,
  },
  buttonText: {
    color: "#fff",
    fontWeight: "600",
  },
  submittedBox: {
    alignItems: "center",
    marginTop: 8,
    marginBottom: 8,
  },
  submittedLabel: {
    fontSize: 12,
    color: "#888",
  },
  submittedClue: {
    fontSize: 18,
    fontWeight: "600",
    marginVertical: 4,
  },
  list: {
    width: "100%",
    maxWidth: 360,
    marginTop: 8,
  },
  playerRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: "#eee",
  },
  playerName: {
    fontSize: 14,
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
});
