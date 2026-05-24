import 'package:flutter/cupertino.dart';
import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'dart:typed_data';
import 'package:go_router/go_router.dart';
import 'package:hugeicons/hugeicons.dart';
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

    // Regex for mentions, hashtags, and links
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

// ─── Create Post Screen ─────────────────────────────────────────────────────
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
      if (_mentionKeyword != null) {
        setState(() => _mentionKeyword = null);
      }
      return;
    }

    final textBeforeCursor = text.substring(0, selection.baseOffset);
    final match = RegExp(r'@(\w*)$').firstMatch(textBeforeCursor);

    if (match != null) {
      setState(() => _mentionKeyword = match.group(1));
    } else {
      if (_mentionKeyword != null) {
        setState(() => _mentionKeyword = null);
      }
    }
  }

  void _onSuggestionSelect(String username) {
    final text = _contentController.text;
    final selection = _contentController.selection;
    final textBeforeCursor = text.substring(0, selection.baseOffset);
    final textAfterCursor = text.substring(selection.baseOffset);

    final newTextBefore = textBeforeCursor.replaceFirst(
      RegExp(r'@\w*$'),
      '@$username ',
    );
    _contentController.value = TextEditingValue(
      text: newTextBefore + textAfterCursor,
      selection: TextSelection.collapsed(offset: newTextBefore.length),
    );
    setState(() => _mentionKeyword = null);
  }

  Future<void> _pickImage() async {
    final picked = await _picker.pickImage(
      source: ImageSource.gallery,
      maxWidth: 1080,
      maxHeight: 1080,
      imageQuality: 85,
    );
    if (picked != null && mounted) {
      setState(() => _selectedImage = File(picked.path));
      _editImage();
    }
  }

  Future<void> _takePhoto() async {
    final picked = await _picker.pickImage(
      source: ImageSource.camera,
      maxWidth: 1080,
      maxHeight: 1080,
      imageQuality: 85,
    );
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
          configs: ProImageEditorConfigs(
            designMode: platformDesignMode,
            imageEditorTheme: const ImageEditorTheme(
              uiOverlayStyle: SystemUiOverlayStyle.light,
              backgroundColor: Colors.black,
              appBarBackgroundColor: Colors.black,
              appBarForegroundColor: Colors.white,
              bottomBarBackgroundColor: Colors.black,
              bottomBarForegroundColor: Colors.white,
            ),
            cropRotateEditorConfigs: const CropRotateEditorConfigs(
              enabled: true,
            ),
            filterEditorConfigs: FilterEditorConfigs(
              enabled: true,
            ),
            blurEditorConfigs: const BlurEditorConfigs(
              enabled: true,
            ),
          ),
          callbacks: ProImageEditorCallbacks(
            onImageEditingComplete: (Uint8List bytes) async {
              final tempDir = Directory.systemTemp;
              final file = await File(
                '${tempDir.path}/edited_image_${DateTime.now().millisecondsSinceEpoch}.png',
              ).create();
              await file.writeAsBytes(bytes);
              setState(() => _selectedImage = file);
              if (mounted) Navigator.pop(context);
            },
          ),
        ),
      ),
    );
  }

  Future<void> _showLocationDialog() async {
    final controller = TextEditingController(text: _location);
    final result = await showDialog<String>(
      context: context,
      builder: (context) => AlertDialog(
        title: const Text(
          'Add Location',
          style: TextStyle(fontWeight: FontWeight.bold),
        ),
        content: TextField(
          controller: controller,
          decoration: const InputDecoration(hintText: 'e.g. Dhaka, Bangladesh'),
          autofocus: true,
        ),
        actions: [
          TextButton(
            onPressed: () => Navigator.pop(context),
            child: const Text('Cancel'),
          ),
          TextButton(
            onPressed: () => Navigator.pop(context, controller.text),
            child: const Text('Add'),
          ),
        ],
      ),
    );
    if (result != null) {
      setState(() => _location = result.trim());
    }
  }

  Future<void> _submitPost() async {
    final content = _contentController.text.trim();
    if (content.isEmpty && _selectedImage == null) {
      return;
    }

    setState(() => _isPosting = true);
    try {
      final repo = ref.read(postRepositoryProvider);

      final hashtags = RegExp(r'#\w+')
          .allMatches(content)
          .map((m) => m.group(0)!.substring(1).toLowerCase())
          .toList();

      await repo.createPost(
        content: content.isNotEmpty ? content : null,
        location: _location.isNotEmpty ? _location : null,
        hashtags: hashtags,
      );

      ref.invalidate(publicFeedProvider);
      ref.invalidate(followingFeedProvider);
      ref.invalidate(trendingFeedProvider);

      if (mounted) {
        context.pop();
      }
    } catch (e) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(content: Text('Failed to post: ${e.toString()}')),
        );
      }
    } finally {
      if (mounted) setState(() => _isPosting = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    final userAsync = ref.watch(currentUserProvider);
    final user = userAsync.value;
    final hasContent =
        _contentController.text.trim().isNotEmpty || _selectedImage != null;
    final canPost =
        !_isPosting &&
        hasContent &&
        _contentController.text.length <= _charLimit;

    return Scaffold(
      backgroundColor: AppColors.background,
      appBar: AppBar(
        backgroundColor: AppColors.background,
        elevation: 0,
        scrolledUnderElevation: 0,
        leading: IconButton(
          icon: HugeIcon(
            icon: HugeIcons.strokeRoundedCancel01,
            color: Theme.of(context).brightness == Brightness.dark
                ? Colors.white
                : AppColors.textPrimary,
            size: 24,
          ),
          onPressed: _isPosting ? null : () => context.pop(),
        ),
        actions: [
          Padding(
            padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 8),
            child: ElevatedButton(
              onPressed: canPost ? _submitPost : null,
              style: ElevatedButton.styleFrom(
                backgroundColor: const Color(0xFF0F1419),
                foregroundColor: Colors.white,
                disabledBackgroundColor: const Color(0xFFCCD6DD),
                elevation: 0,
                minimumSize: const Size(68, 36),
                padding: const EdgeInsets.symmetric(horizontal: 16),
                shape: RoundedRectangleBorder(
                  borderRadius: BorderRadius.circular(20),
                ),
              ),
              child: _isPosting
                  ? const SizedBox(
                      width: 16,
                      height: 16,
                      child: CircularProgressIndicator(
                        strokeWidth: 2,
                        color: Colors.white,
                      ),
                    )
                  : const Text(
                      'Post',
                      style: TextStyle(
                        fontWeight: FontWeight.w800,
                        fontSize: 15,
                      ),
                    ),
            ),
          ),
        ],
      ),
      body: Column(
        children: [
          Expanded(
            child: Stack(
              children: [
                SingleChildScrollView(
                  padding: const EdgeInsets.symmetric(
                    horizontal: 16,
                    vertical: 12,
                  ),
                  child: Row(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      UserAvatar(uri: user?.avatarUrl, size: 44),
                      const SizedBox(width: 12),
                      Expanded(
                        child: Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            Row(
                              children: [
                                Text(
                                  user?.displayName ?? 'You',
                                  style: TextStyle(
                                    fontWeight: FontWeight.w800,
                                    fontSize: 15,
                                    color:
                                        Theme.of(context).brightness ==
                                            Brightness.dark
                                        ? Colors.white
                                        : const Color(0xFF14171A),
                                  ),
                                ),
                                const SizedBox(width: 8),
                                const _AudienceChip(),
                              ],
                            ),
                            TextField(
                              controller: _contentController,
                              maxLines: null,
                              minLines: 1,
                              autofocus: true,
                              style: TextStyle(
                                fontSize: 18,
                                height: 1.4,
                                color:
                                    Theme.of(context).brightness ==
                                        Brightness.dark
                                    ? Colors.white
                                    : AppColors.textPrimary,
                              ),
                              decoration: const InputDecoration(
                                hintText: "What's happening?!",
                                hintStyle: TextStyle(
                                  color: Color(0xFFAAB8C2),
                                  fontSize: 18,
                                ),
                                border: InputBorder.none,
                                enabledBorder: InputBorder.none,
                                focusedBorder: InputBorder.none,
                                filled: false,
                                contentPadding: EdgeInsets.symmetric(
                                  vertical: 8,
                                ),
                              ),
                              onChanged: (_) => setState(() {}),
                            ),
                            if (_location.isNotEmpty) ...[
                              const SizedBox(height: 8),
                              _LocationTag(
                                label: _location,
                                onRemove: () => setState(() => _location = ''),
                              ),
                            ],
                            if (_selectedImage != null) ...[
                              const SizedBox(height: 12),
                              Stack(
                                children: [
                                  ClipRRect(
                                    borderRadius: BorderRadius.circular(16),
                                    child: Image.file(
                                      _selectedImage!,
                                      width: double.infinity,
                                      fit: BoxFit.cover,
                                    ),
                                  ),
                                  Positioned(
                                    top: 10,
                                    right: 10,
                                    child: Row(
                                      children: [
                                        GestureDetector(
                                          onTap: _editImage,
                                          child: Container(
                                            padding: const EdgeInsets.all(6),
                                            decoration: const BoxDecoration(
                                              color: Colors.black54,
                                              shape: BoxShape.circle,
                                            ),
                                            child: const HugeIcon(
                                              icon:
                                                  HugeIcons.strokeRoundedEdit01,
                                              color: Colors.white,
                                              size: 16,
                                            ),
                                          ),
                                        ),
                                        const SizedBox(width: 8),
                                        GestureDetector(
                                          onTap: () => setState(
                                            () => _selectedImage = null,
                                          ),
                                          child: Container(
                                            padding: const EdgeInsets.all(6),
                                            decoration: const BoxDecoration(
                                              color: Colors.black54,
                                              shape: BoxShape.circle,
                                            ),
                                            child: const HugeIcon(
                                              icon: HugeIcons
                                                  .strokeRoundedCancel01,
                                              color: Colors.white,
                                              size: 16,
                                            ),
                                          ),
                                        ),
                                      ],
                                    ),
                                  ),
                                  /*Positioned(
                                    top: 10,
                                    right: 10,
                                    child: GestureDetector(
                                      onTap: () =>
                                          setState(() => _selectedImage = null),
                                      child: Container(
                                        padding: const EdgeInsets.all(6),
                                        decoration: const BoxDecoration(
                                          color: Colors.black54,
                                          shape: BoxShape.circle,
                                        ),
                                        child: const HugeIcon(
                                          icon: HugeIcons.strokeRoundedCancel01,
                                          color: Colors.white,
                                          size: 16,
                                        ),
                                      ),
                                    ),
                                  ),*/
                                ],
                              ),
                            ],
                          ],
                        ),
                      ),
                    ],
                  ),
                ),
                if (_mentionKeyword != null)
                  Positioned(
                    left: 72,
                    top:
                        60, // Rough estimate, ideally you'd use a LayerLink and CompositedTransformFollower
                    child: _MentionSuggestions(
                      keyword: _mentionKeyword!,
                      onSelect: _onSuggestionSelect,
                    ),
                  ),
              ],
            ),
          ),
          _Toolbar(
            charCount: _contentController.text.length,
            charLimit: _charLimit,
            onPickImage: _pickImage,
            onTakePhoto: _takePhoto,
            onLocationPress: _showLocationDialog,
            isLocationActive: _location.isNotEmpty,
          ),
        ],
      ),
    );
  }
}

