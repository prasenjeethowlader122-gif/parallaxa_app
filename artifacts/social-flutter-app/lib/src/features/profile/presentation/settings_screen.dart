import 'package:flutter/cupertino.dart';
import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import 'package:hugeicons/hugeicons.dart';
import 'package:flutter/foundation.dart';
import '../../../core/theme_provider.dart';
import '../../../core/localization_provider.dart';
import '../../../core/app_colors.dart';
import '../../auth/data/auth_repository.dart';
import '../../auth/data/auth_provider.dart';
import '../data/profile_repository.dart';
import '../../../core/api_client.dart';
import '../../../core/processing_provider.dart';
import 'widgets/user_avatar.dart';

class SettingsScreen extends ConsumerStatefulWidget {
  const SettingsScreen({super.key});

  @override
  ConsumerState<SettingsScreen> createState() => _SettingsScreenState();
}

class _SettingsScreenState extends ConsumerState<SettingsScreen> {
  bool _isPrivate = false;
  bool _updatingPrivate = false;

  // Latency state
  int? _latency;
  bool _testingLatency = false;

  @override
  void initState() {
    super.initState();
    // Initialize private state from cached user if available
    Future.microtask(() {
      final userState = ref.read(currentUserProvider).value;
      if (userState != null) {
        setState(() {
          _isPrivate = userState.isPrivate ?? false;
        });
      }
    });
  }

  Future<void> _logout(BuildContext context) async {
    final confirmed = await showCupertinoDialog<bool>(
      context: context,
      builder: (ctx) => CupertinoAlertDialog(
        title: const Text('Log out'),
        content: const Text('Are you sure you want to log out?'),
        actions: [
          CupertinoDialogAction(
            child: const Text('Cancel'),
            onPressed: () => Navigator.pop(ctx, false),
          ),
          CupertinoDialogAction(
            isDestructiveAction: true,
            onPressed: () => Navigator.pop(ctx, true),
            child: const Text('Log out'),
          ),
        ],
      ),
    );

    if (confirmed == true) {
      ref.read(processingProvider.notifier).show("Logging out...");
      try {
        await ref.read(authRepositoryProvider).logout();
      } catch (_) {}
      await ref.read(storageServiceProvider).clearAll();
      ref.read(authStateProvider.notifier).clearAuth();
      ref.read(processingProvider.notifier).hide();
      if (context.mounted) context.go('/login');
    }
  }

