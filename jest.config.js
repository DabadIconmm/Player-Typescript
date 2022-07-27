module.exports = {
    transform: {
      '^.+\\.(t|j)sx?$': ['@swc/jest', { ...config, /* custom configuration in Jest */ }],
    },
  }