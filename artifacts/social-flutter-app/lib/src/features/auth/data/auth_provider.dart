import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../domain/user.dart';

class AuthState {
  final String? token;
  final User? user;
  final bool isLoading;
  final bool isGuest;

  AuthState({this.token, this.user, this.isLoading = false, this.isGuest = false});

  AuthState copyWith({String? token, User? user, bool? isLoading, bool? isGuest}) {
    return AuthState(
      token: token ?? this.token,
      user: user ?? this.user,
      isLoading: isLoading ?? this.isLoading,
      isGuest: isGuest ?? this.isGuest,
    );
  }
}

class AuthNotifier extends Notifier<AuthState> {
  @override
  AuthState build() {
    // Returns an initial empty state. The SplashScreen is responsible for
    // reading the token asynchronously from secure storage on startup and
    // setting it via setAuth().
    return AuthState();
  }

  void setAuth(String token, User? user) {
    state = AuthState(token: token, user: user, isGuest: false);
  }

  void setGuest() {
    state = AuthState(isGuest: true);
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
