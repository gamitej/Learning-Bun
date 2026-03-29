export default {
  extends: ['@commitlint/config-conventional'],
  rules: {
    'type-enum': [
      2,
      'always',
      [
        'feat',
        'fix',
        'chore',
        'refactor',
        'docs',
        'style',
        'perf',
        'test',
        'ci',
        'revert',
        'build'
      ],
    ],
  },
};