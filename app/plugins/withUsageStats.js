const { withAndroidManifest, withInfoPlist } = require('@expo/config-plugins');

/**
 * Expo Config Plugin for Usage Stats & App Blocking
 * This adds necessary permissions and configurations for both platforms
 */
const withUsageStats = (config) => {
  // Android configuration
  config = withAndroidManifest(config, async (config) => {
    const androidManifest = config.modResults.manifest;

    // Add tools namespace if not present
    if (!androidManifest.$) {
      androidManifest.$ = {};
    }
    if (!androidManifest.$['xmlns:tools']) {
      androidManifest.$['xmlns:tools'] = 'http://schemas.android.com/tools';
    }

    // Add permissions
    if (!androidManifest['uses-permission']) {
      androidManifest['uses-permission'] = [];
    }

    const permissions = [
      {
        name: 'android.permission.PACKAGE_USAGE_STATS',
        extra: { 'tools:ignore': 'ProtectedPermissions' },
      },
      { name: 'android.permission.QUERY_ALL_PACKAGES' },
      { name: 'android.permission.SYSTEM_ALERT_WINDOW' },
      { name: 'android.permission.FOREGROUND_SERVICE' },
      { name: 'android.permission.FOREGROUND_SERVICE_SPECIAL_USE' },
      { name: 'android.permission.RECEIVE_BOOT_COMPLETED' },
      { name: 'android.permission.VIBRATE' },
      { name: 'android.permission.CAMERA' },
    ];

    permissions.forEach((perm) => {
      const hasPermission = androidManifest['uses-permission'].some(
        (p) => p.$?.['android:name'] === perm.name
      );

      if (!hasPermission) {
        const permObj = { $: { 'android:name': perm.name, ...perm.extra } };
        androidManifest['uses-permission'].push(permObj);
      }
    });

    // Add queries for getting app list on Android 11+
    if (!androidManifest.queries) {
      androidManifest.queries = [{}];
    }

    // Add intent filter for all apps
    if (!androidManifest.queries[0].intent) {
      androidManifest.queries[0].intent = [];
    }

    const hasLauncherIntent = androidManifest.queries[0].intent.some(
      (i) => i.action?.[0]?.$?.['android:name'] === 'android.intent.action.MAIN'
    );

    if (!hasLauncherIntent) {
      androidManifest.queries[0].intent.push({
        action: [{ $: { 'android:name': 'android.intent.action.MAIN' } }],
        category: [{ $: { 'android:name': 'android.intent.category.LAUNCHER' } }],
      });
    }

    return config;
  });

  // iOS configuration
  config = withInfoPlist(config, (config) => {
    // Add Screen Time / Family Controls usage description
    config.modResults.NSScreenTimeUsageDescription =
      'LockIn needs access to screen time data to help you track and reduce your phone usage.';

    // Add Family Controls entitlement requirement
    config.modResults.NSFamilyControlsUsageDescription =
      'LockIn uses Family Controls to provide you with detailed app usage statistics and help you build better digital habits.';

    // Add Camera usage description for task verification
    config.modResults.NSCameraUsageDescription =
      'LockIn needs camera access to take photos for task verification.';

    // Add Photo Library usage description
    config.modResults.NSPhotoLibraryUsageDescription =
      'LockIn needs photo library access to save task verification photos.';

    return config;
  });

  return config;
};

module.exports = withUsageStats;
