import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import "package:material_symbols_icons/material_symbols_icons.dart";
import '../data/auth_repository.dart';
import '../../../core/app_colors.dart';
import '../../../core/processing_provider.dart';
import 'widgets/floating_label_input.dart';

class ForgotPasswordScreen extends ConsumerStatefulWidget {
  const ForgotPasswordScreen({super.key});

  @override
  ConsumerState<ForgotPasswordScreen> createState() => _ForgotPasswordScreenState();
}

class _ForgotPasswordScreenState extends ConsumerState<ForgotPasswordScreen> {
  final _emailController = TextEditingController();
  final _codeController = TextEditingController();
  final _passwordController = TextEditingController();
  int _step = 0; // 0: Email, 1: Code & New Password
  String? _error;
  bool _success = false;

  @override
  void dispose() {
    _emailController.dispose();
    _codeController.dispose();
    _passwordController.dispose();
    super.dispose();
  }

  Future<void> _handleForgotPassword() async {
    setState(() => _error = null);
    ref.read(processingProvider.notifier).show("Processing...");

    try {
      await ref.read(authRepositoryProvider).forgotPassword(_emailController.text);
      setState(() => _step = 1);
    } catch (e) {
      setState(() => _error = e.toString());
    } finally {
      ref.read(processingProvider.notifier).hide();
    }
  }

  Future<void> _handleResetPassword() async {
    setState(() => _error = null);
    ref.read(processingProvider.notifier).show("Processing...");

    try {
      await ref.read(authRepositoryProvider).resetPassword(_codeController.text, _passwordController.text);
      setState(() => _success = true);
    } catch (e) {
      setState(() => _error = e.toString());
    } finally {
      ref.read(processingProvider.notifier).hide();
    }
  }

  @override
  Widget build(BuildContext context) {
    if (_success) {
      return Scaffold(
        body: Center(
          child: Padding(
            padding: const EdgeInsets.all(24),
            child: Column(
              mainAxisSize: MainAxisSize.min,
              children: [
                const Icon(Symbols.check_circle, size: 80, color: Colors.green),
                const SizedBox(height: 24),
                const Text(
                  'Password Reset Successful',
                  style: TextStyle(fontSize: 24, fontWeight: FontWeight.bold),
                ),
                const SizedBox(height: 16),
                const Text(
                  'Your password has been reset. You can now log in with your new password.',
                  textAlign: TextAlign.center,
                ),
                const SizedBox(height: 32),
                ElevatedButton(
                  onPressed: () => context.go('/login'),
                  child: const Text('Go to Login'),
                ),
              ],
            ),
          ),
        ),
      );
    }

    return Scaffold(
      backgroundColor: AppColors.background,
      appBar: AppBar(
        title: const Text('Forgot Password'),
        leading: IconButton(
          icon: const Icon(Symbols.arrow_back),
          onPressed: () => context.pop(),
        ),
      ),
      body: SingleChildScrollView(
        padding: const EdgeInsets.all(24),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.stretch,
          children: [
            Text(
              _step == 0
                  ? 'Enter your email to receive a password reset code.'
                  : 'Enter the code sent to your email and your new password.',
              style: const TextStyle(fontSize: 16, color: AppColors.mutedForeground),
            ),
            const SizedBox(height: 32),
            if (_error != null) ...[
              Text(_error!, style: const TextStyle(color: Colors.red)),
              const SizedBox(height: 16),
            ],
            if (_step == 0) ...[
              FloatingLabelInput(
                label: 'Email',
                icon: Symbols.mail,
                controller: _emailController,
                keyboardType: TextInputType.emailAddress,
              ),
              const SizedBox(height: 24),
              ElevatedButton(
                onPressed: _handleForgotPassword,
                child: const Text('Send Reset Code'),
              ),
            ] else ...[
              FloatingLabelInput(
                label: 'Reset Code',
                icon: Symbols.confirmation_number,
                controller: _codeController,
                keyboardType: TextInputType.number,
              ),
              const SizedBox(height: 20),
              FloatingLabelInput(
                label: 'New Password',
                icon: Symbols.lock,
                controller: _passwordController,
                isPassword: true,
              ),
              const SizedBox(height: 24),
              ElevatedButton(
                onPressed: _handleResetPassword,
                child: const Text('Reset Password'),
              ),
            ],
          ],
        ),
      ),
    );
  }
}
