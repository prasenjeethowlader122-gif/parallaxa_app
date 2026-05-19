import 'package:flutter/cupertino.dart';
import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import '../../../core/app_colors.dart';
import 'package:social_app/src/features/auth/data/auth_repository.dart';

import '../../../core/api_client.dart';
import '../../../core/processing_provider.dart';
import 'package:social_app/src/features/profile/presentation/widgets/user_avatar.dart';

class SettingsScreen extends ConsumerWidget {
  const SettingsScreen({super.key});

  Future<void> _logout(BuildContext context, WidgetRef ref) async {
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
      ref.read(processingProvider.notifier).hide();
      if (context.mounted) context.go('/login');
    }
  }

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final meAsync = ref.watch(meProvider);

    return Scaffold(
      backgroundColor: AppColors.background,
      appBar: AppBar(
        title: const Text('Settings'),
        centerTitle: true,
        leading: IconButton(
          icon: const Icon(CupertinoIcons.arrow_left),
          onPressed: () => context.pop(),
        ),
        bottom: const PreferredSize(
          preferredSize: Size.fromHeight(0.5),
          child: Divider(height: 0.5),
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
                                  const Icon(
                                    CupertinoIcons.checkmark_seal_fill,
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
                      const Icon(
                        CupertinoIcons.chevron_right,
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
              const _SectionHeader(title: 'Administrative Tools'),
              _SettingsTile(
                icon: CupertinoIcons.settings,
                label: 'User Management',
                onTap: () => context.push('/admin/users'),
              ),
              const SizedBox(height: 24),
            ],

            const _SectionHeader(title: 'Account'),
            _SettingsTile(
              icon: CupertinoIcons.pencil,
              label: 'Edit profile',
              onTap: () => context.push('/profile/edit', extra: me),
            ),
            _SettingsTile(
              icon: CupertinoIcons.check_mark_circled,
              label: 'Account Verification',
              onTap: () => context.push('/account-verification'),
            ),

            const SizedBox(height: 24),

            const _SectionHeader(title: 'Security & Privacy'),
            _SettingsTile(
              icon: CupertinoIcons.lock,
              label: 'Two-Factor Auth',
              onTap: () => context.push('/two-factor-setup'),
            ),
            _SettingsTile(
              icon: CupertinoIcons.shield,
              label: 'Private account',
              trailing: CupertinoSwitch(
                value: me.isPrivate ?? false,
                onChanged: (val) {
                  // TODO: Implement update privacy
                },
              ),
            ),

            const SizedBox(height: 24),

            const _SectionHeader(title: 'Support & About'),
            _SettingsTile(
              icon: CupertinoIcons.question_circle,
              label: 'Help & Support',
              onTap: () {},
            ),
            _SettingsTile(
              icon: CupertinoIcons.info,
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
                onTap: () => _logout(context, ref),
                tileColor: AppColors.card,
                shape: RoundedRectangleBorder(
                  borderRadius: BorderRadius.circular(12),
                  side: const BorderSide(color: AppColors.border, width: 0.5),
                ),
                leading: const Icon(
                  CupertinoIcons.square_arrow_right,
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
                style: TextStyle(fontSize: 13, color: AppColors.mutedForeground),
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
  final IconData icon;
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
      leading: Icon(icon, color: AppColors.foreground, size: 22),
      title: Text(
        label,
        style: const TextStyle(
          fontSize: 16,
          fontWeight: FontWeight.w500,
          color: AppColors.foreground,
        ),
      ),
      trailing: trailing ?? const Icon(CupertinoIcons.chevron_right, size: 16, color: AppColors.mutedForeground),
      contentPadding: const EdgeInsets.symmetric(horizontal: 20, vertical: 4),
    );
  }
}
