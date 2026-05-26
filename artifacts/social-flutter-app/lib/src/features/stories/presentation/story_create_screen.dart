import 'dart:io';
import 'package:flutter/cupertino.dart';
import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:material_symbols_icons/symbols.dart';
import 'package:image_picker/image_picker.dart';
import 'package:go_router/go_router.dart';
import '../data/story_repository.dart';

class StoryCreateScreen extends ConsumerStatefulWidget {
  const StoryCreateScreen({super.key});

  @override
  ConsumerState<StoryCreateScreen> createState() => _StoryCreateScreenState();
}

class _StoryCreateScreenState extends ConsumerState<StoryCreateScreen> {
  File? _image;
  final _picker = ImagePicker();
  bool _isUploading = false;
  bool _isTextStory = false;
  final _textController = TextEditingController();
  Color _selectedColor = Colors.deepPurple;

  final List<Color> _colors = [
    Colors.deepPurple,
    Colors.blue,
    Colors.green,
    Colors.orange,
    Colors.pink,
    Colors.red,
    Colors.teal,
    Colors.indigo,
  ];

  @override
  void dispose() {
    _textController.dispose();
    super.dispose();
  }

  Future<void> _pickImage() async {
    final pickedFile = await _picker.pickImage(source: ImageSource.gallery);
    if (pickedFile != null) {
      setState(() {
        _image = File(pickedFile.path);
        _isTextStory = false;
      });
    }
  }

  Future<void> _uploadStory() async {
    if (_image == null && _textController.text.trim().isEmpty) return;

    setState(() => _isUploading = true);
    try {
      final repo = ref.read(storyRepositoryProvider);

      if (_image != null) {
        final url = await repo.uploadFile(_image!.path);
        await repo.createStory(mediaUrl: url, mediaType: 'image');
      } else {
        await repo.createStory(
          content: _textController.text.trim(),
          mediaType: 'text',
          backgroundColor: '#${_selectedColor.value.toRadixString(16).padLeft(8, '0')}',
        );
      }

      if (mounted) context.pop();
    } catch (e) {
      if (mounted) {
        ScaffoldMessenger.of(
          context,
        ).showSnackBar(SnackBar(content: Text('Error: $e')));
      }
    } finally {
      if (mounted) setState(() => _isUploading = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: _isTextStory ? _selectedColor : Colors.black,
      appBar: AppBar(
        backgroundColor: Colors.transparent,
        elevation: 0,
        title: Text(
          _isTextStory ? 'Text Story' : 'Add to Story',
          style: const TextStyle(color: Colors.white, fontWeight: FontWeight.bold),
        ),
        leading: IconButton(
          icon: const Icon(Symbols.close, color: Colors.white),
          onPressed: () => context.pop(),
        ),
        actions: [
          if (_image != null || _textController.text.trim().isNotEmpty)
            Padding(
              padding: const EdgeInsets.only(right: 8.0),
              child: TextButton(
                onPressed: _isUploading ? null : _uploadStory,
                style: TextButton.styleFrom(
                  backgroundColor: Colors.white,
                  foregroundColor: Colors.black,
                  shape: RoundedRectangleBorder(
                    borderRadius: BorderRadius.circular(20),
                  ),
                  padding: const EdgeInsets.symmetric(horizontal: 16),
                ),
                child: _isUploading
                    ? const SizedBox(
                        width: 20,
                        height: 20,
                        child: CircularProgressIndicator(
                          strokeWidth: 2,
                          color: Colors.black,
                        ),
                      )
                    : const Text(
                        'Share',
                        style: TextStyle(fontWeight: FontWeight.bold),
                      ),
              ),
            ),
        ],
      ),
      body: Stack(
        children: [
          Center(
            child: _isTextStory
                ? Padding(
                    padding: const EdgeInsets.symmetric(horizontal: 40),
                    child: TextField(
                      controller: _textController,
                      autofocus: true,
                      maxLines: null,
                      textAlign: TextAlign.center,
                      style: const TextStyle(
                        color: Colors.white,
                        fontSize: 28,
                        fontWeight: FontWeight.w800,
                      ),
                      decoration: const InputDecoration(
                        hintText: 'Type something...',
                        hintStyle: TextStyle(color: Colors.white60),
                        border: InputBorder.none,
                        enabledBorder: InputBorder.none,
                        focusedBorder: InputBorder.none,
                        fillColor: Colors.transparent,
                        filled: false,
                      ),
                      onChanged: (_) => setState(() {}),
                    ),
                  )
                : (_image == null
                    ? Column(
                        mainAxisAlignment: MainAxisAlignment.center,
                        children: [
                          const Icon(
                            Symbols.photo_camera,
                            color: Colors.white,
                            size: 80,
                            weight: 100,
                          ),
                          const SizedBox(height: 32),
                          Row(
                            mainAxisAlignment: MainAxisAlignment.center,
                            children: [
                              _OptionButton(
                                icon: Symbols.image,
                                label: 'Gallery',
                                onTap: _pickImage,
                              ),
                              const SizedBox(width: 40),
                              _OptionButton(
                                icon: Symbols.text_fields,
                                label: 'Text',
                                onTap: () => setState(() => _isTextStory = true),
                              ),
                            ],
                          ),
                        ],
                      )
                    : Image.file(_image!, fit: BoxFit.contain)),
          ),
          if (_isTextStory)
            Positioned(
              bottom: 40,
              left: 0,
              right: 0,
              child: SizedBox(
                height: 50,
                child: ListView.builder(
                  scrollDirection: Axis.horizontal,
                  padding: const EdgeInsets.symmetric(horizontal: 20),
                  itemCount: _colors.length,
                  itemBuilder: (context, index) {
                    return GestureDetector(
                      onTap: () => setState(() => _selectedColor = _colors[index]),
                      child: Container(
                        width: 40,
                        height: 40,
                        margin: const EdgeInsets.symmetric(horizontal: 8),
                        decoration: BoxDecoration(
                          color: _colors[index],
                          shape: BoxShape.circle,
                          border: Border.all(
                            color: _selectedColor == _colors[index]
                                ? Colors.white
                                : Colors.white24,
                            width: 2,
                          ),
                        ),
                      ),
                    );
                  },
                ),
              ),
            ),
        ],
      ),
    );
  }
}

class _OptionButton extends StatelessWidget {
  final IconData icon;
  final String label;
  final VoidCallback onTap;

  const _OptionButton({
    required this.icon,
    required this.label,
    required this.onTap,
  });

  @override
  Widget build(BuildContext context) {
    return GestureDetector(
      onTap: onTap,
      child: Column(
        children: [
          Container(
            padding: const EdgeInsets.all(16),
            decoration: BoxDecoration(
              color: Colors.white.withOpacity(0.1),
              shape: BoxShape.circle,
            ),
            child: Icon(icon, color: Colors.white, size: 32, weight: 300),
          ),
          const SizedBox(height: 12),
          Text(
            label,
            style: const TextStyle(
              color: Colors.white,
              fontSize: 14,
              fontWeight: FontWeight.w600,
            ),
          ),
        ],
      ),
    );
  }
}
