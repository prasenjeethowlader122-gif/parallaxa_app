import 'dart:async';
import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import 'package:flutter_svg/flutter_svg.dart';
import '../data/auth_repository.dart';
import '../../../core/api_client.dart';
import '../../../core/storage_service.dart';
import '../../../core/app_colors.dart';
import '../../../common_widgets/floating_label_input.dart';

class RegisterScreen extends ConsumerStatefulWidget {
  const RegisterScreen({super.key});

  @override
  ConsumerState<RegisterScreen> createState() => _RegisterScreenState();
}

class _RegisterScreenState extends ConsumerState<RegisterScreen> {
  final int _totalSteps = 5;
  int _currentStep = 0;

  final _displayNameController = TextEditingController();
  final _usernameController = TextEditingController();
  final _emailController = TextEditingController();
  final _phoneNumberController = TextEditingController();
  final _dobController = TextEditingController();
  final _passwordController = TextEditingController();
  final _confirmPasswordController = TextEditingController();

  bool _usePhone = false;
  bool _showPassword = false;
  bool _showConfirmPassword = false;
  bool _acceptTerms = false;
  bool _isLoading = false;
  bool _isCheckingUsername = false;

  List<String> _usernameSuggestions = [];
  Map<String, String?> _errors = {};
  Timer? _debounceTimer;

  final List<Map<String, String>> _steps = [
    {'title': "Who are you?", 'subtitle': "Let's start with your full name"},
    {'title': "Your birthday", 'subtitle': "You must be at least 18 years old"},
    {'title': "Contact info", 'subtitle': "Enter your email or phone number"},
    {'title': "Secure it", 'subtitle': "Create a strong password"},
    {'title': "Username", 'subtitle': "Pick a unique username for your profile"},
  ];

  @override
  void dispose() {
    _displayNameController.dispose();
    _usernameController.dispose();
    _emailController.dispose();
    _phoneNumberController.dispose();
    _dobController.dispose();
    _passwordController.dispose();
    _confirmPasswordController.dispose();
    _debounceTimer?.cancel();
    super.dispose();
  }

  void _onUsernameChanged(String value) {
    if (_debounceTimer?.isActive ?? false) _debounceTimer?.cancel();

    _debounceTimer = Timer(const Duration(milliseconds: 500), () async {
      if (value.trim().length >= 3) {
        setState(() => _isCheckingUsername = true);
        final authRepo = ref.read(authRepositoryProvider);
        final available = await authRepo.checkUsername(value.trim().toLowerCase());
        if (!available) {
          final suggestions = await authRepo.suggestUsernames(value.trim().toLowerCase());
          setState(() {
            _usernameSuggestions = suggestions;
            _errors['username'] = "Username is already taken";
          });
        } else {
          setState(() {
            _usernameSuggestions = [];
            _errors['username'] = null;
          });
        }
        setState(() => _isCheckingUsername = false);
      }
    });
  }

  bool _validateStep() {
    final Map<String, String?> newErrors = {};

    if (_currentStep == 0) {
      final name = _displayNameController.text.trim();
      if (name.isEmpty) newErrors['displayName'] = "Full name is required";
      else if (name.length < 2) newErrors['displayName'] = "Name must be at least 2 characters";
      else if (name.length > 50) newErrors['displayName'] = "Name must be less than 50 characters";
    }

    if (_currentStep == 1) {
      final dobStr = _dobController.text.trim();
      if (dobStr.isEmpty) {
        newErrors['dateOfBirth'] = "Date of birth is required";
      } else {
        try {
          final dob = DateTime.parse(dobStr);
          final age = DateTime.now().year - dob.year;
          if (age < 18) newErrors['dateOfBirth'] = "You must be at least 18 years old";
        } catch (e) {
          newErrors['dateOfBirth'] = "Invalid date format (YYYY-MM-DD)";
        }
      }
    }

    if (_currentStep == 2) {
      if (_usePhone) {
        final phone = _phoneNumberController.text.trim();
        if (phone.isEmpty) newErrors['phoneNumber'] = "Phone number is required";
        else if (phone.length < 8) newErrors['phoneNumber'] = "Please enter a valid phone number";
      } else {
        final email = _emailController.text.trim();
        if (email.isEmpty) newErrors['email'] = "Email address is required";
        else if (!RegExp(r'^[^\s@]+@[^\s@]+\.[^\s@]+$').hasMatch(email))
          newErrors['email'] = "Please enter a valid email address";
      }
    }

    if (_currentStep == 3) {
      final pass = _passwordController.text;
      final confirm = _confirmPasswordController.text;
      if (pass.isEmpty) newErrors['password'] = "Password is required";
      else if (pass.length < 6) newErrors['password'] = "Password must be at least 6 characters";

      if (confirm.isEmpty) newErrors['confirmPassword'] = "Please confirm your password";
      else if (pass != confirm) newErrors['confirmPassword'] = "Passwords do not match";
    }

    if (_currentStep == 4) {
      final user = _usernameController.text.trim();
      if (user.isEmpty) newErrors['username'] = "Username is required";
      else if (user.length < 3) newErrors['username'] = "Username must be at least 3 characters";
      else if (!RegExp(r'^[a-zA-Z0-9_-]+$').hasMatch(user))
        newErrors['username'] = "Letters, numbers, _ and - only";

      if (!_acceptTerms) newErrors['general'] = "You must accept the terms to continue";
    }

    setState(() => _errors = newErrors);
    return newErrors.isEmpty;
  }

