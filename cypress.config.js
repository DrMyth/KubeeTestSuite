const { defineConfig } = require("cypress");
require("dotenv").config();

module.exports = defineConfig({
  e2e: {
    setupNodeEvents(on, config) {
      // implement node event listeners here
      require("cypress-mochawesome-reporter/plugin")(on);
    },
  },
  experimentalStudio: true,
  video: true,
  reporter: "cypress-mochawesome-reporter",
  env: {
    EMAIL: process.env.EMAIL,
    PASSWORD: process.env.PASSWORD,
    WORK_MODE: process.env.WORK_MODE,
    TEST_URL: process.env.TEST_URL,
    PASSWORD_HASHED: process.env.PASSWORD_HASHED,
    TEST_BACKEND_URL: process.env.TEST_BACKEND_URL,
  },
});
