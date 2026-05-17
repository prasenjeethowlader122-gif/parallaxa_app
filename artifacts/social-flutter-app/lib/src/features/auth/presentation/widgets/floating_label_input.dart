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
  });

  @override
  State<FloatingLabelInput> createState() => _FloatingLabelInputState();
}

class _FloatingLabelInputState extends State<FloatingLabelInput>
    with SingleTickerProviderStateMixin {
  late AnimationController _controller;
  late Animation<double> _animation;
  late FocusNode _focusNode;
  late TextEditingController _textController;

  @override
  void initState() {
    super.initState();
    _focusNode = widget.focusNode ?? FocusNode();
    _textController = widget.controller ?? TextEditingController();
    _controller = AnimationController(
      vsync: this,
      duration: const Duration(milliseconds: 150),
    );
    _animation = CurvedAnimation(parent: _controller, curve: Curves.easeOut);

    if (_textController.text.isNotEmpty || _focusNode.hasFocus) {
      _controller.value = 1.0;
    }

    _focusNode.addListener(_handleFocusChange);
    _textController.addListener(_handleTextChange);
  }

  void _handleFocusChange() {
    if (_focusNode.hasFocus || _textController.text.isNotEmpty) {
      _controller.forward();
    } else {
      _controller.reverse();
    }
    setState(() {});
  }

  void _handleTextChange() {
    if (_focusNode.hasFocus || _textController.text.isNotEmpty) {
      _controller.forward();
    } else {
      _controller.reverse();
    }
  }

  @override
  void dispose() {
    if (widget.focusNode == null) _focusNode.dispose();
    if (widget.controller == null) _textController.dispose();
    _controller.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    final isFocused = _focusNode.hasFocus;
    final hasError = widget.error != null;

    final Color borderColor = hasError
        ? const Color(0xFFFCA5A5) // red-300
        : isFocused
            ? AppColors.primary
            : AppColors.slate200;

    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Stack(
          clipBehavior: Clip.none,
          children: [
            Container(
              height: 52,
              decoration: BoxDecoration(
                color: Colors.white,
                borderRadius: BorderRadius.circular(16),
                border: Border.all(
                  color: borderColor,
                  width: 1.5,
                ),
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
                                ? const Color(0xFFDC2626) // red-600
                                : AppColors.slate500,
                        size: 20,
                      ),
                    ),
                  Expanded(
                    child: TextField(
                      controller: _textController,
                      focusNode: _focusNode,
                      obscureText: widget.secureTextEntry,
                      keyboardType: widget.keyboardType,
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
                      ),
                      decoration: InputDecoration(
                        isDense: true,
                        contentPadding: EdgeInsets.only(
                          left: widget.icon != null ? 12 : 16,
                          right: 16,
                        ),
                        border: InputBorder.none,
                        counterText: '',
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
                  top: 14 - (_animation.value * 24),
                  child: Container(
                    padding: EdgeInsets.symmetric(
                      horizontal: _animation.value * 4,
                    ),
                    color: _animation.value > 0 ? Colors.white : Colors.transparent,
                    child: Text(
                      widget.label,
                      style: TextStyle(
                        fontSize: 16 - (_animation.value * 4),
                        color: hasError
                            ? const Color(0xFFDC2626) // red-600
                            : isFocused
                                ? AppColors.primary
                                : AppColors.slate400,
                        fontFamily: 'Sora',
                        fontWeight: _animation.value > 0
                            ? FontWeight.w500
                            : FontWeight.normal,
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
                  Icons.info_outline,
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
        const SizedBox(height: 20),
      ],
    );
  }
}