// ─── Mention Suggestions ─────────────────────────────────────────────────────
final searchUsersProvider = FutureProvider.family<List<UserSummary>, String>((
  ref,
  query,
) async {
  if (query.isEmpty) return [];
  final dio = ref.watch(dioProvider);
  final response = await dio.get(
    '/search',
    queryParameters: {'q': query, 'type': 'users'},
  );
  final users = (response.data['users'] as List)
      .map((u) => UserSummary.fromJson(u))
      .toList();
  return users;
});

class _MentionSuggestions extends ConsumerWidget {
  final String keyword;
  final Function(String) onSelect;

  const _MentionSuggestions({required this.keyword, required this.onSelect});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final searchAsync = ref.watch(searchUsersProvider(keyword));

    return searchAsync.when(
      data: (users) {
        if (users.isEmpty) return const SizedBox.shrink();
        return Container(
          width: 250,
          constraints: const BoxConstraints(maxHeight: 250),
          decoration: BoxDecoration(
            color: Colors.white,
            borderRadius: BorderRadius.circular(12),
            border: Border.all(color: const Color(0xFFE1E8ED)),
            boxShadow: [
              BoxShadow(
                color: Colors.black.withOpacity(0.08),
                blurRadius: 8,
                offset: const Offset(0, 2),
              ),
            ],
          ),
          child: ListView.separated(
            shrinkWrap: true,
            padding: EdgeInsets.zero,
            itemCount: users.length,
            separatorBuilder: (_, __) =>
                const Divider(height: 1, color: Color(0xFFF2F2F2)),
            itemBuilder: (context, index) {
              final user = users[index];
              return ListTile(
                onTap: () => onSelect(user.username),
                dense: true,
                leading: CircleAvatar(
                  radius: 17,
                  backgroundColor: const Color(0xFFE8F5FD),
                  backgroundImage: user.avatarUrl != null
                      ? NetworkImage(user.avatarUrl!)
                      : null,
                  child: user.avatarUrl == null
                      ? Text(
                          user.displayName.isNotEmpty
                              ? user.displayName[0].toUpperCase()
                              : '?',
                          style: const TextStyle(
                            fontSize: 14,
                            fontWeight: FontWeight.w700,
                            color: Color(0xFF1D9BF0),
                          ),
                        )
                      : null,
                ),
                title: Text(
                  user.displayName,
                  style: const TextStyle(
                    fontWeight: FontWeight.w700,
                    color: Color(0xFF14171A),
                  ),
                ),
                subtitle: Text(
                  '@${user.username}',
                  style: const TextStyle(color: Color(0xFF657786)),
                ),
              );
            },
          ),
        );
      },
      loading: () => Container(
        width: 250,
        height: 50,
        decoration: BoxDecoration(
          color: Colors.white,
          borderRadius: BorderRadius.circular(12),
        ),
        child: const Center(child: CircularProgressIndicator(strokeWidth: 2)),
      ),
      error: (_, __) => const SizedBox.shrink(),
    );
  }
}

