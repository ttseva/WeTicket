/** @type {import('jest').Config} */
module.exports = {
  testEnvironment: "node",
  roots: ["<rootDir>/tests"],
  transform: {
    "^.+\\.tsx?$": [
      "ts-jest",
      {
        tsconfig: "<rootDir>/tsconfig.app.json"
      }
    ]
  },
  moduleNameMapper: {
    "^@app/(.*)$": "<rootDir>/src/app/$1",
    "^@pages/(.*)$": "<rootDir>/src/pages/$1",
    "^@shared/(.*)$": "<rootDir>/src/shared/$1"
  }
};
