import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../domain/user.dart';
import '../../../core/api_client.dart';

class AuthState {
  final String? token;
  final User? user;
  final bool isLoading;

  AuthState({this.token, this.user, this.isLoading = false});

  AuthState copyWith({String? token, User? user, bool? isLoading}) {
    return AuthState(
      token: token ?? this.token,
      user: user ?? this.user,
      isLoading: isLoading ?? this.isLoading,
    );
  }
}

class AuthNotifier extends Notifier<AuthState> {
  @override
  AuthState build() {
    final storage = ref.watch(storageServiceProvider);
    return AuthState(token: storage.getAuthToken());
  }

  void setAuth(String token, User? user) {
    state = AuthState(token: token, user: user);
  }

  void clearAuth() {
    state = AuthState();
  }

  void setLoading(bool loading) {
    state = state.copyWith(isLoading: loading);
  }
}

final authStateProvider = NotifierProvider<AuthNotifier, AuthState>(() {
  return AuthNotifier();
});