class _AudienceChip extends StatelessWidget {
  const _AudienceChip();

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 9, vertical: 3),
      decoration: BoxDecoration(
        color: const Color(0xFFE8F5FD),
        borderRadius: BorderRadius.circular(20),
        border: Border.all(color: const Color(0xFFB8D7F1)),
      ),
      child: const Row(
        mainAxisSize: MainAxisSize.min,
        children: [
          HugeIcon(
            icon: HugeIcons.strokeRoundedGlobe,
            color: Color(0xFF1D9BF0),
            size: 14,
          ),
          SizedBox(width: 4),
          Text(
            'Everyone',
            style: TextStyle(
              color: Color(0xFF1D9BF0),
              fontSize: 11,
              fontWeight: FontWeight.w600,
            ),
          ),
        ],
      ),
    );
  }
}

class _LocationTag extends StatelessWidget {
  final String label;
  final VoidCallback onRemove;

  const _LocationTag({required this.label, required this.onRemove});

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 5),
      decoration: BoxDecoration(
        color: const Color(0xFFE8F5FD),
        borderRadius: BorderRadius.circular(20),
      ),
      child: Row(
        mainAxisSize: MainAxisSize.min,
        children: [
          const HugeIcon(
            icon: HugeIcons.strokeRoundedLocation01,
            color: Color(0xFF1D9BF0),
            size: 14,
          ),
          const SizedBox(width: 5),
          Text(
            label,
            style: const TextStyle(
              color: Color(0xFF1D9BF0),
              fontSize: 13,
              fontWeight: FontWeight.w600,
            ),
          ),
          const SizedBox(width: 5),
          GestureDetector(
            onTap: onRemove,
            child: const HugeIcon(
              icon: HugeIcons.strokeRoundedCancel01,
              color: Color(0xFF1D9BF0),
              size: 14,
            ),
          ),
        ],
      ),
    );
  }
}

