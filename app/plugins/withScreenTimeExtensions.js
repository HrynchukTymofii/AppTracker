/**
 * Expo Config Plugin for Screen Time Extensions
 * Automatically adds extension targets to the Xcode project
 */

const {
  withEntitlementsPlist,
  withXcodeProject,
  withDangerousMod,
} = require("expo/config-plugins");
const fs = require("fs");
const path = require("path");

const BUNDLE_ID = "com.hrynchuk.appblocker";
const APP_GROUP = "group.com.hrynchuk.appblocker";

const EXTENSIONS = [
  {
    name: "DeviceActivityMonitor",
    bundleIdSuffix: ".DeviceActivityMonitor",
    extensionType: "com.apple.deviceactivitymonitor",
    swiftFile: "DeviceActivityMonitorExtension.swift",
  },
  {
    name: "DeviceActivityReport",
    bundleIdSuffix: ".DeviceActivityReport",
    extensionType: "com.apple.deviceactivityui",
    swiftFile: "DeviceActivityReportExtension.swift",
  },
  {
    name: "ShieldConfiguration",
    bundleIdSuffix: ".ShieldConfiguration",
    extensionType: "com.apple.ManagedSettingsUI.shield-configuration",
    swiftFile: "ShieldConfigurationExtension.swift",
  },
  {
    name: "ShieldAction",
    bundleIdSuffix: ".ShieldAction",
    extensionType: "com.apple.ManagedSettingsUI.shield-action",
    swiftFile: "ShieldActionExtension.swift",
  },
];

const withScreenTimeExtensions = (config, pluginConfig = {}) => {
  // Extract optional development team from plugin config
  const configuredTeamId = pluginConfig.developmentTeamId || null;

  // Step 1: Add entitlements to main app
  config = withEntitlementsPlist(config, (config) => {
    config.modResults["com.apple.developer.family-controls"] = true;
    config.modResults["com.apple.security.application-groups"] = [APP_GROUP];
    return config;
  });

  // Step 2: Copy extension files
  config = withDangerousMod(config, [
    "ios",
    async (config) => {
      const projectRoot = config.modRequest.projectRoot;
      const iosPath = path.join(projectRoot, "ios");
      const extensionsSourcePath = path.join(projectRoot, "ios-extensions");

      for (const ext of EXTENSIONS) {
        const srcDir = path.join(extensionsSourcePath, ext.name);
        const destDir = path.join(iosPath, ext.name);

        if (fs.existsSync(srcDir)) {
          if (!fs.existsSync(destDir)) {
            fs.mkdirSync(destDir, { recursive: true });
          }
          const files = fs.readdirSync(srcDir);
          for (const file of files) {
            fs.copyFileSync(path.join(srcDir, file), path.join(destDir, file));
          }
          console.log(`✓ Copied ${ext.name} files`);
        }
      }
      return config;
    },
  ]);

  // Step 3: Add extension targets to Xcode project
  config = withXcodeProject(config, (config) => {
    const xcodeProject = config.modResults;
    const projectName = config.modRequest.projectName;

    for (const ext of EXTENSIONS) {
      try {
        addExtensionTarget(xcodeProject, ext, projectName, configuredTeamId);
        console.log(`✓ Added ${ext.name} target`);
      } catch (error) {
        console.error(`✗ Failed to add ${ext.name}: ${error.message}`);
      }
    }

    return config;
  });

  return config;
};

