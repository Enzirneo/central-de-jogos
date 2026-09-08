import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';

import 'tokens.dart';

/// `ThemeData` da Central de Jogos, derivado de [CjTokens].
/// `displayFont` = Space Grotesk (títulos), corpo = Inter — igual à web.
ThemeData buildAppTheme() {
  final scheme = ColorScheme.dark(
    primary: CjTokens.primary,
    onPrimary: CjTokens.primaryFg,
    secondary: CjTokens.glow,
    surface: CjTokens.surface,
    onSurface: CjTokens.fg,
    error: CjTokens.danger,
    outline: CjTokens.border,
  );

  final base = ThemeData(
    useMaterial3: true,
    brightness: Brightness.dark,
    colorScheme: scheme,
    scaffoldBackgroundColor: CjTokens.bg,
    textTheme: GoogleFonts.interTextTheme(ThemeData.dark().textTheme).copyWith(
      displayLarge: _display(57),
      displayMedium: _display(45),
      displaySmall: _display(36),
      headlineMedium: _display(28),
      headlineSmall: _display(24),
      titleLarge: _display(22),
    ),
  );

  return base.copyWith(
    cardTheme: CardThemeData(
      color: CjTokens.surface,
      elevation: 0,
      shape: RoundedRectangleBorder(
        borderRadius: BorderRadius.circular(CjTokens.radius),
        side: BorderSide(color: CjTokens.border),
      ),
    ),
    filledButtonTheme: FilledButtonThemeData(
      style: FilledButton.styleFrom(
        minimumSize: const Size.fromHeight(52),
        shape: RoundedRectangleBorder(
          borderRadius: BorderRadius.circular(CjTokens.radiusSm),
        ),
        textStyle: _display(16, FontWeight.w600),
      ),
    ),
  );
}

TextStyle _display(double size, [FontWeight weight = FontWeight.w500]) =>
    GoogleFonts.spaceGrotesk(fontSize: size, fontWeight: weight, height: 1.1);
