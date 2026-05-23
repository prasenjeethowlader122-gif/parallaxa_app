import 'package:dio/dio.dart';
import 'package:flutter/cupertino.dart';
import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import 'package:flutter_svg/flutter_svg.dart';
import 'package:hugeicons/hugeicons.dart';
import '../data/auth_repository.dart';
import '../../../core/api_client.dart';
import '../../../core/app_colors.dart';
import '../../../core/processing_provider.dart';
import 'widgets/floating_label_input.dart';

class LoginScreen extends ConsumerStatefulWidget {
  const LoginScreen({super.key});

  @override
  ConsumerState<LoginScreen> createState() => _LoginScreenState();
}

class _LoginScreenState extends ConsumerState<LoginScreen> {
  final _emailController = TextEditingController();
  final _passwordController = TextEditingController();
  final _totpController = TextEditingController();

  bool _isLoading = false;
  bool _showPassword = false;
  bool _showTotpInput = false;

  Map<String, String> _errors = {};

  @override
  void dispose() {
    _emailController.dispose();
    _passwordController.dispose();
    _totpController.dispose();
    super.dispose();
  }

  bool _validateForm() {
    final Map<String, String> newErrors = {};

    final email = _emailController.text.trim();
    if (email.isEmpty) {
      newErrors['email'] = "Email address is required";
    } else if (!RegExp(r'^[^\s@]+@[^\s@]+\.[^\s@]+$').hasMatch(email)) {
      newErrors['email'] = "Please enter a valid email address";
    }

    final password = _passwordController.text.trim();
    if (password.isEmpty) {
      newErrors['password'] = "Password is required";
    } else if (password.length < 6) {
      newErrors['password'] = "Password must be at least 6 characters";
    }

    if (_showTotpInput && _totpController.text.trim().length != 6) {
      newErrors['general'] = "Please enter a valid 6-digit 2FA code";
    }

    setState(() => _errors = newErrors);
    return newErrors.isEmpty;
  }

  Future<void> _handleLogin() async {
    setState(() => _errors = {});
    if (!_validateForm()) return;

    ref.read(processingProvider.notifier).show("Logging in...");
    setState(() => _isLoading = true);
    try {
      final authRepo = ref.read(authRepositoryProvider);

      if (_showTotpInput) {
        final response = await authRepo.verify2FA(
          _emailController.text.trim(),
          _totpController.text.trim(),
        );
        if (response.token != null) {
          await _onLoginSuccess(response.token!, response.user?.id);
        }
        return;
      }

      final response = await authRepo.login(
        _emailController.text.trim(),
        _passwordController.text,
      );

      if (response.twoFactorRequired) {
        setState(() {
          _showTotpInput = true;
          _isLoading = false;
        });
        return;
      }

      if (response.token != null) {
        await _onLoginSuccess(response.token!, response.user?.id);
      }
    } catch (e) {
      if (mounted) {
        String errorMessage = "Invalid email or password. Please try again.";
        if (e is DioException) {
          final data = e.response?.data;
          if (data is Map && data.containsKey('message')) {
            errorMessage = data['message'];
          } else if (e.type == DioExceptionType.connectionTimeout ||
              e.type == DioExceptionType.receiveTimeout) {
            errorMessage = "Connection timed out. Please check your internet.";
          } else if (e.type == DioExceptionType.connectionError) {
            errorMessage = "Unable to connect to the server.";
          }
        }
        setState(() {
          _errors = {'general': errorMessage};
        });
      }
    } finally {
      ref.read(processingProvider.notifier).hide();
      if (mounted && _isLoading) {
        setState(() => _isLoading = false);
      }
    }
  }

  Future<void> _onLoginSuccess(String token, String? userId) async {
    final storage = ref.read(storageServiceProvider);
    await storage.setAuthToken(token);
    if (userId != null) {
      await storage.setCurrentUserId(userId);
    }
    if (mounted) context.go('/feed');
  }

