const localMacIdentity = process.platform === 'darwin' && !process.env.CI
  ? 'Developer ID Application: TUYEN HO (Y69F3DRK44)'
  : undefined;
const macIdentity = process.env.APPLE_SIGNING_IDENTITY || localMacIdentity;
const notarizationConfigured = process.env.APPLE_ID
  && process.env.APPLE_PASSWORD
  && process.env.APPLE_TEAM_ID;
const macNotarization = notarizationConfigured
  ? {
      tool: 'notarytool',
      appleId: process.env.APPLE_ID,
      appleIdPassword: process.env.APPLE_PASSWORD,
      teamId: process.env.APPLE_TEAM_ID
    }
  : localMacIdentity
    ? { keychainProfile: 'twinpane-notary' }
    : undefined;

module.exports = {
  packagerConfig: {
    asar: true,
    executableName: 'ctx7proxy',
    appBundleId: 'dev.ctx7proxy.desktop',
    appCategoryType: 'public.app-category.developer-tools',
    ...(macIdentity ? { osxSign: { identity: macIdentity } } : {}),
    ...(macNotarization ? { osxNotarize: macNotarization } : {})
  },
  makers: [
    {
      name: '@electron-forge/maker-squirrel',
      config: {
        name: 'ctx7proxy',
        ...(process.env.WINDOWS_CERTIFICATE_FILE ? {
          certificateFile: process.env.WINDOWS_CERTIFICATE_FILE,
          certificatePassword: process.env.WINDOWS_CERTIFICATE_PASSWORD
        } : {})
      }
    },
    {
      name: '@electron-forge/maker-dmg',
      platforms: ['darwin'],
      config: { format: 'ULFO' }
    },
    {
      name: '@electron-forge/maker-zip',
      platforms: ['darwin']
    }
  ]
};
