/// <reference types="cypress" />

import {
  testSearchFunctionality,
  testSyncButton,
  testColumnToggling,
  testExpandButton,
  testPagination,
  testColumnSorting,
  testRowNavigation,
} from "../../Shared/view.cy";

describe("Clients View Page Tests", () => {
  function configureTestEnvironment() {
    cy.on("uncaught:exception", (err) => {
      console.error("Uncaught exception:", err.message);
      return false;
    });
    cy.viewport(1280, 720);
  }

  beforeEach(() => {
    cy.intercept("GET", "**/clients*").as("clientList");
    cy.intercept("GET", "**/platforms*").as("platformsList");

    configureTestEnvironment();
    cy.login();
    cy.visit("https://bmsredesign.kubeedevelopment.com/clients_module/View", {
      failOnStatusCode: false,
      timeout: 30000,
    });

    cy.wait("@clientList", { timeout: 35000 });
    cy.wait("@platformsList", { timeout: 35000 });

    cy.contains("Clients", { timeout: 35000 }).should("be.visible");
  });

  // INITIAL RENDERING TESTS
  describe.skip("Initial Rendering Tests", () => {
    // MAIN PAGE STRUCTURE VERIFICATION
    // Validates all critical elements are present and properly displayed on initial page load
    // - Page title and primary action button
    // - Filter section with all form controls
    // - Table headers and initial data rows
    // - Search functionality elements
    // - Key action buttons (Save, More, Expand, Sync)
    it("should load the main page structure", () => {
      // Title Section
      cy.contains(".this-is-a-title.two", "Clients").should("exist");

      // Verify 'Add New Client' button with plus icon exists and is visible
      cy.contains("button", "Add New Client")
        .should("exist")
        .and("be.visible")
        .within(() => {
          cy.get(".anticon-plus").should("exist");
        });

      // Filters Section
      cy.get(".filters > .ant-row")
        .first()
        .within(() => {
          cy.get(".ant-col").its("length").should("be.gte", 6);
        });

      cy.contains("label", "Nationality").should("exist").and("be.visible");
      cy.contains("label", "Nationality")
        .parents(".ant-form-item")
        .within(() => {
          cy.get(".ant-select").should("exist").and("be.visible");
          cy.get('input[role="combobox"]').should("exist");
          cy.contains("Choose Nationality").should("exist");
          cy.get(".ant-select-arrow").should("exist");
        });

      ["Gender", "Status", "Status Category"].forEach((label) => {
        cy.contains("label", label).should("exist");
        checkRenderingOfSelects(label);
      });

      cy.contains("label", "RFM Segment")
        .should("exist")
        .parents(".ant-form-item-row")
        .find(".ant-form-item-control")
        .within(() => {
          cy.get(".ant-select-selector").should("exist");
          cy.get(`#segment`).should("exist");
        });

      // Action buttons and icons
      ["save", "more", "expand", "sync"].forEach((icon) => {
        cy.get(`svg[data-icon="${icon}"]`)
          .should("exist")
          .parent(`.anticon.anticon-${icon}`)
          .should("exist");
      });
      cy.get('div.ant-col img[src="/images/comments.svg"]').should("exist");

      // Verify that the Export button includes an Excel icon
      cy.contains("button", "Export")
        .should("exist")
        .parent()
        .find(".ant-btn-icon")
        .find("span[role='img'].anticon-file-excel")
        .should("exist");

      // Search Bar
      cy.get("button").contains("Search").should("exist");

      // Search Box
      cy.get(".ant-input-affix-wrapper")
        .should("exist")
        .within(() => {
          cy.get("input").should(
            "have.attr",
            "placeholder",
            "Type and hit Enter"
          );
          cy.get("input").should("exist");
        });

      // Search icon
      cy.get("button.ant-input-search-button")
        .should("exist")
        .and("be.visible");

      // Table Structure (Table headers and rows)
      cy.get(".ant-table").within(() => {
        [
          "Full Name",
          "Customer ID",
          "Gender",
          "Email",
          "Phone",
          "Preferred Contact",
          "Nationality",
          "Last Purchase",
          "Last Visit",
          "Total Spend",
          "RFM Segment",
          "Actions",
        ].forEach((header) => {
          cy.contains("th", header).should("exist");
        });
      });

      // Table Rows
      cy.get(".ant-table-row").should("have.length.greaterThan", 1);
    });
  });

  // FILTER FUNCTIONALITY
  describe.skip("Filter Functionality Tests", () => {
    // COMPREHENSIVE FILTER OPERATIONS
    // Tests complete filter workflow including:
    // 1. Applying multiple filter combinations
    // 2. Saving filter configuration as named search
    // 3. Loading saved search from dropdown
    // 4. Deleting saved search
    // Validates API calls and UI responses at each stage
    it("should apply full filter set and validate traffic view results", () => {
      cy.intercept(
        "DELETE",
        /https:\/\/api\.kubeedevelopment\.com\/api\/v1\/default-search\/\d+/
      ).as("deleteDefaultSearch");

      // Basic filter selections for "Nationality", "Gender", and "Status".
      // Nationality filter (special handling => due to some issue with the naming of the labels)
      cy.contains("label", "Nationality")
        .parents(".ant-form-item")
        .within(() => {
          cy.get('input[role="combobox"]').should("exist").forceClick();
        });

      cy.get(".ant-select-dropdown").should(
        "not.have.class",
        "ant-select-dropdown-hidden",
        { timeout: 5000 }
      );

      cy.get(".ant-select-dropdown").should("be.visible");

      cy.get(".rc-virtual-list-holder-inner", { timeout: 5000 })
        .should("have.length.greaterThan", 0)
        .then(($options) => {
          cy.wrap($options[0]).click();
        });

      cy.get(".ant-select .ant-select-selection-item", {
        timeout: 5000,
      }).should("exist");

      ["Gender", "Status", "Status Category", "RFM Segment"].forEach(
        (label) => {
          checkAndSelectOption(label);
        }
      );

      // Click Search to apply the basic filters.
      cy.contains("button", "Search").then(($btn) => {
        $btn[0].click();
      });

      // cy.get("button").contains("Search").should("exist").realClick();
      cy.wait("@clientList", { timeout: 25000 });

      // Save filter settings
      cy.get('svg[data-icon="save"]')
        .should("exist")
        .parent(".anticon.anticon-save")
        .should("exist")
        .realClick();

      cy.get(".ant-modal-header").contains("Confirm Save").should("exist");

      cy.get(".ant-modal-footer")
        .should("exist")
        .within(() => {
          cy.contains("button", "Yes", { timeout: 10000 })
            .should("be.visible")
            .click();
      });

      cy.get(".ant-message-notice-content", { timeout: 5000 }).contains(
          "Please enter a name for the search."
      );

      cy.get(".ant-modal-body")
        .should("exist")
        .within(() => {
          cy.get("input[placeholder='Enter search name']")
            .should("exist")
            .type("Filter Search Selection");
        });

      cy.get(".ant-modal-footer")
        .should("exist")
        .within(() => {
          cy.contains("button", "Yes", { timeout: 10000 })
            .should("be.visible")
            .click();
        });

      cy.get(".ant-message-notice-content", { timeout: 5000 }).contains(
        "Search settings saved successfully!"
      );

      // Checks if the search have saved correctly or not
      cy.get("button.ant-btn-primary")
        .should("contain.text", "Saved Searches")
        .find(".anticon-down")
        .should("exist")
        .click();

      cy.get(".ant-dropdown-menu")
        .should("exist")
        .within(() => {
          cy.get(".ant-dropdown-menu-item").its("length").should("be.gte", 1);

          cy.contains(".ant-dropdown-menu-item", "Filter Search Selection")
            .should("exist")
            .click();
        });

      cy.wait("@clientList", { timeout: 10000 });

      // Delete saved search
      cy.get("button.ant-btn-primary")
        .should("contain.text", "Saved Searches")
        .find(".anticon-down")
        .should("exist")
        .click();

      cy.get(".ant-dropdown-menu")
        .should("be.visible")
        .within(() => {
          cy.contains(".ant-dropdown-menu-item", "Filter Search Selection")
            .find('img[alt="Delete"]')
            .click();
        });

      // wait until a modal with the "Confirm Delete" header appears
      cy.contains(".ant-modal-header", "Confirm Delete", { timeout: 5000 })
        .should("be.visible")
        .closest(".ant-modal-content")
        .within(() => {
          cy.contains(".ant-modal-footer button", "Yes, Delete")
            .should("be.visible")
            .click();
        });

      cy.wait("@deleteDefaultSearch")
        .its("response.statusCode")
        .should("eq", 200);

      cy.get(".ant-message-notice-content", { timeout: 5000 }).contains(
        "Search deleted successfully!"
      );
    });
  });

  // TABLE UTILITY TESTS
  describe("Table Functionality Tests", () => {
    // Tests searching within the table and clearing results
    testSearchFunctionality({
      searchTerm: "AddClient Test",
      defaultRowCount: 10,
    });

    // Sync Button Functionality
    testSyncButton({
      apiAlias: "clientList",
    });

    // Validates the More menu columns toggling
    testColumnToggling({
      columnsToToggle: [
        { name: "Nationality", shouldExist: false },
        { name: "Preferred Contact", shouldExist: false },
        { name: "Address", shouldExist: true },
        { name: "DoB", shouldExist: true },
      ],
    });

    // Toggles full-screen mode via the expand button
    testExpandButton({});

    // Export to Excel Functionality
    it("should trigger an export request and download a .xlsx file", () => {
      cy.get("button").contains("Export to Excel").should("be.visible").click();

      // Wait for the request, then assert on URL and response headers
      cy.wait("@clientList").then(() => {
        const fileName = "clients.xlsx";
        cy.readFile(`cypress/downloads/${fileName}`, { timeout: 15000 })
          .should("exist")
          .and((buf) => {
            // buffer should begin with PK (zip magic bytes for .xlsx)
            expect(buf.slice(0, 2).toString(), "xlsx magic bytes").to.equal(
              "PK"
            );
          });
      });
    });

    // Validates pagination controls, page size, and quick-jump
    testPagination({
      defaultPageSize: 10,
      pageSizeOptions: [25, 50, 100],
    });

    // Validates sorting of the "Last Purchase", "Last Visit", "Total Spend" columns via class toggling
    testColumnSorting({
      columnHeaders: ["Last Purchase", "Last Visit", "Total Spend"],
    });

    // Navigates to traffic details when clicking on a client name
    testRowNavigation({
      urlPattern: "/clients_module/ClientDetails?given_client_id=",
    });

    // TASK MANAGEMENT WORKFLOW
    // Tests complete task creation process:
    // 1. Opening task modal through row actions
    // 2. Validating form validation
    // 3. Submitting valid task data
    // 4. Verifying API response and success notification
    it("Add Task Functionality", () => {
      cy.intercept(
        "POST",
        "https://api.kubeedevelopment.com/api/v1/notifications"
      ).as("notificationApi");

      searchForClient("salesNewClient Test");
      openRowAction("Add Task");
      cy.get(".ant-modal-content").should("be.visible");

      cy.get("button").contains("Add Task").click();
      cy.get(".ant-form-item-explain-error").contains("Enter task name").should("exist");
      cy.get(".ant-form-item-explain-error").contains("Please enter a due date!").should("exist");

      // Fill in the task form
      cy.get("#form_in_modal_task_name").type("Test").clear();
      cy.get(".ant-form-item-explain-error").should("contain", "Enter task name");
      cy.get("#form_in_modal_task_name").type("Automated Test Task");

      // Pick a due date
      cy.get("#form_in_modal_date").type("{enter}", { force: true });
      cy.get("#form_in_modal_date").clear({force: true});
      cy.get("#form_in_modal_date").clear({force: true}).type("December 11th 09:16 pm {enter}", {
        force: true,
      });

      // Fill description
      cy.get("#form_in_modal_description").type(
        "This task was created using Cypress automation."
      );

      // Select an assignee
      cy.contains("label", "Assignee")
        .closest(".ant-form-item-row")
        .find(".ant-select-selector")
        .click({ force: true });

      cy.get(".ant-select-item-option")
        .contains("Varun Maramreddy")
        .forceClick();

      // Submit the form
      cy.get("button").contains("Add Task").click();
      cy.wait("@notificationApi").its("response.statusCode").should("eq", 200);

      cy.get(".ant-message-notice")
        .should("be.visible")
        .and("contain.text", "Task created successfully");
    });

    // CLIENT PROFILE UPDATE PROCESS
    // Validates client editing workflow:
    // 1. Accessing edit form through row actions
    // 2. Modifying contact information
    // 3. Submitting changes
    // 4. Verifying update in table view
    it("Edit Client Functionality", () => {
      cy.intercept("POST", "**/clients/**").as("updateClient");

      const rnd = Date.now();
      const email = `test.${rnd}@example.com`;
      const phone = `+1${Math.floor(
        1_000_000_000 + Math.random() * 9_000_000_000
      )}`;

      searchForClient("SalesNewClient Test");
      openRowAction("Edit");

      // Verify the modal title and input fields
      cy.get(".this-is-a-title.two").should("contain.text", "Edit client");
      cy.get("#first_name").should("have.value", "salesNewClient");
      cy.get("#last_name").should("have.value", "Test");

      // Fill in the new email and phone number
      typeByLabel("Phone Number", phone);
      typeByLabel("Email", email);

      // Click the "Submit" button
      cy.get("button").contains("Submit").should("exist").realClick();
      cy.wait("@updateClient").its("response.statusCode").should("eq", 200);

      cy.get(".ant-message-notice")
        .should("be.visible")
        .and("contain.text", "Client has been updated Successfully!");

      // Verify that the updated email and phone number are displayed
      cy.contains("a", "Cancel").click();

      cy.url({ timeout: 35000 }).should("include", "/clients_module/View");
      cy.wait("@clientList", { timeout: 10000 });

      searchForClient("SalesNewClient Test");

      // Check if the first row contains the updated email and phone number
      cy.get(".ant-table-tbody tr")
        .first()
        .find("td")
        .eq(0)
        .find("a")
        .should("have.attr", "href")
        .then((href) => {
          const url = new URL(
            "https://bmsredesign.kubeedevelopment.com" + href
          );
          const fullName = url.searchParams.get("search_term");
          expect(fullName).to.eq("SalesNewClient Test");
        });

      cy.get(".ant-table-tbody tr")
        .first()
        .within(() => {
          cy.get("td").eq(3).should("contain.text", email);
        });
      cy.get(".ant-table-tbody tr")
        .first()
        .within(() => {
          cy.get("td").eq(4).should("contain.text", phone);
        });
    });

    // WALLET MANAGEMENT SYSTEM
    // Tests complete wallet transaction flow:
    // 1. Adding funds through wallet modal
    // 2. Testing email voucher functionality
    // 3. Verifying print voucher generation
    // 4. Checking error handling for invalid inputs
    it("Add Wallet Functionality", () => {
      cy.intercept(
        "POST",
        "https://api.kubeedevelopment.com/api/v1/client_wallet"
      ).as("saveWallet");

      cy.intercept(
        "GET",
        "https://api.kubeedevelopment.com/api/v1/client_wallet_transaction/email/*"
      ).as("emailVoucher");

      // Add Wallet Functionality
      searchForClient("SalesNewClient Test");
      fillAddWalletForm(true);

      // Fill in the wallet form and submit
      cy.get(".ant-modal-footer")
        .find("button.ant-btn-primary")
        .should("be.visible")
        .and("not.be.disabled")
        .realClick();

      cy.get(".ant-message-notice")
        .should("be.visible")
        .and("contain.text", "Transaction has been created successfully!");
      cy.wait("@saveWallet").its("response.statusCode").should("eq", 200);

      // This is to check if the cancel button works
      cy.get(".ant-modal-footer")
        .find("button.ant-btn-default")
        .should("be.visible")
        .and("not.be.disabled")
        .realClick();

      // Checking for the Send Email Functionality
      cy.reload();

      searchForClient("SalesNewClient Test");
      fillAddWalletForm(false);

      // Click on the "Send Email" checkbox
      cy.get(".ant-modal-footer label").contains("Send Email").click();

      cy.get(".ant-modal-footer")
        .find("button.ant-btn-primary")
        .should("be.visible")
        .and("not.be.disabled")
        .realClick();

      cy.get(".ant-message-notice")
        .should("be.visible")
        .and("contain.text", "Transaction has been created successfully!");
      cy.wait("@saveWallet").its("response.statusCode").should("eq", 200);

      // Checking for the Email Voucher Modal
      cy.get(".this-is-a-title.three")
        .should("be.visible")
        .and("not.be.empty")
        .contains("Email Voucher");

      // Check for the sync button functionality
      cy.get(".anticon-sync").should("exist").realClick();
      cy.wait("@platformsList", { timeout: 35000 });

      cy.get("#platform_slug").realClick();

      // Select the first option in the dropdown
      cy.get(".ant-select-dropdown:visible")
        .should("exist")
        .within(() => {
          cy.get(".ant-select-item-option-content")
            .first()
            .click({ force: true });
        });

      // Fill in the form with empty data
      cy.get("#email").clear();
      cy.get("#subject").clear();

      cy.contains("button", "Send").click();

      // Check for the error message
      cy.get(".ant-message-notice")
        .should("be.visible")
        .and("contain.text", "Please add Email");

      // Verify validation messages
      cy.get(".ant-form-item-explain-error")
        .should("have.length.at.least", 2)
        .and("contain", "Please enter the subject!")
        .and("contain", "Please enter the email!");

      // Fill in the form with valid data
      cy.get("#subject").clear().type("Updated Subject");
      cy.get("#email").clear().type("valid@example.com");
      cy.get("#cc").type("cc@example.com");

      cy.contains("button", "Send").click();

      cy.wait("@emailVoucher").its("response.statusCode").should("eq", 400);

      // Add Account Functionality
      openRowAction("Add Wallet");

      cy.get('a[href="/ecommerce_module/PlatformIntegration"]').then(($a) => {
        // Remove target="_blank" to prevent new tab opening
        $a.removeAttr("target");
      });

      cy.get(".this-is-a-title.three")
        .should("be.visible")
        .and("not.be.empty")
        .contains("Email Voucher");

      cy.get("span").contains("Add Account").realClick();

      cy.location("pathname", { timeout: 35000 }).should(
        "eq",
        "/ecommerce_module/PlatformIntegration"
      );

      //Checking for the print voucher
      cy.visit("https://bmsredesign.kubeedevelopment.com/clients_module/View", {
        failOnStatusCode: false,
        timeout: 30000,
      });

      stubWindowOpen();

      searchForClient("SalesNewClient Test");

      fillAddWalletForm(false);

      // Click on the "Print Voucher" checkbox
      cy.get(".ant-modal-footer label").contains("Print Voucher").click();

      cy.get(".ant-modal-footer")
        .find("button.ant-btn-primary")
        .should("be.visible")
        .and("not.be.disabled")
        .realClick();

      cy.get("@windowOpen").should("have.been.calledOnce");
      cy.get("@windowOpen").then((stub) => {
        const relativePath = stub.firstCall.args[0];
        cy.window()
          .its("location.origin")
          .then((origin) => {
            const absoluteUrl = `${origin}${relativePath}`;
            cy.visit(absoluteUrl, { timeout: 35000, pageLoadTimeout: 35000 });

            cy.location("pathname").should(
              "include",
              "/clients_module/WalletTransactionVoucher"
            );
            cy.location("search").should(
              "match",
              /code=[^&]+&id=\d+&wallet_id=\d+&show_print=1/
            );

            // Checks if the page has loaded
            cy.get(".print-container").should("be.visible");

            // Checks if the page has a title "Voucher"
            cy.get(".print-container").should("be.visible");
            cy.get(".print-container h2")
              .should("be.visible")
              .and("have.text", "Voucher");

            // Checks if the date is present
            cy.get(".print-container")
              .contains("Date:")
              .next()
              .invoke("text")
              .should("match", /\d{2}\/\d{2}\/\d{4}/);

            // Client Name matches what we searched for
            cy.get(".print-container")
              .contains("Name:")
              .next()
              .should("have.text", "SalesNewClient Test");

            // Wallet ID is present (e.g. CW-xxxxxx)
            cy.get(".print-container")
              .contains("Wallet ID:")
              .next()
              .invoke("text")
              .should("match", /^CW\-[A-Z0-9]+$/);

            // The transaction table has at least one row with the right columns
            cy.get(".print-container .ant-table")
              .should("be.visible")
              .within(() => {
                // Check header
                cy.get("th").eq(0).should("have.text", "Reference No");
                cy.get("th").eq(1).should("have.text", "Type");
                cy.get("th").eq(2).should("have.text", "Qty");
                cy.get("th").eq(3).should("contain.text", "Price");
                cy.get("th").eq(4).should("contain.text", "Total");

                // Check first data row exists
                cy.get("tbody tr")
                  .first()
                  .within(() => {
                    // Check if the reference number is in the format VC-xxxxxx
                    cy.get("td")
                      .eq(0)
                      .invoke("text")
                      .should("match", /VC\-[A-Z0-9]+/);

                    // Check if the type is either "Credit" or "Debit"

                    cy.get("td")
                      .eq(1)
                      .invoke("text")
                      .should("match", /Credit|Debit/);

                    // Check if the quantity is a number

                    cy.get("td").eq(2).invoke("text").should("match", /\d+/);

                    // Check if the price and total are in the format "xx,xxx.xx"
                    cy.get("td")
                      .eq(3)
                      .invoke("text")
                      .should("match", /[\d,]+\.\d{2}/);
                    cy.get("td")
                      .eq(4)
                      .invoke("text")
                      .should("match", /[\d,]+\.\d{2}/);
                  });
              });

            // Payment summary on bottom right
            cy.get(".print-container")
              .contains("Total (AED):")
              .should("be.visible");
            cy.get(".print-container")
              .contains("Previous Wallet Balance (AED):")
              .should("be.visible");
            cy.get(".print-container")
              .contains("Current Wallet Balance (AED):")
              .should("be.visible");
          });
      });
    });

    // SALES HISTORY VALIDATION
    // Verifies purchase history navigation:
    // 1. Accessing history through row actions
    // 2. Checking correct tab activation
    // 3. Validating transaction table structure
    // 4. Ensuring data presence in sales records
    it("Purchase History Functionality", () => {
      openRowAction("Purchase History");
      cy.url({timeout: 35000}).should("include", "/clients_module/ClientDetails");
      cy.contains('[role="tab"]', 'Sales')
      .should('exist')
      .and('have.attr', 'aria-selected', 'true');

      const headers = [
        'Transaction ID',
        'Product Name',
        'Boutique',
        'Product Code',
        'Sale Quantity',
        'Sales Price',
        'Sale Date'
      ];

      cy.get('.ant-table-thead').within(() => {
        headers.map((header) => {
          cy.contains(header).should('exist');
        });
      });

      cy.get('.ant-table-tbody tr').should('have.length.greaterThan', 0);

    })
  });

  // ADD NEW CLIENT & DELETE CLIENT FUNCTIONALITY
  describe("Add New Client Functionality", () => {
    let rnd, firstName, lastName, email, phone;
    before(() => {
      rnd = Cypress._.random(1e3, 1e6);
      firstName = `TestFN${rnd}`;
      lastName = `TestLN${rnd}`;
      email = `test.${rnd}@example.com`;
      phone = `+1${Math.floor(1_000_000_000 + Math.random() * 9_000_000_000)}`;
    });

    // CLIENT CREATION WORKFLOW
    // Tests complete client registration process:
    // 1. Navigating to add client form
    // 2. Filling all required fields
    // 3. Testing form validation rules
    // 4. Submitting valid data
    // 5. Verifying success notification
    // 6. Checking new client appears in list
    it("fills and submits the Add Client form, then navigates back", () => {
      cy.intercept(
        "GET",
        "https://api.kubeedevelopment.com/api/v1/clients/getNextCustomerId"
      ).as("getCustomerId");

      cy.intercept(
        "POST",
        "https://api.kubeedevelopment.com/api/v1/clients"
      ).as("createClient");

      cy.get("button").contains("Add New Client").should("exist").click();

      cy.url({ timeout: 10000 }).should("include", "/clients_module/AddClient");
      cy.contains("Add client").should("exist");

      // Error Handling for empty fields
      cy.get("#first_name").clear().type("Test").clear();
      cy.get(".ant-form-item-explain-error").should(
        "contain",
        "Enter first name"
      );

      typeByLabel("First name", firstName);

      // Error Handling for empty fields
      cy.get("#last_name").clear().type("Test").clear();
      cy.get(".ant-form-item-explain-error").should(
        "contain",
        "Enter last name"
      );

      typeByLabel("Last name", lastName);

      selectBirthDate("Birth date", 26);

      selectDropdownByLabel("Gender", "Male");

      // Error Handling for empty fields
      cy.contains("label", "Gender")
        .parents(".ant-form-item")
        .find(".anticon.anticon-close-circle")
        .click({ force: true });

      cy.get(".ant-form-item-explain-error").should(
        "contain",
        "Choose gender!"
      );

      selectDropdownByLabel("Gender", "Male");
      selectDropdownByLabel("Nationality", "Angola");
      selectDropdownByLabel("Preferred means of contact", "By Email");

      // Error Handling for Valid Phone Number
      typeByLabel("Phone Number", "TestPhone");
      cy.get(".ant-form-item-explain-error").should(
        "contain",
        "Please input a valid phone number e.g. +44xxxxxxxxxx"
      );

      typeByLabel("Phone Number", phone);
      clickAddItem("Add phone");

      // Add another phone number
      cy.get("input[placeholder='e.g. +44xxxxxxxxxx']")
        .eq(1)
        .type("+19876543212");
      // Remove the second added phone number
      cy.get(".anticon-delete").first().should("be.visible").click();
      cy.get("input[placeholder='e.g. +44xxxxxxxxxx']").should(
        "have.length",
        1
      );

      // Error Handling for Valid Email
      typeByLabel("Email", "abc.com");
      cy.get(".ant-form-item-explain-error").should(
        "contain",
        "The input is not valid E-mail!"
      );

      typeByLabel("Email", email);
      clickAddItem("Add email");

      // Add another email
      cy.get("input[placeholder='Email']").eq(1).type("test@gmail.com");
      // Remove the second added email
      cy.get(".anticon-delete").first().should("be.visible").click();
      cy.get("input[placeholder='Email']").should("have.length", 1);

      typeByLabel("Address", "Rua da Liberdade, N123");
      typeByLabel("Address2", "Bairro Benfica");
      typeByLabel("Apartment number", "Apartamento 12");
      typeByLabel("District", "Luanda");
      typeByLabel("Postal Code", "1000‑123");

      selectCountryAndCity("Choose country", "Angola");
      selectCountryAndCity("Choose/enter city", "Cabinda");

      // Click the sync button to fetch the next customer ID
      cy.get(".ant-input-suffix .anticon-sync").should("exist").click();
      cy.wait("@getCustomerId").its("response.statusCode").should("eq", 200);

      selectDropdownByLabel("Status", "PF - Public Figure");

      // Date time in, Date time out
      // typeByLabel("Date time in", "April 13th 4:00 pm").type("{enter}", {
      //   force: true,
      // });
      // cy.get("button").contains("OK").realClick();

      // Error Handling for Date time out (Check-out date must be later than check-in date)
      typeByLabel("Date time out", "April 14th 12:00 pm").type("{enter}", {
        force: true,
      });
      cy.get("button").contains("OK").realClick();
      cy.get(".ant-form-item-explain-error").should(
        "contain",
        "The check-out date must be later than the check-in date."
      );

      typeByLabel("Date time out", "December 1st 08:10 pm").type("{enter}", {
        force: true,
      });

      typeByLabel(
        "Note",
        "This is a test note to verify that the Note field accepts and displays text correctly"
      );
      cy.get("button").contains("Add client").should("exist").realClick();

      // Check for success message
      cy.get(".ant-message-notice")
        .should("be.visible")
        .and("contain.text", "Client has been created Successfully!.");

      cy.wait("@createClient").its("response.statusCode").should("eq", 200);

      // Ensure that the selected value appears in the select.
      cy.get(".ant-select .ant-select-selection-item", {
        timeout: 5000,
      }).should("exist");

      // Redirect to the client list page
      cy.contains("a", "Cancel")
        .should("have.attr", "href")
        .and("include", "/clients_module/View");

      cy.contains("a", "Cancel").click();

      cy.url({ timeout: 10000 }).should("include", "/clients_module/View");

      cy.wait("@clientList", {timeout: 35000});
      cy.wait("@platformsList" , {timeout: 35000});

      // Search for the newly created client
      searchForClient(firstName);

      cy.wait("@clientList", {timeout: 35000});

      cy.get(".ant-table-tbody tr")
        .first()
        .find("td")
        .eq(0)
        .find("a")
        .should("contain.text", firstName)
        .click({ force: true });

      // Check if the URL contains the client details page
      cy.url({ timeout: 10000 }).should(
        "include",
        "/clients_module/ClientDetails"
      );

      cy.get(".this-is-a-title.two", { timeout: 35000 }).should(
        "contain",
        `${firstName} ${lastName}`
      );
    });

    // CLIENT DELETION PROCESS
    // Validates client removal workflow:
    // 1. Deleting through row actions menu
    // 2. Completing deletion reason form 
    // 3. Verifying API request parameters
    // 4. Checking UI feedback
    // 5. Confirming record status update
    it("Delete Client Functionality", () => {
      cy.intercept(
        "DELETE",
        "https://api.kubeedevelopment.com/api/v1/clients/**"
      ).as("deleteClient");

      searchForClient(email);

      cy.get(".ant-table-tbody tr")
        .first()
        .find("td")
        .last()
        .within(() => {
          cy.get(".anticon-ellipsis")
            .should("exist")
            .scrollIntoView()
            .then(($el) => {
              $el[0].dispatchEvent(
                new MouseEvent("click", { bubbles: true, force: true })
              );
            });
        });

      cy.document().then((doc) => {
        const pop = doc.querySelector(
          ".ant-popover .ant-popover-inner-content"
        );
        if (!pop) throw new Error("Popover not found");

        const deleteLi = Array.from(pop.querySelectorAll("li")).find((li) =>
          li.textContent.trim().startsWith("Delete")
        );

        if (!deleteLi) {
          throw new Error("Delete item not found in popover");
        }

        deleteLi.click({force: true});
      });

      cy.document().then((doc) => {
        const selector =
          ".ant-popover .ant-popover-inner-content li:nth-child(3) .action-label";
        const span = doc.querySelector(selector);
        if (!span)
          throw new Error(`Could not find Delete span using ${selector}`);

        const evt = new MouseEvent("click", {
          bubbles: true,
          cancelable: true,
          view: window,
        });
        span.dispatchEvent(evt);
      });

      cy.get(".ant-modal-content", { timeout: 10000 }).should("exist");

      cy.get("#form_in_modal_delete_reason")
        .should("be.visible")
        .type("Test").clear();

      cy.get(".ant-form-item-explain-error").contains("Please enter the reason!");

      cy.get("#form_in_modal_delete_reason")
        .should("be.visible")
        .type("Testing delete reason");

      cy.contains("button", "Yes").click();

      cy.wait("@deleteClient").then((interception) => {
        const requestUrl = new URL(interception.request.url);

        const deleteReason = requestUrl.searchParams.get("delete_reason");
        expect(deleteReason).to.eq("Testing delete reason");
      });

      cy.reload();

      searchForClient(email);

      cy.get(".ant-table-tbody tr")
        .first()
        .then(($row) => {
          if ($row.hasClass("deleted-row")) {
            cy.log('✅ First row has class "deleted-row"');
          } else {
            cy.log('❌ First row does NOT have class "deleted-row"');
          }
        });
    });
  });

  // SEARCH NEW CLIENT
  describe("Add New Client -> Search New Client", () => {
    beforeEach(() => {
      cy.intercept(
        "GET",
        "https://api.kubeedevelopment.com/api/v1/clients/clientSearch*"
      ).as("clientSearch");

      cy.intercept(
        "GET",
        "https://api.kubeedevelopment.com/api/v1/clients/getNextCustomerId"
      ).as("getCustomerId");

      cy.intercept(
        "POST",
        "https://api.kubeedevelopment.com/api/v1/clients"
      ).as("createClient");

      cy.get("button").contains("Add New Client").should("exist").click();
      cy.url({ timeout: 10000 }).should("include", "/clients_module/AddClient");
      cy.contains("Add client").should("exist");

      cy.get('input[placeholder="Search for client/traffic"]')
        .type(" ")
        .parents(".ant-input-affix-wrapper")
        .parent()
        .find(".ant-input-group-addon .ant-input-search-button")
        .forceClick();
    });

    // SEARCH MODAL VALIDATION
    // Tests client search functionality within add client form:
    // 1. Modal structure verification
    // 2. Filter field validations
    // 3. Search execution and results handling
    // 4. Record selection and data propagation
    it("should show the modal title and all fields", () => {
      cy.get(".this-is-a-title").should(
        "contain.text",
        "Search client/traffic"
      );

      // Name field
      cy.get('label[for="form_in_modal_name"]').should("have.text", "Name");
      cy.get("#form_in_modal_name")
        .should("have.attr", "placeholder", "Search by name")
        .and("have.value", " ");

      // Email & Phone
      cy.get('label[for="form_in_modal_email"]').should("have.text", "Email");
      cy.get("#form_in_modal_email").should(
        "have.attr",
        "placeholder",
        "Search by email"
      );

      cy.get('label[for="form_in_modal_phone"]').should("have.text", "Phone");
      cy.get("#form_in_modal_phone").should(
        "have.attr",
        "placeholder",
        "Search by phone"
      );

      // Boutique select
      cy.get('label[for="form_in_modal_boutique"]').should(
        "have.text",
        "Boutique"
      );
      cy.get("#form_in_modal_boutique").should("exist");

      // Date picker
      cy.get('label[for="form_in_modal_date"]').should(
        "contain.text",
        "Last Visit Date"
      );
      cy.get("#form_in_modal_date").should(
        "have.attr",
        "placeholder",
        "Start date"
      );

      // Select button disabled by default
      cy.contains("button", "Select").should("be.disabled");
    });

    // Filter Functionality
    // ADVANCED SEARCH OPERATIONS
    // Validates complex search scenarios:
    // 1. Multi-criteria searches
    // 2. Date range filtering
    // 3. Boutique selection
    // 4. Result selection and data transfer
    it("Functionality of Search Modal", () => {
      // Fill in the form
      typeInField("form_in_modal_name", "Traffic104 Record").should(
        "have.value",
        "Traffic104 Record"
      );

      clearField("form_in_modal_name").should("have.value", "");

      typeInField(
        "form_in_modal_email",
        "traffic_email_104@example.com"
      ).should("have.value", "traffic_email_104@example.com");

      typeInField("form_in_modal_phone", "08198638020").should(
        "have.value",
        "08198638020"
      );

      selectDropdownOption("#form_in_modal_boutique", "Boutique8");

      // Open the date picker
      cy.get(
        '.ant-picker-input-active input[placeholder="Start date"]'
      ).forceClick();
      // select today for both start & end
      cy.get(".ant-picker-cell-inner")
        .contains(new Date().getDate().toString())
        .first()
        .forceClick();

      // pick same date as end
      cy.get(".ant-picker-cell-inner")
        .contains(new Date().getDate().toString())
        .last()
        .forceClick();

      // click the clear button
      cy.get("#form_in_modal_date")
        .closest(".ant-picker")
        .find(".ant-picker-clear")
        .forceClick();

      // click the search button
      cy.contains("button", "Select").should("be.disabled");

      // table should appear and have at least one row
      cy.get(".ant-table-tbody tr").its("length").should("be.gt", 0);

      // verify that the first row contains the name we searched
      cy.get(".ant-table-tbody tr")
        .first()
        .find("td")
        .contains("Traffic104 Record", { timeout: 35000 })
        .click({ force: true });

      cy.get('input[name="Traffic104 Record"]')
        .parents(".ant-radio")
        .click({ force: true });

      cy.contains("button", "Select")
        .should("exist")
        .should("be.enabled")
        .forceClick();

      cy.wait("@clientSearch", { timeout: 5000 });

      cy.url({ timeout: 10000 }).should("include", "/clients_module/AddClient");
      cy.contains("Add client").should("exist");

      cy.contains("label", "First name")
        .should("exist")
        .parents(".ant-form-item-row")
        .find(".ant-form-item-control")
        .find("#first_name")
        .should("exist")
        .should("have.value", "Traffic104");
    });
  });

  // HELPER FUNCTIONS

  function searchForClient(term) {
    cy.get("input[placeholder='Type and hit Enter']")
      .clear({ force: true })
      .type(term, { force: true });
    cy.get(".anticon-search").realClick();

    cy.contains("button", "Search").then(($btn) => {
      $btn[0].click();
    });

    cy.wait("@clientList", { timeout: 35000 });
  }

  function openRowAction(action) {
    cy.get(".ant-table-tbody tr")
      .first()
      .find("td")
      .last()
      .within(() => {
        cy.get(".anticon-ellipsis")
          .should("exist")
          .scrollIntoView()
          .then(($el) => {
            $el[0].dispatchEvent(new MouseEvent("click", { bubbles: true }));
          });
      });

    cy.get(".ant-popover")
      .contains("li", action)
      .then(($el) => {
        $el[0].dispatchEvent(new MouseEvent("click", { bubbles: true }));
      });
  }

  function typeInField(fieldId, text) {
    return cy
      .get(`#${fieldId}`)
      .clear({ force: true })
      .type(text, { force: true });
  }

  function clearField(fieldId) {
    return cy
      .get(`#${fieldId}`)
      .siblings(".ant-input-suffix")
      .find(".ant-input-clear-icon")
      .click({ force: true });
  }

  function selectCountryAndCity(entity, name) {
    cy.get(".ant-select-selection-placeholder")
      .contains(entity)
      .should("exist")
      .click({ force: true }); // triggers the dropdown

    cy.get(".ant-select-dropdown:visible", {timeout: 35000})
      .first()
      .within(() => {
        cy.contains(".ant-select-item-option", name).realClick();
      });
  }

  function selectDropdownOption(selectId, optionText) {
    cy.get(selectId).click({ force: true });
    cy.get(".ant-select-dropdown")
      .filter(":visible")
      .first()
      .contains(".ant-select-item-option", optionText)
      .click({ force: true });
  }

  function clickAddItem(buttonText) {
    return cy
      .contains("button.addItem", buttonText)
      .should("be.visible")
      .within(() => {
        // check if + icon exists inside the button
        cy.get(".ant-btn-icon .anticon-plus").should("exist");
      })
      .click();
  }

  function selectDropdownByLabel(labelText, optionText) {
    // Click the select input associated with the label
    cy.contains("label", labelText)
      .parents(".ant-form-item-row")
      .find(".ant-select")
      .as("selectWrapper")
      .within(() => {
        cy.get(".ant-select-selector").should("exist").click({ force: true });
      });

    // Use the dropdown that is attached to this specific select
    cy.get("@selectWrapper").then(($select) => {
      const dropdownClass = ".ant-select-dropdown";

      // Get all dropdowns, then pick the one closest to the clicked select
      cy.get(dropdownClass)
        .filter(":visible")
        .first()
        .within(() => {
          cy.contains(".ant-select-item-option", optionText).click({
            force: true,
          });
        });
    });
  }

  function stubWindowOpen() {
    cy.window().then((win) => cy.stub(win, "open").as("windowOpen"));
  }

  function fillAddWalletForm(check) {
    openRowAction("Add Wallet");

    cy.get(".ant-modal-content", { timeout: 10000 }).should("exist");

    // cy.get(".this-is-a-title.three")
    //   .should("be.visible")
    //   .and("not.be.empty")
    //   .contains("SalesNewClient Test Wallet");

    cy.get("#boutique").should("exist").and("be.disabled");

    cy.get("#payment_mode").click({ force: true });

    if (check) {
      cy.get(".ant-modal-footer")
        .find("button.ant-btn-primary")
        // .should("be.visible")
        .and("not.be.disabled")
        .realClick();

        cy.get(".ant-modal-footer")
        .find("button.ant-btn-primary")
        // .should("be.visible")
        .and("not.be.disabled")
        .realClick();

      cy.get(".ant-message-notice-content").contains(
        "All fields are required!"
      );
    }

    cy.get(".ant-select-dropdown")
      .should("exist")
      .within(() => {
        cy.contains(".ant-select-item-option-content", "Cash")
          .scrollIntoView()
          .click({ force: true });
      });

    cy.get(".ant-select-item-option-content").should("contain", "Cash");

    if (check) {
      cy.get(".ant-modal-footer")
        .find("button.ant-btn-primary")
        .should("be.visible")
        .and("not.be.disabled")
        .realClick();

      cy.get(".ant-message-notice-content").contains(
        "All fields are required!"
      );
    }

    cy.get("#amount").clear().type("450000").should("have.value", 450000);
  }

  function typeByLabel(labelText, value) {
    // build the input id from the label
    let inputId = labelText.trim().toLowerCase().replace(/\s+/g, "_");
    if (labelText == "Phone Number") {
      inputId = "phone";
    } else if (labelText == "Note") {
      inputId = "notes";
    }

    // find the label, walk up to the form‑row, then down into the control
    return cy
      .contains("label", labelText)
      .should("exist")
      .parents(".ant-form-item-row")
      .find(".ant-form-item-control")
      .find(`#${inputId}`)
      .clear({ force: true })
      .should("exist")
      .type(value, { force: true });
  }

  function selectBirthDate(labelText, date = 15, timeStamp) {
    cy.contains("label", labelText)
      .should("exist")
      .parents(".ant-form-item-row")
      .find(".ant-form-item-control")
      .within(() => {
        cy.get(".ant-picker-input").should("exist").realClick();
      });

    // wait for the picker to be visible
    cy.get(".ant-picker-dropdown").should("be.visible");

    // Click on the date
    cy.get(".ant-picker-cell-inner")
      .contains(new RegExp(`^${date}$`))
      .realClick();

    if (timeStamp) {
      const [time, period] = timeStamp.split(" ");
      const [hour, minute] = time.split(":");

      cy.get(".ant-picker-time-panel-column")
        .eq(0)
        .contains(new RegExp(`^${hour}$`))
        .realClick();

      // Select minutes
      cy.get(".ant-picker-time-panel-column")
        .eq(1)
        .contains(new RegExp(`^${minute}$`))
        .realClick();

      // Select period
      cy.get(".ant-picker-time-panel-column")
        .eq(2)
        .contains(period)
        .realClick();

      cy.get("button").contains("OK").realClick();
    }
  }

  function checkRenderingOfSelects(label) {
    const id = label
      .split("/")[0]
      .toLowerCase()
      .replace(/\s+/g, "_")
      .replace(/\?/g, "");

    cy.log("Id:" + id);

    cy.contains("label", label)
      .should("exist")
      .parents(".ant-form-item-row")
      .find(".ant-form-item-control")
      .within(() => {
        cy.get(".ant-select-selector").should("exist");
        cy.get(`#${id}`).should("exist");
      });
  }

  function checkAndSelectOption(label) {
    let id = label
      .split("/")[0]
      .toLowerCase()
      .replace(/\s+/g, "_")
      .replace(/\?/g, "");

    if (label == "RFM Segment") {
      id = "segment";
    }

    cy.log("Selecting from filter: " + label + " [ID:" + id + "]");

    // Ensure the filter is visible and rendered.
    cy.contains("label", label).should("exist");

    // Within the same form item row, find the select element.
    cy.contains("label", label)
      .parents(".ant-form-item-row")
      .find(".ant-form-item-control")
      .within(() => {
        cy.get(".ant-select-selector").should("exist");

        // Click on the select element to open its dropdown.
        cy.get(`#${id}`).click();
      });

    // should not have class ant-select-dropdown-hidden
    cy.get(".ant-select-dropdown").should(
      "not.have.class",
      "ant-select-dropdown-hidden",
      { timeout: 5000 }
    );

    cy.get(".ant-select-dropdown").should("be.visible");

    cy.get(".rc-virtual-list-holder-inner", { timeout: 5000 })
      .should("have.length.greaterThan", 0)
      .then(($options) => {
        cy.wrap($options[0]).click();
      });
  }
});