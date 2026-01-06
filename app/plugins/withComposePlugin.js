const { withProjectBuildGradle, withSettingsGradle } = require('@expo/config-plugins');

/**
 * Expo config plugin to add Kotlin Compose compiler plugin support
 */
function withComposePlugin(config) {
  // Add compose compiler plugin to classpath
  config = withProjectBuildGradle(config, (config) => {
    if (config.modResults.language === 'groovy') {
      let contents = config.modResults.contents;

      // Add the Kotlin Compose compiler plugin to classpath if not present
      if (!contents.includes('compose-compiler-gradle-plugin')) {
        contents = contents.replace(
          /classpath\('org\.jetbrains\.kotlin:kotlin-gradle-plugin'\)/,
          `classpath('org.jetbrains.kotlin:kotlin-gradle-plugin')
    classpath('org.jetbrains.kotlin:compose-compiler-gradle-plugin:2.0.0')`
        );
      }

      config.modResults.contents = contents;
    }
    return config;
  });

  return config;
}

module.exports = withComposePlugin;
