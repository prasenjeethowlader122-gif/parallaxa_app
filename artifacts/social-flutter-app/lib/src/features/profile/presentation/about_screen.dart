import 'package:flutter/cupertino.dart';
import 'package:flutter/material.dart';
import 'package:hugeicons/hugeicons.dart';
import '../../../core/app_colors.dart';

class AboutScreen extends StatelessWidget {
  const AboutScreen({super.key});

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: AppColors.background,
      appBar: AppBar(title: const Text('About Parallaxa')),
      body: SingleChildScrollView(
        padding: const EdgeInsets.all(24),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            const Center(
              child: Column(
                children: [
                  Text(
                    'Parallaxa',
                    style: TextStyle(
                      fontSize: 32,
                      fontWeight: FontWeight.w800,
                      color: AppColors.textPrimary,
                    ),
                  ),
                  Text(
                    'Version 1.0.0',
                    style: TextStyle(fontSize: 16, color: AppColors.textMuted),
                  ),
                ],
              ),
            ),
            const SizedBox(height: 40),
            const Text(
              'About the App',
              style: TextStyle(fontSize: 20, fontWeight: FontWeight.w700),
            ),
            const SizedBox(height: 12),
            const Text(
              'Parallaxa is a modern social networking platform designed to connect people through shared experiences, stories, and real-time messaging. Built with speed and security in mind, it provides a seamless experience for users to express themselves and discover trending content.',
              style: TextStyle(
                fontSize: 16,
                height: 1.6,
                color: AppColors.foreground,
              ),
            ),
            const SizedBox(height: 32),
            const Text(
              'Developer',
              style: TextStyle(fontSize: 20, fontWeight: FontWeight.w700),
            ),
            const SizedBox(height: 12),
            _DeveloperInfoRow(
              icon: HugeIcons.strokeRoundedUser,
              label: 'Name',
              value: 'Prasenjeet Howlader',
            ),
            _DeveloperInfoRow(
              icon: HugeIcons.strokeRoundedMail01,
              label: 'Contact',
              value: 'contact@prasenjeet.dev',
            ),
            _DeveloperInfoRow(
              icon: HugeIcons.strokeRoundedGlobe,
              label: 'Website',
              value: 'https://prasenjeet.dev',
            ),
            const SizedBox(height: 40),
            const Center(
              child: Text(
                '© 2024 Parallaxa Inc. All rights reserved.',
                style: TextStyle(fontSize: 14, color: AppColors.textMuted),
              ),
            ),
          ],
        ),
      ),
    );
  }
}

class _DeveloperInfoRow extends StatelessWidget {
  final dynamic icon;
  final String label;
  final String value;

  const _DeveloperInfoRow({
    required this.icon,
    required this.label,
    required this.value,
  });

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: const EdgeInsets.symmetric(vertical: 8),
      child: Row(
        children: [
          icon is IconData
              ? Icon(icon as IconData, size: 20, color: AppColors.primary)
              : HugeIcon(icon: icon, size: 20, color: AppColors.primary),
          const SizedBox(width: 12),
          Text(
            '$label: ',
            style: const TextStyle(fontWeight: FontWeight.w600, fontSize: 16),
          ),
          Text(
            value,
            style: const TextStyle(fontSize: 16, color: AppColors.textPrimary),
          ),
        ],
      ),
    );
  }
}
