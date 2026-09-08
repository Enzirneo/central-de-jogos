import { useState } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import type { ItoMode, ItoRoundsConfig } from "@central-de-jogos/game-ito";

export interface ItoStartOptions {
  mode: ItoMode;
  rounds: ItoRoundsConfig;
}

interface ItoStartConfigScreenProps {
  onConfirm: (options: ItoStartOptions) => void;
  onCancel: () => void;
}

const MIN_ROUNDS = 2;
const MAX_ROUNDS = 20;
const DEFAULT_ROUNDS = 5;

export function ItoStartConfigScreen({ onConfirm, onCancel }: ItoStartConfigScreenProps) {
  const [mode, setMode] = useState<ItoMode>("consensus");
  const [roundsType, setRoundsType] = useState<"fixed" | "endless">("fixed");
  const [totalRounds, setTotalRounds] = useState(DEFAULT_ROUNDS);

  const handleConfirm = () => {
    const rounds: ItoRoundsConfig =
      roundsType === "endless" ? { type: "endless" } : { type: "fixed", totalRounds };
    onConfirm({ mode, rounds });
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Configurar ITO</Text>

      <Text style={styles.label}>Modo</Text>
      <View style={styles.optionRow}>
        <OptionButton
          label="Consenso"
          description="Um quadro só, todo mundo mexe junto, placar de equipe."
          selected={mode === "consensus"}
          onPress={() => setMode("consensus")}
        />
        <OptionButton
          label="Individual"
          description="Cada um monta seu próprio palpite. Só pontua quem acerta 100%."
          selected={mode === "individual"}
          onPress={() => setMode("individual")}
        />
      </View>

      <Text style={styles.label}>Rodadas</Text>
      <View style={styles.optionRow}>
        <OptionButton
          label="Número fixo"
          selected={roundsType === "fixed"}
          onPress={() => setRoundsType("fixed")}
        />
        <OptionButton
          label="Livre (até encerrar)"
          selected={roundsType === "endless"}
          onPress={() => setRoundsType("endless")}
        />
      </View>

      {roundsType === "fixed" && (
        <View style={styles.stepper}>
          <Pressable
            style={styles.stepperButton}
            onPress={() => setTotalRounds((n) => Math.max(MIN_ROUNDS, n - 1))}
          >
            <Text style={styles.stepperButtonText}>−</Text>
          </Pressable>
          <Text style={styles.stepperValue}>{totalRounds} rodadas</Text>
          <Pressable
            style={styles.stepperButton}
            onPress={() => setTotalRounds((n) => Math.min(MAX_ROUNDS, n + 1))}
          >
            <Text style={styles.stepperButtonText}>+</Text>
          </Pressable>
        </View>
      )}

      <Pressable style={styles.buttonStart} onPress={handleConfirm}>
        <Text style={styles.buttonStartText}>Começar</Text>
      </Pressable>
      <Pressable style={styles.buttonCancel} onPress={onCancel}>
        <Text style={styles.buttonCancelText}>Cancelar</Text>
      </Pressable>
    </View>
  );
}

function OptionButton({
  label,
  description,
  selected,
  onPress,
}: {
  label: string;
  description?: string;
  selected: boolean;
  onPress: () => void;
}) {
  return (
    <Pressable
      style={[styles.option, selected && styles.optionSelected]}
      onPress={onPress}
    >
      <Text style={[styles.optionLabel, selected && styles.optionLabelSelected]}>{label}</Text>
      {description && <Text style={styles.optionDescription}>{description}</Text>}
    </Pressable>
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
    marginBottom: 16,
  },
  label: {
    alignSelf: "flex-start",
    fontSize: 13,
    color: "#666",
    marginTop: 16,
    marginBottom: 8,
  },
  optionRow: {
    flexDirection: "row",
    gap: 8,
    width: "100%",
    maxWidth: 400,
  },
  option: {
    flex: 1,
    borderWidth: 1,
    borderColor: "#ddd",
    borderRadius: 8,
    padding: 12,
  },
  optionSelected: {
    borderColor: "#4f46e5",
    backgroundColor: "#f5f5ff",
  },
  optionLabel: {
    fontWeight: "600",
    marginBottom: 4,
  },
  optionLabelSelected: {
    color: "#4f46e5",
  },
  optionDescription: {
    fontSize: 12,
    color: "#888",
  },
  stepper: {
    flexDirection: "row",
    alignItems: "center",
    gap: 16,
    marginTop: 12,
  },
  stepperButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "#eee",
    alignItems: "center",
    justifyContent: "center",
  },
  stepperButtonText: {
    fontSize: 20,
    fontWeight: "bold",
  },
  stepperValue: {
    fontSize: 16,
    fontWeight: "600",
    minWidth: 100,
    textAlign: "center",
  },
  buttonStart: {
    marginTop: 32,
    width: "100%",
    maxWidth: 320,
    backgroundColor: "#4f46e5",
    borderRadius: 8,
    paddingVertical: 12,
    alignItems: "center",
  },
  buttonStartText: {
    color: "#fff",
    fontWeight: "600",
    fontSize: 16,
  },
  buttonCancel: {
    marginTop: 8,
    paddingVertical: 12,
  },
  buttonCancelText: {
    color: "#888",
  },
});
