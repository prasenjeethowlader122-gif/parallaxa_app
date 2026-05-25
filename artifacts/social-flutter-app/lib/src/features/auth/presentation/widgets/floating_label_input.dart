import 'package:flutter/material.dart';
import '../../../../core/app_colors.dart';
import "package:material_symbols_icons/material_symbols_icons.dart";

class FloatingLabelInput extends StatefulWidget {
  final String label;
  final dynamic icon;
  final TextEditingController controller;
  final bool isPassword;
  final TextInputType keyboardType;
  final String? errorText;
  final int? maxLines;

  const FloatingLabelInput({
    super.key,
    required this.label,
    this.icon,
    required this.controller,
    this.isPassword = false,
    this.keyboardType = TextInputType.text,
    this.errorText,
    this.maxLines = 1,
  });

  @override
  State<FloatingLabelInput> createState() => _FloatingLabelInputState();
}

class _FloatingLabelInputState extends State<FloatingLabelInput> {
  bool _obscureText = true;
  final FocusNode _focusNode = FocusNode();
  bool _isFocused = false;

  @override
  void initState() {
    super.initState();
    _focusNode.addListener(() {
      setState(() {
        _isFocused = _focusNode.hasFocus;
      });
    });
  }

  @override
  void dispose() {
    _focusNode.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    final hasError = widget.errorText != null;
    final isFocused = _isFocused;

    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        AnimatedContainer(
          duration: const Duration(milliseconds: 200),
          decoration: BoxDecoration(
            color: isFocused ? Colors.white : AppColors.slate50,
            borderRadius: BorderRadius.circular(16),
            border: Border.all(
              color: hasError
                  ? const Color(0xFFDC2626)
                  : isFocused
                  ? AppColors.primary
                  : AppColors.slate200,
              width: isFocused ? 2 : 1,
            ),
            boxShadow: isFocused
                ? [
              BoxShadow(
                color: AppColors.primary.withOpacity(0.1),
                blurRadius: 8,
                offset: const Offset(0, 4),
              )
            ]
                : [],
          ),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Padding(
                padding: const EdgeInsets.fromLTRB(16, 12, 16, 0),
                child: Text(
                  widget.label,
                  style: TextStyle(
                    fontSize: 12,
                    fontWeight: FontWeight.w600,
                    color: hasError
                        ? const Color(0xFFDC2626)
                        : isFocused
                        ? AppColors.primary
                        : AppColors.slate500,
                  ),
                ),
              ),
              Row(
                children: [
                  if (widget.icon != null)
                    Padding(
                      padding: const EdgeInsets.only(left: 16),
                      child: Icon(
                        widget.icon is IconData ? widget.icon as IconData : Symbols.help,
                        color: isFocused
                            ? AppColors.primary
                            : hasError
                            ? const Color(0xFFDC2626)
                            : AppColors.slate500,
                        size: 20,
                      ),
                    ),
                  Expanded(
                    child: TextField(
                      controller: widget.controller,
                      focusNode: _focusNode,
                      obscureText: widget.isPassword && _obscureText,
                      keyboardType: widget.keyboardType,
                      maxLines: widget.maxLines,
                      style: const TextStyle(
                        fontSize: 16,
                        fontWeight: FontWeight.w500,
                        color: AppColors.slate900,
                      ),
                      decoration: const InputDecoration(
                        border: InputBorder.none,
                        enabledBorder: InputBorder.none,
                        focusedBorder: InputBorder.none,
                        contentPadding: EdgeInsets.fromLTRB(12, 8, 16, 12),
                        isDense: true,
                        filled: false,
                      ),
                    ),
                  ),
                  if (widget.isPassword)
                    IconButton(
                      icon: Icon(
                        _obscureText ? Symbols.visibility : Symbols.visibility_off,
                        color: AppColors.slate400,
                        size: 20,
                      ),
                      onPressed: () {
                        setState(() {
                          _obscureText = !_obscureText;
                        });
                      },
                    ),
                ],
              ),
            ],
          ),
        ),
        if (hasError)
          Padding(
            padding: const EdgeInsets.only(top: 6, left: 4),
            child: Row(
              children: [
                const Icon(
                  Symbols.error,
                  color: Color(0xFFDC2626),
                  size: 14,
                ),
                const SizedBox(width: 6),
                Text(
                  widget.errorText!,
                  style: const TextStyle(
                    color: Color(0xFFDC2626),
                    fontSize: 12,
                    fontWeight: FontWeight.w500,
                  ),
                ),
              ],
            ),
          ),
      ],
    );
  }
}
