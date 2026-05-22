import 'package:flutter/cupertino.dart';
import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:hugeicons/hugeicons.dart';
import 'package:go_router/go_router.dart';
import '../../auth/data/auth_repository.dart';
import '../../auth/domain/user.dart';
import '../../../core/app_colors.dart';

class AccountVerificationScreen extends ConsumerStatefulWidget {
  const AccountVerificationScreen({super.key});

  @override
  ConsumerState<AccountVerificationScreen> createState() =>
      _AccountVerificationScreenState();
}

class _AccountVerificationScreenState
    extends ConsumerState<AccountVerificationScreen> {
  final _otpController = TextEditingController();
  String _step = 'start';
  String? _verifyingType;
  bool _isLoading = false;

  @override
  void dispose() {
    _otpController.dispose();
    super.dispose();
  }

  Future<void> _requestVerification() async {
    setState(() => _isLoading = true);
    try {
      // Simulate API call
      await Future.delayed(const Duration(seconds: 1));
      setState(() {
        _step = 'pending';
        _isLoading = false;
      });
    } catch (e) {
      setState(() => _isLoading = false);
      if (mounted)
        ScaffoldMessenger.of(
          context,
        ).showSnackBar(SnackBar(content: Text('Error: $e')));
    }
  }

  void _verifyOTP() {
    if (_otpController.text.length != 6) return;
    ScaffoldMessenger.of(context).showSnackBar(
      SnackBar(
        content: Text(
          '${_verifyingType == 'email' ? 'Email' : 'Phone'} verified successfully!',
        ),
      ),
    );
    setState(() {
      _step = 'start';
      _verifyingType = null;
      _otpController.clear();
    });
  }

  @override
  Widget build(BuildContext context) {
    // In a real app, watch the user profile to determine state

    return Scaffold(
      backgroundColor: AppColors.background,
      appBar: AppBar(
        title: const Text('Verification'),
        leading: IconButton(
          icon: const HugeIcon(icon: HugeIcons.strokeRoundedArrowLeft01, color: AppColors.textPrimary),
          onPressed: () => context.pop(),
        ),
      ),
      body: SingleChildScrollView(
        padding: const EdgeInsets.all(24),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            if (_verifyingType != null) ...[
              Text(
                'Verify your $_verifyingType',
                style: const TextStyle(
                  fontSize: 24,
                  fontWeight: FontWeight.bold,
                ),
              ),
              const SizedBox(height: 16),
              Text(
                'Enter the 6-digit code sent to your $_verifyingType.',
                style: const TextStyle(color: AppColors.mutedForeground),
              ),
              const SizedBox(height: 32),
              TextField(
                controller: _otpController,
                textAlign: TextAlign.center,
                keyboardType: TextInputType.number,
                maxLength: 6,
                style: const TextStyle(
                  fontSize: 32,
                  fontWeight: FontWeight.bold,
                  letterSpacing: 10,
                ),
                decoration: const InputDecoration(hintText: '000000'),
                onChanged: (val) {
                  if (val.length == 6) _verifyOTP();
                },
              ),
              const SizedBox(height: 24),
              ElevatedButton(
                onPressed: _otpController.text.length == 6 ? _verifyOTP : null,
                style: ElevatedButton.styleFrom(
                  minimumSize: const Size(double.infinity, 56),
                ),
                child: const Text('Verify'),
              ),
              TextButton(
                onPressed: () => setState(() => _verifyingType = null),
                child: const Center(child: Text('Cancel')),
              ),
            ] else if (_step == 'pending') ...[
              const Center(
                child: Column(
                  children: [
                    HugeIcon(
                      icon: HugeIcons.strokeRoundedInformationCircle,
                      size: 64,
                      color: AppColors.primary,
                    ),
                    SizedBox(height: 24),
                    Text(
                      'Request Pending',
                      style: TextStyle(
                        fontSize: 24,
                        fontWeight: FontWeight.bold,
                      ),
                    ),
                    SizedBox(height: 16),
                    Text(
                      'Your verification request is currently being reviewed. This usually takes 24-48 hours.',
                      textAlign: TextAlign.center,
                      style: TextStyle(color: AppColors.mutedForeground),
                    ),
                  ],
                ),
              ),
            ] else ...[
              _VerificationOption(
                title: 'Email Verification',
                subtitle: 'Verify your email address',
                icon: HugeIcons.strokeRoundedMail01,
                onTap: () => setState(() => _verifyingType = 'email'),
              ),
              const SizedBox(height: 16),
              _VerificationOption(
                title: 'Phone Verification',
                subtitle: 'Connect your phone number',
                icon: HugeIcons.strokeRoundedCall,
                onTap: () => setState(() => _verifyingType = 'phone'),
              ),
              const SizedBox(height: 32),
              const Text(
                'Verification Request',
                style: TextStyle(fontSize: 18, fontWeight: FontWeight.bold),
              ),
              const SizedBox(height: 8),
              const Text(
                'Applying for verification requires a complete profile, a confirmed email address, and a phone number.',
                style: TextStyle(color: AppColors.mutedForeground),
              ),
              const SizedBox(height: 24),
              ElevatedButton(
                onPressed: _isLoading ? null : _requestVerification,
                style: ElevatedButton.styleFrom(
                  minimumSize: const Size(double.infinity, 56),
                  backgroundColor: Colors.black,
                ),
                child: _isLoading
                    ? const CupertinoActivityIndicator(color: Colors.white)
                    : const Text('Request Verification'),
              ),
            ],
          ],
        ),
      ),
    );
  }
}

class _VerificationOption extends StatelessWidget {
  final String title;
  final String subtitle;
  final dynamic icon;
  final VoidCallback onTap;

  const _VerificationOption({
    required this.title,
    required this.subtitle,
    required this.icon,
    required this.onTap,
  });

  @override
  Widget build(BuildContext context) {
    return InkWell(
      onTap: onTap,
      borderRadius: BorderRadius.circular(16),
      child: Container(
        padding: const EdgeInsets.all(16),
        decoration: BoxDecoration(
          color: AppColors.muted,
          borderRadius: BorderRadius.circular(16),
        ),
        child: Row(
          children: [
            Container(
              padding: const EdgeInsets.all(10),
              decoration: const BoxDecoration(
                color: Colors.white,
                shape: BoxShape.circle,
              ),
              child: icon is IconData
                  ? Icon(icon as IconData, color: AppColors.primary)
                  : HugeIcon(icon: icon, color: AppColors.primary),
            ),
            const SizedBox(width: 16),
            Expanded(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(
                    title,
                    style: const TextStyle(fontWeight: FontWeight.bold),
                  ),
                  Text(
                    subtitle,
                    style: const TextStyle(
                      fontSize: 12,
                      color: AppColors.mutedForeground,
                    ),
                  ),
                ],
              ),
            ),
            const HugeIcon(
              icon: HugeIcons.strokeRoundedArrowRight01,
              size: 16,
              color: AppColors.mutedForeground,
            ),
          ],
        ),
      ),
    );
  }
}
