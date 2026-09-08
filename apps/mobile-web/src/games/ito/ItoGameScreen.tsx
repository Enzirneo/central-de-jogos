import { StyleSheet, Text, View } from "react-native";
import type { ItoStateForPlayer } from "@central-de-jogos/game-ito";
import type { LobbyPlayer } from "../../types";
import { ItoClueScreen } from "./ItoClueScreen";
import { ItoBoardScreen } from "./ItoBoardScreen";
import { ItoRevealScreen } from "./ItoRevealScreen";

interface ItoGameScreenProps {
  state: ItoStateForPlayer | null;
  players: LobbyPlayer[];
  mySessionId: string;
  onSubmitClue: (clue: string) => void;
  onReorder: (order: string[]) => void;
  onToggleReadyToReveal: () => void;
  onToggleReadyForNextRound: () => void;
  onEndGame: () => void;
}

export function ItoGameScreen({
  state,
  players,
  mySessionId,
  onSubmitClue,
  onReorder,
  onToggleReadyToReveal,
  onToggleReadyForNextRound,
  onEndGame,
}: ItoGameScreenProps) {
  if (!state) {
    return (
      <View style={styles.container}>
        <Text>Carregando ITO…</Text>
      </View>
    );
  }

  switch (state.phase) {
    case "giving_clues":
      return (
        <ItoClueScreen
          state={state}
          players={players}
          mySessionId={mySessionId}
          onSubmitClue={onSubmitClue}
        />
      );
    case "organizing":
      return (
        <ItoBoardScreen
          state={state}
          players={players}
          mySessionId={mySessionId}
          onReorder={onReorder}
          onToggleReady={onToggleReadyToReveal}
        />
      );
    case "revealed":
      return (
        <ItoRevealScreen
          state={state}
          players={players}
          mySessionId={mySessionId}
          onToggleReadyForNextRound={onToggleReadyForNextRound}
          onEndGame={onEndGame}
        />
      );
    default:
      return null;
  }
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#fff",
    alignItems: "center",
    justifyContent: "center",
  },
});