  void _goNext() {
    if (_validateStep()) {
      if (_currentStep < _totalSteps - 1) {
        setState(() => _currentStep++);
      }
    }
  }

  void _goBack() {
    if (_currentStep > 0) {
      setState(() {
        _currentStep--;
        _errors = {};
      });
    } else {
      context.pop();
    }
  }

  Future<void> _handleRegister() async {
    if (!_validateStep()) return;

    setState(() => _isLoading = true);
    try {
      final authRepo = ref.read(authRepositoryProvider);
      final response = await authRepo.register(
        displayName: _displayNameController.text.trim(),
        username: _usernameController.text.trim().toLowerCase(),
        email: _usePhone ? null : _emailController.text.trim().toLowerCase(),
        phoneNumber: _usePhone ? _phoneNumberController.text.trim() : null,
        password: _passwordController.text,
        dateOfBirth: _dobController.text.trim(),
      );

      if (response.token != null && response.user != null) {
        final storage = ref.read(storageServiceProvider);
        await storage.setAuthToken(response.token!);
        await storage.setCurrentUserId(response.user!.id);
        if (mounted) context.go('/feed');
      }
    } catch (e) {
      setState(() => _errors = {'general': "Registration failed. Please try again."});
    } finally {
      if (mounted) setState(() => _isLoading = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    final topPadding = MediaQuery.of(context).padding.top + 16;
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
                padding: const EdgeInsets.only(bottom: 32),
                child: SvgPicture.asset(
                  'assets/images/text-logo-dark.svg',
                  width: 220,
                  height: 52,
                ),
              ),
            ),

            // Top bar
            Row(
              children: [
                GestureDetector(
                  onTap: _isLoading ? null : _goBack,
                  child: Container(
                    width: 40,
                    height: 40,
                    decoration: BoxDecoration(
                      color: const Color(0xFFF3F4F6),
                      borderRadius: BorderRadius.circular(20),
                    ),
                    child: const Center(
                      child: Icon(Icons.arrow_back, size: 20, color: Color(0xFF1F2937)),
                    ),
                  ),
                ),
                Expanded(
                  child: Row(
                    mainAxisAlignment: MainAxisAlignment.center,
                    children: List.generate(_totalSteps, (index) {
                      return AnimatedContainer(
                        duration: const Duration(milliseconds: 200),
                        margin: const EdgeInsets.symmetric(horizontal: 4),
                        width: index == _currentStep ? 24 : 8,
                        height: 8,
                        decoration: BoxDecoration(
                          color: index <= _currentStep ? Colors.black : const Color(0xFFE5E7EB),
                          borderRadius: BorderRadius.circular(4),
                        ),
                      );
                    }),
                  ),
                ),
                const SizedBox(width: 40), // Balanced spacer
              ],
            ),
            const SizedBox(height: 40),

            // Heading
            Text(
              'Step ${_currentStep + 1} of $_totalSteps',
              style: const TextStyle(
                fontSize: 12,
                fontWeight: FontWeight.bold,
                color: Color(0xFF9CA3AF),
                letterSpacing: 1.2,
              ),
            ),
            const SizedBox(height: 8),
            Text(
              _steps[_currentStep]['title']!,
              style: const TextStyle(
                fontSize: 30,
                fontWeight: FontWeight.bold,
                color: Color(0xFF0F172A),
                fontFamily: 'Sora',
              ),
            ),
            const SizedBox(height: 8),
            Text(
              _steps[_currentStep]['subtitle']!,
              style: const TextStyle(
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
                    const Icon(Icons.error_outline, size: 20, color: Color(0xFF111111)),
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

            // Step Fields
            _buildStepFields(),

            const SizedBox(height: 16),

            // Terms Acceptance (Last Step)
            if (_currentStep == 4)
              Padding(
                padding: const EdgeInsets.only(bottom: 24),
                child: GestureDetector(
                  onTap: () => setState(() => _acceptTerms = !_acceptTerms),
                  child: Row(
                    children: [
                      Container(
                        width: 20,
                        height: 20,
                        decoration: BoxDecoration(
                          color: _acceptTerms ? Colors.black : Colors.transparent,
                          border: Border.all(color: _acceptTerms ? Colors.black : const Color(0xFFCBD5E1)),
                          borderRadius: BorderRadius.circular(4),
                        ),
                        child: _acceptTerms
                            ? const Center(child: Icon(Icons.check, size: 14, color: Colors.white))
                            : null,
                      ),
                      const SizedBox(width: 12),
                      const Expanded(
                        child: Text.rich(
                          TextSpan(
                            style: TextStyle(color: Color(0xFF475569), fontSize: 14),
                            children: [
                              TextSpan(text: 'I agree to the '),
                              TextSpan(text: 'Terms of Service', style: TextStyle(color: Color(0xFF2563EB), fontWeight: FontWeight.bold)),
                              TextSpan(text: ' and '),
                              TextSpan(text: 'Privacy Policy', style: TextStyle(color: Color(0xFF2563EB), fontWeight: FontWeight.bold)),
                              TextSpan(text: '.'),
                            ],
                          ),
                        ),
                      ),
                    ],
                  ),
                ),
              ),

            // CTA Button
            SizedBox(
              height: 56,
              child: ElevatedButton(
                onPressed: _isLoading || (_currentStep == 4 && !_acceptTerms) ? null : (_currentStep == 4 ? _handleRegister : _goNext),
                style: ElevatedButton.styleFrom(
                  backgroundColor: (_currentStep == 4 && !_acceptTerms) || _isLoading ? const Color(0xFFE5E7EB) : Colors.black,
                  foregroundColor: Colors.white,
                  shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(28)),
                  elevation: 0,
                ),
                child: _isLoading
                    ? const SizedBox(height: 20, width: 20, child: CircularProgressIndicator(strokeWidth: 2, color: Colors.white))
                    : Row(
                        mainAxisAlignment: MainAxisAlignment.center,
                        children: [
                          Text(
                            _currentStep == 4 ? "Create account" : "Continue",
                            style: const TextStyle(fontSize: 16, fontWeight: FontWeight.bold),
                          ),
                          if (_currentStep < 4) ...[
                            const SizedBox(width: 8),
                            const Icon(Icons.arrow_forward, size: 18, color: Colors.white),
                          ]
                        ],
                      ),
              ),
            ),

            // Divider & sign in (Step 0)
            if (_currentStep == 0) ...[
              Padding(
                padding: const EdgeInsets.symmetric(vertical: 24),
                child: Row(
                  children: [
                    Expanded(child: Container(height: 1, color: const Color(0xFFE2E8F0))),
                    const Padding(
                      padding: EdgeInsets.symmetric(horizontal: 12),
                      child: Text('OR', style: TextStyle(color: Color(0xFF64748B), fontSize: 12, fontWeight: FontWeight.w500)),
                    ),
                    Expanded(child: Container(height: 1, color: const Color(0xFFE2E8F0))),
                  ],
                ),
              ),
              Row(
                mainAxisAlignment: MainAxisAlignment.center,
                children: [
                  const Text("Already have an account? ", style: TextStyle(color: Color(0xFF475569), fontSize: 14)),
                  GestureDetector(
                    onTap: () => context.pop(),
                    child: const Text('Sign in', style: TextStyle(color: Color(0xFF2563EB), fontWeight: FontWeight.bold, fontSize: 14)),
                  ),
                ],
              ),
            ],

            // Terms (last step)
            if (_currentStep == 4)
              Padding(
                padding: const EdgeInsets.only(top: 24),
                child: RichText(
                  textAlign: TextAlign.center,
                  text: const TextSpan(
                    style: TextStyle(color: Color(0xFF64748B), fontSize: 12, height: 1.6),
                    children: [
                      TextSpan(text: 'By creating an account, you agree to our '),
                      TextSpan(text: 'Terms of Service', style: TextStyle(color: Color(0xFF2563EB), fontWeight: FontWeight.w600)),
                      TextSpan(text: ' and '),
                      TextSpan(text: 'Privacy Policy', style: TextStyle(color: Color(0xFF2563EB), fontWeight: FontWeight.w600)),
                      TextSpan(text: ', including '),
                      TextSpan(text: 'Cookie Use', style: TextStyle(color: Color(0xFF2563EB), fontWeight: FontWeight.w600)),
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

  Widget _buildStepFields() {
    switch (_currentStep) {
      case 0:
        return FloatingLabelInput(
          label: "Full Name",
          icon: Icons.person_outline,
          value: _displayNameController.text,
          onChanged: (v) => _displayNameController.text = v,
          error: _errors['displayName'],
          textCapitalization: TextCapitalization.words,
          editable: !_isLoading,
        );
      case 1:
        return Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            FloatingLabelInput(
              label: "Birthday (YYYY-MM-DD)",
              icon: Icons.calendar_today_outlined,
              value: _dobController.text,
              onChanged: (v) => _dobController.text = v,
              error: _errors['dateOfBirth'],
              keyboardType: TextInputType.datetime,
              editable: !_isLoading,
            ),
            const SizedBox(height: 4),
            const Text(
              "This will not be shown publicly. You must be at least 18.",
              style: TextStyle(color: Color(0xFF94A3B8), fontSize: 12),
            ),
            const SizedBox(height: 16),
          ],
        );
      case 2:
        return Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            if (_usePhone)
              FloatingLabelInput(
                label: "Phone Number",
                icon: Icons.phone_android_outlined,
                value: _phoneNumberController.text,
                onChanged: (v) => _phoneNumberController.text = v,
                error: _errors['phoneNumber'],
                keyboardType: TextInputType.phone,
                editable: !_isLoading,
              )
            else
              FloatingLabelInput(
                label: "Email Address",
                icon: Icons.email_outlined,
                value: _emailController.text,
                onChanged: (v) => _emailController.text = v,
                error: _errors['email'],
                keyboardType: TextInputType.emailAddress,
                editable: !_isLoading,
              ),
            const SizedBox(height: 8),
            GestureDetector(
              onTap: () => setState(() => _usePhone = !_usePhone),
              child: Text(
                "Use ${_usePhone ? "email" : "phone number"} instead",
                style: const TextStyle(color: Color(0xFF2563EB), fontWeight: FontWeight.w600, fontSize: 14),
              ),
            ),
            const SizedBox(height: 16),
          ],
        );
      case 3:
        return Column(
          children: [
            FloatingLabelInput(
              label: "Password",
              icon: Icons.lock_outline,
              value: _passwordController.text,
              onChanged: (v) => _passwordController.text = v,
              error: _errors['password'],
              secureTextEntry: !_showPassword,
              editable: !_isLoading,
              right: IconButton(
                onPressed: () => setState(() => _showPassword = !_showPassword),
                icon: Icon(
                  _showPassword ? Icons.visibility_off_outlined : Icons.visibility_outlined,
                  size: 18,
                  color: _errors['password'] != null ? const Color(0xFFDC2626) : const Color(0xFF6B7280),
                ),
              ),
            ),
            const SizedBox(height: 12),
            FloatingLabelInput(
              label: "Confirm Password",
              icon: Icons.lock_outline,
              value: _confirmPasswordController.text,
              onChanged: (v) => _confirmPasswordController.text = v,
              error: _errors['confirmPassword'],
              secureTextEntry: !_showConfirmPassword,
              editable: !_isLoading,
              right: IconButton(
                onPressed: () => setState(() => _showConfirmPassword = !_showConfirmPassword),
                icon: Icon(
                  _showConfirmPassword ? Icons.visibility_off_outlined : Icons.visibility_outlined,
                  size: 18,
                  color: _errors['confirmPassword'] != null ? const Color(0xFFDC2626) : const Color(0xFF6B7280),
                ),
              ),
            ),
          ],
        );
      case 4:
        return Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            FloatingLabelInput(
              label: "Username",
              icon: Icons.alternate_email,
              value: _usernameController.text,
              onChanged: _onUsernameChanged,
              error: _errors['username'],
              editable: !_isLoading,
              right: _isCheckingUsername ? const SizedBox(height: 16, width: 16, child: CircularProgressIndicator(strokeWidth: 2)) : null,
            ),
            if (_usernameSuggestions.isNotEmpty) ...[
              const SizedBox(height: 12),
              Text(
                _errors['username'] != null ? "Username taken. Try these:" : "Suggested for you:",
                style: const TextStyle(color: Color(0xFF64748B), fontSize: 12),
              ),
              const SizedBox(height: 8),
              Wrap(
                spacing: 8,
                runSpacing: 8,
                children: _usernameSuggestions.map((s) => GestureDetector(
                  onTap: () {
                    _usernameController.text = s;
                    setState(() {
                      _usernameSuggestions = [];
                      _errors['username'] = null;
                    });
                  },
                  child: Container(
                    padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 6),
                    decoration: BoxDecoration(color: const Color(0xFFF1F5F9), borderRadius: BorderRadius.circular(16)),
                    child: Text("@$s", style: const TextStyle(color: Color(0xFF2563EB), fontSize: 12, fontWeight: FontWeight.bold)),
                  ),
                )).toList(),
              ),
            ],
            const SizedBox(height: 16),
          ],
        );
      default:
        return const SizedBox.shrink();
    }
  }
}
