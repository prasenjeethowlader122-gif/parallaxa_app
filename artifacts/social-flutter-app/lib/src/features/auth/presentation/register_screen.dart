import 'dart:async';
import 'package:dio/dio.dart';
import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:material_symbols_icons/symbols.dart';
import 'package:go_router/go_router.dart';
import 'package:flutter_svg/flutter_svg.dart';
import 'package:intl/intl.dart';
import '../data/auth_repository.dart';
import '../../../core/api_client.dart';
import '../../../core/processing_provider.dart';
import '../../../core/localization_provider.dart';
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
  final _dateOfBirthController = TextEditingController();
  final _passwordController = TextEditingController();

  int _step = 0;
  final int _totalSteps = 5;
  bool _isLoading = false;
  bool _showPassword = false;
  bool _acceptTerms = false;

  bool? _usernameAvailable;
  bool _checkingUsername = false;
  List<String> _usernameSuggestions = [];

  Timer? _usernameDebounce;

  Map<String, String> _errors = {};

  final List<Map<String, String>> _stepInfo = [
    {"title": "Who are you?", "subtitle": "Let's start with your full name"},
    {"title": "Your birthday", "subtitle": "You must be at least 18 years old"},
    {"title": "Contact info", "subtitle": "Enter your email address"},
    {"title": "Secure it", "subtitle": "Create a strong password"},
    {
      "title": "Username",
      "subtitle": "Pick a unique username for your profile",
    },
  ];

  @override
  void dispose() {
    _displayNameController.dispose();
    _usernameController.dispose();
    _emailController.dispose();
    _dateOfBirthController.dispose();
    _passwordController.dispose();
    _usernameDebounce?.cancel();
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
          final dob = DateFormat(
            'yyyy-MM-dd',
          ).parse(_dateOfBirthController.text.trim());
          final now = DateTime.now();
          int age = now.year - dob.year;
          if (now.month < dob.month ||
              (now.month == dob.month && now.day < dob.day)) {
            age--;
          }
          if (age < 18) {
            newErrors['dateOfBirth'] = "You must be at least 18 years old";
          }
        } catch (_) {
          newErrors['dateOfBirth'] = "Invalid date format";
        }
      }
    } else if (_step == 2) {
      if (_emailController.text.trim().isEmpty) {
        newErrors['email'] = "Email address is required";
      } else if (!RegExp(
        r'^[^\s@]+@[^\s@]+\.[^\s@]+$',
      ).hasMatch(_emailController.text.trim())) {
        newErrors['email'] = "Please enter a valid email address";
      }
    } else if (_step == 3) {
      if (_passwordController.text.isEmpty) {
        newErrors['password'] = "Password is required";
      } else if (_passwordController.text.length < 6) {
        newErrors['password'] = "Password must be at least 6 characters";
      }
    } else if (_step == 4) {
      if (_usernameController.text.trim().isEmpty) {
        newErrors['username'] = "Username is required";
      } else if (_usernameController.text.trim().length < 3) {
        newErrors['username'] = "Username must be at least 3 characters";
      } else if (_usernameAvailable == false) {
        newErrors['username'] = "This username is not available";
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
      setState(() {
        _step++;
        _errors = {};
      });
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

  void _onUsernameChanged(String value) {
    setState(() {
      _errors.remove('username');
      _usernameAvailable = null;
      _usernameSuggestions = [];
    });

    _usernameDebounce?.cancel();
    if (value.trim().length < 3) return;

    _usernameDebounce = Timer(const Duration(milliseconds: 500), () {
      _checkUsernameAvailability(value);
    });
  }

  Future<void> _checkUsernameAvailability(String username) async {
    if (!mounted) return;
    setState(() {
      _checkingUsername = true;
      _usernameAvailable = null;
      _usernameSuggestions = [];
    });

    try {
      final authRepo = ref.read(authRepositoryProvider);
      final available = await authRepo.checkUsername(
        username.trim().toLowerCase(),
      );
      if (!mounted) return;

      setState(() => _usernameAvailable = available);

      if (!available) {
        final suggestions = await authRepo.suggestUsernames(
          username.trim().toLowerCase(),
        );
        if (mounted) setState(() => _usernameSuggestions = suggestions);
      }
    } catch (_) {
      if (mounted) setState(() => _usernameAvailable = null);
    } finally {
      if (mounted) setState(() => _checkingUsername = false);
    }
  }

  Future<void> _handleRegister() async {
    if (!_validateStep()) return;

    final l10n = ref.read(l10nProvider);
    ref.read(processingProvider.notifier).show(l10n.get('create_account'));
    setState(() => _isLoading = true);
    try {
      final authRepo = ref.read(authRepositoryProvider);
      final response = await authRepo.register(
        username: _usernameController.text.trim().toLowerCase(),
        displayName: _displayNameController.text.trim(),
        email: _emailController.text.trim().toLowerCase(),
        password: _passwordController.text,
        dateOfBirth: DateFormat(
          'yyyy-MM-dd',
        ).parse(_dateOfBirthController.text.trim()),
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
      if (mounted) {
        String errorMessage = "Registration failed. Please try again.";
        if (e is DioException) {
          errorMessage =
              e.response?.data['message'] ??
              e.response?.data['error'] ??
              errorMessage;
        } else if (e.toString().contains('409')) {
          errorMessage = "Username or email already taken";
        }
        setState(() {
          _errors = {'general': errorMessage};
        });
      }
    } finally {
      ref.read(processingProvider.notifier).hide();
      if (mounted) setState(() => _isLoading = false);
    }
  }

  Future<void> _pickDateOfBirth() async {
    final now = DateTime.now();
    final eighteenYearsAgo = DateTime(now.year - 18, now.month, now.day);
    final theme = Theme.of(context);

    final picked = await showDatePicker(
      context: context,
      initialDate: eighteenYearsAgo,
      firstDate: DateTime(1900),
      lastDate: eighteenYearsAgo,
      builder: (context, child) {
        return Theme(
          data: theme.copyWith(
            colorScheme: theme.colorScheme.copyWith(
              primary: theme.colorScheme.primary,
              onPrimary: theme.colorScheme.onPrimary,
              surface: theme.colorScheme.surface,
              onSurface: theme.colorScheme.onSurface,
            ),
          ),
          child: child!,
        );
      },
    );

    if (picked != null && mounted) {
      setState(() {
        _dateOfBirthController.text = DateFormat('yyyy-MM-dd').format(picked);
        _errors.remove('dateOfBirth');
      });
    }
  }

  Widget _renderStep(L10n l10n, ThemeData theme) {
    if (_step == 0) {
      return FloatingLabelInput(
        key: const ValueKey(0),
        label: l10n.get('display_name'),
        icon: Symbols.person,
        controller: _displayNameController,
        error: _errors['displayName'],
        textCapitalization: TextCapitalization.words,
        textInputAction: TextInputAction.next,
        editable: !_isLoading,
        onChanged: (_) => setState(() => _errors.remove('displayName')),
        onFieldSubmitted: (_) => _goNext(),
      );
    } else if (_step == 1) {
      return Column(
        key: const ValueKey(1),
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          GestureDetector(
            onTap: _isLoading ? null : _pickDateOfBirth,
            child: AbsorbPointer(
              child: FloatingLabelInput(
                label: l10n.get('birthday'),
                icon: Symbols.calendar_today,
                controller: _dateOfBirthController,
                error: _errors['dateOfBirth'],
                keyboardType: TextInputType.none,
                editable: false,
              ),
            ),
          ),
          if (_dateOfBirthController.text.isEmpty)
            Padding(
              padding: const EdgeInsets.only(left: 4, bottom: 4),
              child: Text(
                "Tap the field above to open the date picker",
                style: TextStyle(
                  fontSize: 12,
                  color: theme.colorScheme.onSurfaceVariant,
                  fontWeight: FontWeight.w500,
                ),
              ),
            ),
          const SizedBox(height: 8),
          Padding(
            padding: const EdgeInsets.only(left: 4),
            child: Text(
              "This will not be shown publicly. You must be at least 18.",
              style: TextStyle(
                fontSize: 12,
                color: theme.colorScheme.onSurfaceVariant,
                fontWeight: FontWeight.w500,
              ),
            ),
          ),
        ],
      );
    } else if (_step == 2) {
      return FloatingLabelInput(
        key: const ValueKey(2),
        label: l10n.get('email'),
        icon: Symbols.mail,
        controller: _emailController,
        error: _errors['email'],
        keyboardType: TextInputType.emailAddress,
        textInputAction: TextInputAction.next,
        editable: !_isLoading,
        onChanged: (_) => setState(() => _errors.remove('email')),
        onFieldSubmitted: (_) => _goNext(),
      );
    } else if (_step == 3) {
      return FloatingLabelInput(
        key: const ValueKey(3),
        label: l10n.get('password'),
        icon: Symbols.lock,
        controller: _passwordController,
        error: _errors['password'],
        secureTextEntry: !_showPassword,
        textInputAction: TextInputAction.next,
        editable: !_isLoading,
        onChanged: (_) => setState(() => _errors.remove('password')),
        onFieldSubmitted: (_) => _goNext(),
        right: IconButton(
          onPressed: () => setState(() => _showPassword = !_showPassword),
          icon: Icon(
            _showPassword ? Symbols.visibility_off : Symbols.visibility,
            color: _errors['password'] != null
                ? theme.colorScheme.error
                : theme.colorScheme.onSurfaceVariant,
            size: 20,
          ),
          padding: EdgeInsets.zero,
          constraints: const BoxConstraints(),
        ),
      );
    } else {
      return Column(
        key: const ValueKey(4),
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          FloatingLabelInput(
            label: l10n.get('username'),
            icon: Symbols.account_circle,
            controller: _usernameController,
            error: _errors['username'],
            textInputAction: TextInputAction.done,
            editable: !_isLoading,
            onChanged: _onUsernameChanged,
            onFieldSubmitted: (_) => _handleRegister(),
            right: _checkingUsername
                ? SizedBox(
                    width: 18,
                    height: 18,
                    child: CircularProgressIndicator(
                      strokeWidth: 2,
                      color: theme.colorScheme.onSurfaceVariant,
                    ),
                  )
                : _usernameAvailable == null
                ? null
                : Icon(
                    _usernameAvailable! ? Symbols.check_circle : Symbols.cancel,
                    color: _usernameAvailable!
                        ? Colors.green
                        : theme.colorScheme.error,
                    size: 20,
                  ),
          ),
          if (_usernameAvailable != null && !_checkingUsername)
            Padding(
              padding: const EdgeInsets.only(left: 4, bottom: 8),
              child: Text(
                _usernameAvailable!
                    ? "✓ Username is available"
                    : "✗ Username is taken",
                style: TextStyle(
                  fontSize: 12,
                  color: _usernameAvailable!
                      ? Colors.green
                      : theme.colorScheme.error,
                  fontWeight: FontWeight.w600,
                ),
              ),
            ),
          if (_usernameSuggestions.isNotEmpty) ...[
            Padding(
              padding: const EdgeInsets.only(left: 4, bottom: 8),
              child: Text(
                "Try one of these instead:",
                style: TextStyle(
                  fontSize: 12,
                  color: theme.colorScheme.onSurfaceVariant,
                  fontWeight: FontWeight.w500,
                ),
              ),
            ),
            Wrap(
              spacing: 8,
              runSpacing: 8,
              children: _usernameSuggestions
                  .map(
                    (s) => GestureDetector(
                      onTap: () {
                        _usernameController.text = s;
                        _usernameDebounce?.cancel();
                        setState(() {
                          _usernameAvailable = true;
                          _usernameSuggestions = [];
                          _errors.remove('username');
                        });
                      },
                      child: Container(
                        padding: const EdgeInsets.symmetric(
                          horizontal: 12,
                          vertical: 6,
                        ),
                        decoration: BoxDecoration(
                          border: Border.all(
                            color: theme.colorScheme.outline,
                            width: 1.5,
                          ),
                          borderRadius: BorderRadius.circular(20),
                        ),
                        child: Text(
                          '@$s',
                          style: TextStyle(
                            fontSize: 14,
                            color: theme.colorScheme.primary,
                            fontWeight: FontWeight.w700,
                          ),
                        ),
                      ),
                    ),
                  )
                  .toList(),
            ),
            const SizedBox(height: 16),
          ],
        ],
      );
    }
  }

  @override
  Widget build(BuildContext context) {
    final l10n = ref.watch(l10nProvider);
    final theme = Theme.of(context);
    final isLastStep = _step == _totalSteps - 1;
    final screenWidth = MediaQuery.of(context).size.width;

    return Scaffold(
      backgroundColor: theme.scaffoldBackgroundColor,
      body: SafeArea(
        child: SingleChildScrollView(
          padding: const EdgeInsets.symmetric(horizontal: 24),
          keyboardDismissBehavior: ScrollViewKeyboardDismissBehavior.onDrag,
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.stretch,
            children: [
              const SizedBox(height: 16),

              // Logo
              Center(
                child: SvgPicture.asset(
                  'assets/images/parallaxa-logo.svg',
                  width: (screenWidth - 120).clamp(100.0, 160.0),
                  height: 48,
                  fit: BoxFit.contain,
                  colorFilter: ColorFilter.mode(
                    theme.colorScheme.primary,
                    BlendMode.srcIn,
                  ),
                ),
              ),
              const SizedBox(height: 24),

              // Top Bar
              Row(
                children: [
                  GestureDetector(
                    onTap: _goBack,
                    child: Container(
                      width: 40,
                      height: 40,
                      decoration: BoxDecoration(
                        color: theme.colorScheme.surfaceContainer,
                        shape: BoxShape.circle,
                      ),
                      child: Center(
                        child: Icon(
                          Symbols.arrow_back,
                          color: theme.colorScheme.onSurface,
                          size: 20,
                        ),
                      ),
                    ),
                  ),
                  Expanded(
                    child: Row(
                      mainAxisAlignment: MainAxisAlignment.center,
                      children: List.generate(_totalSteps, (index) {
                        final isActive = index == _step;
                        final isDone = index < _step;
                        return AnimatedContainer(
                          duration: const Duration(milliseconds: 250),
                          curve: Curves.easeInOut,
                          width: isActive ? 24 : 8,
                          height: 8,
                          margin: const EdgeInsets.symmetric(horizontal: 3),
                          decoration: BoxDecoration(
                            color: isDone || isActive
                                ? theme.colorScheme.onSurface
                                : theme.colorScheme.outline.withValues(
                                    alpha: 0.3,
                                  ),
                            borderRadius: BorderRadius.circular(4),
                          ),
                        );
                      }),
                    ),
                  ),
                  const SizedBox(width: 40),
                ],
              ),
              const SizedBox(height: 32),

              // Step heading
              Text(
                'Step ${_step + 1} of $_totalSteps',
                style: TextStyle(
                  fontSize: 11,
                  fontWeight: FontWeight.w800,
                  color: theme.colorScheme.onSurfaceVariant.withValues(
                    alpha: 0.6,
                  ),
                  letterSpacing: 1.4,
                ),
              ),
              const SizedBox(height: 6),
              Text(
                _stepInfo[_step]['title']!,
                style: TextStyle(
                  fontSize: 28,
                  fontWeight: FontWeight.w800,
                  color: theme.colorScheme.onSurface,
                  letterSpacing: -0.5,
                ),
              ),
              const SizedBox(height: 6),
              Text(
                _stepInfo[_step]['subtitle']!,
                style: TextStyle(
                  fontSize: 15,
                  color: theme.colorScheme.onSurfaceVariant,
                  fontWeight: FontWeight.w500,
                ),
              ),
              const SizedBox(height: 24),

              // General error alert
              if (_errors['general'] != null) ...[
                Container(
                  padding: const EdgeInsets.symmetric(
                    horizontal: 16,
                    vertical: 14,
                  ),
                  decoration: BoxDecoration(
                    color: theme.colorScheme.errorContainer.withValues(
                      alpha: 0.2,
                    ),
                    borderRadius: BorderRadius.circular(12),
                    border: Border.all(
                      color: theme.colorScheme.error.withValues(alpha: 0.5),
                    ),
                  ),
                  child: Row(
                    children: [
                      Icon(
                        Symbols.error,
                        color: theme.colorScheme.error,
                        size: 20,
                      ),
                      const SizedBox(width: 12),
                      Expanded(
                        child: Text(
                          _errors['general']!,
                          style: TextStyle(
                            color: theme.colorScheme.error,
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

              // Step content
              _renderStep(l10n, theme),

              const SizedBox(height: 8),

              // Terms checkbox
              if (isLastStep) ...[
                GestureDetector(
                  onTap: () => setState(() => _acceptTerms = !_acceptTerms),
                  child: Padding(
                    padding: const EdgeInsets.only(bottom: 20),
                    child: Row(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        AnimatedContainer(
                          duration: const Duration(milliseconds: 150),
                          width: 22,
                          height: 22,
                          decoration: BoxDecoration(
                            color: _acceptTerms
                                ? theme.colorScheme.onSurface
                                : Colors.transparent,
                            border: Border.all(
                              color: _acceptTerms
                                  ? theme.colorScheme.onSurface
                                  : theme.colorScheme.outline,
                              width: 1.5,
                            ),
                            borderRadius: BorderRadius.circular(6),
                          ),
                          child: _acceptTerms
                              ? Center(
                                  child: Icon(
                                    Symbols.check,
                                    color: theme.colorScheme.surface,
                                    size: 14,
                                  ),
                                )
                              : null,
                        ),
                        const SizedBox(width: 12),
                        Expanded(
                          child: Text.rich(
                            TextSpan(
                              text: 'I agree to the ',
                              children: [
                                TextSpan(
                                  text: 'Terms of Service',
                                  style: TextStyle(
                                    color: theme.colorScheme.primary,
                                    fontWeight: FontWeight.w700,
                                  ),
                                ),
                                const TextSpan(text: ' and '),
                                TextSpan(
                                  text: 'Privacy Policy',
                                  style: TextStyle(
                                    color: theme.colorScheme.primary,
                                    fontWeight: FontWeight.w700,
                                  ),
                                ),
                                const TextSpan(text: '.'),
                              ],
                            ),
                            style: TextStyle(
                              color: theme.colorScheme.onSurfaceVariant,
                              fontSize: 14,
                              height: 1.4,
                              fontWeight: FontWeight.w500,
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
                height: 54,
                child: ElevatedButton(
                  onPressed: (_isLoading || (isLastStep && !_acceptTerms))
                      ? null
                      : (isLastStep ? _handleRegister : _goNext),
                  style: ElevatedButton.styleFrom(
                    backgroundColor: theme.colorScheme.onSurface,
                    foregroundColor: theme.colorScheme.surface,
                    shape: RoundedRectangleBorder(
                      borderRadius: BorderRadius.circular(27),
                    ),
                    elevation: 0,
                  ),
                  child: _isLoading
                      ? SizedBox(
                          height: 22,
                          width: 22,
                          child: CircularProgressIndicator(
                            color: theme.colorScheme.surface,
                            strokeWidth: 2.5,
                          ),
                        )
                      : Row(
                          mainAxisAlignment: MainAxisAlignment.center,
                          children: [
                            Text(
                              isLastStep
                                  ? l10n.get('create_account')
                                  : l10n.get('continue'),
                              style: const TextStyle(
                                fontSize: 16,
                                fontWeight: FontWeight.w800,
                              ),
                            ),
                            if (!isLastStep) ...[
                              const SizedBox(width: 8),
                              const Icon(Symbols.arrow_forward, size: 18),
                            ],
                          ],
                        ),
                ),
              ),

              if (_step == 0) ...[
                Padding(
                  padding: const EdgeInsets.symmetric(vertical: 20),
                  child: Row(
                    children: [
                      Expanded(
                        child: Container(height: 1, color: theme.dividerColor),
                      ),
                      Padding(
                        padding: const EdgeInsets.symmetric(horizontal: 12),
                        child: Text(
                          'OR',
                          style: TextStyle(
                            color: theme.colorScheme.onSurfaceVariant
                                .withValues(alpha: 0.5),
                            fontSize: 11,
                            fontWeight: FontWeight.w700,
                            letterSpacing: 1,
                          ),
                        ),
                      ),
                      Expanded(
                        child: Container(height: 1, color: theme.dividerColor),
                      ),
                    ],
                  ),
                ),
                Row(
                  mainAxisAlignment: MainAxisAlignment.center,
                  children: [
                    Text(
                      "${l10n.get('already_have_account')} ",
                      style: TextStyle(
                        color: theme.colorScheme.onSurfaceVariant,
                        fontSize: 14,
                        fontWeight: FontWeight.w500,
                      ),
                    ),
                    GestureDetector(
                      onTap: () => context.pop(),
                      child: Text(
                        l10n.get('sign_in'),
                        style: TextStyle(
                          color: theme.colorScheme.primary,
                          fontWeight: FontWeight.w800,
                          fontSize: 14,
                        ),
                      ),
                    ),
                  ],
                ),
              ],

              if (isLastStep) ...[
                const SizedBox(height: 20),
                Text.rich(
                  TextSpan(
                    text: 'By creating an account, you agree to our ',
                    children: [
                      TextSpan(
                        text: 'Terms of Service',
                        style: TextStyle(
                          color: theme.colorScheme.primary,
                          fontWeight: FontWeight.w700,
                        ),
                      ),
                      const TextSpan(text: ' and '),
                      TextSpan(
                        text: 'Privacy Policy',
                        style: TextStyle(
                          color: theme.colorScheme.primary,
                          fontWeight: FontWeight.w700,
                        ),
                      ),
                      const TextSpan(text: '.'),
                    ],
                  ),
                  textAlign: TextAlign.center,
                  style: TextStyle(
                    color: theme.colorScheme.onSurfaceVariant.withValues(
                      alpha: 0.6,
                    ),
                    fontSize: 12,
                    height: 1.5,
                    fontWeight: FontWeight.w500,
                  ),
                ),
              ],

              const SizedBox(height: 32),
            ],
          ),
        ),
      ),
    );
  }
}
