import 'package:flutter/material.dart';

import 'core/router.dart';
import 'core/theme/app_theme.dart';

class CentralDeJogosApp extends StatelessWidget {
  const CentralDeJogosApp({super.key});

  @override
  Widget build(BuildContext context) {
    return MaterialApp.router(
      title: 'Central de Jogos',
      debugShowCheckedModeBanner: false,
      theme: buildAppTheme(),
      routerConfig: appRouter,
    );
  }
}
