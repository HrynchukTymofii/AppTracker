const { withAndroidManifest } = require('@expo/config-plugins');

/**
 * Expo Config Plugin to merge ML Kit dependencies
 * Resolves conflict between vision-camera-pose-landmarks-plugin (pose_detection)
 * and expo-dev-launcher (barcode_ui)
 */
const withMLKitMerge = (config) => {
  return withAndroidManifest(config, async (config) => {
    const androidManifest = config.modResults.manifest;

    // Ensure tools namespace exists
    if (!androidManifest.$) {
      androidManifest.$ = {};
    }
    if (!androidManifest.$['xmlns:tools']) {
      androidManifest.$['xmlns:tools'] = 'http://schemas.android.com/tools';
    }

    // Get the application element
    const application = androidManifest.application?.[0];
    if (!application) {
      return config;
    }

    // Ensure meta-data array exists
    if (!application['meta-data']) {
      application['meta-data'] = [];
    }

    // Find existing ML Kit meta-data or add new one
    const mlKitMetaName = 'com.google.mlkit.vision.DEPENDENCIES';
    const existingIndex = application['meta-data'].findIndex(
      (meta) => meta.$?.['android:name'] === mlKitMetaName
    );

    const mlKitMetaData = {
      $: {
        'android:name': mlKitMetaName,
        'android:value': 'pose_detection,pose_detection_accurate,barcode_ui',
        'tools:replace': 'android:value',
      },
    };

    if (existingIndex >= 0) {
      // Replace existing entry
      application['meta-data'][existingIndex] = mlKitMetaData;
    } else {
      // Add new entry at the beginning
      application['meta-data'].unshift(mlKitMetaData);
    }

    return config;
  });
};

module.exports = withMLKitMerge;
