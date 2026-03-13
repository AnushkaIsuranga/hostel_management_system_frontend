const jestConfig = require('../../jest.config')

describe('Jest configuration', () => {
  it('uses jsdom as the test environment', () => {
    expect(jestConfig.testEnvironment).toBe('jsdom')
  })

  it('loads the project setup file after environment setup', () => {
    expect(jestConfig.setupFilesAfterEnv).toEqual(['<rootDir>/jest.setup.js'])
  })
})
