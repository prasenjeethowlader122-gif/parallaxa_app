import 'package:flutter/material.dart';
import "package:material_symbols_icons/material_symbols_icons.dart";
import 'package:go_router/go_router.dart';
import '../../../core/app_colors.dart';

class AboutScreen extends StatelessWidget {
  const AboutScreen({super.key});

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: AppColors.background,
      appBar: AppBar(
        title: const Text('About Parallaxa'),
        leading: IconButton(
          icon: const Icon(Symbols.arrow_back),
          onPressed: () => context.pop(),
        ),
      ),
      body: SingleChildScrollView(
        padding: const EdgeInsets.all(24.0),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Center(
              child: Column(
                children: [
                  Container(
                    width: 100,
                    height: 100,
                    decoration: BoxDecoration(
                      color: AppColors.primary,
                      borderRadius: BorderRadius.circular(24),
                    ),
                    child: const Center(
                      child: Icon(
                        Symbols.public,
                        size: 60,
                        color: Colors.white,
                      ),
                    ),
                  ),
                  const SizedBox(height: 16),
                  const Text(
                    'Parallaxa',
                    style: TextStyle(
                      fontSize: 28,
                      fontWeight: FontWeight.bold,
                      letterSpacing: 1.2,
                    ),
                  ),
                  const Text(
                    'Version 1.0.0',
                    style: TextStyle(
                      color: AppColors.mutedForeground,
                      fontSize: 16,
                    ),
                  ),
                ],
              ),
            ),
            const SizedBox(height: 40),
            const Text(
              'Developer',
              style: TextStyle(
                fontSize: 20,
                fontWeight: FontWeight.bold,
              ),
            ),
            const SizedBox(height: 16),
            const _DeveloperInfoRow(
              icon: Symbols.public,
              label: 'Website',
              value: 'https://parallaxa.app',
            ),
            const _DeveloperInfoRow(
              icon: Symbols.mail,
              label: 'Support',
              value: 'support@parallaxa.app',
            ),
            const _DeveloperInfoRow(
              icon: Symbols.location_on,
              label: 'Location',
              value: 'Global',
            ),
            const SizedBox(height: 40),
            const Text(
              'About',
              style: TextStyle(
                fontSize: 20,
                fontWeight: FontWeight.bold,
              ),
            ),
            const SizedBox(height: 12),
            const Text(
              'Parallaxa is a privacy-focused social network designed to give you complete control over your data and interactions. We believe in an open, transparent, and secure digital space.',
              style: TextStyle(
                fontSize: 16,
                height: 1.6,
                color: AppColors.textPrimary,
              ),
            ),
          ],
        ),
      ),
    );
  }
}

class _DeveloperInfoRow extends StatelessWidget {
  final IconData icon;
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
      padding: const EdgeInsets.symmetric(vertical: 8.0),
      child: Row(
        children: [
          Container(
            padding: const EdgeInsets.all(8),
            decoration: BoxDecoration(
              color: AppColors.primary.withOpacity(0.1),
              borderRadius: BorderRadius.circular(8),
            ),
            child: Icon(icon, size: 20, color: AppColors.primary),
          ),
          const SizedBox(width: 16),
          Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Text(
                label,
                style: const TextStyle(
                  fontSize: 12,
                  color: AppColors.mutedForeground,
                ),
              ),
              Text(
                value,
                style: const TextStyle(
                  fontSize: 16,
                  fontWeight: FontWeight.w500,
                ),
              ),
            ],
          ),
        ],
      ),
    );
  }
}
