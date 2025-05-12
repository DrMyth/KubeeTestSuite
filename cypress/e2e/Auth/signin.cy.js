describe("Signin Page Tests", () => {

  function configureTestEnvironment() {
    cy.on("uncaught:exception", (err) => {
      console.error("Uncaught exception:", err.message);
      return false;
    });
    cy.viewport(1280, 720);
  }

  function visitSigninPage(){
    cy.visit("https://bmsredesign.kubeedevelopment.com/signin", {
      onBeforeLoad(win) {
        win.event = { currentTarget: win.document.querySelector("form") };
      },
      failOnStatusCode: false,
      timeout: 30000,
    });
  }
  
  beforeEach(() => {
    configureTestEnvironment();
    visitSigninPage();
  });

  //Component Rendering Tests
  context("Page Structure Validation", () => {
    it("should display all essential signin components", () => {
      getEmailInput().should("be.visible");
      getPasswordInput().should("be.visible");
      getLoginButton().should("be.visible");
      getForgotPasswordLink().should("be.visible");
      getWorkModeSwitch().should("be.visible");
    });
  });

  // Tests for toggle functionalities of input fields and switches.
  context("Form Interactions", () => {
    it("should toggle password visibility when clicking eye icon", () => {
      getPasswordInput().should("have.attr", "type", "password");
      getPasswordVisibilityToggle().click();
      getPasswordInput().should("have.attr", "type", "text");
      getPasswordVisibilityToggle().click();
      getPasswordInput().should("have.attr", "type", "password");
    });

    it("should toggle work mode switch state when clicked", () => {
      getWorkModeSwitch().should("have.attr", "aria-checked", "false");

      getWorkModeSwitch().click();

      getWorkModeSwitch().should("have.attr", "aria-checked", "true")
      
      getWorkModeSwitch().click();

      getWorkModeSwitch().should("have.attr", "aria-checked", "false");
    });
  });

  // Tests for login feedback on valid and invalid form submissions.
  context("Form Submission Handling", () => {
    it("should show loading state and redirect on valid credentials", () => {
      submitValidCredentials();
      verifyLoadingFeedback();
      cy.location("pathname", { timeout: 10000 }).should((path) => {
        expect(["/Otp", "/dashboard_module/Dashboard"]).to.include(path);
      });
    });

    it("should display error message for invalid credentials", () => {
      submitInvalidCredentials();
      getAlertMessage()
        .should("be.visible")
        .and("contain", "Invalid Username/Password");
    });

    it("should show validation messages for empty required fields", () => {
      testFormValidation();
    });
  });

  context("Navigation Tests", () => {
    it("should redirect to forgot password page when link is clicked", () => {
      getForgotPasswordLink().click();
      cy.location("pathname", { timeout: 10000 }).should("eq", "/forgot");
    });
  });

  // Helper Functions
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
    getEmailInput().type("varunmaramreddy.work@gmail.com");
    getPasswordInput().type("Var14@#Re");
    getLoginButton().click();
  }

  function submitInvalidCredentials() {
    getEmailInput().type("invalid@example.com");
    getPasswordInput().type("invalidPassword");
    getLoginButton().click();
  }

  function verifyLoadingFeedback() {
    cy.get(".ant-spin-spinning").should("be.visible");
    cy.get("body").then(($body) => {
      if ($body.find(".ant-alert-message").length > 0) {
        getAlertMessage()
          .should("be.visible")
          .and("contain.text", "OTP has been sent to your registered email");
      } else {
        cy.log("No alert message detected - assuming existing session");
      }
    });
  }

  function testFormValidation() {
    // Test empty form submission
    getLoginButton().click();
    cy.get(".ant-form-item-explain-error")
      .should("contain.text", "Please input your E-mail!")
      .and("contain.text", "Please input your Password!");

    // Test email-only submission
    getEmailInput().type("test@example.com");
    getLoginButton().click();
    cy.get(".ant-form-item-explain-error")
      .should("not.contain.text", "Please input your E-mail!")
      .and("contain.text", "Please input your Password!");

    // Test password-only submission
    getEmailInput().clear();
    getPasswordInput().type("Test@123");
    getLoginButton().click();
    cy.get(".ant-form-item-explain-error")
      .should("contain.text", "Please input your E-mail!")
      .and("not.contain.text", "Please input your Password!");
  }
});
