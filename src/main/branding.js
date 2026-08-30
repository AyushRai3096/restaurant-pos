import fs from 'node:fs';
import path from 'node:path';
import { app } from 'electron';

/**
 * Outlet branding, read from branding.json in the app data folder next to the
 * database and menu.csv. Editing that file changes the name, window title and
 * logo without a rebuild — the same reasoning as the menu.
 *
 * A logo image can be dropped in as logo.png in the same folder; it is read and
 * inlined as a data URI so the renderer's strict CSP does not have to allow
 * file:// access.
 */

const FILE_NAME = 'branding.json';
const LOGO_NAMES = ['logo.png', 'logo.jpg', 'logo.jpeg', 'logo.svg'];

const DEFAULTS = {
  // The restaurant this POS is for, not the software vendor.
  outletName: 'Veer Ji Malai Chaap Wale',
  branchName: '(Paschim Vihar)',
  outletCode: '',
  // Shown in the nav when there is no logo image.
  markText: 'V',
  wordmark: 'VEERJI',
  wordmarkAccent: 'POS',
  tagline: 'Restaurant Management',
};

export function brandingFilePath() {
  return path.join(app.getPath('userData'), FILE_NAME);
}

function readLogo() {
  for (const name of LOGO_NAMES) {
    const file = path.join(app.getPath('userData'), name);
    try {
      if (!fs.existsSync(file)) continue;
      const ext = path.extname(name).slice(1).toLowerCase();
      const mime = ext === 'svg' ? 'image/svg+xml' : `image/${ext === 'jpg' ? 'jpeg' : ext}`;
      const data = fs.readFileSync(file).toString('base64');
      return `data:${mime};base64,${data}`;
    } catch {
      // A bad image must not stop the app starting.
    }
  }
  return null;
}

/** Writes a starter branding.json so there is something to edit. */
function writeDefaultFile() {
  fs.writeFileSync(brandingFilePath(), JSON.stringify(DEFAULTS, null, 2) + '\n', 'utf8');
}

export function loadBranding() {
  const file = brandingFilePath();
  let config = DEFAULTS;

  try {
    if (!fs.existsSync(file)) {
      writeDefaultFile();
    } else {
      // Unknown keys are ignored; missing ones fall back to the defaults, so a
      // partial edit can never leave the nav bar blank.
      config = { ...DEFAULTS, ...JSON.parse(fs.readFileSync(file, 'utf8')) };
    }
  } catch (err) {
    console.error('[branding] using defaults:', err.message);
  }

  return { ...config, logo: readLogo(), file, logoFolder: app.getPath('userData') };
}