class _Toolbar extends StatelessWidget {
  final int charCount;
  final int charLimit;
  final VoidCallback onPickImage;
  final VoidCallback onTakePhoto;
  final VoidCallback onLocationPress;
  final bool isLocationActive;

  const _Toolbar({
    required this.charCount,
    required this.charLimit,
    required this.onPickImage,
    required this.onTakePhoto,
    required this.onLocationPress,
    required this.isLocationActive,
  });

  @override
  Widget build(BuildContext context) {
    return Container(
      decoration: const BoxDecoration(
        border: Border(top: BorderSide(color: AppColors.border, width: 0.5)),
      ),
      padding: EdgeInsets.only(
        left: 14,
        right: 14,
        top: 12,
        bottom: MediaQuery.of(context).padding.bottom > 0
            ? MediaQuery.of(context).padding.bottom
            : 16,
      ),
      child: Row(
        children: [
          IconButton(
            icon: const HugeIcon(
              icon: HugeIcons.strokeRoundedImage01,
              color: Color(0xFF1D9BF0),
              size: 24,
            ),
            onPressed: onPickImage,
          ),
          IconButton(
            icon: const HugeIcon(
              icon: HugeIcons.strokeRoundedVideoReplay,
              color: Color(0xFF1D9BF0),
              size: 24,
            ),
            onPressed: () {},
          ),
          IconButton(
            icon: const HugeIcon(
              icon: HugeIcons.strokeRoundedListView,
              color: Color(0xFF1D9BF0),
              size: 24,
            ),
            onPressed: () {},
          ),
          IconButton(
            icon: const HugeIcon(
              icon: HugeIcons.strokeRoundedSent,
              color: Color(0xFF1D9BF0),
              size: 24,
            ),
            onPressed: () {},
          ),
          Stack(
            children: [
              IconButton(
                icon: const HugeIcon(
                  icon: HugeIcons.strokeRoundedLocation01,
                  color: Color(0xFF1D9BF0),
                  size: 24,
                ),
                onPressed: onLocationPress,
              ),
              if (isLocationActive)
                Positioned(
                  top: 8,
                  right: 8,
                  child: Container(
                    width: 6,
                    height: 6,
                    decoration: const BoxDecoration(
                      color: Color(0xFF1D9BF0),
                      shape: BoxShape.circle,
                    ),
                  ),
                ),
            ],
          ),
          const Spacer(),
          if (charCount > 0) ...[
            Container(width: 1, height: 22, color: const Color(0xFFE1E8ED)),
            const SizedBox(width: 12),
            _CharRing(count: charCount, limit: charLimit),
            const SizedBox(width: 12),
            Container(
              width: 32,
              height: 32,
              decoration: BoxDecoration(
                shape: BoxShape.circle,
                border: Border.all(color: const Color(0xFFE1E8ED)),
              ),
              child: const Center(
                child: HugeIcon(
                  icon: HugeIcons.strokeRoundedCalendar01,
                  color: Color(0xFF1D9BF0),
                  size: 16,
                ),
              ),
            ),
          ],
        ],
      ),
    );
  }
}

class _CharRing extends StatelessWidget {
  final int count;
  final int limit;

  const _CharRing({required this.count, required this.limit});

  @override
  Widget build(BuildContext context) {
    final double pct = math.min(count / limit, 1.0);
    final int remaining = limit - count;
    final Color color = remaining <= 0
        ? const Color(0xFFE0245E)
        : remaining <= 20
        ? const Color(0xFFF5A623)
        : const Color(0xFF1D9BF0);

    return SizedBox(
      width: 26,
      height: 26,
      child: Stack(
        alignment: Alignment.center,
        children: [
          CircularProgressIndicator(
            value: pct,
            strokeWidth: 2.5,
            backgroundColor: const Color(0xFFE1E8ED),
            valueColor: AlwaysStoppedAnimation<Color>(color),
          ),
          if (remaining <= 20)
            Text(
              '$remaining',
              style: TextStyle(
                fontSize: 10,
                fontWeight: FontWeight.w700,
                color: remaining <= 0
                    ? const Color(0xFFE0245E)
                    : const Color(0xFF536471),
              ),
            ),
        ],
      ),
    );
  }
}
