// ***********************************************
// This example commands.js shows you how to
// create various custom commands and overwrite
// existing commands.
//
// For more comprehensive examples of custom
// commands please read more here:
// https://on.cypress.io/custom-commands
// ***********************************************
//
//
// -- This is a parent command --
// Cypress.Commands.add('login', (email, password) => { ... })
//
//
// -- This is a child command --
// Cypress.Commands.add('drag', { prevSubject: 'element'}, (subject, options) => { ... })
//
//
// -- This is a dual command --
// Cypress.Commands.add('dismiss', { prevSubject: 'optional'}, (subject, options) => { ... })
//
//
// -- This will overwrite an existing command --
// Cypress.Commands.overwrite('visit', (originalFn, url, options) => { ... })

require("dotenv").config();

Cypress.Commands.add(
  "forceClick",
  { prevSubject: "element" },
  (subject, options) => {
    // Click the element with force
    cy.wrap(subject).click({ force: true });
  }
);

Cypress.Commands.add("login", () => {
  // Configure the test environment
  function configureTestEnvironment() {
    // Ignore uncaught exceptions
    cy.on("uncaught:exception", (err) => {
      console.error("Uncaught exception:", err.message);
      return false;
    });
    cy.viewport(1280, 720);
  }

  function setLocalStorageData() {
    // Set the email, password, and work mode in local storage
    localStorage.setItem("email", Cypress.env("EMAIL"));
    localStorage.setItem("password", Cypress.env("PASSWORD"));
    localStorage.setItem("work_mode", Cypress.env("WORK_MODE"));
  }

  cy.session(
    "login-session",
    () => {
      // Intercept the login API
      cy.intercept("POST", "**/login").as("login");

      configureTestEnvironment();
      // setLocalStorageData();

      // Visit the signin page
      cy.visit(`${Cypress.env("TEST_URL")}/signin`, {
        timeout: 150000,
      });

      // Get the email input
      function getEmailInput() {
        return cy.get('input[placeholder="Email address"]');
      }

      // Get the password input
      function getPasswordInput() {
        return cy.get('input[id="password"]');
      }

      // Get the login button
      function getLoginButton() {
        return cy.get("button").contains(/log in/i);
      }

      // Submit valid credentials
      function submitValidCredentials() {
        getEmailInput().type(Cypress.env("EMAIL"));
        getPasswordInput().type(Cypress.env("PASSWORD"));
        getLoginButton().realClick();
      }

      // Submit valid credentials
      submitValidCredentials();

      // Wait for the login API to be called
      cy.wait("@login", { timeout: 100000 }).then((interception) => {
        const statusCode = interception.response.statusCode;

        if (statusCode === 200) {
          // Verify the dashboard page
          cy.get(".this-is-a-title.two", { timeout: 35000 }).should(
            "contain",
            "Dashboard"
          );
          cy.log("Already on the dashboard page");
        } else {
          // Verify the OTP page
          cy.location("pathname", { timeout: 35000 }).should("eq", "/Otp");

          // Verify the OTP input
          cy.contains("Enter your verification code", {
            timeout: 35000,
          }).should("be.visible");

          // Type the OTP
          cy.get(".ant-input", { timeout: 35000 }).each(($el) => {
            cy.wrap($el).type("0 ");
          });

          // Verify the dashboard page
          cy.location("pathname", { timeout: 35000 }).should(
            "eq",
            "/dashboard_module/Dashboard"
          );
        }
      });
    },
    {
      // Cache the session across specs
      cacheAcrossSpecs: true,
    }
  );
});
