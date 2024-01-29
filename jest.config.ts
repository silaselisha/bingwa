module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'jest-environment-node',
  watchman: true,
  setupFiles: ['dotenv/config'],
  forceExit: true
}
