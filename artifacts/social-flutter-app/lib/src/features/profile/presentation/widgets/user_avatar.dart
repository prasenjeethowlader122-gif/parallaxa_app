import 'package:flutter/material.dart';
import 'package:cached_network_image/cached_network_image.dart';
import 'package:hugeicons/hugeicons.dart';
import 'dart:math' as math;
import '../../../../core/app_colors.dart';

class UserAvatar extends StatelessWidget {
  final String? uri;
  final double size;
  final bool hasStory;
  final bool hasUnviewedStory;

  const UserAvatar({
    super.key,
    this.uri,
    this.size = 40,
    this.hasStory = false,
    this.hasUnviewedStory = false,
  });

  @override
  Widget build(BuildContext context) {
    final double borderWidth = hasStory ? 2.5 : 0;
    final double padding = hasStory ? 2.5 : 0;
    final double outerSize = size + (borderWidth + padding) * 2;

    return Stack(
      alignment: Alignment.center,
      children: [
        if (hasStory)
          SizedBox(
            width: outerSize,
            height: outerSize,
            child: CustomPaint(
              painter: DashedCirclePainter(
                color: hasUnviewedStory ? AppColors.story : AppColors.slate300,
                strokeWidth: borderWidth,
                gap: 4,
              ),
            ),
          ),
        Container(
          width: size,
          height: size,
          decoration: const BoxDecoration(
            shape: BoxShape.circle,
            color: AppColors.muted,
          ),
          clipBehavior: Clip.antiAlias,
          child: uri != null && uri!.isNotEmpty
              ? CachedNetworkImage(
                  imageUrl: uri!,
                  fit: BoxFit.cover,
                  placeholder: (context, url) => const Center(
                    child: SizedBox(
                      width: 20,
                      height: 20,
                      child: CircularProgressIndicator(
                        strokeWidth: 2,
                        color: AppColors.primary,
                      ),
                    ),
                  ),
                  errorWidget: (context, url, error) => HugeIcon(
                    icon: HugeIcons.strokeRoundedUser,
                    color: AppColors.slate400,
                    size: size * 0.6,
                  ),
                )
              : Center(
                  child: HugeIcon(
                    icon: HugeIcons.strokeRoundedUser,
                    color: AppColors.slate400,
                    size: size * 0.6,
                  ),
                ),
        ),
      ],
    );
  }
}

class DashedCirclePainter extends CustomPainter {
  final Color color;
  final double strokeWidth;
  final double gap;

  DashedCirclePainter({
    required this.color,
    required this.strokeWidth,
    this.gap = 4.0,
  });

  @override
  void paint(Canvas canvas, Size size) {
    final double radius = (size.width - strokeWidth) / 2;
    final Offset center = Offset(size.width / 2, size.height / 2);

    final Paint paint = Paint()
      ..color = color
      ..strokeWidth = strokeWidth
      ..style = PaintingStyle.stroke
      ..strokeCap = StrokeCap.round;

    final int dashCount = 12;
    final double dashArc =
        (2 * math.pi - (dashCount * gap * math.pi / 180)) / dashCount;
    final double gapArc = gap * math.pi / 180;

    for (int i = 0; i < dashCount; i++) {
      final double startAngle = i * (dashArc + gapArc) - math.pi / 2;
      canvas.drawArc(
        Rect.fromCircle(center: center, radius: radius),
        startAngle,
        dashArc,
        false,
        paint,
      );
    }
  }

  @override
  bool shouldRepaint(covariant CustomPainter oldDelegate) => true;
}
