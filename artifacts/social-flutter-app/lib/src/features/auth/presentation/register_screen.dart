import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import 'package:flutter_svg/flutter_svg.dart';
import 'package:intl/intl.dart';
import '../data/auth_repository.dart';
import '../../../core/api_client.dart';
import '../../../core/app_colors.dart';
import 'widgets/floating_label_input.dart';

class RegisterScreen extends ConsumerStatefulWidget {
  const RegisterScreen({super.key});

  @override
  ConsumerState<RegisterScreen> createState() => _RegisterScreenState();
}

class _RegisterScreenState extends ConsumerState<RegisterScreen> {
  final _displayNameController = TextEditingController();
  final _usernameController = TextEditingController();
  final _emailController = TextEditingController();
  final _phoneNumberController = TextEditingController();
  final _dateOfBirthController = TextEditingController();
  final _passwordController = TextEditingController();
  final _confirmPasswordController = TextEditingController();

  int _step = 0;
  final int _totalSteps = 5;
  bool _usePhone = false;
  bool _isLoading = false;
  bool _showPassword = false;
  bool _showConfirmPassword = false;
  bool _acceptTerms = false;

  Map<String, String> _errors = {};

  final List<Map<String, String>> _stepInfo = [
    { "title": "Who are you?", "subtitle": "Let's start with your full name" },
    { "title": "Your birthday", "subtitle": "You must be at least 18 years old" },
    { "title": "Contact info", "subtitle": "Enter your email or phone number" },
    { "title": "Secure it", "subtitle": "Create a strong password" },
    { "title": "Username", "subtitle": "Pick a unique username for your profile" },
  ];

  @override
  void dispose() {
    _displayNameController.dispose();
    _usernameController.dispose();
    _emailController.dispose();
    _phoneNumberController.dispose();
    _dateOfBirthController.dispose();
    _passwordController.dispose();
    _confirmPasswordController.dispose();
    super.dispose();
  }

  bool _validateStep() {
    final Map<String, String> newErrors = {};

    if (_step == 0) {
      if (_displayNameController.text.trim().isEmpty) {
        newErrors['displayName'] = "Full name is required";
      } else if (_displayNameController.text.trim().length < 2) {
        newErrors['displayName'] = "Name must be at least 2 characters";
      }
    } else if (_step == 1) {
      if (_dateOfBirthController.text.trim().isEmpty) {
        newErrors['dateOfBirth'] = "Date of birth is required";
      } else {
        try {
          final dob = DateFormat('yyyy-MM-dd').parse(_dateOfBirthController.text.trim());
          final age = DateTime.now().year - dob.year;
          if (age < 18) {
            newErrors['dateOfBirth'] = "You must be at least 18 years old";
          }
        } catch (e) {
          newErrors['dateOfBirth'] = "Invalid date format (YYYY-MM-DD)";
        }
      }
    } else if (_step == 2) {
      if (_usePhone) {
        if (_phoneNumberController.text.trim().isEmpty) {
          newErrors['phoneNumber'] = "Phone number is required";
        }
      } else {
        if (_emailController.text.trim().isEmpty) {
          newErrors['email'] = "Email address is required";
        } else if (!RegExp(r'^[^\s@]+@[^\s@]+\.[^\s@]+$').hasMatch(_emailController.text.trim())) {
          newErrors['email'] = "Please enter a valid email address";
        }
      }
    } else if (_step == 3) {
      if (_passwordController.text.isEmpty) {
        newErrors['password'] = "Password is required";
      } else if (_passwordController.text.length < 6) {
        newErrors['password'] = "Password must be at least 6 characters";
      }

      if (_confirmPasswordController.text.isEmpty) {
        newErrors['confirmPassword'] = "Please confirm your password";
      } else if (_passwordController.text != _confirmPasswordController.text) {
        newErrors['confirmPassword'] = "Passwords do not match";
      }
    } else if (_step == 4) {
      if (_usernameController.text.trim().isEmpty) {
        newErrors['username'] = "Username is required";
      } else if (_usernameController.text.trim().length < 3) {
        newErrors['username'] = "Username must be at least 3 characters";
      }

      if (!_acceptTerms) {
        newErrors['general'] = "You must accept the terms to continue";
      }
    }

    setState(() => _errors = newErrors);
    return newErrors.isEmpty;
  }

  void _goNext() {
    if (!_validateStep()) return;
    if (_step < _totalSteps - 1) {
      setState(() => _step++);
    }
  }

