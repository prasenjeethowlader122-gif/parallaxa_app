import 'package:dio/dio.dart';
import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:hugeicons/hugeicons.dart';
import 'package:go_router/go_router.dart';
import '../data/auth_repository.dart';
import '../../../core/app_colors.dart';
import 'widgets/floating_label_input.dart';

class ForgotPasswordScreen extends ConsumerStatefulWidget {
  const ForgotPasswordScreen({super.key});

  @override
  ConsumerState<ForgotPasswordScreen> createState() =>
      _ForgotPasswordScreenState();
}

class _ForgotPasswordScreenState extends ConsumerState<ForgotPasswordScreen> {
  final _emailController = TextEditingController();
  final _tokenController = TextEditingController();
  final _passwordController = TextEditingController();

  bool _isLoading = false;
  bool _isSuccess = false;
  bool _showTokenInput = false;
  bool _showPassword = false;
  Map<String, String> _errors = {};

  @override
  void dispose() {
    _emailController.dispose();
    _tokenController.dispose();
    _passwordController.dispose();
    super.dispose();
  }

  Future<void> _handleForgotPassword() async {
    final email = _emailController.text.trim();
    if (email.isEmpty) {
      setState(() => _errors = {'email': 'Email is required'});
      return;
    }

    setState(() {
      _isLoading = true;
      _errors = {};
    });

    try {
      await ref.read(authRepositoryProvider).forgotPassword(email);
      if (mounted) {
        setState(() {
          _showTokenInput = true;
          _isLoading = false;
        });
      }
    } catch (e) {
      if (mounted) {
        String message = "Failed to send reset link.";
        if (e is DioException) {
          message = e.response?.data['message'] ?? message;
        }
        setState(() {
          _isLoading = false;
          _errors = {'general': message};
        });
      }
    }
  }

  Future<void> _handleResetPassword() async {
    final token = _tokenController.text.trim();
    final password = _passwordController.text.trim();

    if (token.isEmpty || password.length < 6) {
      setState(
        () => _errors = {
          if (token.isEmpty) 'token': 'Token is required',
          if (password.length < 6)
            'password': 'Password must be at least 6 characters',
        },
      );
      return;
    }

    setState(() {
      _isLoading = true;
      _errors = {};
    });

    try {
      await ref.read(authRepositoryProvider).resetPassword(token, password);
      if (mounted) {
        setState(() {
          _isSuccess = true;
          _isLoading = false;
        });
      }
    } catch (e) {
      if (mounted) {
        String message = "Failed to reset password.";
        if (e is DioException) {
          message = e.response?.data['message'] ?? message;
        }
        setState(() {
          _isLoading = false;
          _errors = {'general': message};
        });
      }
    }
  }

