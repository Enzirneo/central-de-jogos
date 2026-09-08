import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';

import '../../core/colyseus/room_controller.dart';
import '../../core/nickname_store.dart';
import '../../core/theme/tokens.dart';
import '../../shared/widgets/cj_screen.dart';
import '../../shared/widgets/cj_text_field.dart';

/// Entrada: apelido + criar sala, ou entrar por código. Espelha `features/home`
/// da web. Ao conectar, o `SalaPage` assume (via redirect do router).
class HomePage extends ConsumerStatefulWidget {
  const HomePage({super.key});

  @override
  ConsumerState<HomePage> createState() => _HomePageState();
}

class _HomePageState extends ConsumerState<HomePage> {
  final _nicknames = NicknameStore();
  String _nickname = '';
  String _code = '';

  @override
  void initState() {
    super.initState();
    _nicknames.load().then((v) {
      if (mounted) setState(() => _nickname = v);
    });
  }

  bool get _hasNick => _nickname.trim().isNotEmpty;

  void _create() {
    _nicknames.save(_nickname.trim());
    ref.read(roomControllerProvider.notifier).create(_nickname.trim());
  }

  void _join() {
    _nicknames.save(_nickname.trim());
    ref
        .read(roomControllerProvider.notifier)
        .join(_code.trim(), _nickname.trim());
  }

  @override
  Widget build(BuildContext context) {
    final room = ref.watch(roomControllerProvider);
    // conectou -> vai pra sala
    ref.listen(roomControllerProvider.select((s) => s.connected), (_, connected) {
      if (connected) context.go('/sala');
    });
    final text = Theme.of(context).textTheme;
    final busy = room.connecting;

    return CjScreen(
      center: true,
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.stretch,
        spacing: CjTokens.gap,
        children: [
          Column(
            children: [
              Text(
                'CENTRAL DE JOGOS',
                style: TextStyle(
                  letterSpacing: 3,
                  fontSize: 12,
                  color: CjTokens.glow,
                ),
              ),
              const SizedBox(height: 6),
              Text(
                'Jogue com a galera,\ncada um no seu celular',
                textAlign: TextAlign.center,
                style: text.headlineSmall,
              ),
            ],
          ),
          Card(
            child: Padding(
              padding: const EdgeInsets.all(16),
              child: Column(
                spacing: 12,
                children: [
                  CjTextField(
                    label: 'Seu apelido',
                    hintText: 'Ana',
                    value: _nickname,
                    maxLength: 20,
                    textCapitalization: TextCapitalization.words,
                    onChanged: (v) => setState(() => _nickname = v),
                  ),
                  FilledButton(
                    onPressed: busy || !_hasNick ? null : _create,
                    child: const Text('Criar uma sala'),
                  ),
                ],
              ),
            ),
          ),
          Text(
            'OU ENTRAR COM CÓDIGO',
            textAlign: TextAlign.center,
            style: TextStyle(fontSize: 11, letterSpacing: 1.5, color: CjTokens.muted),
          ),
          Card(
            child: Padding(
              padding: const EdgeInsets.all(16),
              child: Column(
                spacing: 12,
                children: [
                  CjTextField(
                    label: 'Código da sala',
                    hintText: 'ABCD',
                    value: _code,
                    maxLength: 4,
                    textCapitalization: TextCapitalization.characters,
                    onChanged: (v) => setState(() => _code = v),
                    onSubmitted: _hasNick && _code.trim().length == 4 ? _join : null,
                  ),
                  FilledButton.tonal(
                    onPressed: busy || !_hasNick || _code.trim().length < 4
                        ? null
                        : _join,
                    child: const Text('Entrar'),
                  ),
                ],
              ),
            ),
          ),
          if (room.error != null)
            Text(
              room.error!,
              textAlign: TextAlign.center,
              style: TextStyle(color: CjTokens.danger),
            ),
        ],
      ),
    );
  }
}
