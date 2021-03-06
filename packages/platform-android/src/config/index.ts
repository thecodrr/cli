/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import path from 'path';
import findAndroidAppFolder from './findAndroidAppFolder';
import findManifest from './findManifest';
import findPackageClassName from './findPackageClassName';
import readManifest from './readManifest';
import {ProjectParamsAndroid, DependencyParamsAndroid} from '../types';
import {XmlDocument} from 'xmldoc';

const getPackageName = (manifest: XmlDocument) => manifest.attr.package;

/**
 * Gets android project config by analyzing given folder and taking some
 * defaults specified by user into consideration
 */
export function projectConfig(
  folder: string,
  userConfig: ProjectParamsAndroid = {},
) {
  const src = userConfig.sourceDir || findAndroidAppFolder(folder);

  if (!src) {
    return null;
  }

  const sourceDir = path.join(folder, src);
  const isFlat = sourceDir.indexOf('app') === -1;
  const manifestPath = userConfig.manifestPath
    ? path.join(sourceDir, userConfig.manifestPath)
    : findManifest(sourceDir);

  if (!manifestPath) {
    return null;
  }

  const manifest = readManifest(manifestPath);

  const packageName = userConfig.packageName || getPackageName(manifest);

  if (!packageName) {
    throw new Error(`Package name not found in ${manifestPath}`);
  }

  const packageFolder =
    userConfig.packageFolder || packageName.replace(/\./g, path.sep);

  const mainFilePath = path.join(
    sourceDir,
    userConfig.mainFilePath ||
      `src/main/java/${packageFolder}/MainApplication.java`,
  );

  const stringsPath = path.join(
    sourceDir,
    userConfig.stringsPath || 'src/main/res/values/strings.xml',
  );

  const settingsGradlePath = path.join(
    folder,
    'android',
    userConfig.settingsGradlePath || 'settings.gradle',
  );

  const assetsPath = path.join(
    sourceDir,
    userConfig.assetsPath || 'src/main/assets',
  );

  const buildGradlePath = path.join(
    sourceDir,
    userConfig.buildGradlePath || 'build.gradle',
  );

  return {
    sourceDir,
    isFlat,
    folder,
    stringsPath,
    manifestPath,
    buildGradlePath,
    settingsGradlePath,
    assetsPath,
    mainFilePath,
    packageName,
  };
}

/**
 * Same as projectConfigAndroid except it returns
 * different config that applies to packages only
 */
export function dependencyConfig(
  folder: string,
  userConfig: DependencyParamsAndroid = {},
) {
  const src = userConfig.sourceDir || findAndroidAppFolder(folder);

  if (!src) {
    return null;
  }

  const sourceDir = path.join(folder, src);
  const manifestPath = userConfig.manifestPath
    ? path.join(sourceDir, userConfig.manifestPath)
    : findManifest(sourceDir);

  if (!manifestPath) {
    return null;
  }

  const manifest = readManifest(manifestPath);
  const packageName = userConfig.packageName || getPackageName(manifest);
  const packageClassName = findPackageClassName(sourceDir);

  /**
   * This module has no package to export
   */
  if (!packageClassName) {
    return null;
  }

  const packageImportPath =
    userConfig.packageImportPath ||
    `import ${packageName}.${packageClassName};`;

  const packageInstance =
    userConfig.packageInstance || `new ${packageClassName}()`;

  return {sourceDir, folder, packageImportPath, packageInstance};
}
