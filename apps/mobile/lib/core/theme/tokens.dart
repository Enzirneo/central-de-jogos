import 'package:flutter/material.dart';

/// Espelho manual de `apps/web/src/styles/_tokens.scss` (fonte aprovada:
/// `docs/preview-visual.html`). Tema único escuro, verde-floresta.
/// Se os tokens da web mudarem, atualizar aqui.
class CjTokens {
  CjTokens._();

  static Color _hsl(double h, double s, double l, [double a = 1]) =>
      HSLColor.fromAHSL(a, h, s / 100, l / 100).toColor();

  // superfícies
  static final Color bg = _hsl(160, 14, 6);
  static final Color bgDeep = _hsl(160, 14, 4);
  static final Color surface = _hsl(160, 14, 9);
  static final Color surface2 = _hsl(160, 12, 13);

  // texto
  static final Color fg = _hsl(150, 20, 96);
  static final Color muted = _hsl(150, 8, 58);

  // linhas
  static final Color border = _hsl(160, 12, 16);

  // marca
  static final Color primary = _hsl(158, 39, 30);
  static final Color primaryFg = _hsl(150, 30, 98);
  static final Color glow = _hsl(152, 22, 56);

  // semânticas
  static final Color success = _hsl(142, 60, 45);
  static final Color warning = _hsl(38, 92, 55);
  static final Color danger = _hsl(0, 70, 55);

  // forma
  static const double radius = 14;
  static const double radiusSm = 8;
  static const double radiusLg = 20;

  // espaçamento base
  static const double gap = 16;

  // motion
  static const Duration dur = Duration(milliseconds: 250);
  static const Cubic ease = Cubic(0.2, 0.7, 0.2, 1);
}
