import 'package:go_router/go_router.dart';

import '../features/home/home_page.dart';

/// Rotas do app. Só a home por enquanto; `/sala` entra em `feat/mobile-lobby`,
/// protegida por um redirect que checa o estado de conexão (espelha o
/// `connectedGuard` da web).
final appRouter = GoRouter(
  routes: [
    GoRoute(path: '/', builder: (context, state) => const HomePage()),
  ],
);
