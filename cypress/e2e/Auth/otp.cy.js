require('dotenv').config()

describe("OTP Page Tests", () => {
  function setLocalStorageData() {
    localStorage.setItem("email", Cypress.env("EMAIL"));
    localStorage.setItem("password", Cypress.env("PASSWORD_PLAIN_TEXT"));
    localStorage.setItem("work_mode", Cypress.env("WORK_MODE"));
  }

  function configureTestEnvironment() {
    cy.on("uncaught:exception", (err) => {
      console.error("Uncaught exception:", err.message);
      return false;
    });
    cy.viewport(1280, 720);
  }

  function visitOtpPage() {
    cy.log("Visiting OTP page with url: ", Cypress.env("TEST_URL"));
    cy.visit(`${Cypress.env("TEST_URL")}/Otp`, {
      failOnStatusCode: false,
      timeout: 30000,
    });

    cy.contains("Enter your verification code", { timeout: 10000 }).should("be.visible");
  }

  before(() => {
    setLocalStorageData();
  });
  
  beforeEach(() => {
    setLocalStorageData();
    configureTestEnvironment();
    visitOtpPage();
  });

  //Component Rendering Tests
  context('Page Structure Validation', () => {
    it('should display all essential OTP page components', () => {
      // Verify instructional text
      cy.contains('Enter your verification code').should('be.visible');
      cy.contains('An email with a verificcation code has been sent to your registered Email').should('be.visible');
      
      // Verify interactive elements
      cy.get('.ant-input').should('be.visible');
      cy.get('button').contains(/Resend in/i).should('be.visible');
      cy.get('button').contains(/Back to Log in/i).should('be.visible');
    });
  });

  // Resend Button Countdown Tests
  context('Resend OTP Functionality', () => {
    it('should maintain disabled resend button during countdown and reset timer after resend', () => {
      cy.clock();
      
      cy.get('input#seconds').should('have.value', '30');
      getResendButton().should('be.disabled');
      // cy.tick(31000);
      getResendButton().should('be.enabled').click();
      cy.get('input#seconds').should('have.value', '30');
      
      cy.clock().invoke("restore");
    });
  });

  // OTP Submission Tests
  context('OTP Submission Scenarios', () => {
    it('should successfully authenticate with valid OTP and redirect to dashboard', () => {
      enterOtp('0');
      cy.location("pathname", { timeout: 10000 }).should(
        "eq",
        "/dashboard_module/Dashboard"
      );
    });

    it('should display error message when submitting invalid OTP', () => {
      enterOtp('9');
      cy.get('.ant-alert-message')
        .should('be.visible')
        .and('contain', 'OTP is wrong!');
    });
  });

  // Navigation Test: Back to Login
  context('Navigation Tests', () => {
    it('should return to login page when clicking back button', () => {
      getBackButton().click();
      cy.location("pathname", { timeout: 10000 }).should("eq", "/signin");
    });
  });

  // HELPER FUNCTIONS
  function getResendButton() {
    return cy.get('button:contains("Resend in")', {timeout: 90001});
  }

  function enterOtp(digit) {
    cy.get('.ant-input').each(($el) => cy.wrap($el).type(digit));
  }

  function getBackButton() {
    return cy.get('button').contains(/Back to Log in/i);
  }
});
