const dotenv = require("dotenv");

dotenv.config({
  path: ".env.development",
});

const nextJest = require("next/jest");

const createJestConfig = nextJest({
  dir: ".",
});

// const jestConfig = createJestConfig({
//   moduleDirectories: ["node_modules", "<rootDir>"],
//   testTimeout: 60000,
// });

const jestConfig = async () => {
  const config = await createJestConfig({
    moduleDirectories: ["node_modules", "<rootDir>"],
    testTimeout: 60000,
  })();

  // We tell Jest: "Ignore everything in node_modules EXCEPT @faker-js"
  config.transformIgnorePatterns = ["/node_modules/(?!(@faker-js)/)"];

  return config;
};

module.exports = jestConfig;