  bool get _canSubmit {
    if (_isLoading) return false;
    if (_emailController.text.trim().isEmpty) return false;
    if (_passwordController.text.trim().isEmpty) return false;
    if (_showTotpInput && _totpController.text.trim().length != 6) return false;
    return true;
  }

  @override
  Widget build(BuildContext context) {
    final screenWidth = MediaQuery.of(context).size.width;

    return Scaffold(
      body: SafeArea(
        child: SingleChildScrollView(
          padding: const EdgeInsets.symmetric(horizontal: 24),
          keyboardDismissBehavior: ScrollViewKeyboardDismissBehavior.onDrag,
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.stretch,
            children: [
              const SizedBox(height: 48),

              // Logo — capped to screen width to prevent overflow on small devices
              Center(
                child: SvgPicture.asset(
                  'assets/images/parallaxa-logo.svg',
                  width: (screenWidth - 80).clamp(120.0, 200.0),
                  height: 76,
                  fit: BoxFit.contain,
                ),
              ),
              const SizedBox(height: 28),

              // Heading
              const Text(
                'Welcome back',
                style: TextStyle(
                  fontSize: 28,
                  fontWeight: FontWeight.w800,
                  color: AppColors.slate900,
                  letterSpacing: -0.5,
                ),
              ),
              const SizedBox(height: 8),
              const Text(
                'Sign in to continue to your account',
                style: TextStyle(
                  fontSize: 15,
                  color: AppColors.slate500,
                  fontWeight: FontWeight.w500,
                ),
              ),
              const SizedBox(height: 24),

              // General Error Alert
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
                  child: Row(
                    children: [
                      const HugeIcon(
                        icon: HugeIcons.strokeRoundedAlertCircle,
                        color: Color(0xFFDC2626),
                        size: 20,
                      ),
                      const SizedBox(width: 12),
                      Expanded(
                        child: Text(
                          _errors['general']!,
                          style: const TextStyle(
                            color: Color(0xFFDC2626),
                            fontWeight: FontWeight.w600,
                            fontSize: 14,
                          ),
                        ),
                      ),
                    ],
                  ),
                ),
                const SizedBox(height: 16),
              ],

              // Email Input — dimmed during 2FA step
              Opacity(
                opacity: _showTotpInput ? 0.45 : 1.0,
                child: FloatingLabelInput(
                  label: "Email Address",
                  icon: HugeIcons.strokeRoundedMail01,
                  controller: _emailController,
                  error: _errors['email'],
                  keyboardType: TextInputType.emailAddress,
                  textInputAction: TextInputAction.next,
                  editable: !_isLoading && !_showTotpInput,
                  onChanged: (_) => setState(() => _errors.remove('email')),
                ),
              ),

              // Password Input — dimmed during 2FA step
              Opacity(
                opacity: _showTotpInput ? 0.45 : 1.0,
                child: FloatingLabelInput(
                  label: "Password",
                  icon: HugeIcons.strokeRoundedLockPassword,
                  controller: _passwordController,
                  error: _errors['password'],
                  secureTextEntry: !_showPassword,
                  textInputAction: _showTotpInput
                      ? TextInputAction.next
                      : TextInputAction.done,
                  editable: !_isLoading && !_showTotpInput,
                  onChanged: (_) => setState(() => _errors.remove('password')),
                  onFieldSubmitted: (_) {
                    if (!_showTotpInput) _handleLogin();
                  },
                  right: IconButton(
                    onPressed: () =>
                        setState(() => _showPassword = !_showPassword),
                    icon: HugeIcon(
                      icon: _showPassword
                          ? HugeIcons.strokeRoundedViewOffSlash
                          : HugeIcons.strokeRoundedView,
                      color: _errors['password'] != null
                          ? const Color(0xFFDC2626)
                          : AppColors.slate500,
                      size: 18,
                    ),
                    padding: EdgeInsets.zero,
                    constraints: const BoxConstraints(),
                  ),
                ),
              ),

              // Forgot Password link (hidden in 2FA mode)
              if (!_showTotpInput)
                Align(
                  alignment: Alignment.centerRight,
                  child: Padding(
                    padding: const EdgeInsets.only(bottom: 24),
                    child: GestureDetector(
                      onTap: () => context.push('/forgot-password'),
                      child: const Text(
                        'Forgot password?',
                        style: TextStyle(
                          color: Color(0xFF0095F6),
                          fontWeight: FontWeight.w700,
                          fontSize: 14,
                        ),
                      ),
                    ),
                  ),
                ),

              // 2FA Input
              if (_showTotpInput) ...[
                FloatingLabelInput(
                  label: "6-digit 2FA Code",
                  icon: HugeIcons.strokeRoundedShield01,
                  controller: _totpController,
                  keyboardType: TextInputType.number,
                  textInputAction: TextInputAction.done,
                  maxLength: 6,
                  autoFocus: true,
                  editable: !_isLoading,
                  onChanged: (_) => setState(() => _errors.remove('general')),
                  onFieldSubmitted: (_) => _handleLogin(),
                ),
                Align(
                  alignment: Alignment.center,
                  child: Padding(
                    padding: const EdgeInsets.only(bottom: 24),
                    child: GestureDetector(
                      onTap: () => setState(() {
                        _showTotpInput = false;
                        _totpController.clear();
                        _errors = {};
                      }),
                      child: const Text(
                        '← Back to password',
                        style: TextStyle(
                          color: Color(0xFF0095F6),
                          fontWeight: FontWeight.w700,
                          fontSize: 14,
                        ),
                      ),
                    ),
                  ),
                ),
              ],

              // Sign In Button
              SizedBox(
                height: 54,
                child: ElevatedButton(
                  onPressed: _canSubmit ? _handleLogin : null,
                  style: ElevatedButton.styleFrom(
                    backgroundColor: Colors.black,
                    foregroundColor: Colors.white,
                    shape: RoundedRectangleBorder(
                      borderRadius: BorderRadius.circular(27),
                    ),
                    elevation: 0,
                    disabledBackgroundColor: AppColors.slate200,
                    disabledForegroundColor: AppColors.slate400,
                  ),
                  child: _isLoading
                      ? const SizedBox(
                          height: 22,
                          width: 22,
                          child: CircularProgressIndicator(
                            color: Colors.white,
                            strokeWidth: 2.5,
                          ),
                        )
                      : const Text(
                          'Sign in',
                          style: TextStyle(
                            fontSize: 16,
                            fontWeight: FontWeight.w800,
                          ),
                        ),
                ),
              ),
              const SizedBox(height: 12),

              // Sign Up CTA
              Row(
                mainAxisAlignment: MainAxisAlignment.center,
                children: [
                  const Text(
                    "Don't have an account? ",
                    style: TextStyle(
                      color: AppColors.slate600,
                      fontSize: 14,
                      fontWeight: FontWeight.w500,
                    ),
                  ),
                  GestureDetector(
                    onTap: () => context.push('/register'),
                    child: const Text(
                      'Sign up',
                      style: TextStyle(
                        color: Color(0xFF0095F6),
                        fontWeight: FontWeight.w800,
                        fontSize: 14,
                      ),
                    ),
                  ),
                ],
              ),

              const SizedBox(height: 32),
              const Text.rich(
                TextSpan(
                  text: 'By signing in, you agree to our ',
                  children: [
                    TextSpan(
                      text: 'Terms of Service',
                      style: TextStyle(
                        color: Color(0xFF0095F6),
                        fontWeight: FontWeight.w700,
                      ),
                    ),
                    TextSpan(text: ' and '),
                    TextSpan(
                      text: 'Privacy Policy',
                      style: TextStyle(
                        color: Color(0xFF0095F6),
                        fontWeight: FontWeight.w700,
                      ),
                    ),
                    TextSpan(text: '.'),
                  ],
                ),
                textAlign: TextAlign.center,
                style: TextStyle(
                  color: AppColors.slate400,
                  fontSize: 12,
                  height: 1.5,
                  fontWeight: FontWeight.w500,
                ),
              ),
              const SizedBox(height: 32),
            ],
          ),
        ),
      ),
    );
  }
}