  @override
  Widget build(BuildContext context) {
    if (_isSuccess) {
      return Scaffold(
        backgroundColor: Colors.white,
        body: Center(
          child: Padding(
            padding: const EdgeInsets.all(24.0),
            child: Column(
              mainAxisAlignment: MainAxisAlignment.center,
              children: [
                const HugeIcon(
                  icon: HugeIcons.strokeRoundedCheckmarkCircle01,
                  size: 80,
                  color: Colors.green,
                ),
                const SizedBox(height: 24),
                const Text(
                  'Password Reset Successfully',
                  style: TextStyle(fontSize: 24, fontWeight: FontWeight.w800),
                  textAlign: TextAlign.center,
                ),
                const SizedBox(height: 12),
                const Text(
                  'Your password has been reset. You can now login with your new password.',
                  textAlign: TextAlign.center,
                  style: TextStyle(color: AppColors.slate500),
                ),
                const SizedBox(height: 32),
                SizedBox(
                  width: double.infinity,
                  height: 54,
                  child: ElevatedButton(
                    onPressed: () => context.go('/login'),
                    style: ElevatedButton.styleFrom(
                      backgroundColor: Colors.black,
                      shape: RoundedRectangleBorder(
                        borderRadius: BorderRadius.circular(27),
                      ),
                    ),
                    child: const Text(
                      'Back to Login',
                      style: TextStyle(fontWeight: FontWeight.w800),
                    ),
                  ),
                ),
              ],
            ),
          ),
        ),
      );
    }

    return Scaffold(
      backgroundColor: Colors.white,
      appBar: AppBar(
        backgroundColor: Colors.white,
        elevation: 0,
        leading: IconButton(
          icon: const HugeIcon(
            icon: HugeIcons.strokeRoundedArrowLeft01,
            color: AppColors.slate900,
          ),
          onPressed: () => context.pop(),
        ),
      ),
      body: SafeArea(
        child: SingleChildScrollView(
          padding: const EdgeInsets.symmetric(horizontal: 24),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.stretch,
            children: [
              const SizedBox(height: 24),
              Text(
                _showTokenInput ? 'Reset Password' : 'Forgot Password',
                style: const TextStyle(
                  fontSize: 28,
                  fontWeight: FontWeight.w800,
                  color: AppColors.slate900,
                ),
              ),
              const SizedBox(height: 8),
              Text(
                _showTokenInput
                    ? 'Enter the token you received and your new password.'
                    : 'Enter your email address and we will send you a reset token.',
                style: const TextStyle(fontSize: 15, color: AppColors.slate500),
              ),
              const SizedBox(height: 32),

              if (_errors['general'] != null) ...[
                Container(
                  padding: const EdgeInsets.symmetric(
                    horizontal: 16,
                    vertical: 14,
                  ),
                  decoration: BoxDecoration(
                    color: const Color(0xFFFEF2F2),
                    borderRadius: BorderRadius.circular(12),
                    border: Border.all(color: const Color(0xFFFCA5A5)),
                  ),
                  child: Text(
                    _errors['general']!,
                    style: const TextStyle(
                      color: Color(0xFFDC2626),
                      fontWeight: FontWeight.w600,
                      fontSize: 14,
                    ),
                  ),
                ),
                const SizedBox(height: 16),
              ],

              if (!_showTokenInput)
                FloatingLabelInput(
                  label: "Email Address",
                  icon: HugeIcons.strokeRoundedMail01,
                  controller: _emailController,
                  error: _errors['email'],
                  keyboardType: TextInputType.emailAddress,
                  textInputAction: TextInputAction.done,
                  editable: !_isLoading,
                  onFieldSubmitted: (_) => _handleForgotPassword(),
                )
              else ...[
                FloatingLabelInput(
                  label: "Reset Token",
                  icon: HugeIcons.strokeRoundedTicket01,
                  controller: _tokenController,
                  error: _errors['token'],
                  textInputAction: TextInputAction.next,
                  editable: !_isLoading,
                ),
                FloatingLabelInput(
                  label: "New Password",
                  icon: HugeIcons.strokeRoundedLockPassword,
                  controller: _passwordController,
                  error: _errors['password'],
                  secureTextEntry: !_showPassword,
                  textInputAction: TextInputAction.done,
                  editable: !_isLoading,
                  onFieldSubmitted: (_) => _handleResetPassword(),
                  right: IconButton(
                    onPressed: () =>
                        setState(() => _showPassword = !_showPassword),
                    icon: HugeIcon(
                      icon: _showPassword
                          ? HugeIcons.strokeRoundedViewOffSlash
                          : HugeIcons.strokeRoundedView,
                      color: AppColors.slate500,
                      size: 18,
                    ),
                    padding: EdgeInsets.zero,
                    constraints: const BoxConstraints(),
                  ),
                ),
              ],

              const SizedBox(height: 32),
              SizedBox(
                height: 54,
                child: ElevatedButton(
                  onPressed: _isLoading
                      ? null
                      : (_showTokenInput
                            ? _handleResetPassword
                            : _handleForgotPassword),
                  style: ElevatedButton.styleFrom(
                    backgroundColor: Colors.black,
                    shape: RoundedRectangleBorder(
                      borderRadius: BorderRadius.circular(27),
                    ),
                    disabledBackgroundColor: AppColors.slate200,
                  ),
                  child: _isLoading
                      ? const SizedBox(
                          width: 22,
                          height: 22,
                          child: CircularProgressIndicator(
                            color: Colors.white,
                            strokeWidth: 2,
                          ),
                        )
                      : Text(
                          _showTokenInput
                              ? 'Reset Password'
                              : 'Send Reset Link',
                          style: const TextStyle(
                            fontSize: 16,
                            fontWeight: FontWeight.w800,
                          ),
                        ),
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }
}
