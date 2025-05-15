describe("OTP Page Tests", () => {
    function setLocalStorageData() {
      localStorage.setItem("email", Cypress.env("EMAIL"));
      localStorage.setItem("password", Cypress.env("PASSWORD"));
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
        cy.visit("https://bmsredesign.kubeedevelopment.com/Otp", {
          failOnStatusCode: false,
          timeout: 30000,
        });
    
        cy.contains("Enter your verification code", { timeout: 3000 }).should("not.be.visible");
    }
    
    before(() => {
    setLocalStorageData();
    });
    beforeEach(() => {
    setLocalStorageData();
    configureTestEnvironment();
    visitOtpPage();
    });

    it("should fail to verify OTP", () => {
        cy.get('input[name="otp"]').type("123456");
        cy.get('button[type="submit"]').click();
        cy.contains("Invalid OTP", { timeout: 10000 }).should("be.visible");
    });
});