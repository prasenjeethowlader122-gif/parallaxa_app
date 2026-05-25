import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import "package:material_symbols_icons/material_symbols_icons.dart";
import 'package:go_router/go_router.dart';
import '../../../core/theme_provider.dart';
import '../../../core/localization_provider.dart';
import '../../../core/app_colors.dart';
import '../../auth/data/auth_repository.dart';

class SettingsScreen extends ConsumerWidget {
  const SettingsScreen({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final themeMode = ref.watch(themeProvider);
    final locale = ref.watch(localeProvider);
    final l10n = ref.watch(l10nProvider);

    return Scaffold(
      backgroundColor: AppColors.background,
      appBar: AppBar(
        title: Text(l10n.get('settings')),
        leading: IconButton(
          icon: const Icon(Symbols.arrow_back),
          onPressed: () => context.pop(),
        ),
      ),
      body: ListView(
        children: [
          _SettingsSection(
            title: l10n.get('account'),
            children: [
              _SettingsTile(
                icon: Symbols.person,
                title: l10n.get('edit_profile'),
                onTap: () => context.push('/profile/edit'),
              ),
              _SettingsTile(
                icon: Symbols.check_circle,
                title: 'Account Verification',
                onTap: () => context.push('/account-verification'),
              ),
              _SettingsTile(
                icon: Symbols.lock,
                title: 'Change Password',
                onTap: () => context.push('/forgot-password'),
              ),
              _SettingsTile(
                icon: Symbols.shield,
                title: 'Two-Factor Authentication',
                onTap: () => context.push('/two-factor-setup'),
              ),
            ],
          ),
          _SettingsSection(
            title: 'Appearance & Language',
            children: [
              ListTile(
                leading: Container(
                  padding: const EdgeInsets.all(8),
                  decoration: BoxDecoration(
                    color: Colors.purple.withOpacity(0.1),
                    borderRadius: BorderRadius.circular(8),
                  ),
                  child: const Icon(Symbols.palette, color: Colors.purple, size: 22),
                ),
                title: Text(l10n.get('dark_mode')),
                trailing: Switch(
                  value: themeMode == ThemeMode.dark,
                  onChanged: (val) {
                    ref.read(themeProvider.notifier).setThemeMode(
                      val ? ThemeMode.dark : ThemeMode.light,
                    );
                  },
                ),
              ),
              ListTile(
                leading: Container(
                  padding: const EdgeInsets.all(8),
                  decoration: BoxDecoration(
                    color: Colors.blue.withOpacity(0.1),
                    borderRadius: BorderRadius.circular(8),
                  ),
                  child: const Icon(Symbols.public, color: Colors.blue, size: 22),
                ),
                title: Text(l10n.get('language')),
                trailing: DropdownButton<String>(
                  value: locale.languageCode,
                  underline: const SizedBox(),
                  items: const [
                    DropdownMenuItem(value: 'en', child: Text('English')),
                    DropdownMenuItem(value: 'bn', child: Text('Bengali')),
                  ],
                  onChanged: (val) {
                    if (val != null) {
                      ref.read(localeProvider.notifier).setLocale(Locale(val));
                    }
                  },
                ),
              ),
            ],
          ),
          _SettingsSection(
            title: l10n.get('support'),
            children: [
              _SettingsTile(
                icon: Symbols.help,
                title: 'Help Center',
                onTap: () {},
              ),
              _SettingsTile(
                icon: Symbols.info,
                title: l10n.get('about'),
                onTap: () => context.push('/about'),
              ),
            ],
          ),
          const SizedBox(height: 32),
          Padding(
            padding: const EdgeInsets.symmetric(horizontal: 16),
            child: OutlinedButton.icon(
              onPressed: () async {
                await ref.read(authRepositoryProvider).logout();
                if (context.mounted) {
                  context.go('/login');
                }
              },
              icon: const Icon(Symbols.logout, size: 20),
              label: Text(l10n.get('logout')),
              style: OutlinedButton.styleFrom(
                foregroundColor: Colors.redAccent,
                side: const BorderSide(color: Colors.redAccent),
                padding: const EdgeInsets.symmetric(vertical: 12),
              ),
            ),
          ),
          const SizedBox(height: 40),
        ],
      ),
    );
  }
}

class _SettingsSection extends StatelessWidget {
  final String title;
  final List<Widget> children;

  const _SettingsSection({required this.title, required this.children});

  @override
  Widget build(BuildContext context) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Padding(
          padding: const EdgeInsets.fromLTRB(16, 24, 16, 8),
          child: Text(
            title.toUpperCase(),
            style: const TextStyle(
              fontSize: 12,
              fontWeight: FontWeight.bold,
              color: AppColors.mutedForeground,
              letterSpacing: 1.1,
            ),
          ),
        ),
        ...children,
      ],
    );
  }
}

class _SettingsTile extends StatelessWidget {
  final IconData icon;
  final String title;
  final VoidCallback onTap;

  const _SettingsTile({
    required this.icon,
    required this.title,
    required this.onTap,
  });

  @override
  Widget build(BuildContext context) {
    return ListTile(
      leading: Container(
        padding: const EdgeInsets.all(8),
        decoration: BoxDecoration(
          color: AppColors.primary.withOpacity(0.1),
          borderRadius: BorderRadius.circular(8),
        ),
        child: Icon(icon, color: AppColors.primary, size: 22),
      ),
      title: Text(
        title,
        style: const TextStyle(fontSize: 16, fontWeight: FontWeight.w500),
      ),
      trailing: const Icon(Symbols.arrow_forward, size: 16, color: Colors.grey),
      onTap: onTap,
    );
  }
}