function addExtensionTarget(project, ext, projectName, configuredTeamId = null) {
  const extName = ext.name;
  const bundleId = BUNDLE_ID + ext.bundleIdSuffix;

  // Check if target already exists
  const existingTarget = project.pbxTargetByName(extName);
  if (existingTarget) {
    console.log(`  ${extName} target already exists, skipping...`);
    return;
  }

  // Get development team from main app target
  let developmentTeam = null;
  const mainTarget = project.getFirstTarget();
  if (mainTarget) {
    const buildConfigList = project.hash.project.objects["XCConfigurationList"][mainTarget.firstTarget.buildConfigurationList];
    if (buildConfigList && buildConfigList.buildConfigurations) {
      for (const configRef of buildConfigList.buildConfigurations) {
        const config = project.hash.project.objects["XCBuildConfiguration"][configRef.value];
        if (config && config.buildSettings && config.buildSettings.DEVELOPMENT_TEAM) {
          developmentTeam = config.buildSettings.DEVELOPMENT_TEAM;
          break;
        }
      }
    }
  }

  // Generate UUIDs
  const targetUuid = project.generateUuid();
  const productFileUuid = project.generateUuid();
  const buildConfigListUuid = project.generateUuid();
  const debugBuildConfigUuid = project.generateUuid();
  const releaseBuildConfigUuid = project.generateUuid();
  const sourcesBuildPhaseUuid = project.generateUuid();
  const frameworksBuildPhaseUuid = project.generateUuid();
  const resourcesBuildPhaseUuid = project.generateUuid();
  const swiftFileUuid = project.generateUuid();
  const swiftBuildFileUuid = project.generateUuid();
  const groupUuid = project.generateUuid();
  const infoPlistFileUuid = project.generateUuid();
  const entitlementsFileUuid = project.generateUuid();
  const containerItemProxyUuid = project.generateUuid();
  const targetDependencyUuid = project.generateUuid();
  const embedBuildFileUuid = project.generateUuid();

  const productFileName = `${extName}.appex`;

  // Add PBXFileReference for product
  if (!project.hash.project.objects["PBXFileReference"]) {
    project.hash.project.objects["PBXFileReference"] = {};
  }
  project.hash.project.objects["PBXFileReference"][productFileUuid] = {
    isa: "PBXFileReference",
    explicitFileType: '"wrapper.app-extension"',
    includeInIndex: 0,
    path: `"${productFileName}"`,
    sourceTree: "BUILT_PRODUCTS_DIR",
  };
  project.hash.project.objects["PBXFileReference"][`${productFileUuid}_comment`] = productFileName;

  // Add Swift file reference
  project.hash.project.objects["PBXFileReference"][swiftFileUuid] = {
    isa: "PBXFileReference",
    lastKnownFileType: "sourcecode.swift",
    path: `"${ext.swiftFile}"`,
    sourceTree: '"<group>"',
  };
  project.hash.project.objects["PBXFileReference"][`${swiftFileUuid}_comment`] = ext.swiftFile;

  // Add Info.plist reference
  project.hash.project.objects["PBXFileReference"][infoPlistFileUuid] = {
    isa: "PBXFileReference",
    lastKnownFileType: "text.plist.xml",
    path: '"Info.plist"',
    sourceTree: '"<group>"',
  };
  project.hash.project.objects["PBXFileReference"][`${infoPlistFileUuid}_comment`] = "Info.plist";

  // Add entitlements reference
  project.hash.project.objects["PBXFileReference"][entitlementsFileUuid] = {
    isa: "PBXFileReference",
    lastKnownFileType: "text.plist.entitlements",
    path: `"${extName}.entitlements"`,
    sourceTree: '"<group>"',
  };
  project.hash.project.objects["PBXFileReference"][`${entitlementsFileUuid}_comment`] = `${extName}.entitlements`;

  // Add PBXGroup for extension
  if (!project.hash.project.objects["PBXGroup"]) {
    project.hash.project.objects["PBXGroup"] = {};
  }
  project.hash.project.objects["PBXGroup"][groupUuid] = {
    isa: "PBXGroup",
    children: [
      { value: swiftFileUuid, comment: ext.swiftFile },
      { value: infoPlistFileUuid, comment: "Info.plist" },
      { value: entitlementsFileUuid, comment: `${extName}.entitlements` },
    ],
    path: `"${extName}"`,
    sourceTree: '"<group>"',
  };
  project.hash.project.objects["PBXGroup"][`${groupUuid}_comment`] = extName;

  // Add group to main group
  const mainGroupUuid = project.getFirstProject().firstProject.mainGroup;
  const mainGroup = project.hash.project.objects["PBXGroup"][mainGroupUuid];
  if (mainGroup && mainGroup.children) {
    mainGroup.children.push({ value: groupUuid, comment: extName });
  }

  // Add product to Products group
  const productsGroupUuid = project.pbxGroupByName("Products")?.uuid;
  if (productsGroupUuid) {
    const productsGroup = project.hash.project.objects["PBXGroup"][productsGroupUuid];
    if (productsGroup && productsGroup.children) {
      productsGroup.children.push({ value: productFileUuid, comment: productFileName });
    }
  }

  // Add PBXBuildFile for swift source
  if (!project.hash.project.objects["PBXBuildFile"]) {
    project.hash.project.objects["PBXBuildFile"] = {};
  }
  project.hash.project.objects["PBXBuildFile"][swiftBuildFileUuid] = {
    isa: "PBXBuildFile",
    fileRef: swiftFileUuid,
    fileRef_comment: ext.swiftFile,
  };
  project.hash.project.objects["PBXBuildFile"][`${swiftBuildFileUuid}_comment`] = `${ext.swiftFile} in Sources`;

  // Add PBXSourcesBuildPhase
  if (!project.hash.project.objects["PBXSourcesBuildPhase"]) {
    project.hash.project.objects["PBXSourcesBuildPhase"] = {};
  }
  project.hash.project.objects["PBXSourcesBuildPhase"][sourcesBuildPhaseUuid] = {
    isa: "PBXSourcesBuildPhase",
    buildActionMask: 2147483647,
    files: [{ value: swiftBuildFileUuid, comment: `${ext.swiftFile} in Sources` }],
    runOnlyForDeploymentPostprocessing: 0,
  };
  project.hash.project.objects["PBXSourcesBuildPhase"][`${sourcesBuildPhaseUuid}_comment`] = "Sources";

  // Add PBXFrameworksBuildPhase
  if (!project.hash.project.objects["PBXFrameworksBuildPhase"]) {
    project.hash.project.objects["PBXFrameworksBuildPhase"] = {};
  }
  project.hash.project.objects["PBXFrameworksBuildPhase"][frameworksBuildPhaseUuid] = {
    isa: "PBXFrameworksBuildPhase",
    buildActionMask: 2147483647,
    files: [],
    runOnlyForDeploymentPostprocessing: 0,
  };
  project.hash.project.objects["PBXFrameworksBuildPhase"][`${frameworksBuildPhaseUuid}_comment`] = "Frameworks";

  // Add PBXResourcesBuildPhase
  if (!project.hash.project.objects["PBXResourcesBuildPhase"]) {
    project.hash.project.objects["PBXResourcesBuildPhase"] = {};
  }
  project.hash.project.objects["PBXResourcesBuildPhase"][resourcesBuildPhaseUuid] = {
    isa: "PBXResourcesBuildPhase",
    buildActionMask: 2147483647,
    files: [],
    runOnlyForDeploymentPostprocessing: 0,
  };
  project.hash.project.objects["PBXResourcesBuildPhase"][`${resourcesBuildPhaseUuid}_comment`] = "Resources";

  // Build settings for extension
  const commonBuildSettings = {
    ASSETCATALOG_COMPILER_GENERATE_SWIFT_ASSET_SYMBOL_EXTENSIONS: "YES",
    CLANG_ANALYZER_NONNULL: "YES",
    CLANG_ANALYZER_NUMBER_OBJECT_CONVERSION: "YES_AGGRESSIVE",
    CLANG_CXX_LANGUAGE_STANDARD: '"gnu++20"',
    CLANG_ENABLE_OBJC_WEAK: "YES",
    CLANG_WARN_DOCUMENTATION_COMMENTS: "YES",
    CLANG_WARN_QUOTED_INCLUDE_IN_FRAMEWORK_HEADER: "YES",
    CLANG_WARN_UNGUARDED_AVAILABILITY: "YES_AGGRESSIVE",
    CODE_SIGN_ENTITLEMENTS: `"${extName}/${extName}.entitlements"`,
    CODE_SIGN_STYLE: "Automatic",
    CURRENT_PROJECT_VERSION: 1,
    GCC_C_LANGUAGE_STANDARD: "gnu17",
    GENERATE_INFOPLIST_FILE: "YES",
    INFOPLIST_FILE: `"${extName}/Info.plist"`,
    INFOPLIST_KEY_CFBundleDisplayName: `"${extName}"`,
    INFOPLIST_KEY_NSHumanReadableCopyright: '""',
    IPHONEOS_DEPLOYMENT_TARGET: "16.0",
    LD_RUNPATH_SEARCH_PATHS: '"$(inherited) @executable_path/Frameworks @executable_path/../../Frameworks"',
    LOCALIZATION_PREFERS_STRING_CATALOGS: "YES",
    MARKETING_VERSION: "1.0",
    PRODUCT_BUNDLE_IDENTIFIER: `"${bundleId}"`,
    PRODUCT_NAME: '"$(TARGET_NAME)"',
    SKIP_INSTALL: "YES",
    SWIFT_ACTIVE_COMPILATION_CONDITIONS: '"$(inherited)"',
    SWIFT_EMIT_LOC_STRINGS: "YES",
    SWIFT_VERSION: "5.0",
    TARGETED_DEVICE_FAMILY: '"1,2"',
  };

  // Add development team - prefer configured team, then try from main target
  const teamToUse = configuredTeamId || developmentTeam;
  if (teamToUse) {
    commonBuildSettings.DEVELOPMENT_TEAM = teamToUse;
    console.log(`  Using development team: ${teamToUse}`);
  }

  // Add XCBuildConfiguration for Debug
  if (!project.hash.project.objects["XCBuildConfiguration"]) {
    project.hash.project.objects["XCBuildConfiguration"] = {};
  }
  project.hash.project.objects["XCBuildConfiguration"][debugBuildConfigUuid] = {
    isa: "XCBuildConfiguration",
    buildSettings: {
      ...commonBuildSettings,
      DEBUG_INFORMATION_FORMAT: "dwarf",
      MTL_ENABLE_DEBUG_INFO: "INCLUDE_SOURCE",
      SWIFT_OPTIMIZATION_LEVEL: '"-Onone"',
    },
    name: "Debug",
  };
  project.hash.project.objects["XCBuildConfiguration"][`${debugBuildConfigUuid}_comment`] = "Debug";

  // Add XCBuildConfiguration for Release
  project.hash.project.objects["XCBuildConfiguration"][releaseBuildConfigUuid] = {
    isa: "XCBuildConfiguration",
    buildSettings: {
      ...commonBuildSettings,
      COPY_PHASE_STRIP: "NO",
      DEBUG_INFORMATION_FORMAT: '"dwarf-with-dsym"',
      SWIFT_OPTIMIZATION_LEVEL: '"-O"',
    },
    name: "Release",
  };
  project.hash.project.objects["XCBuildConfiguration"][`${releaseBuildConfigUuid}_comment`] = "Release";

  // Add XCConfigurationList
  if (!project.hash.project.objects["XCConfigurationList"]) {
    project.hash.project.objects["XCConfigurationList"] = {};
  }
  project.hash.project.objects["XCConfigurationList"][buildConfigListUuid] = {
    isa: "XCConfigurationList",
    buildConfigurations: [
      { value: debugBuildConfigUuid, comment: "Debug" },
      { value: releaseBuildConfigUuid, comment: "Release" },
    ],
    defaultConfigurationIsVisible: 0,
    defaultConfigurationName: "Release",
  };
  project.hash.project.objects["XCConfigurationList"][`${buildConfigListUuid}_comment`] = `Build configuration list for PBXNativeTarget "${extName}"`;

  // Add PBXNativeTarget
  if (!project.hash.project.objects["PBXNativeTarget"]) {
    project.hash.project.objects["PBXNativeTarget"] = {};
  }
  project.hash.project.objects["PBXNativeTarget"][targetUuid] = {
    isa: "PBXNativeTarget",
    buildConfigurationList: buildConfigListUuid,
    buildConfigurationList_comment: `Build configuration list for PBXNativeTarget "${extName}"`,
    buildPhases: [
      { value: sourcesBuildPhaseUuid, comment: "Sources" },
      { value: frameworksBuildPhaseUuid, comment: "Frameworks" },
      { value: resourcesBuildPhaseUuid, comment: "Resources" },
    ],
    buildRules: [],
    dependencies: [],
    name: `"${extName}"`,
    productName: `"${extName}"`,
    productReference: productFileUuid,
    productReference_comment: productFileName,
    productType: '"com.apple.product-type.app-extension"',
  };
  project.hash.project.objects["PBXNativeTarget"][`${targetUuid}_comment`] = extName;

  // Add target to project
  const projectSection = project.hash.project.objects["PBXProject"];
  for (const key in projectSection) {
    if (projectSection[key].isa === "PBXProject") {
      projectSection[key].targets.push({ value: targetUuid, comment: extName });
      break;
    }
  }

  // Add container item proxy for dependency
  if (!project.hash.project.objects["PBXContainerItemProxy"]) {
    project.hash.project.objects["PBXContainerItemProxy"] = {};
  }
  const projectUuid = project.getFirstProject().uuid;
  project.hash.project.objects["PBXContainerItemProxy"][containerItemProxyUuid] = {
    isa: "PBXContainerItemProxy",
    containerPortal: projectUuid,
    containerPortal_comment: "Project object",
    proxyType: 1,
    remoteGlobalIDString: targetUuid,
    remoteInfo: `"${extName}"`,
  };
  project.hash.project.objects["PBXContainerItemProxy"][`${containerItemProxyUuid}_comment`] = "PBXContainerItemProxy";

  // Add target dependency
  if (!project.hash.project.objects["PBXTargetDependency"]) {
    project.hash.project.objects["PBXTargetDependency"] = {};
  }
  project.hash.project.objects["PBXTargetDependency"][targetDependencyUuid] = {
    isa: "PBXTargetDependency",
    target: targetUuid,
    target_comment: extName,
    targetProxy: containerItemProxyUuid,
    targetProxy_comment: "PBXContainerItemProxy",
  };
  project.hash.project.objects["PBXTargetDependency"][`${targetDependencyUuid}_comment`] = "PBXTargetDependency";

  // Add dependency to main target
  if (mainTarget) {
    const mainTargetObj = project.hash.project.objects["PBXNativeTarget"][mainTarget.uuid];
    if (mainTargetObj) {
      if (!mainTargetObj.dependencies) {
        mainTargetObj.dependencies = [];
      }
      mainTargetObj.dependencies.push({ value: targetDependencyUuid, comment: "PBXTargetDependency" });
    }
  }

  // Add embed extension build phase
  project.hash.project.objects["PBXBuildFile"][embedBuildFileUuid] = {
    isa: "PBXBuildFile",
    fileRef: productFileUuid,
    fileRef_comment: productFileName,
    settings: { ATTRIBUTES: ["RemoveHeadersOnCopy"] },
  };
  project.hash.project.objects["PBXBuildFile"][`${embedBuildFileUuid}_comment`] = `${productFileName} in Embed Foundation Extensions`;

  // Find or create Embed Foundation Extensions copy files phase
  let embedPhaseUuid = null;
  const copyFilesPhases = project.hash.project.objects["PBXCopyFilesBuildPhase"] || {};

  for (const key in copyFilesPhases) {
    if (typeof copyFilesPhases[key] === "object" && copyFilesPhases[key].name === '"Embed Foundation Extensions"') {
      embedPhaseUuid = key;
      break;
    }
  }

  if (!embedPhaseUuid) {
    embedPhaseUuid = project.generateUuid();
    if (!project.hash.project.objects["PBXCopyFilesBuildPhase"]) {
      project.hash.project.objects["PBXCopyFilesBuildPhase"] = {};
    }
    project.hash.project.objects["PBXCopyFilesBuildPhase"][embedPhaseUuid] = {
      isa: "PBXCopyFilesBuildPhase",
      buildActionMask: 2147483647,
      dstPath: '""',
      dstSubfolderSpec: 13,
      files: [],
      name: '"Embed Foundation Extensions"',
      runOnlyForDeploymentPostprocessing: 0,
    };
    project.hash.project.objects["PBXCopyFilesBuildPhase"][`${embedPhaseUuid}_comment`] = "Embed Foundation Extensions";

    // Add to main target build phases
    if (mainTarget) {
      const mainTargetObj = project.hash.project.objects["PBXNativeTarget"][mainTarget.uuid];
      if (mainTargetObj && mainTargetObj.buildPhases) {
        mainTargetObj.buildPhases.push({ value: embedPhaseUuid, comment: "Embed Foundation Extensions" });
      }
    }
  }

  // Add extension to embed phase
  const embedPhase = project.hash.project.objects["PBXCopyFilesBuildPhase"][embedPhaseUuid];
  if (embedPhase && embedPhase.files) {
    embedPhase.files.push({ value: embedBuildFileUuid, comment: `${productFileName} in Embed Foundation Extensions` });
  }
}

module.exports = withScreenTimeExtensions;
