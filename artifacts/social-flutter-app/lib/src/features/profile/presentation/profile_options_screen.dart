import 'package:flutter/cupertino.dart';
import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import '../../../core/app_colors.dart';
import '../../auth/domain/user.dart';

class ProfileOptionsScreen extends ConsumerWidget {
  final User user;
  const ProfileOptionsScreen({super.key, required this.user});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    return Scaffold(
      backgroundColor: AppColors.background,
      appBar: AppBar(
        title: const Text('Options'),
        leading: IconButton(
          icon: const Icon(CupertinoIcons.arrow_left),
          onPressed: () => context.pop(),
        ),
      ),
      body: ListView(
        padding: const EdgeInsets.symmetric(vertical: 16),
        children: [
          _OptionSection(
            title: 'User Actions',
            items: [
              _OptionItem(
                label: 'Report @${user.username}',
                icon: CupertinoIcons.flag,
                onTap: () {},
                isDestructive: true,
              ),
              _OptionItem(
                label: 'Block @${user.username}',
                icon: CupertinoIcons.slash_circle,
                onTap: () {},
                isDestructive: true,
              ),
            ],
          ),
          const SizedBox(height: 24),
          _OptionSection(
            title: 'Security',
            items: [
              _OptionItem(
                label: 'Two-Factor Authentication',
                icon: CupertinoIcons.shield,
                onTap: () => context.push('/two-factor-setup'),
              ),
              _OptionItem(
                label: 'Account Verification',
                icon: CupertinoIcons.checkmark_seal,
                onTap: () => context.push('/account-verification'),
              ),
            ],
          ),
        ],
      ),
    );
  }
}

class _OptionSection extends StatelessWidget {
  final String title;
  final List<_OptionItem> items;

  const _OptionSection({required this.title, required this.items});

  @override
  Widget build(BuildContext context) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Padding(
          padding: const EdgeInsets.symmetric(horizontal: 20, vertical: 8),
          child: Text(
            title.toUpperCase(),
            style: const TextStyle(
              fontSize: 12,
              fontWeight: FontWeight.bold,
              color: AppColors.mutedForeground,
              letterSpacing: 1.2,
            ),
          ),
        ),
        Container(
          margin: const EdgeInsets.symmetric(horizontal: 16),
          decoration: BoxDecoration(
            color: AppColors.muted,
            borderRadius: BorderRadius.circular(16),
          ),
          child: Column(
            children: items,
          ),
        ),
      ],
    );
  }
}

class _OptionItem extends StatelessWidget {
  final String label;
  final IconData icon;
  final VoidCallback onTap;
  final bool isDestructive;

  const _OptionItem({
    required this.label,
    required this.icon,
    required this.onTap,
    this.isDestructive = false,
  });

  @override
  Widget build(BuildContext context) {
    final color = isDestructive ? Colors.red : AppColors.textPrimary;

    return ListTile(
      leading: Icon(icon, color: color, size: 22),
      title: Text(
        label,
        style: TextStyle(color: color, fontSize: 16, fontWeight: FontWeight.w500),
      ),
      trailing: const Icon(CupertinoIcons.chevron_right, size: 16, color: AppColors.mutedForeground),
      onTap: onTap,
      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(16)),
    );
  }
}
