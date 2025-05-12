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

require('dotenv').config()

Cypress.Commands.add(
  "forceClick",
  { prevSubject: "element" },
  (subject, options) => {
    cy.wrap(subject).click({ force: true });
  }
);

Cypress.Commands.add("login", () => {
  function configureTestEnvironment() {
    cy.on("uncaught:exception", (err) => {
      console.error("Uncaught exception:", err.message);
      return false;
    });
    cy.viewport(1280, 720);
  }

  function setLocalStorageData() {
    localStorage.setItem("email", Cypress.env("EMAIL"));
    localStorage.setItem("password", Cypress.env("PASSWORD"));
    localStorage.setItem("work_mode", Cypress.env("WORK_MODE"));
  }

  cy.session(
    "login-session",
    () => {
      configureTestEnvironment();
      setLocalStorageData();

      cy.visit("https://bmsredesign.kubeedevelopment.com/Otp", {
        timeout: 150000,
      });

      cy.contains("Enter your verification code", { timeout: 10000 }).should(
        "be.visible"
      );

      cy.get(".ant-input", { timeout: 10000 }).each(($el) => {
        cy.wrap($el).type("0 ");
      });

      cy.location("pathname", { timeout: 30000 }).should(
        "eq",
        "/dashboard_module/Dashboard"
      );
    },
    {
      cacheAcrossSpecs: true,
    }
  );
});
