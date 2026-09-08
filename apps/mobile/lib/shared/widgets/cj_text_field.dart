import 'package:flutter/material.dart';
import 'package:flutter/services.dart';

import '../../core/theme/tokens.dart';

/// Campo de texto com rótulo em maiúsculas, no estilo da web (`<cj-text-field>`).
class CjTextField extends StatefulWidget {
  const CjTextField({
    super.key,
    required this.label,
    required this.value,
    required this.onChanged,
    this.hintText,
    this.maxLength,
    this.textCapitalization = TextCapitalization.none,
    this.onSubmitted,
  });

  final String label;
  final String value;
  final ValueChanged<String> onChanged;
  final String? hintText;
  final int? maxLength;
  final TextCapitalization textCapitalization;
  final VoidCallback? onSubmitted;

  @override
  State<CjTextField> createState() => _CjTextFieldState();
}

class _CjTextFieldState extends State<CjTextField> {
  late final _controller = TextEditingController(text: widget.value);

  @override
  void didUpdateWidget(CjTextField old) {
    super.didUpdateWidget(old);
    if (widget.value != _controller.text) {
      _controller.value = TextEditingValue(
        text: widget.value,
        selection: TextSelection.collapsed(offset: widget.value.length),
      );
    }
  }

  @override
  void dispose() {
    _controller.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    final border = OutlineInputBorder(
      borderRadius: BorderRadius.circular(CjTokens.radiusSm),
      borderSide: BorderSide(color: CjTokens.border),
    );
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      spacing: 6,
      children: [
        Text(
          widget.label.toUpperCase(),
          style: TextStyle(
            fontSize: 11,
            letterSpacing: 1.4,
            fontWeight: FontWeight.w600,
            color: CjTokens.muted,
          ),
        ),
        TextField(
          controller: _controller,
          onChanged: widget.onChanged,
          onSubmitted: (_) => widget.onSubmitted?.call(),
          textCapitalization: widget.textCapitalization,
          inputFormatters: [
            if (widget.maxLength != null)
              LengthLimitingTextInputFormatter(widget.maxLength),
          ],
          decoration: InputDecoration(
            hintText: widget.hintText,
            filled: true,
            fillColor: CjTokens.surface2,
            border: border,
            enabledBorder: border,
          ),
        ),
      ],
    );
  }
}
