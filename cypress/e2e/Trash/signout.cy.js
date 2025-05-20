require('dotenv').config()

describe("Logout Functionality", () => {
  function configureTestEnvironment() {
    cy.on("uncaught:exception", (err) => {
      console.error("Uncaught exception:", err.message);
      return false;
    });
    cy.viewport(1280, 720);
  }

  beforeEach(() => {
    Cypress.session.clearAllSavedSessions(); 
    cy.session("loggedInSession", () => {
      cy.login();
    });
    configureTestEnvironment();
    cy.visit(
      `${Cypress.env("TEST_URL")}/dashboard_module/Dashboard`
    );
    cy.contains("Dashboard", { timeout: 10000 }).should("be.visible");
  });

  describe("Logout Functionality - Clear Session and Redirect", () => {
    it("should clear localStorage and redirect to login on logout", () => {
        clickLogoutButton();
        cy.url({ timeout: 10000 }).should("include", "/signin");
        verifyLocalStorageCleared();
    });
  });

  describe("Logout Functionality - Protected Route Access", () => {
    it("should not allow access to a protected route after logout", () => {
        clickLogoutButton();
        cy.url({ timeout: 10000 }).should("include", "/signin");
        cy.visit(`${Cypress.env("TEST_URL")}/settings/MyProfile`, {
          failOnStatusCode: false,
        });
        verifyLocalStorageCleared();
        cy.url().should("include", "/signin");
    });
  });

  // HELPER FUNCTIONS
  function clickLogoutButton() {
    cy.get("#corner_picture").click();
    cy.contains("Log Out").should("be.visible").click();
  }

  function verifyLocalStorageCleared() {
    cy.window({ timeout: 10000 }).should((win) => {
      expect(win.localStorage.getItem("token")).to.be.null;
      expect(win.localStorage.getItem("general_token")).to.be.null;
      expect(win.localStorage.getItem("access_token_id")).to.be.null;
    });
  }  
});
