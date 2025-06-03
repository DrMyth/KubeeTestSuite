require("dotenv").config();

describe("Logout Functionality", () => {
  function configureTestEnvironment() {
    // configure the test environment
    cy.on("uncaught:exception", (err) => {
      console.error("Uncaught exception:", err.message);
      return false;
    });
    cy.viewport(1280, 720);
  }

  beforeEach(() => {
    // clear the session cache
    Cypress.session.clearAllSavedSessions();
    // register a session named "loggedInSession" to avoid side effects.
    cy.session("loggedInSession", () => {
      cy.login();
    });
    // configure the test environment
    configureTestEnvironment();
    // visit the dashboard page
    cy.visit(Cypress.env("TEST_URL") + "/dashboard_module/Dashboard");
    // verify that the dashboard page is loaded
    cy.contains("Dashboard", { timeout: 10000 }).should("be.visible");
  });

  // LOCAL STORAGE CLEARING TESTS
  describe("Logout Functionality - Clear Session and Redirect", () => {
    // Test Case: Logout Functionality - Clear Session and Redirect
    // Simulates a logout action by clicking the logout button.
    // Verifies that the user is redirected to the login page.
    // Asserts that all relevant tokens are removed from localStorage to ensure session invalidation.
    it(
      "should clear localStorage and redirect to login on logout and checks for protected route access after logout",
      { retries: 3 },
      () => {
        // click the logout button
        clickLogoutButton();
        // verify that the user is redirected to the login page
        cy.url({ timeout: 10000 }).should("include", "/signin");
        // verify that the local storage is cleared
        verifyLocalStorageCleared();

        // PROTECTED ROUTE ACCESS TESTS
        // Test Case: Logout Functionality - Protected Route Access
        // Simulates a logout action by clicking the logout button.
        // Verifies that the user is redirected to the login page.
        // Asserts that the user cannot access protected routes directly via URL.
        // visit the protected route
        cy.visit(Cypress.env("TEST_URL") + "/settings/MyProfile", {
          failOnStatusCode: false,
        });
        // verify that the local storage is cleared
        verifyLocalStorageCleared();
        // verify that the user is redirected to the login page
        cy.url().should("include", "/signin");
      }
    );
  });

  // HELPER FUNCTIONS

  function clickLogoutButton() {
    // click the logout button
    cy.get("#corner_picture").click();
    // verify that the logout button is visible
    cy.contains("Log Out").should("be.visible").click();
  }

  function verifyLocalStorageCleared() {
    // verify that the local storage is cleared
    cy.window({ timeout: 10000 }).should((win) => {
      // verify that the token is cleared
      expect(win.localStorage.getItem("token")).to.be.null;
      // verify that the general token is cleared
      expect(win.localStorage.getItem("general_token")).to.be.null;
      // verify that the access token id is cleared
      expect(win.localStorage.getItem("access_token_id")).to.be.null;
    });
  }
});
