module.exports = {
  testEnvironment: 'node',
  verbose: true,
  testMatch: ['**/__tests__/**/*.test.js'],
  collectCoverageFrom: [
    'src/**/*.js',
    '!src/config/**',
  ],
  coverageReporters: ['text', 'lcov'],
  coverageDirectory: 'coverage',
};
