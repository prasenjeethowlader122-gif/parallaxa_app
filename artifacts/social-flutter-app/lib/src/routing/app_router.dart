import 'package:flutter/cupertino.dart';
import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:flutter_svg/flutter_svg.dart';
import 'package:hugeicons/hugeicons.dart';
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
import '../features/messaging/presentation/chat_starter_screen.dart';
import '../features/feed/presentation/post_detail_screen.dart';
import '../features/feed/presentation/image_preview_screen.dart';
import '../features/admin/presentation/admin_dashboard_screen.dart';
import '../features/admin/presentation/admin_users_screen.dart';
import '../features/stories/presentation/story_view_screen.dart';
import '../features/stories/presentation/story_create_screen.dart';
import '../features/profile/presentation/edit_profile_screen.dart';
import '../features/profile/presentation/bookmarks_screen.dart';
import '../features/profile/presentation/account_verification_screen.dart';
import '../features/profile/presentation/profile_options_screen.dart';
import '../features/profile/presentation/settings_screen.dart';
import '../features/profile/presentation/about_screen.dart';
import '../features/auth/presentation/two_factor_setup_screen.dart';
import '../features/auth/domain/user.dart';

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
        path: '/messages/start',
        builder: (_, state) => ChatStarterScreen(user: state.extra as User),
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
        path: '/post/:postId',
        builder: (_, state) =>
            PostDetailScreen(postId: state.pathParameters['postId']!),
      ),
      GoRoute(
        path: '/image-preview',
        builder: (_, state) =>
            ImagePreviewScreen(imageUrl: state.extra as String),
      ),
      GoRoute(path: '/admin', builder: (_, _) => const AdminDashboardScreen()),
      GoRoute(
        path: '/admin/users',
        builder: (_, _) => const AdminUsersScreen(),
      ),
      GoRoute(
        path: '/stories/:userId',
        builder: (_, state) =>
            StoryViewScreen(userId: state.pathParameters['userId']!),
      ),
      GoRoute(
        path: '/story/create',
        builder: (_, _) => const StoryCreateScreen(),
      ),
      GoRoute(
        path: '/user/:userId',
        builder: (_, state) =>
            profile.ProfileScreen(userId: state.pathParameters['userId']!),
      ),
      GoRoute(
        path: '/profile/edit',
        builder: (_, state) => EditProfileScreen(user: state.extra as User),
      ),
      GoRoute(
        path: '/profile/options',
        builder: (_, state) => ProfileOptionsScreen(user: state.extra as User),
      ),
      GoRoute(path: '/bookmarks', builder: (_, _) => const BookmarksScreen()),
      GoRoute(
        path: '/account-verification',
        builder: (_, _) => const AccountVerificationScreen(),
      ),
      GoRoute(
        path: '/two-factor-setup',
        builder: (_, _) => const TwoFactorSetupScreen(),
      ),
      GoRoute(path: '/settings', builder: (_, _) => const SettingsScreen()),
      GoRoute(path: '/about', builder: (_, _) => const AboutScreen()),
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

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: AppColors.background,
      appBar: _ParallaxaAppBar(location: location),
      drawer: _AppDrawer(location: location),
      body: child,
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
          icon: const HugeIcon(
            icon: HugeIcons.strokeRoundedMenu01,
            color: AppColors.textPrimary,
            size: 22,
          ),
          onPressed: () => Scaffold.of(context).openDrawer(),
        ),
      ),
      title: SvgPicture.asset(
        'assets/images/text-logo-dark.svg',
        height: 26,
        width: 148,
        fit: BoxFit.contain,
        colorFilter: const ColorFilter.mode(
          Color(0xFF1877F2), // Facebook Blue
          BlendMode.srcIn,
        ),
      ),
      actions: [
        IconButton(
          icon: const HugeIcon(
            icon: HugeIcons.strokeRoundedSearch01,
            color: AppColors.textPrimary,
            size: 22,
          ),
          onPressed: () => context.go('/explore'),
        ),
        IconButton(
          icon: const HugeIcon(
            icon: HugeIcons.strokeRoundedNotification01,
            color: AppColors.textPrimary,
            size: 22,
          ),
          onPressed: () => context.go('/notifications'),
        ),
        IconButton(
          icon: const HugeIcon(
            icon: HugeIcons.strokeRoundedChat01,
            color: AppColors.textPrimary,
            size: 22,
          ),
          onPressed: () => context.go('/messages'),
        ),
        const SizedBox(width: 4),
      ],
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
                    icon: const HugeIcon(
                      icon: HugeIcons.strokeRoundedArrowLeft01,
                      color: AppColors.textPrimary,
                      size: 22,
                    ),
                    onPressed: () => Navigator.of(context).pop(),
                    padding: EdgeInsets.zero,
                  ),
                  const SizedBox(width: 8),
                  SvgPicture.asset(
                    'assets/images/text-logo-dark.svg',
                    height: 26,
                    width: 148,
                    fit: BoxFit.contain,
                    colorFilter: const ColorFilter.mode(
                      Color(0xFF1877F2), // Facebook Blue
                      BlendMode.srcIn,
                    ),
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
                    icon: HugeIcons.strokeRoundedHome01,
                    activeIcon: HugeIcons.strokeRoundedHome01,
                    label: 'Home',
                    isActive: location == '/feed',
                    onTap: () {
                      Navigator.of(context).pop();
                      context.go('/feed');
                    },
                  ),
                  _DrawerItem(
                    icon: HugeIcons.strokeRoundedSearch01,
                    activeIcon: HugeIcons.strokeRoundedSearch01,
                    label: 'Explore',
                    isActive: location == '/explore',
                    onTap: () {
                      Navigator.of(context).pop();
                      context.go('/explore');
                    },
                  ),
                  _DrawerItem(
                    icon: HugeIcons.strokeRoundedNotification01,
                    activeIcon: HugeIcons.strokeRoundedNotification01,
                    label: 'Notifications',
                    isActive: location == '/notifications',
                    onTap: () {
                      Navigator.of(context).pop();
                      context.go('/notifications');
                    },
                  ),
                  _DrawerItem(
                    icon: HugeIcons.strokeRoundedChat01,
                    activeIcon: HugeIcons.strokeRoundedChat01,
                    label: 'Messages',
                    isActive: location == '/messages',
                    onTap: () {
                      Navigator.of(context).pop();
                      context.go('/messages');
                    },
                  ),
                  _DrawerItem(
                    icon: HugeIcons.strokeRoundedUser,
                    activeIcon: HugeIcons.strokeRoundedUser,
                    label: 'Profile',
                    isActive: location == '/profile',
                    onTap: () {
                      Navigator.of(context).pop();
                      context.go('/profile');
                    },
                  ),
                  const Divider(color: AppColors.border, height: 24),
                  _DrawerItem(
                    icon: HugeIcons.strokeRoundedBookmark01,
                    activeIcon: HugeIcons.strokeRoundedBookmark01,
                    label: 'Bookmarks',
                    isActive: location == '/bookmarks',
                    onTap: () {
                      Navigator.of(context).pop();
                      context.push('/bookmarks');
                    },
                  ),
                  _DrawerItem(
                    icon: HugeIcons.strokeRoundedSettings01,
                    activeIcon: HugeIcons.strokeRoundedSettings01,
                    label: 'Settings',
                    isActive: location == '/settings',
                    onTap: () {
                      Navigator.of(context).pop();
                      context.push('/settings');
                    },
                  ),
                  _DrawerItem(
                    icon: HugeIcons.strokeRoundedInformationCircle,
                    activeIcon: HugeIcons.strokeRoundedInformationCircle,
                    label: 'About',
                    isActive: location == '/about',
                    onTap: () {
                      Navigator.of(context).pop();
                      context.push('/about');
                    },
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
  final dynamic icon;
  final dynamic activeIcon;
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
            HugeIcon(
              icon: isActive ? activeIcon : icon,
              size: 26,
              color: AppColors.textPrimary,
            ),
            const SizedBox(width: 20),
            Text(
              label,
              style: TextStyle(
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
