#!/usr/bin/env bash
# =============================================================================
# Shorebird OTA Release & Patch Helper
# =============================================================================
# Usage:
#   ./shorebird_release.sh release [android|ios]   – Create a new release build
#   ./shorebird_release.sh patch   [android|ios]   – Push a patch to existing release
#
# Requirements:
#   - SHOREBIRD_TOKEN env var set (add it to Replit Secrets)
#   - shorebird CLI installed (~/.config/shorebird/bin/shorebird)
#
# How OTA works:
#   1. Run `release` once to publish a new version to the app stores.
#   2. Any time you fix a Dart-only bug, run `patch` to push the fix to all
#      users instantly — no store review required.
#   3. The app calls _checkForUpdate() on every cold start; patches download
#      silently in the background and apply on the next restart.
# =============================================================================

set -euo pipefail

SHOREBIRD="${HOME}/.config/shorebird/bin/shorebird"
PLATFORM="${2:-android}"
FLUTTER_DIR="$(cd "$(dirname "$0")" && pwd)"

if [[ ! -f "$SHOREBIRD" ]]; then
  echo "❌  Shorebird CLI not found. Run the install script first:"
  echo "    curl --proto '=https' --tlsv1.2 https://raw.githubusercontent.com/shorebirdtech/install/main/install.sh -sSf | bash"
  exit 1
fi

if [[ -z "${SHOREBIRD_TOKEN:-}" ]]; then
  echo "❌  SHOREBIRD_TOKEN is not set."
  echo "    Add it to Replit Secrets → https://docs.shorebird.dev/ci"
  exit 1
fi

cd "$FLUTTER_DIR"

case "${1:-}" in
  release)
    echo "🚀  Creating Shorebird release for $PLATFORM…"
    "$SHOREBIRD" release "$PLATFORM" --no-confirm
    echo "✅  Release created. Submit the generated build to the app store."
    ;;
  patch)
    echo "🩹  Pushing Shorebird patch for $PLATFORM…"
    "$SHOREBIRD" patch "$PLATFORM" --no-confirm
    echo "✅  Patch pushed! Users will receive it on next app launch."
    ;;
  *)
    echo "Usage: $0 {release|patch} [android|ios]"
    exit 1
    ;;
esac