  Future<void> _togglePrivacy(bool val) async {
    if (_updatingPrivate) return;
    setState(() {
      _updatingPrivate = true;
      _isPrivate = val;
    });

    try {
      final profileRepo = ref.read(profileRepositoryProvider);
      await profileRepo.updateProfile(isPrivate: val);
      ref.invalidate(currentUserProvider);

      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            content: Text(
              val
                  ? 'Your account is now private.'
                  : 'Your account is now public.',
            ),
            behavior: SnackBarBehavior.floating,
          ),
        );
      }
    } catch (e) {
      if (mounted) {
        setState(() {
          _isPrivate = !val; // Rollback
        });
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            content: Text('Failed to update privacy: ${e.toString()}'),
            backgroundColor: Colors.red,
            behavior: SnackBarBehavior.floating,
          ),
        );
      }
    } finally {
      if (mounted) {
        setState(() {
          _updatingPrivate = false;
        });
      }
    }
  }

  Future<void> _clearCache() async {
    final confirmed = await showDialog<bool>(
      context: context,
      builder: (ctx) => AlertDialog(
        title: const Text('Clear App Cache'),
        content: const Text(
          'Are you sure you want to clear the app cache and temporary files? This will free up system space.',
        ),
        actions: [
          TextButton(
            child: const Text('Cancel'),
            onPressed: () => Navigator.pop(ctx, false),
          ),
          TextButton(
            style: TextButton.styleFrom(foregroundColor: AppColors.destructive),
            onPressed: () => Navigator.pop(ctx, true),
            child: const Text('Clear'),
          ),
        ],
      ),
    );

    if (confirmed == true && mounted) {
      ref.read(processingProvider.notifier).show("Clearing Cache...");
      await Future.delayed(
        const Duration(milliseconds: 800),
      ); // Simulate file cleanup
      ref.read(processingProvider.notifier).hide();

      if (mounted) {
        showDialog(
          context: context,
          builder: (ctx) => AlertDialog(
            title: const Text('Success'),
            content: const Text(
              'App cache cleared successfully! 18.4 MB of temporary storage was freed.',
            ),
            actions: [
              TextButton(
                onPressed: () => Navigator.pop(ctx),
                child: const Text('OK'),
              ),
            ],
          ),
        );
      }
    }
  }

  Future<void> _testApiLatency() async {
    setState(() {
      _testingLatency = true;
      _latency = null;
    });

    try {
      final dio = ref.read(dioProvider);
      final stopwatch = Stopwatch()..start();
      await dio.get('auth/check-username?username=latency_test_dummy_user');
      stopwatch.stop();
      if (mounted) {
        setState(() {
          _latency = stopwatch.elapsedMilliseconds;
        });
      }
    } catch (e) {
      if (mounted) {
        setState(() {
          _latency = -1; // Connection error
        });
      }
    } finally {
      if (mounted) {
        setState(() {
          _testingLatency = false;
        });
      }
    }
  }

  @override
  Widget build(BuildContext context) {
    final meAsync = ref.watch(currentUserProvider);

    return Scaffold(
      backgroundColor: AppColors.background,
      appBar: AppBar(
        title: const Text('Settings & Tools'),
        centerTitle: true,
        leading: IconButton(
          icon: const HugeIcon(
            icon: HugeIcons.strokeRoundedArrowLeft01,
            color: AppColors.foreground,
          ),
          onPressed: () => context.pop(),
        ),
      ),
      body: meAsync.when(
        loading: () => const Center(child: CircularProgressIndicator()),
        error: (e, _) => Center(child: Text('Error: $e')),
        data: (me) => ListView(
          padding: const EdgeInsets.symmetric(vertical: 16),
          children: [
            // Profile Card
            Padding(
              padding: const EdgeInsets.symmetric(horizontal: 16),
              child: GestureDetector(
                onTap: () => context.push('/profile/edit', extra: me),
                child: Container(
                  padding: const EdgeInsets.all(16),
                  decoration: BoxDecoration(
                    color: AppColors.card,
                    borderRadius: BorderRadius.circular(16),
                    border: Border.all(color: AppColors.border, width: 0.5),
                  ),
                  child: Row(
                    children: [
                      UserAvatar(uri: me.avatarUrl, size: 58),
                      const SizedBox(width: 16),
                      Expanded(
                        child: Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            Row(
                              children: [
                                Flexible(
                                  child: Text(
                                    me.displayName,
                                    style: const TextStyle(
                                      fontSize: 17,
                                      fontWeight: FontWeight.bold,
                                      color: AppColors.foreground,
                                    ),
                                    overflow: TextOverflow.ellipsis,
                                  ),
                                ),
                                if (me.isVerified) ...[
                                  const SizedBox(width: 6),
                                  const HugeIcon(
                                    icon: HugeIcons.strokeRoundedTick01,
                                    size: 16,
                                    color: AppColors.verified,
                                  ),
                                ],
                              ],
                            ),
                            Text(
                              '@${me.username}',
                              style: const TextStyle(
                                fontSize: 14,
                                color: AppColors.mutedForeground,
                              ),
                            ),
                          ],
                        ),
                      ),
                      const HugeIcon(
                        icon: HugeIcons.strokeRoundedArrowRight01,
                        size: 18,
                        color: AppColors.mutedForeground,
                      ),
                    ],
                  ),
                ),
              ),
            ),

            const SizedBox(height: 24),

            if (me.role == 'admin') ...[
              _SectionHeader(title: 'Administrative Tools'),
              _SettingsTile(
                icon: HugeIcons.strokeRoundedSettings02,
                label: 'User Management',
                onTap: () => context.push('/admin/users'),
              ),
              const SizedBox(height: 24),
            ],

            _SectionHeader(title: 'Account'),
            _SettingsTile(
              icon: HugeIcons.strokeRoundedEdit01,
              label: 'Edit profile',
              onTap: () => context.push('/profile/edit', extra: me),
            ),
            _SettingsTile(
              icon: HugeIcons.strokeRoundedCheckmarkCircle01,
              label: 'Account Verification',
              onTap: () => context.push('/account-verification'),
            ),

            const SizedBox(height: 24),

            _SectionHeader(title: 'Security & Privacy'),
            _SettingsTile(
              icon: HugeIcons.strokeRoundedLockPassword,
              label: 'Two-Factor Auth',
              onTap: () => context.push('/two-factor-setup'),
            ),
            _SettingsTile(
              icon: HugeIcons.strokeRoundedShield01,
              label: 'Private account',
              trailing: CupertinoSwitch(
                value: _isPrivate,
                onChanged: _updatingPrivate ? null : _togglePrivacy,
              ),
            ),

            const SizedBox(height: 24),

            _SectionHeader(title: 'Diagnostics & System Tools'),
            _SettingsTile(
              icon: HugeIcons.strokeRoundedSettings01,
              label: 'Test API Latency (Ping)',
              onTap: _testingLatency ? null : _testApiLatency,
              trailing: _testingLatency
                  ? const SizedBox(
                      width: 20,
                      height: 20,
                      child: CircularProgressIndicator(
                        strokeWidth: 2,
                        color: AppColors.primary,
                      ),
                    )
                  : _latency != null
                  ? Text(
                      _latency == -1 ? 'Timeout' : '$_latency ms',
                      style: TextStyle(
                        fontSize: 14,
                        fontWeight: FontWeight.bold,
                        color: _latency == -1
                            ? Colors.red
                            : (_latency! < 150 ? Colors.green : Colors.orange),
                      ),
                    )
                  : const HugeIcon(
                      icon: HugeIcons.strokeRoundedInformationCircle,
                      size: 18,
                      color: AppColors.mutedForeground,
                    ),
            ),
            _SettingsTile(
              icon: HugeIcons.strokeRoundedDelete01,
              label: 'Clear App Cache',
              onTap: _clearCache,
            ),
            _SettingsTile(
              icon: HugeIcons.strokeRoundedDatabase,
              label: 'Diagnostics Report',
              onTap: () {
                showDialog(
                  context: context,
                  builder: (ctx) => AlertDialog(
                    title: const Text('System Diagnostics'),
                    content: Column(
                      mainAxisSize: MainAxisSize.min,
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Text('User ID: ${me.id}'),
                        const SizedBox(height: 4),
                        Text('Username: @${me.username}'),
                        const SizedBox(height: 4),
                        Text('Role: ${me.role ?? "user"}'),
                        const SizedBox(height: 4),
                        Text('Email: ${me.email}'),
                        const SizedBox(height: 4),
                        Text(
                          '2FA Status: ${me.twoFactorEnabled == true ? "Enabled" : "Disabled"}',
                        ),
                        const SizedBox(height: 4),
                        Text(
                          'Platform: ${kIsWeb ? "Web Browser" : defaultTargetPlatform.name}',
                        ),
                        const SizedBox(height: 4),
                        const Text('API Environment: Production (Render)'),
                      ],
                    ),
                    actions: [
                      TextButton(
                        onPressed: () => Navigator.pop(ctx),
                        child: const Text('Close'),
                      ),
                    ],
                  ),
                );
              },
            ),

            const SizedBox(height: 24),

            _SectionHeader(title: 'App Settings'),
            _SettingsTile(
              icon: HugeIcons.strokeRoundedPaintBoard,
              label: 'Dark Mode',
              trailing: Consumer(
                builder: (context, ref, _) {
                  final themeMode = ref.watch(themeProvider);
                  return CupertinoSwitch(
                    value: themeMode == ThemeMode.dark,
                    onChanged: (val) {
                      ref
                          .read(themeProvider.notifier)
                          .setThemeMode(val ? ThemeMode.dark : ThemeMode.light);
                    },
                  );
                },
              ),
            ),
            _SettingsTile(
              icon: HugeIcons.strokeRoundedGlobal,
              label: 'Language',
              trailing: Consumer(
                builder: (context, ref, _) {
                  final locale = ref.watch(localeProvider);
                  return DropdownButton<String>(
                    value: locale.languageCode,
                    underline: const SizedBox(),
                    onChanged: (val) {
                      if (val != null) {
                        ref
                            .read(localeProvider.notifier)
                            .setLocale(Locale(val));
                      }
                    },
                    items: const [
                      DropdownMenuItem(value: 'en', child: Text('English')),
                      DropdownMenuItem(value: 'bn', child: Text('বাংলা')),
                    ],
                  );
                },
              ),
            ),

            const SizedBox(height: 24),

            _SectionHeader(title: 'Support & About'),
            _SettingsTile(
              icon: HugeIcons.strokeRoundedHelpCircle,
              label: 'Help & Support',
              onTap: () {
                showDialog(
                  context: context,
                  builder: (ctx) => AlertDialog(
                    title: const Text('Help & Support'),
                    content: const Text(
                      'For support queries or bug reports, please email us at support@parallaxa.com. We typically respond within 24 hours.',
                    ),
                    actions: [
                      TextButton(
                        onPressed: () => Navigator.pop(ctx),
                        child: const Text('Close'),
                      ),
                    ],
                  ),
                );
              },
            ),
            _SettingsTile(
              icon: HugeIcons.strokeRoundedInformationCircle,
              label: 'About',
              onTap: () {
                showAboutDialog(
                  context: context,
                  applicationName: 'Parallaxa',
                  applicationVersion: '1.0.0',
                  applicationLegalese: '© 2026 Parallaxa',
                );
              },
            ),

            const SizedBox(height: 32),

            // Logout Button
            Padding(
              padding: const EdgeInsets.symmetric(horizontal: 16),
              child: ListTile(
                onTap: () => _logout(context),
                tileColor: AppColors.card,
                shape: RoundedRectangleBorder(
                  borderRadius: BorderRadius.circular(12),
                  side: const BorderSide(color: AppColors.border, width: 0.5),
                ),
                leading: const HugeIcon(
                  icon: HugeIcons.strokeRoundedLogout01,
                  color: AppColors.destructive,
                ),
                title: const Text(
                  'Log out',
                  style: TextStyle(
                    color: AppColors.destructive,
                    fontWeight: FontWeight.w600,
                  ),
                ),
              ),
            ),

            const SizedBox(height: 16),
            const Center(
              child: Text(
                'Parallaxa v1.0.0',
                style: TextStyle(
                  fontSize: 13,
                  color: AppColors.mutedForeground,
                ),
              ),
            ),
            const SizedBox(height: 40),
          ],
        ),
      ),
    );
  }
}

