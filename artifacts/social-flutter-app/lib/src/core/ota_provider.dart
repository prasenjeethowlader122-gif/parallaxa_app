import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:shorebird_code_push/shorebird_code_push.dart';

enum OTAStatus {
  idle,
  checking,
  available,
  downloading,
  downloaded,
  error,
}

class OTAState {
  final OTAStatus status;
  final String? message;

  OTAState({required this.status, this.message});

  OTAState copyWith({OTAStatus? status, String? message}) {
    return OTAState(
      status: status ?? this.status,
      message: message ?? this.message,
    );
  }
}

class OTANotifier extends Notifier<OTAState> {
  final _updater = ShorebirdUpdater();

  @override
  OTAState build() {
    return OTAState(status: OTAStatus.idle);
  }

  Future<void> checkForUpdate() async {
    if (state.status == OTAStatus.checking || state.status == OTAStatus.downloading) return;

    state = state.copyWith(status: OTAStatus.checking);

    try {
      final status = await _updater.checkForUpdate();
      if (status == UpdateStatus.outdated) {
        state = state.copyWith(status: OTAStatus.available, message: "New update available.");
        await downloadUpdate();
      } else {
        state = state.copyWith(status: OTAStatus.idle);
      }
    } catch (e) {
      state = state.copyWith(status: OTAStatus.error, message: "Failed to check for updates.");
    }
  }

  Future<void> downloadUpdate() async {
    state = state.copyWith(status: OTAStatus.downloading, message: "Downloading update...");
    try {
      await _updater.update();
      state = state.copyWith(status: OTAStatus.downloaded, message: "Update downloaded. Restart the app to apply.");
    } catch (e) {
      state = state.copyWith(status: OTAStatus.error, message: "Failed to download update.");
    }
  }
}

final otaProvider = NotifierProvider<OTANotifier, OTAState>(() => OTANotifier());
