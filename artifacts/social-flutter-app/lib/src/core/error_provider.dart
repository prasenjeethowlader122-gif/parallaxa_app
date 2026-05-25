import 'package:flutter_riverpod/flutter_riverpod.dart';

final errorProvider = NotifierProvider<ErrorNotifier, String?>(ErrorNotifier.new);

class ErrorNotifier extends Notifier<String?> {
  @override
  String? build() => null;

  void showError(String message) {
    state = message;
    // Clear error after a short delay so same error can be shown again if triggered
    Future.delayed(const Duration(milliseconds: 500), () {
      state = null;
    });
  }
}
