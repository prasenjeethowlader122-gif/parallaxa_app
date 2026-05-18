import 'package:flutter_riverpod/flutter_riverpod.dart';

class ProcessingState {
  final bool isProcessing;
  final String? message;

  ProcessingState({required this.isProcessing, this.message});

  ProcessingState copyWith({bool? isProcessing, String? message}) {
    return ProcessingState(
      isProcessing: isProcessing ?? this.isProcessing,
      message: message ?? this.message,
    );
  }
}

class ProcessingNotifier extends Notifier<ProcessingState> {
  @override
  ProcessingState build() {
    return ProcessingState(isProcessing: false);
  }

  void show(String message) {
    state = ProcessingState(isProcessing: true, message: message);
  }

  void hide() {
    state = ProcessingState(isProcessing: false);
  }
}

final processingProvider = NotifierProvider<ProcessingNotifier, ProcessingState>(() {
  return ProcessingNotifier();
});
