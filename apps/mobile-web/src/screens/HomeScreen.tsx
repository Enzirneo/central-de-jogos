import { useState } from "react";
import {
  ActivityIndicator,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";

interface HomeScreenProps {
  busy: boolean;
  errorMessage: string | null;
  onCreateRoom: (nickname: string) => void;
  onJoinRoom: (nickname: string, code: string) => void;
}

export function HomeScreen({
  busy,
  errorMessage,
  onCreateRoom,
  onJoinRoom,
}: HomeScreenProps) {
  const [nickname, setNickname] = useState("");
  const [code, setCode] = useState("");
  const [showJoinField, setShowJoinField] = useState(false);

  const hasNickname = nickname.trim().length > 0;
  const canJoin = hasNickname && code.trim().length === 4 && !busy;

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Central de Jogos</Text>
      <Text style={styles.subtitle}>Crie uma sala ou entre com um código</Text>

      <TextInput
        style={styles.input}
        placeholder="Seu apelido"
        value={nickname}
        onChangeText={setNickname}
        maxLength={20}
        editable={!busy}
      />

      <Pressable
        style={[styles.button, (!hasNickname || busy) && styles.buttonDisabled]}
        disabled={!hasNickname || busy}
        onPress={() => onCreateRoom(nickname.trim())}
      >
        <Text style={styles.buttonText}>Criar sala</Text>
      </Pressable>

      {!showJoinField ? (
        <Pressable
          style={styles.buttonSecondary}
          onPress={() => setShowJoinField(true)}
          disabled={busy}
        >
          <Text style={styles.buttonSecondaryText}>Entrar com código</Text>
        </Pressable>
      ) : (
        <>
          <TextInput
            style={[styles.input, styles.codeInput]}
            placeholder="ABCD"
            value={code}
            onChangeText={(text) => setCode(text.toUpperCase().slice(0, 4))}
            maxLength={4}
            autoCapitalize="characters"
            editable={!busy}
          />
          <Pressable
            style={[styles.button, !canJoin && styles.buttonDisabled]}
            disabled={!canJoin}
            onPress={() => onJoinRoom(nickname.trim(), code.trim())}
          >
            <Text style={styles.buttonText}>Entrar na sala</Text>
          </Pressable>
        </>
      )}

      {busy && <ActivityIndicator style={styles.spinner} />}
      {errorMessage && <Text style={styles.error}>{errorMessage}</Text>}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#fff",
    alignItems: "center",
    justifyContent: "center",
    padding: 24,
    gap: 12,
  },
  title: {
    fontSize: 28,
    fontWeight: "bold",
  },
  subtitle: {
    fontSize: 14,
    color: "#666",
    marginBottom: 12,
  },
  input: {
    width: "100%",
    maxWidth: 320,
    borderWidth: 1,
    borderColor: "#ccc",
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 16,
  },
  codeInput: {
    textAlign: "center",
    fontSize: 24,
    letterSpacing: 8,
    fontWeight: "600",
  },
  button: {
    width: "100%",
    maxWidth: 320,
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
    fontSize: 16,
  },
  buttonSecondary: {
    width: "100%",
    maxWidth: 320,
    borderRadius: 8,
    paddingVertical: 12,
    alignItems: "center",
  },
  buttonSecondaryText: {
    color: "#4f46e5",
    fontWeight: "600",
    fontSize: 16,
  },
  spinner: {
    marginTop: 8,
  },
  error: {
    color: "crimson",
    textAlign: "center",
    marginTop: 8,
  },
});
