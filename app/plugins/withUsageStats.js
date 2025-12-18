const { withAndroidManifest, withInfoPlist } = require('@expo/config-plugins');

/**
 * Expo Config Plugin for Usage Stats
 * This adds necessary permissions and configurations for both platforms
 */
const withUsageStats = (config) => {
  // Android configuration
  config = withAndroidManifest(config, async (config) => {
    const androidManifest = config.modResults.manifest;

    // Add PACKAGE_USAGE_STATS permission
    if (!androidManifest['uses-permission']) {
      androidManifest['uses-permission'] = [];
    }

    const usageStatsPermission = {
      $: {
        'android:name': 'android.permission.PACKAGE_USAGE_STATS',
        'tools:ignore': 'ProtectedPermissions',
      },
    };

    // Check if permission already exists
    const hasPermission = androidManifest['uses-permission'].some(
      (permission) =>
        permission.$?.['android:name'] === 'android.permission.PACKAGE_USAGE_STATS'
    );

    if (!hasPermission) {
      androidManifest['uses-permission'].push(usageStatsPermission);
    }

    // Add tools namespace if not present
    if (!androidManifest.$) {
      androidManifest.$ = {};
    }
    if (!androidManifest.$['xmlns:tools']) {
      androidManifest.$['xmlns:tools'] = 'http://schemas.android.com/tools';
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

    return config;
  });

  return config;
};

module.exports = withUsageStats;
