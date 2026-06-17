import * as Updates from "expo-updates";
import { useEffect } from "react";
import { Alert } from "react-native";

export function useUpdates() {
  useEffect(() => {
    if (__DEV__) return;

    async function checkUpdates() {
      try {
        console.log("[Updates] Checking for updates...");
        console.log(`[Updates] Runtime version: ${Updates.runtimeVersion}`);
        console.log(`[Updates] Channel: ${Updates.channel}`);
        console.log(`[Updates] Current update ID: ${Updates.updateId}`);

        const update = await Updates.checkForUpdateAsync();
        if (update.isAvailable) {
          console.log(`[Updates] Update available! ID: ${update.manifest?.id}`);
          await Updates.fetchUpdateAsync();
          Alert.alert(
            "Update Available",
            "A new version of the app is available. Restart the app to apply the update.",
            [
              {
                text: "Restart Now",
                onPress: () => Updates.reloadAsync(),
              },
              {
                text: "Later",
                style: "cancel",
              },
            ]
          );
        }
      } catch (error) {
        console.error("Failed to check for updates:", error);
      }
    }

    checkUpdates();
  }, []);
}
