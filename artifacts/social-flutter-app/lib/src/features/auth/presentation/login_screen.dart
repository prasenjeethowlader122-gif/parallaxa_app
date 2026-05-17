import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import 'package:flutter_svg/flutter_svg.dart';
import '../data/auth_repository.dart';
import '../../../core/api_client.dart';
import '../../../core/app_colors.dart';
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

    if (_showTotpInput && (_totpController.text.trim().length != 6)) {
      newErrors['general'] = "Please enter a valid 6-digit 2FA code";
    }

    setState(() => _errors = newErrors);
    return newErrors.isEmpty;
  }

  Future<void> _handleLogin() async {
    setState(() => _errors = {});

    if (!_validateForm()) return;

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
          return;
        }
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
      setState(() {
        _errors = {
          'general': "Invalid email or password. Please try again.",
        };
      });
    } finally {
      if (mounted) setState(() => _isLoading = false);
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

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: Colors.white,
      body: SafeArea(
        child: SingleChildScrollView(
          padding: const EdgeInsets.symmetric(horizontal: 24),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.stretch,
            children: [
              const SizedBox(height: 32 + 32),

              // Logo
              Center(
                child: SvgPicture.asset(
                  'assets/images/parallaxa-logo.svg',
                  width: 180,
                  height: 64,
                  fit: BoxFit.contain,
                ),
              ),
              const SizedBox(height: 32),

              // Heading
              const Text(
                'Welcome back',
                style: TextStyle(
                  fontSize: 30,
                  fontWeight: FontWeight.bold,
                  color: AppColors.slate900,
                  fontFamily: 'Sora',
                ),
              ),
              const SizedBox(height: 12),
              const Text(
                'Sign in to continue to your account',
                style: TextStyle(
                  fontSize: 16,
                  color: AppColors.slate500,
                  fontFamily: 'Sora',
                ),
              ),
              const SizedBox(height: 32),

              // General Error Alert
              if (_errors['general'] != null) ...[
                Container(
                  padding: const EdgeInsets.all(16),
                  decoration: BoxDecoration(
                    color: AppColors.slate50,
                    borderRadius: BorderRadius.circular(12),
                  ),
                  child: Row(
                    children: [
                      const Icon(
                        Icons.error_outline_rounded,
                        color: Color(0xFF111111),
                        size: 20,
                      ),
                      const SizedBox(width: 12),
                      Expanded(
                        child: Text(
                          _errors['general']!,
                          style: const TextStyle(
                            color: Color(0xFF111111),
                            fontWeight: FontWeight.w600,
                            fontSize: 14,
                            fontFamily: 'Sora',
                          ),
                        ),
                      ),
                    ],
                  ),
                ),
                const SizedBox(height: 24),
              ],

              // Email Input
              Opacity(
                opacity: _showTotpInput ? 0.5 : 1.0,
                child: FloatingLabelInput(
                  label: "Email Address",
                  icon: Icons.mail_outline_rounded,
                  controller: _emailController,
                  error: _errors['email'],
                  keyboardType: TextInputType.emailAddress,
                  editable: !_isLoading && !_showTotpInput,
                  right: _emailController.text.isNotEmpty && _errors['email'] == null
                      ? const Icon(
                          Icons.check_circle_outline_rounded,
                          color: Color(0xFF10B981),
                          size: 18,
                        )
                      : null,
                ),
              ),

              // Password Input
              Opacity(
                opacity: _showTotpInput ? 0.5 : 1.0,
                child: FloatingLabelInput(
                  label: "Password",
                  icon: Icons.lock_outline_rounded,
                  controller: _passwordController,
                  error: _errors['password'],
                  secureTextEntry: !_showPassword,
                  editable: !_isLoading && !_showTotpInput,
                  right: IconButton(
                    onPressed: () => setState(() => _showPassword = !_showPassword),
                    icon: Icon(
                      _showPassword ? Icons.visibility_off_outlined : Icons.visibility_outlined,
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

              // Forgot Password Link
              if (!_showTotpInput)
                Align(
                  alignment: Alignment.centerRight,
                  child: Padding(
                    padding: const EdgeInsets.only(bottom: 32),
                    child: GestureDetector(
                      onTap: () => context.push('/forgot-password'),
                      child: const Text(
                        'Forgot password?',
                        style: TextStyle(
                          color: Color(0xFF2563EB), // blue-600
                          fontWeight: FontWeight.w600,
                          fontSize: 14,
                          fontFamily: 'Sora',
                        ),
                      ),
                    ),
                  ),
                ),

              // 2FA Input
              if (_showTotpInput) ...[
                const SizedBox(height: 16),
                FloatingLabelInput(
                  label: "2FA Code",
                  icon: Icons.lock_outline_rounded,
                  controller: _totpController,
                  keyboardType: TextInputType.number,
                  maxLength: 6,
                  autoFocus: true,
                  editable: !_isLoading,
                ),
                GestureDetector(
                  onTap: () => setState(() => _showTotpInput = false),
                  child: const Text(
                    'Back to password',
                    style: TextStyle(
                      color: Color(0xFF2563EB),
                      fontWeight: FontWeight.w600,
                      fontSize: 14,
                      fontFamily: 'Sora',
                    ),
                    textAlign: TextAlign.center,
                  ),
                ),
                const SizedBox(height: 24),
              ],

              // Sign In Button
              SizedBox(
                height: 56,
                child: ElevatedButton(
                  onPressed: _isLoading || _emailController.text.isEmpty || _passwordController.text.isEmpty || (_showTotpInput && _totpController.text.length != 6)
                      ? null
                      : _handleLogin,
                  style: ElevatedButton.styleFrom(
                    backgroundColor: Colors.black,
                    foregroundColor: Colors.white,
                    shape: RoundedRectangleBorder(
                      borderRadius: BorderRadius.circular(28),
                    ),
                    elevation: 0,
                    disabledBackgroundColor: AppColors.slate300,
                  ),
                  child: _isLoading
                      ? const CircularProgressIndicator(color: Colors.white)
                      : const Text(
                          'Sign in',
                          style: TextStyle(
                            fontSize: 16,
                            fontWeight: FontWeight.bold,
                            fontFamily: 'Sora',
                          ),
                        ),
                ),
              ),
              const SizedBox(height: 16),

              // Google Sign In Button
              SizedBox(
                height: 56,
                child: OutlinedButton(
                  onPressed: _isLoading ? null : () {},
                  style: OutlinedButton.styleFrom(
                    side: const BorderSide(color: AppColors.slate200),
                    shape: RoundedRectangleBorder(
                      borderRadius: BorderRadius.circular(28),
                    ),
                  ),
                  child: Row(
                    mainAxisAlignment: MainAxisAlignment.center,
                    children: [
                      SvgPicture.network(
                        'https://www.gstatic.com/firebasejs/ui/2.0.0/images/auth/google.svg',
                        width: 20,
                        height: 20,
                      ),
                      const SizedBox(width: 12),
                      const Text(
                        'Continue with Google',
                        style: TextStyle(
                          color: AppColors.slate900,
                          fontSize: 16,
                          fontWeight: FontWeight.bold,
                          fontFamily: 'Sora',
                        ),
                      ),
                    ],
                  ),
                ),
              ),

              // Divider
              Padding(
                padding: const EdgeInsets.symmetric(vertical: 24),
                child: Row(
                  children: [
                    Expanded(child: Container(height: 1, color: AppColors.slate200)),
                    const Padding(
                      padding: EdgeInsets.symmetric(horizontal: 12),
                      child: Text(
                        'OR',
                        style: TextStyle(
                          color: AppColors.slate500,
                          fontSize: 12,
                          fontWeight: FontWeight.w500,
                          fontFamily: 'Sora',
                        ),
                      ),
                    ),
                    Expanded(child: Container(height: 1, color: AppColors.slate200)),
                  ],
                ),
              ),

              // Sign Up CTA
              Row(
                mainAxisAlignment: MainAxisAlignment.center,
                children: [
                  const Text(
                    "Don't have an account? ",
                    style: TextStyle(
                      color: AppColors.slate600,
                      fontSize: 14,
                      fontFamily: 'Sora',
                    ),
                  ),
                  GestureDetector(
                    onTap: () => context.push('/register'),
                    child: const Text(
                      'Sign up',
                      style: TextStyle(
                        color: Color(0xFF2563EB),
                        fontWeight: FontWeight.bold,
                        fontSize: 14,
                        fontFamily: 'Sora',
                      ),
                    ),
                  ),
                ],
              ),

              // Footer
              const SizedBox(height: 48),
              const Text.rich(
                TextSpan(
                  text: 'By signing in, you agree to our ',
                  children: [
                    TextSpan(
                      text: 'Terms of Service',
                      style: TextStyle(color: Color(0xFF2563EB), fontWeight: FontWeight.w600),
                    ),
                    TextSpan(text: ' and '),
                    TextSpan(
                      text: 'Privacy Policy',
                      style: TextStyle(color: Color(0xFF2563EB), fontWeight: FontWeight.w600),
                    ),
                    TextSpan(text: ', including '),
                    TextSpan(
                      text: 'Cookie Use',
                      style: TextStyle(color: Color(0xFF2563EB), fontWeight: FontWeight.w600),
                    ),
                    TextSpan(text: '.'),
                  ],
                ),
                textAlign: TextAlign.center,
                style: TextStyle(
                  color: AppColors.slate500,
                  fontSize: 12,
                  height: 1.4,
                  fontFamily: 'Sora',
                ),
              ),
              const SizedBox(height: 24),
            ],
          ),
        ),
      ),
    );
  }
}
