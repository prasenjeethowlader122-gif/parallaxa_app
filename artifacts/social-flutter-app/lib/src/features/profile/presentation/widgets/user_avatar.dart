import 'package:flutter/material.dart';
import 'package:cached_network_image/cached_network_image.dart';
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
    final Color borderColor = hasUnviewedStory
        ? AppColors.story
        : (hasStory ? AppColors.border : Colors.transparent);

    return Container(
      width: outerSize,
      height: outerSize,
      decoration: BoxDecoration(
        shape: BoxShape.circle,
        border: Border.all(
          color: borderColor,
          width: borderWidth,
        ),
      ),
      padding: EdgeInsets.all(padding),
      alignment: Alignment.center,
      child: Container(
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
                errorWidget: (context, url, error) => Icon(
                  Icons.person,
                  color: AppColors.slate400,
                  size: size * 0.6,
                ),
              )
            : Center(
                child: Icon(
                  Icons.person,
                  color: AppColors.slate400,
                  size: size * 0.6,
                ),
              ),
      ),
    );
  }
}
