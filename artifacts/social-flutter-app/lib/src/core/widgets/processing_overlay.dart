import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../processing_provider.dart';
import '../app_colors.dart';

class ProcessingOverlay extends ConsumerWidget {
  final Widget child;

  const ProcessingOverlay({super.key, required this.child});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final state = ref.watch(processingProvider);

    return Stack(
      children: [
        child,
        if (state.isProcessing)
          Container(
            color: const Color.fromRGBO(255, 255, 255, 0.9),
            child: Center(
              child: Column(
                mainAxisSize: MainAxisSize.min,
                children: [
                  const CircularProgressIndicator(
                    color: AppColors.primary,
                    strokeWidth: 3,
                  ),
                  if (state.message != null) ...[
                    const SizedBox(height: 20),
                    Text(
                      state.message!,
                      style: const TextStyle(

                        fontSize: 16,
                        fontWeight: FontWeight.w600,
                        color: AppColors.slate900,
                        decoration: TextDecoration.none,
                      ),
                    ),
                  ],
                ],
              ),
            ),
          ),
      ],
    );
  }
}
