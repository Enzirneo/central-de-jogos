import { useCallback, useState } from "react";
import { StatusBar } from "expo-status-bar";
import type { Room } from "colyseus.js";
import { getStateCallbacks } from "colyseus.js";
import { GAME_CATALOG, findCatalogEntry } from "@central-de-jogos/shared-types";
import type { GameResults } from "@central-de-jogos/shared-types";
import type { ItoStateForPlayer } from "@central-de-jogos/game-ito";
import { client, matchMakeErrorToMessage } from "./src/colyseusClient";
import { HomeScreen } from "./src/screens/HomeScreen";
import { LobbyScreen } from "./src/screens/LobbyScreen";
import { ReadyCheckScreen } from "./src/screens/ReadyCheckScreen";
import { GameScreen } from "./src/screens/GameScreen";
import { ItoGameScreen } from "./src/games/ito/ItoGameScreen";
import { ItoStartConfigScreen, type ItoStartOptions } from "./src/games/ito/ItoStartConfigScreen";
import type { LobbyPlayer, TemplateGameState } from "./src/types";

type Screen = "home" | "lobby";

export default function App() {
  const [screen, setScreen] = useState<Screen>("home");
  const [room, setRoom] = useState<Room | null>(null);
  const [roomCode, setRoomCode] = useState("");
  const [hostId, setHostId] = useState("");
  const [phase, setPhase] = useState("lobby");
  const [activeGameId, setActiveGameId] = useState("");
  const [pendingGameId, setPendingGameId] = useState("");
  const [players, setPlayers] = useState<LobbyPlayer[]>([]);
  const [gameState, setGameState] = useState<unknown>(null);
  const [lastResults, setLastResults] = useState<GameResults | null>(null);
  const [startGameError, setStartGameError] = useState<string | null>(null);
  const [pendingItoConfig, setPendingItoConfig] = useState(false);
  const [busy, setBusy] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const attachRoom = useCallback((newRoom: Room) => {
    const $ = getStateCallbacks(newRoom);

    const syncPlayers = () => {
      const list: LobbyPlayer[] = [];
      newRoom.state.players?.forEach((player: any) => {
        list.push({
          id: player.id,
          nickname: player.nickname,
          connected: player.connected,
          ready: player.ready,
        });
      });
      setPlayers(list);
    };

    // Não lemos `newRoom.state` diretamente aqui: logo após create()/join(),
    // o estado ainda pode não estar totalmente decodificado. Os callbacks
    // abaixo disparam assim que os dados realmente chegam (e de novo a cada
    // mudança), então é a forma segura de popular a tela.
    $(newRoom.state).listen("code", (code: string) => setRoomCode(code));
    $(newRoom.state).listen("hostId", (id: string) => setHostId(id));
    $(newRoom.state).listen("activeGameId", (id: string) => setActiveGameId(id));
    $(newRoom.state).listen("pendingGameId", (id: string) => setPendingGameId(id));
    $(newRoom.state).listen("phase", (nextPhase: string) => {
      setPhase(nextPhase);
      if (nextPhase === "lobby") {
        setGameState(null);
        setPendingItoConfig(false);
      }
    });

    $(newRoom.state).players.onAdd((player: any) => {
      syncPlayers();
      $(player).onChange(() => syncPlayers());
    });
    $(newRoom.state).players.onRemove(() => syncPlayers());

    newRoom.onMessage("game_state", (state: unknown) => {
      setGameState(state);
    });

    newRoom.onMessage("game_over", (results: GameResults) => {
      setLastResults(results);
      setGameState(null);
    });

    newRoom.onMessage("start_game_error", ({ message }: { message: string }) => {
      setStartGameError(message);
    });

    newRoom.onLeave(() => {
      setRoom(null);
      setPlayers([]);
      setRoomCode("");
      setHostId("");
      setPhase("lobby");
      setActiveGameId("");
      setPendingGameId("");
      setGameState(null);
      setLastResults(null);
      setStartGameError(null);
      setPendingItoConfig(false);
      setScreen("home");
    });

    setRoom(newRoom);
    setScreen("lobby");
  }, []);

  const handleCreateRoom = useCallback(
    async (nickname: string) => {
      setBusy(true);
      setErrorMessage(null);
      try {
        const newRoom = await client.create("lobby", { nickname });
        attachRoom(newRoom);
      } catch (err) {
        setErrorMessage(matchMakeErrorToMessage(err));
      } finally {
        setBusy(false);
      }
    },
    [attachRoom]
  );

  const handleJoinRoom = useCallback(
    async (nickname: string, code: string) => {
      setBusy(true);
      setErrorMessage(null);
      try {
        const newRoom = await client.join("lobby", { nickname, code });
        attachRoom(newRoom);
      } catch (err) {
        setErrorMessage(matchMakeErrorToMessage(err));
      } finally {
        setBusy(false);
      }
    },
    [attachRoom]
  );

  const handleLeaveRoom = useCallback(() => {
    room?.leave();
  }, [room]);

  // ITO precisa de uma pequena configuração local (modo, rodadas) antes de
  // propor o jogo pra sala; outros jogos (como o _template) propõem direto.
  const handleSelectGame = useCallback((gameId: string) => {
    setStartGameError(null);
    if (gameId === "ito") {
      setPendingItoConfig(true);
      return;
    }
    room?.send("select_game", { gameId });
  }, [room]);

  const handleConfirmItoConfig = useCallback(
    (options: ItoStartOptions) => {
      room?.send("select_game", { gameId: "ito", options });
      setPendingItoConfig(false);
    },
    [room]
  );

  const handleToggleReady = useCallback(() => {
    room?.send("toggle_ready");
  }, [room]);

  const handleCancelStart = useCallback(() => {
    room?.send("cancel_start");
  }, [room]);

  const handleGameAction = useCallback(
    (action: unknown) => {
      room?.send("game_action", action);
    },
    [room]
  );

  if (screen === "home") {
    return (
      <>
        <HomeScreen
          busy={busy}
          errorMessage={errorMessage}
          onCreateRoom={handleCreateRoom}
          onJoinRoom={handleJoinRoom}
        />
        <StatusBar style="auto" />
      </>
    );
  }

  const mySessionId = room?.sessionId ?? "";
  const isHost = !!room && room.sessionId === hostId;

  let content;
  if (phase === "playing" && activeGameId === "_template") {
    content = (
      <GameScreen
        gameState={gameState as TemplateGameState | null}
        players={players}
        mySessionId={mySessionId}
        onIncrement={() => handleGameAction({ type: "increment" })}
      />
    );
  } else if (phase === "playing" && activeGameId === "ito") {
    content = (
      <ItoGameScreen
        state={gameState as ItoStateForPlayer | null}
        players={players}
        mySessionId={mySessionId}
        onSubmitClue={(clue) => handleGameAction({ type: "submit_clue", clue })}
        onReorder={(order) => handleGameAction({ type: "reorder_board", order })}
        onToggleReadyToReveal={() => handleGameAction({ type: "ready_to_reveal" })}
        onToggleReadyForNextRound={() => handleGameAction({ type: "ready_for_next_round" })}
        onEndGame={() => handleGameAction({ type: "end_game" })}
      />
    );
  } else if (phase === "starting") {
    content = (
      <ReadyCheckScreen
        gameLabel={findCatalogEntry(pendingGameId)?.displayName ?? "Jogo"}
        players={players}
        mySessionId={mySessionId}
        isHost={isHost}
        onToggleReady={handleToggleReady}
        onCancel={handleCancelStart}
      />
    );
  } else if (pendingItoConfig) {
    content = (
      <ItoStartConfigScreen
        onConfirm={handleConfirmItoConfig}
        onCancel={() => setPendingItoConfig(false)}
      />
    );
  } else {
    content = (
      <LobbyScreen
        code={roomCode}
        players={players}
        mySessionId={mySessionId}
        isHost={isHost}
        catalog={GAME_CATALOG}
        startGameError={startGameError}
        lastResults={lastResults}
        onLeave={handleLeaveRoom}
        onSelectGame={handleSelectGame}
      />
    );
  }

  return (
    <>
      {content}
      <StatusBar style="auto" />
    </>
  );
}
