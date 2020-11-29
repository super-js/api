module.exports = {
  preset                : 'ts-jest',
  testEnvironment       : 'node',
  rootDir               : '.',
  moduleFileExtensions  : ['ts', 'tsx', 'js', 'jsx', 'json'],
  collectCoverageFrom   : [
    '<rootDir>/src/**/*.ts',
    '!<rootDir>/src/**/*.d.ts',
    '!<rootDir>/src/**/*.spec.ts',
    '!<rootDir>/src/**/*.test.ts',
    '!<rootDir>/src/**/__*__/*',
  ]
};