import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../core/api_client.dart';
import '../core/storage_service.dart';
import '../features/auth/presentation/login_screen.dart';
import '../features/auth/presentation/register_screen.dart';
import '../features/profile/presentation/profile_screen.dart' as profile;
import '../features/feed/presentation/feed_screen.dart' as feed;
import '../features/feed/presentation/create_post_screen.dart';
import '../features/search/presentation/explore_screen.dart' as search;
import '../features/notifications/presentation/notifications_screen.dart'
    as notifications;
import '../features/messaging/presentation/conversations_screen.dart';
import '../features/messaging/presentation/chat_screen.dart';

final routerProvider = Provider<GoRouter>((ref) {
  final storageService = ref.watch(storageServiceProvider);

  return GoRouter(
    initialLocation: '/feed',
    redirect: (context, state) {
      final token = storageService.getAuthToken();
      final isAuthRoute = state.matchedLocation == '/login' ||
          state.matchedLocation == '/register';

      if (token == null && !isAuthRoute) return '/login';
      if (token != null && isAuthRoute) return '/feed';
      return null;
    },
    routes: [
      GoRoute(
        path: '/login',
        builder: (context, state) => const LoginScreen(),
      ),
      GoRoute(
        path: '/register',
        builder: (context, state) => const RegisterScreen(),
      ),
      GoRoute(
        path: '/create-post',
        builder: (context, state) => const CreatePostScreen(),
      ),
      GoRoute(
        path: '/messages/:conversationId',
        builder: (context, state) {
          final conversationId = state.pathParameters['conversationId']!;
          final participantName = state.extra as String? ?? 'Chat';
          return ChatScreen(
            conversationId: conversationId,
            participantName: participantName,
          );
        },
      ),
      GoRoute(
        path: '/user/:userId',
        builder: (context, state) {
          final userId = state.pathParameters['userId']!;
          return profile.ProfileScreen(userId: userId);
        },
      ),
      StatefulShellRoute.indexedStack(
        builder: (context, state, navigationShell) {
          return _AppShell(navigationShell: navigationShell);
        },
        branches: [
          StatefulShellBranch(
            routes: [
              GoRoute(
                path: '/feed',
                builder: (context, state) => const feed.FeedScreen(),
              ),
            ],
          ),
          StatefulShellBranch(
            routes: [
              GoRoute(
                path: '/explore',
                builder: (context, state) => const search.ExploreScreen(),
              ),
            ],
          ),
          StatefulShellBranch(
            routes: [
              GoRoute(
                path: '/messages',
                builder: (context, state) => const ConversationsScreen(),
              ),
            ],
          ),
          StatefulShellBranch(
            routes: [
              GoRoute(
                path: '/notifications',
                builder: (context, state) =>
                    const notifications.NotificationsScreen(),
              ),
            ],
          ),
          StatefulShellBranch(
            routes: [
              GoRoute(
                path: '/profile',
                builder: (context, state) =>
                    const profile.ProfileScreen(userId: 'me'),
              ),
            ],
          ),
        ],
      ),
    ],
  );
});

class _AppShell extends StatelessWidget {
  final StatefulNavigationShell navigationShell;

  const _AppShell({required this.navigationShell});

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      body: navigationShell,
      bottomNavigationBar: NavigationBar(
        selectedIndex: navigationShell.currentIndex,
        onDestinationSelected: (index) =>
            navigationShell.goBranch(index,
                initialLocation: index == navigationShell.currentIndex),
        backgroundColor: Colors.white,
        indicatorColor: const Color(0xFFE8F4FF),
        destinations: const [
          NavigationDestination(
            icon: Icon(Icons.home_outlined),
            selectedIcon: Icon(Icons.home, color: Color(0xFF0095F6)),
            label: 'Home',
          ),
          NavigationDestination(
            icon: Icon(Icons.search_outlined),
            selectedIcon: Icon(Icons.search, color: Color(0xFF0095F6)),
            label: 'Explore',
          ),
          NavigationDestination(
            icon: Icon(Icons.chat_bubble_outline),
            selectedIcon:
                Icon(Icons.chat_bubble, color: Color(0xFF0095F6)),
            label: 'Messages',
          ),
          NavigationDestination(
            icon: Icon(Icons.notifications_outlined),
            selectedIcon:
                Icon(Icons.notifications, color: Color(0xFF0095F6)),
            label: 'Activity',
          ),
          NavigationDestination(
            icon: Icon(Icons.person_outline),
            selectedIcon: Icon(Icons.person, color: Color(0xFF0095F6)),
            label: 'Profile',
          ),
        ],
      ),
    );
  }
}
