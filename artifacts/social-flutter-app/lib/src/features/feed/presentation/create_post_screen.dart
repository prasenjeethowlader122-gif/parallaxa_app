import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import "package:material_symbols_icons/material_symbols_icons.dart";
import 'package:flutter/services.dart';
import 'package:image_picker/image_picker.dart';
import 'package:pro_image_editor/pro_image_editor.dart';
import 'dart:io';
import 'dart:math' as math;
import '../data/post_repository.dart';
import '../domain/post.dart';
import '../../auth/data/auth_repository.dart';
import '../../../core/app_colors.dart';
import '../../../core/api_client.dart';
import '../../profile/presentation/widgets/user_avatar.dart';

// ─── Highlights Controller ──────────────────────────────────────────────────
class HighlightsEditingController extends TextEditingController {
  @override
  TextSpan buildTextSpan({
    required BuildContext context,
    TextStyle? style,
    required bool withComposing,
  }) {
    final List<InlineSpan> children = [];
    final pattern = RegExp(r'((?:@|#)\w+|https?://[^\s]+)');

    text.splitMapJoin(
      pattern,
      onMatch: (m) {
        children.add(
          TextSpan(
            text: m.group(0),
            style: style?.copyWith(color: const Color(0xFF1D9BF0)),
          ),
        );
        return '';
      },
      onNonMatch: (s) {
        children.add(TextSpan(text: s, style: style));
        return '';
      },
    );

    return TextSpan(children: children, style: style);
  }
}

class CreatePostScreen extends ConsumerStatefulWidget {
  const CreatePostScreen({super.key});

  @override
  ConsumerState<CreatePostScreen> createState() => _CreatePostScreenState();
}

class _CreatePostScreenState extends ConsumerState<CreatePostScreen> {
  final _contentController = HighlightsEditingController();
  File? _selectedImage;
  bool _isPosting = false;
  final _picker = ImagePicker();
  String _location = '';
  final int _charLimit = 280;
  String? _mentionKeyword;

  @override
  void initState() {
    super.initState();
    _contentController.addListener(_onTextChanged);
  }

  @override
  void dispose() {
    _contentController.removeListener(_onTextChanged);
    _contentController.dispose();
    super.dispose();
  }

  void _onTextChanged() {
    final text = _contentController.text;
    final selection = _contentController.selection;
    if (!selection.isCollapsed || selection.baseOffset <= 0) {
      if (_mentionKeyword != null) setState(() => _mentionKeyword = null);
      return;
    }
    final textBeforeCursor = text.substring(0, selection.baseOffset);
    final match = RegExp(r'@(\w*)$').firstMatch(textBeforeCursor);
    if (match != null) {
      setState(() => _mentionKeyword = match.group(1));
    } else {
      if (_mentionKeyword != null) setState(() => _mentionKeyword = null);
    }
  }

  void _onSuggestionSelect(String username) {
    final text = _contentController.text;
    final selection = _contentController.selection;
    final textBeforeCursor = text.substring(0, selection.baseOffset);
    final textAfterCursor = text.substring(selection.baseOffset);
    final newTextBefore = textBeforeCursor.replaceFirst(RegExp(r'@\w*$'), '@$username ');
    _contentController.value = TextEditingValue(
      text: newTextBefore + textAfterCursor,
      selection: TextSelection.collapsed(offset: newTextBefore.length),
    );
    setState(() => _mentionKeyword = null);
  }

  Future<void> _pickImage() async {
    final picked = await _picker.pickImage(source: ImageSource.gallery, imageQuality: 85);
    if (picked != null && mounted) {
      setState(() => _selectedImage = File(picked.path));
      _editImage();
    }
  }

  Future<void> _editImage() async {
    if (_selectedImage == null) return;
    await Navigator.push(
      context,
      MaterialPageRoute(
        builder: (context) => ProImageEditor.file(
          _selectedImage!,
          callbacks: ProImageEditorCallbacks(
            onImageEditingComplete: (Uint8List bytes) async {
              final tempDir = Directory.systemTemp;
              final file = await File('${tempDir.path}/edited_${DateTime.now().millisecondsSinceEpoch}.png').create();
              await file.writeAsBytes(bytes);
              setState(() => _selectedImage = file);
              if (context.mounted) Navigator.pop(context);
            },
          ),
        ),
      ),
    );
  }

  Future<void> _submitPost() async {
    final content = _contentController.text.trim();
    if (content.isEmpty && _selectedImage == null) return;
    setState(() => _isPosting = true);
    try {
      final repo = ref.read(postRepositoryProvider);
      final hashtags = RegExp(r'#\w+').allMatches(content).map((m) => m.group(0)!.substring(1).toLowerCase()).toList();
      await repo.createPost(
        content: content.isNotEmpty ? content : null,
        location: _location.isNotEmpty ? _location : null,
        hashtags: hashtags,
      );
      ref.invalidate(publicFeedProvider);
      if (mounted) context.pop();
    } catch (e) {
      if (mounted) ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: Text('Failed: $e')));
    } finally {
      if (mounted) setState(() => _isPosting = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    final userAsync = ref.watch(currentUserProvider);
    final user = userAsync.value;
    final hasContent = _contentController.text.trim().isNotEmpty || _selectedImage != null;
    final canPost = !_isPosting && hasContent && _contentController.text.length <= _charLimit;

    return Scaffold(
      backgroundColor: AppColors.background,
      appBar: AppBar(
        leading: IconButton(
          icon: const Icon(Symbols.cancel),
          onPressed: () => context.pop(),
        ),
        actions: [
          Padding(
            padding: const EdgeInsets.all(8.0),
            child: ElevatedButton(
              onPressed: canPost ? _submitPost : null,
              child: const Text('Post'),
            ),
          ),
        ],
      ),
      body: Column(
        children: [
          Expanded(
            child: SingleChildScrollView(
              padding: const EdgeInsets.all(16),
              child: Row(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  UserAvatar(uri: user?.avatarUrl, size: 44),
                  const SizedBox(width: 12),
                  Expanded(
                    child: Column(
                      children: [
                        TextField(
                          controller: _contentController,
                          maxLines: null,
                          decoration: const InputDecoration(
                            hintText: "What's happening?!",
                            border: InputBorder.none,
                            enabledBorder: InputBorder.none,
                            focusedBorder: InputBorder.none,
                            filled: false,
                          ),
                        ),
                        if (_selectedImage != null)
                          Stack(
                            children: [
                              ClipRRect(
                                borderRadius: BorderRadius.circular(16),
                                child: Image.file(_selectedImage!),
                              ),
                              Positioned(
                                top: 8,
                                right: 8,
                                child: IconButton(
                                  icon: const Icon(Symbols.cancel, color: Colors.white),
                                  onPressed: () => setState(() => _selectedImage = null),
                                  style: IconButton.styleFrom(backgroundColor: Colors.black54),
                                ),
                              ),
                            ],
                          ),
                      ],
                    ),
                  ),
                ],
              ),
            ),
          ),
        ],
      ),
    );
  }
}
