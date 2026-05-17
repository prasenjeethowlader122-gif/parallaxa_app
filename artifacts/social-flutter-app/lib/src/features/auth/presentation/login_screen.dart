import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import 'package:flutter_svg/flutter_svg.dart';
import '../data/auth_repository.dart';
import '../../../core/api_client.dart';
import '../../../core/storage_service.dart';
import '../../../core/app_colors.dart';
import '../../../common_widgets/floating_label_input.dart';
import '../domain/user.dart';

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

  Map<String, String?> _errors = {};

  @override
  void dispose() {
    _emailController.dispose();
    _passwordController.dispose();
    _totpController.dispose();
    super.dispose();
  }

  bool _validateForm() {
    final Map<String, String?> newErrors = {};

    final email = _emailController.text.trim();
    final password = _passwordController.text;

    if (email.isEmpty) {
      newErrors['email'] = "Email address is required";
    } else if (!RegExp(r'^[^\s@]+@[^\s@]+\.[^\s@]+$').hasMatch(email)) {
      newErrors['email'] = "Please enter a valid email address";
    }

    if (password.isEmpty) {
      newErrors['password'] = "Password is required";
    } else if (password.length < 6) {
      newErrors['password'] = "Password must be at least 6 characters";
    }

    if (_showTotpInput && (_totpController.text.trim().isEmpty || _totpController.text.trim().length != 6)) {
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
        await _processAuthResponse(response);
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

      await _processAuthResponse(response);
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

  Future<void> _processAuthResponse(AuthResponse response) async {
    if (response.token != null && response.user != null) {
      final storage = ref.read(storageServiceProvider);
      await storage.setAuthToken(response.token!);
      await storage.setCurrentUserId(response.user!.id);
      if (mounted) context.go('/feed');
    }
  }

  Future<void> _handleGoogleLogin() async {
    // Google login logic here (similar to RN implementation)
    // For now, keeping it consistent with placeholder
  }

  @override
  Widget build(BuildContext context) {
    final topPadding = MediaQuery.of(context).padding.top + 32;
    final bottomPadding = MediaQuery.of(context).padding.bottom + 24;

    return Scaffold(
      backgroundColor: Colors.white,
      body: SingleChildScrollView(
        padding: EdgeInsets.fromLTRB(24, topPadding, 24, bottomPadding),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.stretch,
          children: [
            // Logo
            Center(
              child: Padding(
                padding: const EdgeInsets.only(top: 24, bottom: 32),
                child: SvgPicture.asset(
                  'assets/images/parallaxa-logo.svg',
                  width: 180,
                  height: 64,
                ),
              ),
            ),

            // Heading
            const Text(
              'Welcome back',
              style: TextStyle(
                fontSize: 30,
                fontWeight: FontWeight.bold,
                color: Color(0xFF0F172A),
                fontFamily: 'Sora',
              ),
            ),
            const SizedBox(height: 12),
            const Text(
              'Sign in to continue to your account',
              style: TextStyle(
                fontSize: 16,
                color: Color(0xFF64748B),
              ),
            ),
            const SizedBox(height: 32),

            // General Error Alert
            if (_errors['general'] != null)
              Container(
                margin: const EdgeInsets.only(bottom: 24),
                padding: const EdgeInsets.all(16),
                decoration: BoxDecoration(
                  color: const Color(0xFFF9FAFB),
                  borderRadius: BorderRadius.circular(12),
                ),
                child: Row(
                  children: [
                    const Icon(
                      Icons.error_outline,
                      size: 20,
                      color: Color(0xFF111111),
                    ),
                    const SizedBox(width: 12),
                    Expanded(
                      child: Text(
                        _errors['general']!,
                        style: const TextStyle(
                          color: Color(0xFF1F2937),
                          fontWeight: FontWeight.w600,
                          fontSize: 14,
                        ),
                      ),
                    ),
                  ],
                ),
              ),

            // Email Input
            Opacity(
              opacity: _showTotpInput ? 0.5 : 1.0,
              child: Padding(
                padding: const EdgeInsets.only(bottom: 12),
                child: FloatingLabelInput(
                  label: 'Email Address',
                  icon: Icons.email_outlined,
                  value: _emailController.text,
                  onChanged: (text) {
                    _emailController.text = text;
                    if (_errors['email'] != null) {
                      setState(() => _errors['email'] = null);
                    }
                  },
                  error: _errors['email'],
                  keyboardType: TextInputType.emailAddress,
                  editable: !_isLoading && !_showTotpInput,
                  right: _emailController.text.isNotEmpty && _errors['email'] == null
                      ? const Icon(
                          Icons.check_circle_outline,
                          size: 18,
                          color: Color(0xFF10B981),
                        )
                      : null,
                ),
              ),
            ),

            // Password Input
            Opacity(
              opacity: _showTotpInput ? 0.5 : 1.0,
              child: Padding(
                padding: const EdgeInsets.only(bottom: 8),
                child: FloatingLabelInput(
                  label: 'Password',
                  icon: Icons.lock_outline,
                  value: _passwordController.text,
                  onChanged: (text) {
                    _passwordController.text = text;
                    if (_errors['password'] != null) {
                      setState(() => _errors['password'] = null);
                    }
                  },
                  error: _errors['password'],
                  secureTextEntry: !_showPassword,
                  editable: !_isLoading && !_showTotpInput,
                  right: IconButton(
                    onPressed: () => setState(() => _showPassword = !_showPassword),
                    icon: Icon(
                      _showPassword ? Icons.visibility_off_outlined : Icons.visibility_outlined,
                      size: 18,
                      color: _errors['password'] != null ? const Color(0xFFDC2626) : const Color(0xFF6B7280),
                    ),
                  ),
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
                        color: Color(0xFF2563EB),
                        fontWeight: FontWeight.w600,
                        fontSize: 14,
                      ),
                    ),
                  ),
                ),
              ),

            // 2FA Input
            if (_showTotpInput)
              Padding(
                padding: const EdgeInsets.symmetric(vertical: 24),
                child: Column(
                  children: [
                    FloatingLabelInput(
                      label: '2FA Code',
                      icon: Icons.lock_outline,
                      value: _totpController.text,
                      onChanged: (text) => _totpController.text = text,
                      keyboardType: TextInputType.number,
                      maxLength: 6,
                      autoFocus: true,
                      editable: !_isLoading,
                    ),
                    const SizedBox(height: 16),
                    GestureDetector(
                      onTap: () => setState(() => _showTotpInput = false),
                      child: const Text(
                        'Back to password',
                        style: TextStyle(
                          color: Color(0xFF2563EB),
                          fontWeight: FontWeight.w600,
                          fontSize: 14,
                        ),
                      ),
                    ),
                  ],
                ),
              ),

            // Sign In Button
            SizedBox(
              height: 56,
              child: ElevatedButton(
                onPressed: _isLoading ||
                        _emailController.text.isEmpty ||
                        _passwordController.text.isEmpty ||
                        (_showTotpInput && _totpController.text.length != 6)
                    ? null
                    : _handleLogin,
                style: ElevatedButton.styleFrom(
                  backgroundColor: Colors.black,
                  foregroundColor: Colors.white,
                  shape: RoundedRectangleBorder(
                    borderRadius: BorderRadius.circular(28),
                  ),
                  elevation: 0,
                ),
                child: _isLoading
                    ? const SizedBox(
                        height: 20,
                        width: 20,
                        child: CircularProgressIndicator(
                          strokeWidth: 2,
                          color: Colors.white,
                        ),
                      )
                    : const Text(
                        'Sign in',
                        style: TextStyle(
                          fontSize: 16,
                          fontWeight: FontWeight.bold,
                        ),
                      ),
              ),
            ),
            const SizedBox(height: 16),

            // Google Sign In Button
            SizedBox(
              height: 56,
              child: OutlinedButton(
                onPressed: _isLoading ? null : _handleGoogleLogin,
                style: OutlinedButton.styleFrom(
                  side: const BorderSide(color: Color(0xFFE2E8F0)),
                  shape: RoundedRectangleBorder(
                    borderRadius: BorderRadius.circular(28),
                  ),
                ),
                child: Row(
                  mainAxisAlignment: MainAxisAlignment.center,
                  children: [
                    Image.network(
                      'https://www.gstatic.com/firebasejs/ui/2.0.0/images/auth/google.svg',
                      width: 20,
                      height: 20,
                    ),
                    const SizedBox(width: 12),
                    const Text(
                      'Continue with Google',
                      style: TextStyle(
                        color: Color(0xFF0F172A),
                        fontSize: 16,
                        fontWeight: FontWeight.bold,
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
                  Expanded(child: Container(height: 1, color: const Color(0xFFE2E8F0))),
                  const Padding(
                    padding: EdgeInsets.symmetric(horizontal: 12),
                    child: Text(
                      'OR',
                      style: TextStyle(
                        color: Color(0xFF64748B),
                        fontSize: 12,
                        fontWeight: FontWeight.w500,
                      ),
                    ),
                  ),
                  Expanded(child: Container(height: 1, color: const Color(0xFFE2E8F0))),
                ],
              ),
            ),

            // Sign Up CTA
            Row(
              mainAxisAlignment: MainAxisAlignment.center,
              children: [
                const Text(
                  "Don't have an account? ",
                  style: TextStyle(color: Color(0xFF475569), fontSize: 14),
                ),
                GestureDetector(
                  onTap: () => context.push('/register'),
                  child: const Text(
                    'Sign up',
                    style: TextStyle(
                      color: Color(0xFF2563EB),
                      fontWeight: FontWeight.bold,
                      fontSize: 14,
                    ),
                  ),
                ),
              ],
            ),

            // Footer
            Padding(
              padding: const EdgeInsets.only(top: 48),
              child: RichText(
                textAlign: TextAlign.center,
                text: const TextSpan(
                  style: TextStyle(
                    color: Color(0xFF64748B),
                    fontSize: 12,
                    height: 1.6,
                  ),
                  children: [
                    TextSpan(text: 'By signing in, you agree to our '),
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
              ),
            ),
          ],
        ),
      ),
    );
  }
}
