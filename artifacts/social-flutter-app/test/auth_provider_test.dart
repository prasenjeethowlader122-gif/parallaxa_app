import 'package:flutter_test/flutter_test.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:social_app/src/features/auth/data/auth_provider.dart';
import 'package:social_app/src/features/auth/domain/user.dart';

void main() {
  group('AuthNotifier Tests', () {
    test('initial state is unauthenticated', () {
      final container = ProviderContainer();
      addTearDown(container.dispose);

      final state = container.read(authStateProvider);
      expect(state.token, isNull);
      expect(state.user, isNull);
      expect(state.isLoading, isFalse);
    });

    test('setAuth sets token and user correctly', () {
      final container = ProviderContainer();
      addTearDown(container.dispose);

      final user = User(
        id: 'user1',
        username: 'testuser',
        email: 'test@example.com',
        displayName: 'Test User',
        role: 'user',
        isVerified: false,
        followersCount: 0,
        followingCount: 0,
        postsCount: 0,
        createdAt: DateTime.now(),
      );

      container.read(authStateProvider.notifier).setAuth('token123', user);

      final state = container.read(authStateProvider);
      expect(state.token, 'token123');
      expect(state.user, user);
      expect(state.isLoading, isFalse);
    });

    test('clearAuth resets token and user', () {
      final container = ProviderContainer();
      addTearDown(container.dispose);

      container.read(authStateProvider.notifier).setAuth('token123', null);
      container.read(authStateProvider.notifier).clearAuth();

      final state = container.read(authStateProvider);
      expect(state.token, isNull);
      expect(state.user, isNull);
    });

    test('setLoading updates loading state', () {
      final container = ProviderContainer();
      addTearDown(container.dispose);

      container.read(authStateProvider.notifier).setLoading(true);
      expect(container.read(authStateProvider).isLoading, isTrue);

      container.read(authStateProvider.notifier).setLoading(false);
      expect(container.read(authStateProvider).isLoading, isFalse);
    });
  });
}
