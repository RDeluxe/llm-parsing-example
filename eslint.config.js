// eslint.config.js
const antfu = require('@antfu/eslint-config').default

module.exports = antfu(
  // Configures for antfu's config
  {
    ignores: [
      '**/dist/',
      '**/temp/',
    ],
    rules: {
      'node/prefer-global/process': ['error', 'always'],
      'antfu/no-top-level-await': 'off',
    },
  },
  // From the second arguments they are ESLint Flat Configs
  // Careful, antfu renames some plugins for consistency https://github.com/antfu/eslint-config?tab=readme-ov-file#plugins-renaming
)
