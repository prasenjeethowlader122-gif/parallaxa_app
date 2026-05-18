import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:flutter_svg/flutter_svg.dart';
import '../core/api_client.dart';
import '../core/app_colors.dart';
import '../features/auth/presentation/login_screen.dart';
import '../features/auth/presentation/register_screen.dart';
import '../features/auth/presentation/forgot_password_screen.dart';
import '../features/auth/presentation/splash_screen.dart';
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
    initialLocation: '/splash',
    redirect: (context, state) {
      final token = storageService.getAuthToken();
      final loc = state.matchedLocation;

      if (loc == '/splash') return null;

      final isAuth =
          loc == '/login' || loc == '/register' || loc == '/forgot-password';
      if (token == null && !isAuth) return '/login';
      if (token != null && isAuth) return '/feed';
      return null;
    },
    routes: [
      GoRoute(path: '/splash', builder: (_, _) => const SplashScreen()),
      GoRoute(path: '/login', builder: (_, _) => const LoginScreen()),
      GoRoute(path: '/register', builder: (_, _) => const RegisterScreen()),
      GoRoute(
        path: '/forgot-password',
        builder: (_, _) => const ForgotPasswordScreen(),
      ),
      GoRoute(
        path: '/messages/:conversationId',
        builder: (_, state) {
          final cid = state.pathParameters['conversationId']!;
          final name = state.extra as String? ?? 'Chat';
          return ChatScreen(conversationId: cid, participantName: name);
        },
      ),
      GoRoute(
        path: '/create-post',
        builder: (_, _) => const CreatePostScreen(),
      ),
      GoRoute(
        path: '/user/:userId',
        builder: (_, state) =>
            profile.ProfileScreen(userId: state.pathParameters['userId']!),
      ),
      ShellRoute(
        builder: (context, state, child) =>
            _MainShell(location: state.matchedLocation, child: child),
        routes: [
          GoRoute(path: '/feed', builder: (_, _) => const feed.FeedScreen()),
          GoRoute(
            path: '/explore',
            builder: (_, _) => const search.ExploreScreen(),
          ),
          GoRoute(
            path: '/messages',
            builder: (_, _) => const ConversationsScreen(),
          ),
          GoRoute(
            path: '/notifications',
            builder: (_, _) => const notifications.NotificationsScreen(),
          ),
          GoRoute(
            path: '/profile',
            builder: (_, _) => const profile.ProfileScreen(userId: 'me'),
          ),
        ],
      ),
    ],
  );
});

// ─── Main Shell ──────────────────────────────────────────────────────────────

class _MainShell extends StatelessWidget {
  final String location;
  final Widget child;

  const _MainShell({required this.location, required this.child});

  bool get _showFab => location == '/feed';

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: AppColors.background,
      appBar: _ParallaxaAppBar(location: location),
      drawer: _AppDrawer(location: location),
      body: child,
      floatingActionButton: _showFab
          ? FloatingActionButton(
              onPressed: () => context.push('/create-post'),
              backgroundColor: AppColors.primary,
              elevation: 6,
              shape: const CircleBorder(),
              child: const Icon(
                Icons.add_rounded,
                color: Colors.white,
                size: 24,
              ),
            )
          : null,
    );
  }
}

// ─── App Bar ─────────────────────────────────────────────────────────────────

class _ParallaxaAppBar extends StatelessWidget implements PreferredSizeWidget {
  final String location;

  const _ParallaxaAppBar({required this.location});

  @override
  Size get preferredSize => const Size.fromHeight(56);

  @override
  Widget build(BuildContext context) {
    return AppBar(
      backgroundColor: AppColors.background,
      elevation: 0,
      scrolledUnderElevation: 0,
      surfaceTintColor: Colors.transparent,
      titleSpacing: 0,
      leading: Builder(
        builder: (context) => IconButton(
          icon: const Icon(
            Icons.menu_rounded,
            color: AppColors.textPrimary,
            size: 22,
          ),
          onPressed: () => Scaffold.of(context).openDrawer(),
        ),
      ),
      title: SvgPicture.asset(
        'assets/images/parallaxa-logo.svg',
        height: 24,
        fit: BoxFit.contain,
      ),
      actions: [
        IconButton(
          icon: const Icon(
            Icons.search_rounded,
            color: AppColors.textPrimary,
            size: 22,
          ),
          onPressed: () => context.go('/explore'),
        ),
        IconButton(
          icon: const Icon(
            Icons.notifications_none_rounded,
            color: AppColors.textPrimary,
            size: 22,
          ),
          onPressed: () => context.go('/notifications'),
        ),
        IconButton(
          icon: const Icon(
            Icons.chat_bubble_outline_rounded,
            color: AppColors.textPrimary,
            size: 22,
          ),
          onPressed: () => context.go('/messages'),
        ),
        const SizedBox(width: 4),
      ],
      bottom: PreferredSize(
        preferredSize: const Size.fromHeight(0.5),
        child: Divider(height: 0.5, thickness: 0.5, color: AppColors.border),
      ),
    );
  }
}