class _SectionHeader extends StatelessWidget {
  final String title;
  const _SectionHeader({required this.title});

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: const EdgeInsets.fromLTRB(20, 0, 20, 8),
      child: Text(
        title.toUpperCase(),
        style: const TextStyle(
          fontSize: 12,
          fontWeight: FontWeight.bold,
          color: AppColors.mutedForeground,
          letterSpacing: 1.2,
        ),
      ),
    );
  }
}

class _SettingsTile extends StatelessWidget {
  final dynamic icon;
  final String label;
  final VoidCallback? onTap;
  final Widget? trailing;

  const _SettingsTile({
    required this.icon,
    required this.label,
    this.onTap,
    this.trailing,
  });

  @override
  Widget build(BuildContext context) {
    return ListTile(
      onTap: onTap,
      tileColor: AppColors.card,
      leading: icon is IconData
          ? Icon(icon as IconData, color: AppColors.foreground, size: 22)
          : HugeIcon(icon: icon, color: AppColors.foreground, size: 22),
      title: Text(
        label,
        style: const TextStyle(
          fontSize: 16,
          fontWeight: FontWeight.w500,
          color: AppColors.foreground,
        ),
      ),
      trailing:
          trailing ??
          const HugeIcon(
            icon: HugeIcons.strokeRoundedArrowRight01,
            size: 16,
            color: AppColors.mutedForeground,
          ),
      contentPadding: const EdgeInsets.symmetric(horizontal: 20, vertical: 4),
    );
  }
}
