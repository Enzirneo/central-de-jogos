/// Espelho manual de `apps/web/src/app/features/games/ito/ito.types.ts` —
/// que por sua vez espelha `packages/games/ito/src/types.ts`. Só a parte que o
/// cliente lê. Wrappers finos sobre o `Map` normalizado que vem em `game_state`.
library;

class ItoCard {
  ItoCard(this._m);
  final Map<String, dynamic> _m;

  String get playerId => _m['playerId'] as String;
  bool get hasSubmittedClue => _m['hasSubmittedClue'] as bool? ?? false;
  String? get clue => _m['clue'] as String?;
  int? get number => (_m['number'] as num?)?.toInt();
}

class ItoRoundResult {
  ItoRoundResult(this._m);
  final Map<String, dynamic> _m;

  List<String> get correctOrder =>
      (_m['correctOrder'] as List? ?? const []).cast<String>();
  List<String>? get finalBoard => (_m['finalBoard'] as List?)?.cast<String>();
  int get correctPositions => (_m['correctPositions'] as num?)?.toInt() ?? 0;
  List<String> get winners =>
      (_m['winners'] as List? ?? const []).cast<String>();
}

class ItoView {
  ItoView(this._m);
  final Map<String, dynamic> _m;

  String get mode => _m['mode'] as String; // 'consensus' | 'individual'
  bool get isConsensus => mode == 'consensus';
  String get phase => _m['phase'] as String; // giving_clues|organizing|revealed
  String get theme => _m['theme'] as String? ?? '';
  int get round => (_m['round'] as num?)?.toInt() ?? 0;
  int get myNumber => (_m['myNumber'] as num?)?.toInt() ?? 0;

  List<String> get board => (_m['board'] as List? ?? const []).cast<String>();
  List<String> get readyToReveal =>
      (_m['readyToReveal'] as List? ?? const []).cast<String>();
  List<String> get readyForNextRound =>
      (_m['readyForNextRound'] as List? ?? const []).cast<String>();

  int? get teamScore => (_m['teamScore'] as num?)?.toInt();

  Map<String, ItoCard> get cards => {
        for (final e in (_m['cards'] as Map? ?? const {}).entries)
          e.key as String: ItoCard((e.value as Map).cast<String, dynamic>()),
      };

  ItoRoundResult? get lastRoundResult {
    final r = _m['lastRoundResult'];
    return r == null ? null : ItoRoundResult((r as Map).cast<String, dynamic>());
  }

  bool get isEndless =>
      (_m['roundsConfig'] as Map?)?['type'] == 'endless';
  int get totalRounds =>
      ((_m['roundsConfig'] as Map?)?['totalRounds'] as num?)?.toInt() ?? 0;

  /// Há próxima rodada? (não, se for a última rodada fixa)
  bool get canAdvance => isEndless || round < totalRounds;
}