// ─── Drawer ───────────────────────────────────────────────────────────────────

class _AppDrawer extends StatelessWidget {
  final String location;

  const _AppDrawer({required this.location});

  @override
  Widget build(BuildContext context) {
    return Drawer(
      backgroundColor: AppColors.background,
      width: 300,
      child: SafeArea(
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Padding(
              padding: const EdgeInsets.fromLTRB(20, 16, 20, 8),
              child: Row(
                children: [
                  IconButton(
                    icon: const Icon(
                      Icons.arrow_back_rounded,
                      color: AppColors.textPrimary,
                      size: 22,
                    ),
                    onPressed: () => Navigator.of(context).pop(),
                    padding: EdgeInsets.zero,
                  ),
                  const SizedBox(width: 8),
                  SvgPicture.asset(
                    'assets/images/parallaxa-logo.svg',
                    height: 24,
                    fit: BoxFit.contain,
                  ),
                ],
              ),
            ),
            const Divider(color: AppColors.border, height: 1),
            Expanded(
              child: ListView(
                padding: const EdgeInsets.symmetric(
                  horizontal: 12,
                  vertical: 8,
                ),
                children: [
                  _DrawerItem(
                    icon: Icons.home_outlined,
                    activeIcon: Icons.home_rounded,
                    label: 'Home',
                    isActive: location == '/feed',
                    onTap: () {
                      Navigator.of(context).pop();
                      context.go('/feed');
                    },
                  ),
                  _DrawerItem(
                    icon: Icons.search_outlined,
                    activeIcon: Icons.search_rounded,
                    label: 'Explore',
                    isActive: location == '/explore',
                    onTap: () {
                      Navigator.of(context).pop();
                      context.go('/explore');
                    },
                  ),
                  _DrawerItem(
                    icon: Icons.notifications_none_rounded,
                    activeIcon: Icons.notifications_rounded,
                    label: 'Notifications',
                    isActive: location == '/notifications',
                    onTap: () {
                      Navigator.of(context).pop();
                      context.go('/notifications');
                    },
                  ),
                  _DrawerItem(
                    icon: Icons.chat_bubble_outline_rounded,
                    activeIcon: Icons.chat_bubble_rounded,
                    label: 'Messages',
                    isActive: location == '/messages',
                    onTap: () {
                      Navigator.of(context).pop();
                      context.go('/messages');
                    },
                  ),
                  _DrawerItem(
                    icon: Icons.person_outline_rounded,
                    activeIcon: Icons.person_rounded,
                    label: 'Profile',
                    isActive: location == '/profile',
                    onTap: () {
                      Navigator.of(context).pop();
                      context.go('/profile');
                    },
                  ),
                  const Divider(color: AppColors.border, height: 24),
                  _DrawerItem(
                    icon: Icons.bookmark_border_rounded,
                    activeIcon: Icons.bookmark_rounded,
                    label: 'Bookmarks',
                    isActive: false,
                    onTap: () => Navigator.of(context).pop(),
                  ),
                  _DrawerItem(
                    icon: Icons.settings_outlined,
                    activeIcon: Icons.settings_rounded,
                    label: 'Settings',
                    isActive: false,
                    onTap: () => Navigator.of(context).pop(),
                  ),
                  const SizedBox(height: 16),
                  Padding(
                    padding: const EdgeInsets.symmetric(horizontal: 12),
                    child: ElevatedButton(
                      onPressed: () {
                        Navigator.of(context).pop();
                        context.push('/create-post');
                      },
                      style: ElevatedButton.styleFrom(
                        backgroundColor: AppColors.primary,
                        shape: const StadiumBorder(),
                        padding: const EdgeInsets.symmetric(vertical: 14),
                        elevation: 0,
                      ),
                      child: const Text(
                        'Post',
                        style: TextStyle(
                          fontFamily: 'Sora',
                          fontWeight: FontWeight.w800,
                          fontSize: 18,
                          color: Colors.white,
                        ),
                      ),
                    ),
                  ),
                ],
              ),
            ),
          ],
        ),
      ),
    );
  }
}

class _DrawerItem extends StatelessWidget {
  final IconData icon;
  final IconData activeIcon;
  final String label;
  final bool isActive;
  final VoidCallback onTap;

  const _DrawerItem({
    required this.icon,
    required this.activeIcon,
    required this.label,
    required this.isActive,
    required this.onTap,
  });

  @override
  Widget build(BuildContext context) {
    return InkWell(
      onTap: onTap,
      borderRadius: BorderRadius.circular(999),
      child: Padding(
        padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 12),
        child: Row(
          children: [
            Icon(
              isActive ? activeIcon : icon,
              size: 26,
              color: AppColors.textPrimary,
            ),
            const SizedBox(width: 20),
            Text(
              label,
              style: TextStyle(
                fontFamily: 'Sora',
                fontSize: 20,
                fontWeight: isActive ? FontWeight.w800 : FontWeight.w500,
                color: AppColors.textPrimary,
              ),
            ),
          ],
        ),
      ),
    );
  }
}
