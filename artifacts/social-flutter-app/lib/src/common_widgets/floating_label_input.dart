import 'package:flutter/material.dart';
import 'package:hugeicons/hugeicons.dart';
import '../core/app_colors.dart';

class FloatingLabelInput extends StatefulWidget {
  final String label;
  final String? value;
  final ValueChanged<String>? onChanged;
  final VoidCallback? onFocus;
  final VoidCallback? onBlur;
  final String? error;
  final Widget? right;
  final IconData? icon;
  final bool secureTextEntry;
  final TextInputType? keyboardType;
  final TextCapitalization textCapitalization;
  final bool autoCorrect;
  final bool editable;
  final TextInputAction? textInputAction;
  final ValueChanged<String>? onFieldSubmitted;
  final int? maxLength;
  final bool autoFocus;

  const FloatingLabelInput({
    super.key,
    required this.label,
    this.value,
    this.onChanged,
    this.onFocus,
    this.onBlur,
    this.error,
    this.right,
    this.icon,
    this.secureTextEntry = false,
    this.keyboardType,
    this.textCapitalization = TextCapitalization.none,
    this.autoCorrect = true,
    this.editable = true,
    this.textInputAction,
    this.onFieldSubmitted,
    this.maxLength,
    this.autoFocus = false,
  });

  @override
  State<FloatingLabelInput> createState() => _FloatingLabelInputState();
}

class _FloatingLabelInputState extends State<FloatingLabelInput>
    with SingleTickerProviderStateMixin {
  late AnimationController _controller;
  late Animation<double> _animation;
  final FocusNode _focusNode = FocusNode();
  late TextEditingController _textController;
  bool _isFocused = false;

  @override
  void initState() {
    super.initState();
    _textController = TextEditingController(text: widget.value);
    _controller = AnimationController(
      vsync: this,
      duration: const Duration(milliseconds: 150),
    );
    _animation = CurvedAnimation(parent: _controller, curve: Curves.easeOut);

    if (_textController.text.isNotEmpty) {
      _controller.value = 1.0;
    }

    _focusNode.addListener(_handleFocusChange);
  }

  @override
  void didUpdateWidget(FloatingLabelInput oldWidget) {
    super.didUpdateWidget(oldWidget);
    if (widget.value != null && widget.value != _textController.text) {
      _textController.text = widget.value!;
      _updateLabelState();
    }
  }

  void _handleFocusChange() {
    setState(() {
      _isFocused = _focusNode.hasFocus;
    });
    if (_isFocused) {
      widget.onFocus?.call();
    } else {
      widget.onBlur?.call();
    }
    _updateLabelState();
  }

  void _updateLabelState() {
    if (_isFocused || _textController.text.isNotEmpty) {
      _controller.forward();
    } else {
      _controller.reverse();
    }
  }

  @override
  void dispose() {
    _focusNode.removeListener(_handleFocusChange);
    _focusNode.dispose();
    _textController.dispose();
    _controller.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Container(
          height: 52,
          decoration: BoxDecoration(
            color: Colors.white,
            borderRadius: BorderRadius.circular(16),
            border: Border.all(
              color: widget.error != null
                  ? const Color(0xFFFCA5A5)
                  : _isFocused
                      ? const Color(0xFF0095F6)
                      : const Color(0xFFE2E8F0),
              width: _isFocused || widget.error != null ? 1.5 : 1.5,
            ),
          ),
          child: Stack(
            clipBehavior: Clip.none,
            children: [
              // Icon
              if (widget.icon != null)
                Positioned(
                  left: 16,
                  top: 0,
                  bottom: 0,
                  child: Center(
                    child: Icon(
                      widget.icon!,
                      size: 18,
                      color: _isFocused
                          ? const Color(0xFF0095F6)
                          : widget.error != null
                              ? const Color(0xFFDC2626)
                              : const Color(0xFF64748B),
                    ),
                  ),
                ),

              // Floating Label
              AnimatedBuilder(
                animation: _animation,
                builder: (context, child) {
                  return Positioned(
                    left: widget.icon != null ? 44 : 16,
                    top: Tween<double>(begin: 14, end: -10).evaluate(_animation),
                    child: Container(
                      padding: const EdgeInsets.symmetric(horizontal: 4),
                      color: _animation.value > 0 ? Colors.white : Colors.transparent,
                      child: Text(
                        widget.label,
                        style: TextStyle(
                          fontSize: Tween<double>(begin: 16, end: 12).evaluate(_animation),
                          color: widget.error != null
                              ? const Color(0xFFDC2626)
                              : _isFocused
                                  ? const Color(0xFF0095F6)
                                  : const Color(0xFF94A3B8),
                          fontWeight: _animation.value > 0 ? FontWeight.w500 : FontWeight.normal,
                        ),
                      ),
                    ),
                  );
                },
              ),

              // Input
              Padding(
                padding: EdgeInsets.only(
                  left: widget.icon != null ? 44 : 16,
                  right: widget.right != null ? 48 : 16,
                ),
                child: TextFormField(
                  controller: _textController,
                  focusNode: _focusNode,
                  onChanged: (val) {
                    widget.onChanged?.call(val);
                    _updateLabelState();
                  },
                  obscureText: widget.secureTextEntry,
                  keyboardType: widget.keyboardType,
                  textCapitalization: widget.textCapitalization,
                  autocorrect: widget.autoCorrect,
                  enabled: widget.editable,
                  textInputAction: widget.textInputAction,
                  onFieldSubmitted: widget.onFieldSubmitted,
                  maxLength: widget.maxLength,
                  autofocus: widget.autoFocus,
                  style: const TextStyle(
                    fontSize: 16,
                    color: Color(0xFF0F172A),
                    fontFamily: 'Sora',
                  ),
                  decoration: const InputDecoration(
                    border: InputBorder.none,
                    enabledBorder: InputBorder.none,
                    focusedBorder: InputBorder.none,
                    errorBorder: InputBorder.none,
                    focusedErrorBorder: InputBorder.none,
                    contentPadding: EdgeInsets.symmetric(vertical: 14),
                    counterText: "",
                  ),
                ),
              ),

              // Right element
              if (widget.right != null)
                Positioned(
                  right: 16,
                  top: 0,
                  bottom: 0,
                  child: Center(child: widget.right!),
                ),
            ],
          ),
        ),
        if (widget.error != null)
          Padding(
            padding: const EdgeInsets.only(top: 6, left: 4),
            child: Row(
              children: [
                const Icon(
                  Icons.info_outline,
                  size: 14,
                  color: Color(0xFFDC2626),
                ),
                const SizedBox(width: 6),
                Text(
                  widget.error!,
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
