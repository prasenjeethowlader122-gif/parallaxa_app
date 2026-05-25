import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import "package:material_symbols_icons/material_symbols_icons.dart";
import '../../../core/app_colors.dart';
import '../../../core/localization_provider.dart';

class ChatSettingsScreen extends ConsumerWidget {
  final String participantName;

  const ChatSettingsScreen({super.key, required this.participantName});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final l10n = ref.watch(l10nProvider);

    return Scaffold(
      appBar: AppBar(
        title: Text(l10n.get('chat_settings')),
        leading: IconButton(
          icon: const Icon(
            Symbols.arrow_back,
            color: AppColors.primary,
          ),
          onPressed: () => context.pop(),
        ),
      ),
      body: ListView(
        children: [
          const SizedBox(height: 20),
          Center(
            child: Column(
              children: [
                CircleAvatar(
                  radius: 40,
                  backgroundColor: AppColors.primary.withValues(alpha: 0.1),
                  child: Text(
                    participantName.isNotEmpty
                        ? participantName[0].toUpperCase()
                        : '?',
                    style: const TextStyle(
                      fontSize: 32,
                      fontWeight: FontWeight.bold,
                      color: AppColors.primary,
                    ),
                  ),
                ),
                const SizedBox(height: 12),
                Text(
                  participantName,
                  style: const TextStyle(
                    fontSize: 20,
                    fontWeight: FontWeight.bold,
                  ),
                ),
              ],
            ),
          ),
          const SizedBox(height: 32),
          _SettingsTile(
            Symbols.notifications,
            label: l10n.get('mute'),
            trailing: Switch(value: false, onChanged: (v) {}),
          ),
          _SettingsTile(
            Symbols.search,
            label: 'Search',
            onTap: () {},
          ),
          _SettingsTile(
            Symbols.shield,
            label: 'Privacy & Safety',
            onTap: () {},
          ),
          const Divider(),
          _SettingsTile(
            Symbols.block,
            label: l10n.get('block'),
            labelColor: AppColors.destructive,
            iconColor: AppColors.destructive,
            onTap: () {},
          ),
          _SettingsTile(
            Symbols.delete,
            label: l10n.get('delete_chat'),
            labelColor: AppColors.destructive,
            iconColor: AppColors.destructive,
            onTap: () {},
          ),
        ],
      ),
    );
  }
}

class _SettingsTile extends StatelessWidget {
  final dynamic icon;
  final String label;
  final VoidCallback? onTap;
  final Widget? trailing;
  final Color? labelColor;
  final Color? iconColor;

  const _SettingsTile({
    required this.icon,
    required this.label,
    this.onTap,
    this.trailing,
    this.labelColor,
    this.iconColor,
  });

  @override
  Widget build(BuildContext context) {
    return ListTile(
      onTap: onTap,
      leading: icon is IconData
          ? Icon(
              icon as IconData,
              color:
                  iconColor ?? Theme.of(context).iconTheme.color ?? Colors.grey,
              size: 22,
            )
          : Icon(
              icon: icon,
              color:
                  iconColor ?? Theme.of(context).iconTheme.color ?? Colors.grey,
              size: 22,
            ),
      title: Text(
        label,
        style: TextStyle(
          fontSize: 16,
          fontWeight: FontWeight.w500,
          color: labelColor,
        ),
      ),
      trailing:
          trailing ??
          const Icon(
            Symbols.arrow_forward,
            size: 16,
            color: Colors.grey,
          ),
    );
  }
}
