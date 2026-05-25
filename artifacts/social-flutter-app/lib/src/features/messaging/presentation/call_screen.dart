import 'package:flutter/material.dart';
import 'package:material_symbols_icons/material_symbols_icons.dart';
import 'dart:ui';
import 'package:cached_network_image/cached_network_image.dart';

class CallScreen extends StatefulWidget {
  final String name;
  final String? avatarUrl;
  final bool isVideo;

  const CallScreen({
    super.key,
    required this.name,
    this.avatarUrl,
    this.isVideo = false,
  });

  @override
  State<CallScreen> createState() => _CallScreenState();
}

class _CallScreenState extends State<CallScreen> {
  bool _isMuted = false;
  bool _isSpeakerOn = true;
  bool _isCameraOff = false;

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: Colors.black,
      body: Stack(
        children: [
          // Background Avatar with Blur
          if (widget.avatarUrl != null)
            Positioned.fill(
              child: Opacity(
                opacity: 0.4,
                child: CachedNetworkImage(
                  imageUrl: widget.avatarUrl!,
                  fit: BoxFit.cover,
                ),
              ),
            ),
          Positioned.fill(
            child: BackdropFilter(
              filter: ImageFilter.blur(sigmaX: 30, sigmaY: 30),
              child: Container(color: Colors.black.withOpacity(0.3)),
            ),
          ),

          // Main Content
          SafeArea(
            child: Column(
              children: [
                const SizedBox(height: 80),
                // Avatar
                Center(
                  child: Container(
                    padding: const EdgeInsets.all(4),
                    decoration: BoxDecoration(
                      shape: BoxShape.circle,
                      border: Border.all(
                        color: Colors.white.withOpacity(0.2),
                        width: 2,
                      ),
                    ),
                    child: CircleAvatar(
                      radius: 60,
                      backgroundImage: widget.avatarUrl != null
                          ? CachedNetworkImageProvider(widget.avatarUrl!)
                          : null,
                      child: widget.avatarUrl == null
                          ? const Icon(Symbols.person, size: 60, color: Colors.white)
                          : null,
                    ),
                  ),
                ),
                const SizedBox(height: 24),
                Text(
                  widget.name,
                  style: const TextStyle(
                    fontSize: 28,
                    fontWeight: FontWeight.bold,
                    color: Colors.white,
                    fontFamily: 'Google Sans',
                  ),
                ),
                const SizedBox(height: 8),
                Text(
                  widget.isVideo ? 'Video Calling...' : 'Voice Calling...',
                  style: TextStyle(
                    fontSize: 16,
                    color: Colors.white.withOpacity(0.7),
                    letterSpacing: 1.2,
                  ),
                ),
                const Spacer(),

                // Call Controls
                Container(
                  padding: const EdgeInsets.symmetric(vertical: 40, horizontal: 20),
                  decoration: BoxDecoration(
                    color: Colors.white.withOpacity(0.1),
                    borderRadius: const BorderRadius.vertical(top: Radius.circular(40)),
                  ),
                  child: Column(
                    children: [
                      Row(
                        mainAxisAlignment: MainAxisAlignment.spaceEvenly,
                        children: [
                          _CallControlButton(
                            icon: _isMuted ? Symbols.mic_off : Symbols.mic,
                            label: 'Mute',
                            isActive: _isMuted,
                            onTap: () => setState(() => _isMuted = !_isMuted),
                          ),
                          if (widget.isVideo)
                            _CallControlButton(
                              icon: _isCameraOff ? Symbols.videocam_off : Symbols.videocam,
                              label: 'Camera',
                              isActive: _isCameraOff,
                              onTap: () => setState(() => _isCameraOff = !_isCameraOff),
                            ),
                          _CallControlButton(
                            icon: _isSpeakerOn ? Symbols.volume_up : Symbols.volume_off,
                            label: 'Speaker',
                            isActive: _isSpeakerOn,
                            onTap: () => setState(() => _isSpeakerOn = !_isSpeakerOn),
                          ),
                        ],
                      ),
                      const SizedBox(height: 40),
                      GestureDetector(
                        onTap: () => Navigator.pop(context),
                        child: Container(
                          width: 70,
                          height: 70,
                          decoration: const BoxDecoration(
                            color: Colors.redAccent,
                            shape: BoxShape.circle,
                            boxShadow: [
                              BoxShadow(
                                color: Colors.redAccent,
                                blurRadius: 20,
                                spreadRadius: 2,
                              )
                            ],
                          ),
                          child: const Icon(Symbols.call_end, color: Colors.white, size: 32),
                        ),
                      ),
                    ],
                  ),
                ),
              ],
            ),
          ),
        ],
      ),
    );
  }
}

class _CallControlButton extends StatelessWidget {
  final IconData icon;
  final String label;
  final bool isActive;
  final VoidCallback onTap;

  const _CallControlButton({
    required this.icon,
    required this.label,
    required this.isActive,
    required this.onTap,
  });

  @override
  Widget build(BuildContext context) {
    return Column(
      children: [
        GestureDetector(
          onTap: onTap,
          child: Container(
            width: 60,
            height: 60,
            decoration: BoxDecoration(
              color: isActive ? Colors.white : Colors.white.withOpacity(0.1),
              shape: BoxShape.circle,
            ),
            child: Icon(
              icon,
              color: isActive ? Colors.black : Colors.white,
              size: 28,
            ),
          ),
        ),
        const SizedBox(height: 8),
        Text(
          label,
          style: const TextStyle(color: Colors.white, fontSize: 12),
        ),
      ],
    );
  }
}
