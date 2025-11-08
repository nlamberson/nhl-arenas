module.exports = {
  root: true,
  extends: ['universe/native', 'universe/shared/typescript-analysis'],
  rules: {
    '@typescript-eslint/no-unused-vars': ['warn', {argsIgnorePattern: '^_'}],
  },
};
