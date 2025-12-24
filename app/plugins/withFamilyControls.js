const { withEntitlementsPlist, withInfoPlist, withXcodeProject } = require("@expo/config-plugins");

/**
 * Expo Config Plugin for Family Controls
 * Adds required entitlements and capabilities for iOS app blocking
 */

const APP_GROUP_ID = "group.com.hrynchuk.appblocker";

// Add Family Controls entitlement
const withFamilyControlsEntitlement = (config) => {
  return withEntitlementsPlist(config, (config) => {
    // Family Controls entitlement
    config.modResults["com.apple.developer.family-controls"] = true;

    // App Groups for sharing data with extensions
    config.modResults["com.apple.security.application-groups"] = [APP_GROUP_ID];

    return config;
  });
};

// Add required Info.plist entries
const withFamilyControlsInfoPlist = (config) => {
  return withInfoPlist(config, (config) => {
    // Face ID usage description (for secure unblock)
    if (!config.modResults.NSFaceIDUsageDescription) {
      config.modResults.NSFaceIDUsageDescription =
        "Use Face ID to temporarily unblock apps";
    }

    return config;
  });
};

// Main plugin
const withFamilyControls = (config) => {
  config = withFamilyControlsEntitlement(config);
  config = withFamilyControlsInfoPlist(config);
  return config;
};

module.exports = withFamilyControls;
