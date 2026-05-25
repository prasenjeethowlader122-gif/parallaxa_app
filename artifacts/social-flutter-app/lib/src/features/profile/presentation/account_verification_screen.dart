import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import "package:material_symbols_icons/material_symbols_icons.dart";
import 'package:go_router/go_router.dart';
import '../../../core/app_colors.dart';

class AccountVerificationScreen extends ConsumerStatefulWidget {
  const AccountVerificationScreen({super.key});

  @override
  ConsumerState<AccountVerificationScreen> createState() =>
      _AccountVerificationScreenState();
}

class _AccountVerificationScreenState
    extends ConsumerState<AccountVerificationScreen> {
  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: AppColors.background,
      appBar: AppBar(
        title: const Text('Verified Account'),
        leading: IconButton(
          icon: const Icon(Symbols.arrow_back),
          onPressed: () => context.pop(),
        ),
      ),
      body: SingleChildScrollView(
        child: Column(
          children: [
            const SizedBox(height: 40),
            const Center(
              child: Icon(
                Symbols.verified,
                size: 80,
                color: AppColors.verified,
              ),
            ),
            const SizedBox(height: 24),
            const Text(
              'Get Verified',
              style: TextStyle(fontSize: 24, fontWeight: FontWeight.bold),
            ),
            const SizedBox(height: 12),
            Padding(
              padding: const EdgeInsets.symmetric(horizontal: 40),
              child: Text(
                'Verified accounts have blue checkmarks next to their names to show that we’ve confirmed they’re the real presence of the public figures, celebrities, and brands they represent.',
                textAlign: TextAlign.center,
                style: TextStyle(
                  color: AppColors.mutedForeground,
                  fontSize: 14,
                  height: 1.5,
                ),
              ),
            ),
            const SizedBox(height: 40),
            _VerificationOption(
              icon: Symbols.badge,
              title: 'Government ID',
              description:
                  'Upload a photo of your official government-issued ID.',
              onTap: () {},
            ),
            _VerificationOption(
              icon: Symbols.description,
              title: 'Official Document',
              description: 'Tax filings, recent utility bill, or articles of incorporation.',
              onTap: () {},
            ),
            const SizedBox(height: 40),
            Padding(
              padding: const EdgeInsets.symmetric(horizontal: 24),
              child: ElevatedButton(
                onPressed: () {},
                style: ElevatedButton.styleFrom(
                  minimumSize: const Size(double.infinity, 50),
                  shape: RoundedRectangleBorder(
                    borderRadius: BorderRadius.circular(12),
                  ),
                ),
                child: const Text('Apply Now'),
              ),
            ),
            const SizedBox(height: 40),
          ],
        ),
      ),
    );
  }
}

class _VerificationOption extends StatelessWidget {
  final IconData icon;
  final String title;
  final String description;
  final VoidCallback onTap;

  const _VerificationOption({
    required this.icon,
    required this.title,
    required this.description,
    required this.onTap,
  });

  @override
  Widget build(BuildContext context) {
    return ListTile(
      onTap: onTap,
      contentPadding: const EdgeInsets.symmetric(horizontal: 24, vertical: 8),
      leading: Container(
        padding: const EdgeInsets.all(12),
        decoration: BoxDecoration(
          color: AppColors.primary.withOpacity(0.1),
          shape: BoxShape.circle,
        ),
        child: Icon(icon, color: AppColors.primary),
      ),
      title: Text(
        title,
        style: const TextStyle(fontWeight: FontWeight.bold, fontSize: 16),
      ),
      subtitle: Text(
        description,
        style: TextStyle(color: AppColors.mutedForeground, fontSize: 13),
      ),
      trailing: const Icon(Symbols.arrow_forward, size: 16, color: Colors.grey),
    );
  }
}
