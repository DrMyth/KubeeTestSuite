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
    localStorage.setItem("password", Cypress.env("PASSWORD_PLAIN_TEXT"));
    localStorage.setItem("work_mode", Cypress.env("WORK_MODE"));
  }

  cy.session(
    "login-session",
    () => {
      cy.intercept("POST", "**/login").as("login");

      configureTestEnvironment();
      // setLocalStorageData();

      cy.visit(`${Cypress.env("TEST_URL")}/signin`, {
        timeout: 150000,
      });

      function getEmailInput() {
        return cy.get('input[placeholder="Email address"]');
      }
    
      function getPasswordInput() {
        return cy.get('input[id="password"]');
      }

      function getLoginButton() {
        return cy.get("button").contains(/log in/i);
      }

      function submitValidCredentials() {
        getEmailInput().type("varunmaramreddy.work@gmail.com");
        getPasswordInput().type("Var14@#Re");
        getLoginButton().realClick();
      }

      submitValidCredentials();

      cy.wait("@login", { timeout: 100000 });

      // check if the url path inclde Otp then click the Otp below or else if the url contains /dashboard_module/Dashboard then do nothing
      if (window.location.pathname.includes("Otp")) {
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
      } else if (window.location.pathname.includes("/dashboard_module/Dashboard")) {
        cy.get(".this-is-a-title.two").should("contain", "Dashboard");
        cy.log("Already on the dashboard page");
      }      
    },
    {
      cacheAcrossSpecs: true,
    }
  );
});
