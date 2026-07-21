module.exports = {
  packagerConfig: {
    asar: true,
    executableName: 'ctx7proxy',
    appBundleId: 'dev.ctx7proxy.desktop',
    appCategoryType: 'public.app-category.developer-tools'
  },
  makers: [
    {
      name: '@electron-forge/maker-squirrel',
      config: { name: 'ctx7proxy' }
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