  void _goBack() {
    if (_step > 0) {
      setState(() {
        _step--;
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
        username: _usernameController.text.trim().toLowerCase(),
        displayName: _displayNameController.text.trim(),
        email: _usePhone ? "" : _emailController.text.trim().toLowerCase(),
        password: _passwordController.text,
        dateOfBirth: DateFormat('yyyy-MM-dd').parse(_dateOfBirthController.text.trim()),
      );

      if (response.token != null) {
        final storage = ref.read(storageServiceProvider);
        await storage.setAuthToken(response.token!);
        if (response.user != null) {
          await storage.setCurrentUserId(response.user!.id);
        }
        if (mounted) context.go('/feed');
      }
    } catch (e) {
      setState(() {
        _errors = {
          'general': e.toString().contains('409')
              ? "Username or email already taken"
              : "Registration failed. Please try again.",
        };
      });
    } finally {
      if (mounted) setState(() => _isLoading = false);
    }
  }

  Widget _renderStep() {
    if (_step == 0) {
      return FloatingLabelInput(
        label: "Full Name",
        icon: Icons.person_outline_rounded,
        controller: _displayNameController,
        error: _errors['displayName'],
        textCapitalization: TextCapitalization.words,
        editable: !_isLoading,
        onChanged: (_) => setState(() => _errors.remove('displayName')),
      );
    } else if (_step == 1) {
      return Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          FloatingLabelInput(
            label: "Birthday (YYYY-MM-DD)",
            icon: Icons.calendar_today_outlined,
            controller: _dateOfBirthController,
            error: _errors['dateOfBirth'],
            keyboardType: TextInputType.datetime,
            editable: !_isLoading,
            onChanged: (_) => setState(() => _errors.remove('dateOfBirth')),
          ),
          const Padding(
            padding: EdgeInsets.only(left: 4, bottom: 16),
            child: Text(
              "This will not be shown publicly. You must be at least 18.",
              style: TextStyle(
                fontSize: 12,
                color: AppColors.slate400,
                fontFamily: 'Sora',
              ),
            ),
          ),
        ],
      );
    } else if (_step == 2) {
      return Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          if (_usePhone)
            FloatingLabelInput(
              label: "Phone Number",
              icon: Icons.phone_android_outlined,
              controller: _phoneNumberController,
              error: _errors['phoneNumber'],
              keyboardType: TextInputType.phone,
              editable: !_isLoading,
              onChanged: (_) => setState(() => _errors.remove('phoneNumber')),
            )
          else
            FloatingLabelInput(
              label: "Email Address",
              icon: Icons.mail_outline_rounded,
              controller: _emailController,
              error: _errors['email'],
              keyboardType: TextInputType.emailAddress,
              editable: !_isLoading,
              onChanged: (_) => setState(() => _errors.remove('email')),
            ),
          GestureDetector(
            onTap: () => setState(() => _usePhone = !_usePhone),
            child: Padding(
              padding: const EdgeInsets.only(left: 4, bottom: 16),
              child: Text(
                "Use ${_usePhone ? 'email' : 'phone number'} instead",
                style: const TextStyle(
                  color: Color(0xFF2563EB),
                  fontWeight: FontWeight.w600,
                  fontSize: 14,
                  fontFamily: 'Sora',
                ),
              ),
            ),
          ),
        ],
      );
    } else if (_step == 3) {
      return Column(
        children: [
          FloatingLabelInput(
            label: "Password",
            icon: Icons.lock_outline_rounded,
            controller: _passwordController,
            error: _errors['password'],
            secureTextEntry: !_showPassword,
            editable: !_isLoading,
            onChanged: (_) => setState(() => _errors.remove('password')),
            right: IconButton(
              onPressed: () => setState(() => _showPassword = !_showPassword),
              icon: Icon(
                _showPassword ? Icons.visibility_off_outlined : Icons.visibility_outlined,
                color: _errors['password'] != null ? const Color(0xFFDC2626) : AppColors.slate500,
                size: 18,
              ),
              padding: EdgeInsets.zero,
              constraints: const BoxConstraints(),
            ),
          ),
          FloatingLabelInput(
            label: "Confirm Password",
            icon: Icons.lock_outline_rounded,
            controller: _confirmPasswordController,
            error: _errors['confirmPassword'],
            secureTextEntry: !_showConfirmPassword,
            editable: !_isLoading,
            onChanged: (_) => setState(() => _errors.remove('confirmPassword')),
            right: IconButton(
              onPressed: () => setState(() => _showConfirmPassword = !_showConfirmPassword),
              icon: Icon(
                _showConfirmPassword ? Icons.visibility_off_outlined : Icons.visibility_outlined,
                color: _errors['confirmPassword'] != null ? const Color(0xFFDC2626) : AppColors.slate500,
                size: 18,
              ),
              padding: EdgeInsets.zero,
              constraints: const BoxConstraints(),
            ),
          ),
        ],
      );
    } else {
      return FloatingLabelInput(
        label: "Username",
        icon: Icons.alternate_email_rounded,
        controller: _usernameController,
        error: _errors['username'],
        editable: !_isLoading,
        onChanged: (_) => setState(() => _errors.remove('username')),
      );
    }
  }

  @override
  Widget build(BuildContext context) {
    final isLastStep = _step == _totalSteps - 1;

    return Scaffold(
      backgroundColor: Colors.white,
      body: SafeArea(
        child: SingleChildScrollView(
          padding: const EdgeInsets.symmetric(horizontal: 24),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.stretch,
            children: [
              const SizedBox(height: 16),

              // Logo
              Center(
                child: SvgPicture.asset(
                  'assets/images/text-logo-dark.svg',
                  width: 220,
                  height: 52,
                  fit: BoxFit.contain,
                ),
              ),
              const SizedBox(height: 32),

              // Top Bar (Back button and Step dots)
              Row(
                children: [
                  GestureDetector(
                    onTap: _goBack,
                    child: Container(
                      width: 40,
                      height: 40,
                      decoration: BoxDecoration(
                        color: AppColors.slate100,
                        shape: BoxShape.circle,
                      ),
                      child: const Center(
                        child: Icon(
                          Icons.arrow_back_rounded,
                          color: Color(0xFF1F2937),
                          size: 20,
                        ),
                      ),
                    ),
                  ),
                  Expanded(
                    child: Row(
                      mainAxisAlignment: MainAxisAlignment.center,
                      children: List.generate(_totalSteps, (index) {
                        return Container(
                          width: index == _step ? 24 : 8,
                          height: 8,
                          margin: const EdgeInsets.symmetric(horizontal: 4),
                          decoration: BoxDecoration(
                            color: index <= _step ? Colors.black : AppColors.slate200,
                            borderRadius: BorderRadius.circular(4),
                          ),
                        );
                      }),
                    ),
                  ),
                  const SizedBox(width: 40), // Spacer for balance
                ],
              ),
              const SizedBox(height: 40),

              // Heading
              Text(
                'Step ${_step + 1} of $_totalSteps',
                style: const TextStyle(
                  fontSize: 12,
                  fontWeight: FontWeight.bold,
                  color: AppColors.slate400,
                  letterSpacing: 1.2,
                  fontFamily: 'Sora',
                ),
              ),
              const SizedBox(height: 8),
              Text(
                _stepInfo[_step]['title']!,
                style: const TextStyle(
                  fontSize: 30,
                  fontWeight: FontWeight.bold,
                  color: AppColors.slate900,
                  fontFamily: 'Sora',
                ),
              ),
              const SizedBox(height: 8),
              Text(
                _stepInfo[_step]['subtitle']!,
                style: const TextStyle(
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

              // Step Content
              _renderStep(),

              // Terms Acceptance (Last Step)
              if (isLastStep) ...[
                GestureDetector(
                  onTap: () => setState(() => _acceptTerms = !_acceptTerms),
                  child: Padding(
                    padding: const EdgeInsets.only(bottom: 24, left: 4),
                    child: Row(
                      children: [
                        Container(
                          width: 20,
                          height: 20,
                          decoration: BoxDecoration(
                            color: _acceptTerms ? Colors.black : Colors.transparent,
                            border: Border.all(
                              color: _acceptTerms ? Colors.black : AppColors.slate300,
                            ),
                            borderRadius: BorderRadius.circular(4),
                          ),
                          child: _acceptTerms
                              ? const Center(
                                  child: Icon(
                                    Icons.check_rounded,
                                    color: Colors.white,
                                    size: 14,
                                  ),
                                )
                              : null,
                        ),
                        const SizedBox(width: 12),
                        const Expanded(
                          child: Text.rich(
                            TextSpan(
                              text: 'I agree to the ',
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
                                TextSpan(text: '.'),
                              ],
                            ),
                            style: TextStyle(
                              color: AppColors.slate600,
                              fontSize: 14,
                              fontFamily: 'Sora',
                            ),
                          ),
                        ),
                      ],
                    ),
                  ),
                ),
              ],

              // CTA Button
              SizedBox(
                height: 56,
                child: ElevatedButton(
                  onPressed: (_isLoading || (isLastStep && !_acceptTerms))
                      ? null
                      : (isLastStep ? _handleRegister : _goNext),
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
                      : Row(
                          mainAxisAlignment: MainAxisAlignment.center,
                          children: [
                            Text(
                              isLastStep ? "Create account" : "Continue",
                              style: const TextStyle(
                                fontSize: 16,
                                fontWeight: FontWeight.bold,
                                fontFamily: 'Sora',
                              ),
                            ),
                            if (!isLastStep) ...[
                              const SizedBox(width: 8),
                              const Icon(
                                Icons.arrow_forward_rounded,
                                color: Colors.white,
                                size: 18,
                              ),
                            ],
                          ],
                        ),
                ),
              ),

              // Sign In Link (Step 0)
              if (_step == 0) ...[
                Padding(
                  padding: const EdgeInsets.symmetric(vertical: 16),
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
                Row(
                  mainAxisAlignment: MainAxisAlignment.center,
                  children: [
                    const Text(
                      "Already have an account? ",
                      style: TextStyle(
                        color: AppColors.slate600,
                        fontSize: 14,
                        fontFamily: 'Sora',
                      ),
                    ),
                    GestureDetector(
                      onTap: () => context.pop(),
                      child: const Text(
                        'Sign in',
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
              ],

              // Final Terms (Last Step)
              if (isLastStep) ...[
                const SizedBox(height: 24),
                const Text.rich(
                  TextSpan(
                    text: 'By creating an account, you agree to our ',
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
              ],
              const SizedBox(height: 24),
            ],
          ),
        ),
      ),
    );
  }
}
