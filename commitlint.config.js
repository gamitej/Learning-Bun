export default {
  extends: ['@commitlint/config-conventional'],
  rules: {
    'type-enum': [
      2,
      'always',
      [
        'feat', // New feature for the user, not a new feature for build script
        'fix', // Bug fix for the user, not a fix to a build script
        'chore', // Changes to the build process or auxiliary tools and libraries such as documentation generation
        'refactor', // A code change that neither fixes a bug nor adds a feature
        'docs', // Documentation only changes
        'style', // Changes that do not affect the meaning of the code (white-space, formatting, missing semi-colons, etc)
        'perf', // A code change that improves performance
        'test', // Adding missing tests or correcting existing tests
        'ci', // Changes to our CI configuration files and scripts
        'revert', // Reverts a previous commit
        'build' // Changes that affect the build system or external dependencies (example scopes: gulp, broccoli, npm)
      ],
    ],
  },
};