import 'package:flutter/cupertino.dart';
import 'package:flutter/material.dart';
import '../../../../core/app_colors.dart';

class FloatingLabelInput extends StatefulWidget {
  final String label;
  final String? error;
  final TextEditingController? controller;
  final bool secureTextEntry;
  final TextInputType? keyboardType;
  final TextInputAction? textInputAction;
  final ValueChanged<String>? onChanged;
  final VoidCallback? onEditingComplete;
  final ValueChanged<String>? onFieldSubmitted;
  final IconData? icon;
  final Widget? right;
  final bool editable;
  final FocusNode? focusNode;
  final int? maxLength;
  final bool autoFocus;
  final TextCapitalization textCapitalization;
  final bool autoCorrect;
  final int? maxLines;

  const FloatingLabelInput({
    super.key,
    required this.label,
    this.error,
    this.controller,
    this.secureTextEntry = false,
    this.keyboardType,
    this.textInputAction,
    this.onChanged,
    this.onEditingComplete,
    this.onFieldSubmitted,
    this.icon,
    this.right,
    this.editable = true,
    this.focusNode,
    this.maxLength,
    this.autoFocus = false,
    this.textCapitalization = TextCapitalization.none,
    this.autoCorrect = true,
    this.maxLines = 1,
  });

  @override
  State<FloatingLabelInput> createState() => _FloatingLabelInputState();
}

class _FloatingLabelInputState extends State<FloatingLabelInput>
    with SingleTickerProviderStateMixin {
  late AnimationController _animController;
  late Animation<double> _animation;

  late FocusNode _focusNode;
  late TextEditingController _textController;
  bool _ownsTextController = false;
  bool _ownsFocusNode = false;

  @override
  void initState() {
    super.initState();

    if (widget.focusNode == null) {
      _focusNode = FocusNode();
      _ownsFocusNode = true;
    } else {
      _focusNode = widget.focusNode!;
    }

    if (widget.controller == null) {
      _textController = TextEditingController();
      _ownsTextController = true;
    } else {
      _textController = widget.controller!;
    }

    _animController = AnimationController(
      vsync: this,
      duration: const Duration(milliseconds: 150),
    );
    _animation = CurvedAnimation(
      parent: _animController,
      curve: Curves.easeOut,
    );

    if (_textController.text.isNotEmpty || _focusNode.hasFocus) {
      _animController.value = 1.0;
    }

    _focusNode.addListener(_handleFocusChange);
    _textController.addListener(_handleTextChange);
  }

  void _handleFocusChange() {
    if (!mounted) return;
    if (_focusNode.hasFocus || _textController.text.isNotEmpty) {
      _animController.forward();
    } else {
      _animController.reverse();
    }
    setState(() {});
  }

  void _handleTextChange() {
    if (!mounted) return;
    if (_focusNode.hasFocus || _textController.text.isNotEmpty) {
      _animController.forward();
    } else {
      _animController.reverse();
    }
  }

  @override
  void dispose() {
    _focusNode.removeListener(_handleFocusChange);
    _textController.removeListener(_handleTextChange);
    if (_ownsFocusNode) _focusNode.dispose();
    if (_ownsTextController) _textController.dispose();
    _animController.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    final isFocused = _focusNode.hasFocus;
    final hasError = widget.error != null;

    final Color borderColor = hasError
        ? const Color(0xFFFCA5A5)
        : isFocused
        ? AppColors.primary
        : AppColors.slate200;

    // The label floats to top: -10 when fully animated.
    // We add 12px of top space so it never overlaps the widget above.
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        const SizedBox(height: 12),
        Stack(
          clipBehavior: Clip.none,
          children: [
            Container(
              constraints: const BoxConstraints(minHeight: 56),
              decoration: BoxDecoration(
                color: Colors.white,
                borderRadius: BorderRadius.circular(16),
                border: Border.all(color: borderColor, width: 1.5),
              ),
              child: Row(
                children: [
                  if (widget.icon != null)
                    Padding(
                      padding: const EdgeInsets.only(left: 16),
                      child: Icon(
                        widget.icon!,
                        color: isFocused
                            ? AppColors.primary
                            : hasError
                            ? const Color(0xFFDC2626)
                            : AppColors.slate500,
                        size: 20,
                      ),
                    ),
                  Expanded(
                    child: Padding(
                      padding: const EdgeInsets.only(top: 8),
                      child: TextField(
                        controller: _textController,
                        focusNode: _focusNode,
                        obscureText: widget.secureTextEntry,
                        keyboardType: widget.keyboardType,
                        maxLines: widget.maxLines,
                        textInputAction: widget.textInputAction,
                        onChanged: widget.onChanged,
                        onEditingComplete: widget.onEditingComplete,
                        onSubmitted: widget.onFieldSubmitted,
                        enabled: widget.editable,
                        autofocus: widget.autoFocus,
                        maxLength: widget.maxLength,
                        textCapitalization: widget.textCapitalization,
                        autocorrect: widget.autoCorrect,
                        cursorColor: AppColors.primary,
                        style: const TextStyle(
                          fontSize: 16,
                          color: AppColors.slate900,
                          fontFamily: 'Sora',
                          fontWeight: FontWeight.w500,
                        ),
                        decoration: InputDecoration(
                          isDense: true,
                          contentPadding: EdgeInsets.only(
                            left: widget.icon != null ? 12 : 16,
                            right: 16,
                            bottom: 10,
                          ),
                          border: InputBorder.none,
                          enabledBorder: InputBorder.none,
                          focusedBorder: InputBorder.none,
                          counterText: '',
                        ),
                      ),
                    ),
                  ),
                  if (widget.right != null)
                    Padding(
                      padding: const EdgeInsets.only(right: 16),
                      child: widget.right,
                    ),
                ],
              ),
            ),
            AnimatedBuilder(
              animation: _animation,
              builder: (context, child) {
                return Positioned(
                  left: widget.icon != null ? 44 : 16,
                  top: 16 - (_animation.value * 26),
                  child: Container(
                    padding: const EdgeInsets.symmetric(horizontal: 4),
                    color: Colors.white,
                    child: Text(
                      widget.label,
                      style: TextStyle(
                        fontSize: 16 - (_animation.value * 4),
                        color: hasError
                            ? const Color(0xFFDC2626)
                            : isFocused
                            ? AppColors.primary
                            : AppColors.slate400,
                        fontFamily: 'Sora',
                        fontWeight: _animation.value > 0
                            ? FontWeight.w600
                            : FontWeight.w500,
                      ),
                    ),
                  ),
                );
              },
            ),
          ],
        ),
        if (hasError)
          Padding(
            padding: const EdgeInsets.only(top: 6, left: 4),
            child: Row(
              children: [
                const Icon(
                  CupertinoIcons.info,
                  color: Color(0xFFDC2626),
                  size: 14,
                ),
                const SizedBox(width: 6),
                Expanded(
                  child: Text(
                    widget.error!,
                    style: const TextStyle(
                      color: Color(0xFFDC2626),
                      fontSize: 12,
                      fontWeight: FontWeight.w500,
                      fontFamily: 'Sora',
                    ),
                  ),
                ),
              ],
            ),
          ),
        const SizedBox(height: 8),
      ],
    );
  }
}
