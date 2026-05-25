import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import "package:material_symbols_icons/material_symbols_icons.dart";
import 'package:go_router/go_router.dart';
import '../../auth/domain/user.dart';
import '../../../core/app_colors.dart';

class ProfileOptionsScreen extends ConsumerWidget {
  final User user;
  const ProfileOptionsScreen({super.key, required this.user});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    return Scaffold(
      backgroundColor: AppColors.background,
      appBar: AppBar(
        title: Text('@${user.username}'),
        leading: IconButton(
          icon: const Icon(Symbols.arrow_back),
          onPressed: () => context.pop(),
        ),
      ),
      body: ListView(
        children: [
          _OptionItem(
            icon: Symbols.flag,
            title: 'Report User',
            onTap: () {},
          ),
          _OptionItem(
            icon: Symbols.block,
            title: 'Block User',
            color: Colors.redAccent,
            onTap: () {},
          ),
          const Divider(),
          _OptionItem(
            icon: Symbols.share,
            title: 'Share Profile',
            onTap: () {},
          ),
        ],
      ),
    );
  }
}

class _OptionItem extends StatelessWidget {
  final IconData icon;
  final String title;
  final VoidCallback onTap;
  final Color? color;

  const _OptionItem({
    required this.icon,
    required this.title,
    required this.onTap,
    this.color,
  });

  @override
  Widget build(BuildContext context) {
    return ListTile(
      leading: Icon(icon, color: color ?? AppColors.textPrimary, size: 22),
      title: Text(
        title,
        style: TextStyle(
          color: color ?? AppColors.textPrimary,
          fontSize: 16,
          fontWeight: FontWeight.w500,
        ),
      ),
      onTap: onTap,
    );
  }
}
