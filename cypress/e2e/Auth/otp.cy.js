require("dotenv").config();

describe("OTP Page Tests", () => {
  function setLocalStorageData() {
    // set the email, password, and work mode in the local storage
    localStorage.setItem("email", Cypress.env("EMAIL"));
    localStorage.setItem("password", Cypress.env("PASSWORD_HASHED"));
    localStorage.setItem("work_mode", Cypress.env("WORK_MODE"));
  }

  function configureTestEnvironment() {
    // configure the test environment
    cy.on("uncaught:exception", (err) => {
      console.error("Uncaught exception:", err.message);
      return false;
    });
    cy.viewport(1280, 720);
  }

  function visitOtpPage() {
    // visit the otp page
    cy.visit(Cypress.env("TEST_URL") + "/Otp", {
      failOnStatusCode: false,
      timeout: 30000,
    });
    // verify that the otp page is loaded
    cy.contains("Enter your verification code", { timeout: 10000 }).should(
      "be.visible"
    );
  }

  beforeEach(() => {
    // set the email, password, and work mode in the local storage
    setLocalStorageData();
    // configure the test environment
    configureTestEnvironment();
    // visit the otp page
    visitOtpPage();
  });

  //INITIAL RENDERING TESTS
  describe("Page Structure Validation", () => {
    // Test Case: OTP Page Component Rendering
    // - Verifies that all essential components of the OTP page are rendered correctly.
    // - Checks for the presence of instructional text guiding the user to enter the verification code.
    // - Ensures the message about the verification code being sent to the registered email is visible.
    // - Validates that the OTP input field, the resend countdown button, and the back to login button are all present and visible to the user.
    it(
      "should display all essential OTP page components",
      { retries: 3 },
      () => {
        // Verify instructional text
        cy.contains("Enter your verification code").should("be.visible");
        cy.contains(
          "An email with a verificcation code has been sent to your registered Email"
        ).should("be.visible");

        // Verify interactive elements
        cy.get(".ant-input").should("be.visible");
        cy.get("button")
          .contains(/Resend in/i)
          .should("be.visible");
        cy.get("button")
          .contains(/Back to Log in/i)
          .should("be.visible");
      }
    );
  });

  // RESEND BUTTON COUNTDOWN TESTS
  describe("Resend OTP Functionality", () => {
    // Test Case: Resend OTP Button Countdown and Reset
    // - Simulates the countdown timer for the resend OTP button using cy.clock().
    // - Asserts that the resend button is disabled while the countdown is active (value should be greater than 80 seconds initially).
    // - Waits for the button to become enabled, then clicks it to trigger a resend.
    // - Verifies that the countdown resets to greater than 80 seconds after resending.
    // - Restores the clock to resume normal time progression.
    it(
      "should maintain disabled resend button during countdown and reset timer after resend",
      { retries: 3 },
      () => {
        // start the clock
        cy.clock();
        // verify that the resend button is disabled and the countdown is greater than 80 seconds
        cy.get("input#seconds")
          .invoke("val")
          .then((val) => {
            expect(Number(val)).to.be.greaterThan(80);
          });
        getResendButton().should("be.disabled");
        // click the resend button
        getResendButton().should("be.enabled").click();
        // verify that the countdown is reset to greater than 80 seconds
        cy.get("input#seconds")
          .invoke("val")
          .then((val) => {
            expect(Number(val)).to.be.greaterThan(80);
          });

        // restore the clock
        cy.clock().invoke("restore");
      }
    );
  });

  // OTP SUBMISSION TESTS
  describe("OTP Submission Scenarios", () => {
    // Test Case: Successful OTP Submission and Redirection
    // - Enters a valid OTP value into the input fields.
    // - Submits the OTP and waits for authentication.
    // - Verifies that the user is redirected to the dashboard page upon successful authentication.
    it(
      "should successfully authenticate with valid OTP and redirect to dashboard",
      { retries: 3 },
      () => {
        // enter the valid otp
        enterOtp("0");
        // verify that the user is redirected to the dashboard page
        cy.location("pathname", { timeout: 35000 }).should(
          "eq",
          "/dashboard_module/Dashboard"
        );
      }
    );

    // Test Case: Invalid OTP Submission Error Handling
    // - Enters an invalid OTP value into the input fields.
    // - Submits the OTP and expects the authentication to fail.
    // - Checks that an error message is displayed, indicating the OTP is incorrect.
    it(
      "should display error message when submitting invalid OTP",
      { retries: 3 },
      () => {
        // enter the invalid otp
        enterOtp("9");
        // verify that the error message is displayed
        cy.get(".ant-alert-message")
          .should("be.visible")
          .and("contain", "OTP is wrong!");
      }
    );
  });

  // NAVIGATION TESTS: Back to Login
  describe("Navigation Tests", () => {
    // Test Case: Back to Login Navigation
    // - Simulates clicking the "Back to Log in" button on the OTP page.
    // - Verifies that the user is redirected to the login page ("/signin").
    it(
      "should return to login page when clicking back button",
      { retries: 3 },
      () => {
        // click the back button
        getBackButton().click();
        // verify that the user is redirected to the login page
        cy.location("pathname", { timeout: 10000 }).should("eq", "/signin");
      }
    );
  });

  //HELPER FUNCTIONS

  function getResendButton() {
    return cy.get('button:contains("Resend in")', { timeout: 95000 });
  }

  function enterOtp(digit) {
    cy.get(".input-otp__field").each(($el) => {
      cy.wrap($el).type(digit, { force: true });
    });
  }

  function getBackButton() {
    return cy.get("button").contains(/Back to Log in/i);
  }
});
