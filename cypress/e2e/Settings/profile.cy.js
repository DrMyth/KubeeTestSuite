import "cypress-file-upload";
require("dotenv").config();

describe("MyProfile Page", () => {
  function configureTestEnvironment() {
    // Ignore uncaught exceptions
    cy.on("uncaught:exception", (err) => {
      console.error("Uncaught exception:", err.message);
      return false;
    });
    cy.viewport(1280, 720);
  }

  beforeEach(() => {
    // Login to the application
    cy.login();
    // Configure the test environment
    configureTestEnvironment();
    // Visit the My Profile page
    cy.visit(Cypress.env("TEST_URL") + "/settings/MyProfile", {
      failOnStatusCode: false,
      timeout: 30000,
    });
    // Verify the page title
    cy.contains("My Profile", { timeout: 10000 }).should("be.visible");
  });

  // INITIAL RENDERING TESTS
  describe("Rendering Tests", () => {
    // Test Case: Verify all main sections are rendered correctly on the My Profile page
    // Ensures the main profile title is visible to the user.
    // Checks for the presence of the 'Personal information' section title.
    // Checks for the presence of the 'Address information' section title.
    // Checks for the presence of the 'Change Password' section title.
    // Validates that the main card container is rendered on the page.
    it("should render all main sections correctly", { retries: 3 }, () => {
      // Verify the main profile title
      verifySectionTitle(".this-is-a-title.two", "My Profile");
      // Verify the Personal information section title
      verifySectionTitle(".this-is-a-title.three", "Personal information");
      // Verify the Address information section title
      verifySectionTitle(".this-is-a-title.three", "Address information");
      // Verify the Change Password section title
      verifySectionTitle(".this-is-a-title.three", "Change Password");
      // Verify the main card container
      cy.get(".ant-card.ant-card-bordered").should("exist");
    });

    // Test Case: Verify all profile field values are rendered correctly
    // Ensures the profile image is visible and loaded from the correct S3 bucket URL.
    // Checks that the work mode and mute notification switches exist and have the correct role attribute.
    // Validates that the user's full name, boutique, email, designation, and role are displayed with the correct values.
    // Confirms that the 'Joining Date' field is present and currently empty as expected.
    it(
      "should render all profile field values correctly",
      { retries: 3 },
      () => {
        // Verify the profile image
        cy.get("#right_img img")
          .should("be.visible")
          .and("have.attr", "src")
          .and(
            "include",
            "https://dev-kubee-laravel-images-bucket.s3.amazonaws.com"
          );

        // Verify the work mode switch
        cy.get('button[name="work_mode"]')
          .should("exist")
          .and("have.attr", "role", "switch");
        cy.get('button[name="mute_notification"]')
          .should("exist")
          .and("have.attr", "role", "switch");

        // Verify the full name field
        verifyProfileField("Full Name", "Varun Maramreddy");
        // Verify the boutique field
        verifyProfileField("Boutique", "Boutique8");
        // Verify the email field
        verifyProfileField("Email", Cypress.env("EMAIL"));
        // Verify the designation field
        verifyProfileField("Designation", "Testing Intern");
        // Verify the role field
        verifyProfileField("Role", "Admin");

        // Verify the joining date field
        cy.contains("div.label-details", "Joining Date")
          .parent()
          .siblings()
          .find("div.value-details")
          .should("be.empty");
      }
    );
  });

  // FUNCTIONALITY TESTS
  describe("Functionality Tests", () => {
    describe("Form Interactions", () => {
      // Test Case: Update personal and address information and verify persistence
      // Simulates user input for first and last name fields, ensuring values are updated.
      // Selects the gender from a dropdown and updates the phone number field.
      // Selects a language from the language dropdown and uploads a new profile image.
      // Fills in address, address2, apartment number, district, and postal code fields.
      // Selects country and city from dropdowns.
      // Submits the form and verifies the success message for profile update.
      // Reloads the page and checks that all updated values persist after refresh.
      // Ensures all updated fields reflect the new values as entered by the user.
      it(
        "should update personal and address information",
        { retries: 3 },
        () => {
          // Clear and type the first name
          cy.get("#first_name").clear().clear().type("Varun");
          // Clear and type the last name
          cy.get("#last_name").clear().type("Maramreddy");

          // Select the gender
          selectDropdownValue("#gender", "Male");
          // Clear and type the phone number
          cy.get("#phone").clear().type("+91938475810");

          // Click the language dropdown
          cy.get(".ant-select-selection-overflow").click({ force: true });
          // Select the language
          cy.contains(
            ".ant-select-item-option-content",
            "Mandarin Chinese"
          ).click({ force: true });

          // Attach the profile image
          cy.fixture("profile.jpg").then((fileContent) => {
            cy.get('input[type="file"]').attachFile({
              fileContent: fileContent.toString(),
              fileName: "profile.png",
              mimeType: "image/png",
              encoding: "base64",
            });
          });
          cy.get(".ant-upload-list-item").should("have.length", 1);

          // Clear and type the address
          cy.get("#address").clear().type("123 Main St");
          // Clear and type the address2
          cy.get("#address2").clear().type("Apt. 4B");
          // Clear and type the apartment number
          cy.get("#apartment_number").clear().type("4B");
          // Clear and type the district
          cy.get("#district").clear().type("Central");
          // Clear and type the postal code
          cy.get("#postal_code").clear().type("90210");

          // Select the country
          selectDropdownValue("#rc_select_2", "United Arab Emirates");
          // Select the city
          selectDropdownValue("#rc_select_3", "Dubai");

          // Click the submit button
          cy.get('button[type="submit"]').realClick();
          // Verify the success message
          cy.get(".ant-space-item", { timeout: 5000 }).contains(
            "Employee has been updated Successfully!."
          );

          // Reload the page
          cy.reload();

          // Verify the first name field
          cy.get("#first_name", { timeout: 10000 })
            .should(($input) => {
              expect($input.val()).to.not.eq("");
            })
            .should("have.value", "Varun");
          // Verify the last name field
          cy.get("#last_name").should("have.value", "Maramreddy");
          // Verify the gender field
          cy.contains(".ant-select-selection-item", "Male").should("exist");
          // Verify the phone number field
          cy.get("#phone").should("have.value", "+91938475810");

          // Verify the country field
          verifyDropdownSelection("#rc_select_2", "United Arab Emirates");
          // Verify the city field
          verifyDropdownSelection("#rc_select_3", "Dubai");

          // Verify the address field
          cy.get("#address").should("have.value", "123 Main St");
          // Verify the address2 field
          cy.get("#address2").should("have.value", "Apt. 4B");
          // Verify the postal code field
          cy.get("#postal_code").should("have.value", "90210");
          // Verify the apartment number field
          cy.get("#apartment_number").should("have.value", "4B");
          // Verify the district field
          // cy.get("#district").should("have.value", "Central");
        }
      );
    });

    describe("Password Management", () => {
      // Test Case: Generate a new password and auto-fill confirm password field
      // Simulates clicking the 'Generate Password' button to trigger password generation.
      // Verifies that the password field is populated with a generated value.
      // Ensures the confirm password field is automatically filled with the generated password value.
      it(
        "should generate and auto-fill confirm password",
        { retries: 3 },
        () => {
          // Click the generate password button
          cy.contains("button", "Generate Password").click();
          // Verify the password field is populated
          cy.get("#password").should("not.have.value", "");

          // Verify the confirm password field is populated with the generated password
          cy.get("#password")
            .invoke("val")
            .then((generatedPassword) => {
              cy.get("#confirm_password").should(
                "have.value",
                generatedPassword
              );
            });
        }
      );

      // Test Case: Show error when password and confirm password do not match
      // Simulates user input of different values in the password and confirm password fields.
      // Checks that the appropriate error message is displayed when the passwords do not match.
      it(
        "should show error when password and confirm password mismatch",
        { retries: 3 },
        () => {
          // Clear and type the password
          cy.get("#password").type("SecurePass123!");
          // Clear and type the confirm password
          cy.get("#confirm_password").type("DifferentPass456!");
          cy.contains("The new password that you entered do not match!").should(
            "exist"
          );
        }
      );
    });

    describe("Toggle Features", () => {
      // Test Case: Show confirmation modal when toggling work mode switch
      // Simulates clicking the work mode toggle switch.
      // Verifies that a confirmation modal appears asking the user to confirm switching work mode.
      // Simulates clicking the 'Cancel' button in the modal and ensures the modal closes.
      // Checks that the work mode switch remains unchecked after cancellation.
      it(
        "should show confirmation modal when toggling work mode",
        { retries: 3 },
        () => {
          // Click the work mode switch
          cy.get('button[name="work_mode"]').click();
          // Verify the confirmation modal
          cy.get(".ant-modal-body").should("contain", "switch the work mode");
          // Click the cancel button
          cy.get("button").contains("Cancel").click({ force: true });
          // Verify the work mode switch is unchecked
          cy.get('button[name="work_mode"]').should("not.be.checked");
        }
      );

      // Test Case: Toggle mute notifications with confirmation modal
      // Simulates clicking the mute notification toggle switch.
      // Verifies that a confirmation modal appears asking the user to confirm muting/unmuting notifications.
      // Simulates clicking the 'No' button in the modal and ensures the modal closes.
      // Checks that the work mode switch remains unchecked after cancellation (as a side effect of the modal logic).
      it(
        "should toggle mute notifications with confirmation",
        { retries: 3 },
        () => {
          // Click the mute notification switch
          cy.get('button[name="mute_notification"]').click();
          // Verify the confirmation modal
          cy.get(".ant-modal-body").should(
            "contain",
            "Are you sure you want to Mute/Unmute Notifications?"
          );
          // Click the no button
          cy.get("button").contains("No").click({ force: true });
          // Verify the work mode switch is unchecked
          cy.get('button[name="work_mode"]').should("not.be.checked");
        }
      );
    });
  });

  //HELPER FUNCTIONS

  function verifySectionTitle(selector, text) {
    cy.get(selector).contains(text).should("exist");
  }

  function verifyProfileField(label, expectedValue) {
    // Verify the profile field
    cy.contains("div.label-details", label)
      .parent()
      .siblings()
      .find("div.value-details")
      .should("contain.text", expectedValue);
  }

  function selectDropdownValue(selector, value) {
    // Click the dropdown
    cy.get(selector).click({ force: true });
    // Type the value
    cy.get(selector).type(value, { force: true });
    // Select the value
    cy.get(".ant-select-item-option-content")
      .contains(value)
      .click({ force: true });
  }

  function verifyDropdownSelection(selector, expectedText) {
    // Verify the dropdown selection
    cy.get(selector)
      .closest(".ant-select-selector")
      .find(".ant-select-selection-item")
      .should("have.text", expectedText);
  }
});
