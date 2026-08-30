import fs from 'node:fs';
import path from 'node:path';
import { app } from 'electron';

/**
 * Locates files shipped inside the app under assets/ — the default menu,
 * branding and logo.
 *
 * These are seeded into the user's data folder on first run so a fresh install
 * works immediately, rather than starting with a placeholder menu and no logo.
 * Once seeded, the copy in the data folder wins: the outlet can edit prices or
 * swap the logo without a rebuild, and an app update will not overwrite it.
 *
 * The path differs between running from source and running from a packaged
 * build, where extraResources places assets/ next to the app bundle.
 */
export function assetPath(name) {
  const candidates = app.isPackaged
    ? [
        path.join(process.resourcesPath, 'assets', name),
        path.join(app.getAppPath(), 'assets', name),
      ]
    : [
        path.join(app.getAppPath(), 'assets', name),
        path.join(process.cwd(), 'assets', name),
      ];

  return candidates.find((p) => fs.existsSync(p)) || null;
}

/**
 * Copies a bundled asset into the user data folder if it is not already there.
 * Returns true when a file was written.
 */
export function seedAsset(name) {
  const target = path.join(app.getPath('userData'), name);
  if (fs.existsSync(target)) return false;

  const source = assetPath(name);
  if (!source) return false;

  try {
    fs.copyFileSync(source, target);
    return true;
  } catch (err) {
    console.error(`[assets] could not seed ${name}:`, err.message);
    return false;
  }
}

/**
 * Seeds every bundled default. Called once at startup, before anything reads
 * the menu or branding.
 */
export function seedDefaults() {
  for (const name of ['menu.csv', 'branding.json', 'logo.png', 'logo.svg']) {
    if (seedAsset(name)) console.info(`[assets] seeded ${name}`);
  }
}
