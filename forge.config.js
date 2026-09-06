const { FusesPlugin } = require('@electron-forge/plugin-fuses');
const { FuseV1Options, FuseVersion } = require('@electron/fuses');

// The Vite plugin packages ONLY the `.vite/` build output — its default
// `ignore` drops all of node_modules on the assumption the main bundle is
// self-contained. `better-sqlite3` is marked external in vite.main.config.mjs
// (a .node binary can't be bundled), so we have to let its folder through by
// hand. Defining `ignore` as a function here makes the Vite plugin defer to
// ours instead of installing its own. Everything else the main process needs
// (electron-squirrel-startup, etc.) is plain JS and gets bundled by Vite.
// A path is kept if it IS one of these prefixes or sits underneath one. The
// bare `/node_modules` entry has to pass so the packager descends into it.
const KEEP = [
  /^[/\\]\.vite($|[/\\])/,
  /^[/\\]node_modules$/,
  /^[/\\]node_modules[/\\]better-sqlite3($|[/\\])/,
];

module.exports = {
  packagerConfig: {
    asar: true,
    // App icon for the packaged .exe and its window. Packager appends the
    // platform extension, so this resolves to assets/icon.ico on Windows.
    icon: './assets/icon',
    // assets/ ships alongside the app rather than inside the asar, so the
    // default menu, branding and logo can be read as ordinary files.
    extraResource: ['./assets'],
    // `file` is repo-relative and starts with a separator; `''` is the root.
    ignore: (file) => file !== '' && !KEEP.some((re) => re.test(file)),
  },
  // better-sqlite3 v13 ships a prebuilt N-API binary per platform in its own
  // package (prebuilds/*.node). N-API is ABI-stable across Node and Electron,
  // so the Electron 43 runtime loads prebuilds/win32-x64.node unchanged. Tell
  // @electron/rebuild to rebuild nothing — a from-source recompile would need a
  // full MSVC toolchain for no gain, and pointlessly bloats the build.
  rebuildConfig: { onlyModules: [] },
  makers: [
    {
      name: '@electron-forge/maker-squirrel',
      config: {
        // Icon shown in the installer UI and for the Add/Remove Programs entry.
        setupIcon: './assets/icon.ico',
      },
    },
    {
      name: '@electron-forge/maker-zip',
      platforms: ['darwin'],
    },
    {
      name: '@electron-forge/maker-deb',
      config: {},
    },
    {
      name: '@electron-forge/maker-rpm',
      config: {},
    },
  ],
  plugins: [
    // Unpacks better-sqlite3's *.node out of the asar (Electron can't dlopen
    // from inside an archive). Must sit before the Vite plugin so its
    // asar.unpack glob is in place when packaging runs.
    { name: '@electron-forge/plugin-auto-unpack-natives', config: {} },
    {
      name: '@electron-forge/plugin-vite',
      config: {
        // `build` can specify multiple entry builds, which can be Main process, Preload scripts, Worker process, etc.
        // If you are familiar with Vite configuration, it will look really familiar.
        build: [
          {
            // `entry` is just an alias for `build.lib.entry` in the corresponding file of `config`.
            entry: 'src/main.js',
            config: 'vite.main.config.mjs',
            target: 'main',
          },
          {
            entry: 'src/preload.js',
            config: 'vite.preload.config.mjs',
            target: 'preload',
          },
        ],
        renderer: [
          {
            name: 'main_window',
            config: 'vite.renderer.config.mjs',
          },
        ],
      },
    },
    // Fuses are used to enable/disable various Electron functionality
    // at package time, before code signing the application
    new FusesPlugin({
      version: FuseVersion.V1,
      [FuseV1Options.RunAsNode]: false,
      [FuseV1Options.EnableCookieEncryption]: true,
      [FuseV1Options.EnableNodeOptionsEnvironmentVariable]: false,
      [FuseV1Options.EnableNodeCliInspectArguments]: false,
      [FuseV1Options.EnableEmbeddedAsarIntegrityValidation]: true,
      [FuseV1Options.OnlyLoadAppFromAsar]: true,
    }),
  ],
};
