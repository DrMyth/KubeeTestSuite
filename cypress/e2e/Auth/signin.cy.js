require("dotenv").config();

describe("Signin Page Tests", () => {
  function configureTestEnvironment() {
    // configure the test environment
    cy.on("uncaught:exception", (err) => {
      console.error("Uncaught exception:", err.message);
      return false;
    });
    cy.viewport(1280, 720);
  }

  function visitSigninPage() {
    // visit the signin page
    cy.visit(Cypress.env("TEST_URL") + "/signin", {
      onBeforeLoad(win) {
        win.event = { currentTarget: win.document.querySelector("form") };
      },
      failOnStatusCode: false,
      timeout: 30000,
    });
  }

  beforeEach(() => {
    // configure the test environment
    configureTestEnvironment();
    // visit the signin page
    visitSigninPage();
  });

  // INITIAL RENDERING TESTS
  describe("Page Structure Validation", () => {
    // Test Case: Validates that all essential signin components are visible on the page.
    // This test ensures that the email input, password input, login button, forgot password link,
    // and work mode switch are all rendered and visible to the user upon visiting the signin page.
    // It verifies the presence and visibility of each critical UI element required for login.
    it("should display all essential signin components", { retries: 3 }, () => {
      // verify that the email input is visible
      getEmailInput().should("be.visible");
      // verify that the password input is visible
      getPasswordInput().should("be.visible");
      // verify that the login button is visible
      getLoginButton().should("be.visible");
      // verify that the forgot password link is visible
      getForgotPasswordLink().should("be.visible");
      // verify that the work mode switch is visible
      getWorkModeSwitch().should("be.visible");
    });
  });

  // FORM INTERACTION TESTS
  describe("Form Interactions", () => {
    // Test Case: Password Visibility Toggle Functionality
    // This test checks that clicking the eye icon toggles the password input field between
    // 'password' and 'text' types, allowing users to show or hide their password as needed.
    // It ensures the toggle works correctly and the input type changes as expected.
    it(
      "should toggle password visibility when clicking eye icon",
      { retries: 3 },
      () => {
        // verify that the password input is in password mode
        getPasswordInput().should("have.attr", "type", "password");
        // click the password visibility toggle
        getPasswordVisibilityToggle().click();
        // verify that the password input is in text mode
        getPasswordInput().should("have.attr", "type", "text");
        // click the password visibility toggle
        getPasswordVisibilityToggle().click();
        // verify that the password input is in password mode
        getPasswordInput().should("have.attr", "type", "password");
      }
    );

    // Test Case: Work Mode Switch Toggle Functionality
    // This test verifies that clicking the work mode switch toggles its state between checked and unchecked.
    // It checks the 'aria-checked' attribute to confirm the switch's state changes appropriately on each click.
    // This ensures the work mode switch is interactive and reflects the correct state.
    it(
      "should toggle work mode switch state when clicked",
      { retries: 3 },
      () => {
        // verify that the work mode switch is in unchecked state
        getWorkModeSwitch().should("have.attr", "aria-checked", "false");
        // click the work mode switch
        getWorkModeSwitch().click();
        // verify that the work mode switch is in checked state
        getWorkModeSwitch().should("have.attr", "aria-checked", "true");
        // click the work mode switch
        getWorkModeSwitch().click();
        // verify that the work mode switch is in unchecked state
        getWorkModeSwitch().should("have.attr", "aria-checked", "false");
      }
    );
  });

  // FORM SUBMISSION HANDLING
  describe("Form Submission Handling", () => {
    // Test Case: Successful Login with Valid Credentials
    // This test submits the signin form using valid credentials, verifies that a loading spinner appears,
    // and checks for redirection to either the OTP or dashboard page. It ensures the login flow works as intended
    // and that users are properly redirected after a successful login attempt.
    it(
      "should show loading state and redirect on valid credentials",
      { retries: 3 },
      () => {
        // submit the valid credentials
        submitValidCredentials();
        // verify that the loading feedback is displayed
        verifyLoadingFeedback();
        // verify that the user is redirected to the OTP or dashboard page
        cy.location("pathname", { timeout: 10000 }).should((path) => {
          expect(["/Otp", "/dashboard_module/Dashboard"]).to.include(path);
        });
      }
    );

    // Test Case: Error Handling for Invalid Credentials
    // This test attempts to sign in with invalid credentials and verifies that an error message
    // indicating 'Invalid Username/Password' is displayed. It ensures the system provides feedback
    // for failed login attempts and prevents unauthorized access.
    it(
      "should display error message for invalid credentials",
      { retries: 3 },
      () => {
        // submit the invalid credentials
        submitInvalidCredentials();
        // verify that the error message is displayed
        getAlertMessage()
          .should("be.visible")
          .and("contain", "Invalid Username/Password");
      }
    );

    // Test Case: Form Validation for Required Fields
    // This test submits the form with empty fields, only email, and only password to ensure
    // appropriate validation messages are shown for missing required inputs. It checks that the
    // form enforces required fields and provides clear feedback to the user.
    it(
      "should show validation messages for empty required fields",
      { retries: 3 },
      () => {
        // test the form validation
        testFormValidation();
      }
    );
  });

  // NAVIGATION TESTS
  describe("Navigation Tests", () => {
    // Test Case: Forgot Password Navigation
    // This test clicks the 'Forgot Password' link and verifies that the user is redirected to the forgot password page.
    // It ensures that the navigation link works correctly and users can access the password recovery flow.
    it(
      "should redirect to forgot password page when link is clicked",
      { retries: 3 },
      () => {
        // click the forgot password link
        getForgotPasswordLink().click();
        // verify that the user is redirected to the forgot password page
        cy.location("pathname", { timeout: 10000 }).should("eq", "/forgot");
      }
    );
  });

  // HELPER FUNCTIONS

  function getEmailInput() {
    return cy.get('input[placeholder="Email address"]');
  }

  function getPasswordInput() {
    return cy.get('input[id="password"]');
  }

  function getLoginButton() {
    return cy.get("button").contains(/log in/i);
  }

  function getForgotPasswordLink() {
    return cy.get("a").contains(/forgot password/i);
  }

  function getWorkModeSwitch() {
    return cy.get(".switch-wrap .ant-switch");
  }

  function getPasswordVisibilityToggle() {
    return cy.get("span.ant-input-suffix").first();
  }

  function getAlertMessage() {
    return cy.get(".ant-alert-message");
  }

  function submitValidCredentials() {
    // enter the email
    getEmailInput().type(Cypress.env("EMAIL"));
    // enter the password
    getPasswordInput().type(Cypress.env("PASSWORD"));
    // click the login button
    getLoginButton().click();
  }

  function submitInvalidCredentials() {
    // enter the invalid email
    getEmailInput().type("invalid@example.com");
    // enter the invalid password
    getPasswordInput().type("invalidPassword");
    // click the login button
    getLoginButton().click();
  }

  function verifyLoadingFeedback() {
    // verify that the loading feedback is displayed
    cy.get(".ant-spin-spinning").should("be.visible");
    // verify that the alert message is displayed
    cy.get("body").then(($body) => {
      if ($body.find(".ant-alert-message").length > 0) {
        getAlertMessage()
          .should("be.visible")
          .and("contain.text", "OTP has been sent to your registered email");
      } else {
        // log a message if no alert message is detected
        cy.log("No alert message detected - assuming existing session");
      }
    });
  }

  function testFormValidation() {
    // test empty form submission
    getLoginButton().click();
    // verify that the error message is displayed
    cy.get(".ant-form-item-explain-error")
      .should("contain.text", "Please input your E-mail!")
      .and("contain.text", "Please input your Password!");

    // test email-only submission
    // enter the email
    getEmailInput().type("test@example.com");
    // click the login button
    getLoginButton().click();
    // verify that the error message is displayed
    cy.get(".ant-form-item-explain-error")
      .should("not.contain.text", "Please input your E-mail!")
      .and("contain.text", "Please input your Password!");

    // test password-only submission
    // clear the email input
    getEmailInput().clear();
    // enter the password
    getPasswordInput().type("Test@123");
    // click the login button
    getLoginButton().click();
    // verify that the error message is displayed
    cy.get(".ant-form-item-explain-error")
      .should("contain.text", "Please input your E-mail!")
      .and("not.contain.text", "Please input your Password!");
  }
});
