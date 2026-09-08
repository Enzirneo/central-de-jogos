import 'package:go_router/go_router.dart';

import '../features/home/home_page.dart';
import '../features/sala/sala_page.dart';

/// Rotas do app. A navegação entre `/` e `/sala` é disparada pelas telas
/// (`ref.listen` no estado da sala), espelhando os `effect()` da web.
final appRouter = GoRouter(
  routes: [
    GoRoute(path: '/', builder: (context, state) => const HomePage()),
    GoRoute(path: '/sala', builder: (context, state) => const SalaPage()),
  ],
);
