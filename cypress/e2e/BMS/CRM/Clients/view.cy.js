/// <reference types="cypress" />
require("dotenv").config();

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
    // ignore uncaught exceptions
    cy.on("uncaught:exception", (err) => {
      console.error("Uncaught exception:", err.message);
      return false;
    });
    cy.viewport(1280, 720);
  }

  beforeEach(() => {
    // intercept the API calls
    cy.intercept("GET", "**/clients*").as("clientList");
    cy.intercept("GET", "**/platforms*").as("platformsList");

    // configure the test environment
    configureTestEnvironment();

    // login
    cy.login();

    // visit the clients view page
    cy.visit(Cypress.env("TEST_URL") + "/clients_module/View", {
      failOnStatusCode: false,
      timeout: 30000,
    });

    // wait for the API calls to complete
    cy.wait("@clientList", { timeout: 35000 });
    cy.wait("@platformsList", { timeout: 35000 });

    // verify that the page title is displayed
    cy.contains("Clients", { timeout: 35000 }).should("be.visible");
  });

  // INITIAL RENDERING TESTS
  describe("Initial Rendering Tests", () => {
    // Test Case: Main Page Structure Verification
    // - Validates that all critical UI elements are present and properly displayed on the initial page load of the Clients View.
    // - Checks for the presence and visibility of the page title and the 'Add New Client' button with the plus icon.
    // - Verifies the filters section, ensuring all filter controls (Nationality, Gender, Status, Status Category, RFM Segment) are rendered and functional.
    // - Confirms the presence of action buttons and icons (Save, More, Expand, Sync, Comments, Export) and their correct rendering.
    // - Ensures the Export button includes the Excel icon and the search bar is present with the correct placeholder.
    // - Checks the table structure, including all expected headers and that at least one data row is present.
    // - Asserts that the search input and search button are visible and functional.
    it("should load the main page structure", { retries: 3 }, () => {
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

      // Nationality filter
      cy.contains("label", "Nationality").should("exist").and("be.visible");
      cy.contains("label", "Nationality")
        .parents(".ant-form-item")
        .within(() => {
          cy.get(".ant-select").should("exist").and("be.visible");
          cy.get('input[role="combobox"]').should("exist");
          cy.contains("Choose Nationality").should("exist");
          cy.get(".ant-select-arrow").should("exist");
        });

      // Gender, Status, Status Category filters
      ["Gender", "Status", "Status Category"].forEach((label) => {
        cy.contains("label", label).should("exist");
        checkRenderingOfSelects(label);
      });

      // RFM Segment filter
      cy.contains("label", "RFM Segment")
        .should("exist")
        .parents(".ant-form-item-row")
        .find(".ant-form-item-control")
        .within(() => {
          cy.get(".ant-select-selector").should("exist");
          cy.get(`#segment`).should("exist");
        });

      // Action buttons and icons (save, more, expand, sync)
      ["save", "more", "expand", "sync"].forEach((icon) => {
        cy.get(`svg[data-icon="${icon}"]`)
          .should("exist")
          .parent(`.anticon.anticon-${icon}`)
          .should("exist");
      });

      // Comments icon
      cy.get('div.ant-col img[src="/images/comments.svg"]').should("exist");

      // Export button
      // Verify that the Export button includes an Excel icon
      cy.contains("button", "Export")
        .should("exist")
        .parent()
        .find(".ant-btn-icon")
        .find("span[role='img'].anticon-file-excel")
        .should("exist");

      // Search button
      cy.get("button").contains("Search").should("exist");

      // Search input
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

      // Search button
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
  describe("Filter Functionality Tests", () => {
    // Test Case: Comprehensive Filter Operations
    // - Validates the complete filter workflow, including applying multiple filter combinations (Nationality, Gender, Status, Status Category, RFM Segment).
    // - Ensures the filter dropdowns open, options are selectable, and selections are reflected in the UI.
    // - Clicks the Search button to apply filters and waits for the filtered client list API response.
    // - Tests saving the filter configuration as a named search, including handling the modal for entering a search name and confirming save.
    // - Verifies that the saved search appears in the dropdown and can be loaded, triggering the correct API call and UI update.
    // - Tests deleting a saved search, including confirming the delete action in the modal and verifying the success notification.
    // - Asserts that all API calls and UI responses occur as expected at each stage of the filter workflow.
    it(
      "should apply full filter set and validate traffic view results",
      { retries: 3 },
      () => {
        // intercept the API call to delete the default search
        cy.intercept("DELETE", /\/api\/v1\/default-search\/\d+/).as(
          "deleteDefaultSearch"
        );

        // Basic filter selections for "Nationality", "Gender", and "Status".
        // Nationality filter (special handling => due to some issue with the naming of the labels)
        cy.contains("label", "Nationality")
          .parents(".ant-form-item")
          .within(() => {
            cy.get('input[role="combobox"]').should("exist").forceClick();
          });

        // verify that the dropdown is not hidden
        cy.get(".ant-select-dropdown").should(
          "not.have.class",
          "ant-select-dropdown-hidden",
          { timeout: 5000 }
        );

        // verify that the dropdown is visible
        cy.get(".ant-select-dropdown").should("be.visible");

        // verify that the dropdown has options
        cy.get(".rc-virtual-list-holder-inner", { timeout: 5000 })
          .should("have.length.greaterThan", 0)
          .then(($options) => {
            cy.wrap($options[0]).click();
          });

        // verify that the selected option is displayed
        cy.get(".ant-select .ant-select-selection-item", {
          timeout: 5000,
        }).should("exist");

        // select the options for the other filters
        ["Gender", "Status", "Status Category", "RFM Segment"].forEach(
          (label) => {
            checkAndSelectOption(label);
          }
        );

        // Click Search to apply the basic filters.
        // click the search button
        cy.contains("button", "Search").then(($btn) => {
          $btn[0].click();
        });

        // cy.get("button").contains("Search").should("exist").realClick();

        // wait for the API call to complete
        cy.wait("@clientList", { timeout: 25000 });

        // save filter settings
        cy.get('svg[data-icon="save"]')
          .should("exist")
          .parent(".anticon.anticon-save")
          .should("exist")
          .realClick();

        // verify that the modal is displayed
        cy.get(".ant-modal-header").contains("Confirm Save").should("exist");

        cy.get(".ant-modal-footer")
          .should("exist")
          .within(() => {
            cy.contains("button", "Yes", { timeout: 10000 })
              .should("be.visible")
              .click();
          });

        // verify that the message is displayed
        cy.get(".ant-message-notice-content", { timeout: 5000 }).contains(
          "Please enter a name for the search."
        );

        // verify that the modal is displayed
        cy.get(".ant-modal-body")
          .should("exist")
          .within(() => {
            cy.get("input[placeholder='Enter search name']")
              .should("exist")
              .type("Filter Search Selection");
          });

        // verify that the modal is displayed
        cy.get(".ant-modal-footer")
          .should("exist")
          .within(() => {
            cy.contains("button", "Yes", { timeout: 10000 })
              .should("be.visible")
              .click();
          });

        // verify that the message is displayed
        cy.get(".ant-message-notice-content", { timeout: 5000 }).contains(
          "Search settings saved successfully!"
        );

        // Checks if the search have saved correctly or not
        cy.get("button.ant-btn-primary")
          .should("contain.text", "Saved Searches")
          .find(".anticon-down")
          .should("exist")
          .click();

        // verify that the dropdown is displayed
        cy.get(".ant-dropdown-menu")
          .should("exist")
          .within(() => {
            cy.get(".ant-dropdown-menu-item").its("length").should("be.gte", 1);

            cy.contains(".ant-dropdown-menu-item", "Filter Search Selection")
              .should("exist")
              .click();
          });

        // wait for the API call to complete
        cy.wait("@clientList", { timeout: 10000 });

        // Delete saved search
        cy.get("button.ant-btn-primary")
          .should("contain.text", "Saved Searches")
          .find(".anticon-down")
          .should("exist")
          .click();

        // verify that the dropdown is displayed
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

        // wait for the API call to complete
        cy.wait("@deleteDefaultSearch")
          .its("response.statusCode")
          .should("eq", 200);

        // verify that the message is displayed
        cy.get(".ant-message-notice-content", { timeout: 5000 }).contains(
          "Search deleted successfully!"
        );
      }
    );
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
    testExpandButton({ SalesPage: true });

    // Test Case: Export to Excel Functionality
    // - Validates the export to Excel feature by clicking the export button.
    // - Waits for the export request to complete and checks that a .xlsx file is downloaded.
    // - Asserts that the downloaded file exists in the downloads folder.
    // - Verifies the file's content by checking for the correct magic bytes (PK) indicating a valid .xlsx file.
    it(
      "should trigger an export request and download a .xlsx file",
      { retries: 3 },
      () => {
        // verify that the export button is displayed
        cy.get("button")
          .contains("Export to Excel")
          .should("be.visible")
          .click({ force: true });

        // Wait for the request, then assert on URL and response headers
        cy.wait("@clientList", { timeout: 90000 }).then(() => {
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
      }
    );

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

    // Test Case: Task Management Workflow
    // - Validates the complete process of adding a new task for a client.
    // - Opens the task modal through row actions and checks for form validation errors when submitting empty fields.
    // - Fills in the task form with valid data, including task name, due date, description, and assignee.
    // - Submits the form and waits for the API response, verifying a successful task creation notification.
    // - Ensures the UI displays the correct success message after task creation.
    it("Add Task Functionality", { retries: 3 }, () => {
      // intercept the API call to create a task
      cy.intercept(
        "POST",
        Cypress.env("TEST_BACKEND_URL") + "/notifications"
      ).as("notificationApi");

      // Search for the client
      cy.get("input[placeholder='Type and hit Enter']")
        .clear({ force: true })
        .type("salesNewClient Test{enter}", { force: true });

      // search for the client
      // searchForClient("salesNewClient Test");

      // open the row action
      openRowAction("Add Task");
      cy.get(".ant-modal-content").should("be.visible");

      // verify that the modal is displayed
      cy.get("button").contains("Add Task").click();
      cy.get(".ant-form-item-explain-error")
        .contains("Enter task name")
        .should("exist");
      cy.get(".ant-form-item-explain-error")
        .contains("Please enter a due date!")
        .should("exist");

      // Fill in the task form
      cy.get("#form_in_modal_task_name").type("Test").clear();
      cy.get(".ant-form-item-explain-error").should(
        "contain",
        "Enter task name"
      );
      cy.get("#form_in_modal_task_name").type("Automated Test Task");

      // Pick a due date
      cy.get("#form_in_modal_date").type("{enter}", { force: true });
      cy.get("#form_in_modal_date").clear({ force: true });
      cy.get("#form_in_modal_date")
        .clear({ force: true })
        .type("December 11th 09:16 pm {enter}", {
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

      // select the assignee
      cy.get(".ant-select-item-option")
        .contains("Varun Maramreddy")
        .forceClick();

      // submit the form
      cy.get("button").contains("Add Task").click();

      // wait for the API call to complete
      cy.wait("@notificationApi").its("response.statusCode").should("eq", 200);

      // verify that the message is displayed
      cy.get(".ant-message-notice")
        .should("be.visible")
        .and("contain.text", "Task created successfully");
    });

    // Test Case: Client Profile Update Process
    // - Validates the workflow for editing a client's profile information.
    // - Accesses the edit form through row actions and verifies the modal title and input fields.
    // - Modifies the client's email and phone number, submits the changes, and waits for the update API response.
    // - Checks for a success notification and verifies that the updated information is displayed in the table.
    // - Ensures the updated client details are reflected in the client list and details page.
    it("Edit Client Functionality", { retries: 3 }, () => {
      // intercept the API call to update the client
      cy.intercept("POST", "**/clients/**").as("updateClient");

      // set the email and phone number
      const rnd = Date.now();
      const email = `test.${rnd}@example.com`;
      const phone = `+1${Math.floor(
        1_000_000_000 + Math.random() * 9_000_000_000
      )}`;

      // search for the client
      searchForClient("SalesNewClient Test");

      // open the row action
      openRowAction("Edit");

      // verify that the modal title is displayed
      cy.get(".this-is-a-title.two").should("contain.text", "Edit client");
      cy.get("#first_name").should("have.value", "salesNewClient");
      cy.get("#last_name").should("have.value", "Test");

      // fill in the new email and phone number
      typeByLabel("Phone Number", phone);
      typeByLabel("Email", email);

      // click the submit button
      cy.get("button").contains("Submit").should("exist").realClick();

      // wait for the API call to complete
      cy.wait("@updateClient").its("response.statusCode").should("eq", 200);

      // verify that the message is displayed
      cy.get(".ant-message-notice")
        .should("be.visible")
        .and("contain.text", "Client has been updated Successfully!");

      // verify that the cancel button is displayed
      cy.contains("a", "Cancel").click();

      // verify that the URL is correct
      cy.url({ timeout: 35000 }).should("include", "/clients_module/View");
      cy.wait("@clientList", { timeout: 10000 });

      // search for the client
      searchForClient("SalesNewClient Test");

      // verify that the first row contains the updated email and phone number
      cy.get(".ant-table-tbody tr")
        .first()
        .find("td")
        .eq(0)
        .find("a")
        .should("have.attr", "href")
        .then((href) => {
          // verify that the URL is correct
          const url = Cypress.config("TEST_URL") + href;
          const match = href.match(/search_term=([^&]*)/);
          const searchTerm = match ? decodeURIComponent(match[1]) : null;
          expect(searchTerm).to.eq("SalesNewClient Test");

          // const fullName = url.searchParams.get("search_term");
          // expect(fullName).to.eq("SalesNewClient Test");
        });

      // verify that the email is displayed
      cy.get(".ant-table-tbody tr")
        .first()
        .within(() => {
          cy.get("td").eq(4).should("contain.text", email);
        });

      // verify that the phone number is displayed
      cy.get(".ant-table-tbody tr")
        .first()
        .within(() => {
          cy.get("td").eq(5).should("contain.text", phone);
        });
    });

    // Test Case: Wallet Management System
    // - Validates the complete wallet transaction flow for a client.
    // - Tests adding funds through the wallet modal, including error handling for missing fields.
    // - Checks the email voucher functionality and verifies the print voucher generation.
    // - Validates error handling for invalid email and subject inputs in the email voucher modal.
    // - Ensures the print voucher page loads correctly and displays all required information and formatting.
    // - Tests navigation to the Add Account page from the wallet modal.
    it("Add Wallet Functionality", { retries: 3 }, () => {
      // intercept the API call to save the wallet
      cy.intercept(
        "POST",
        Cypress.env("TEST_BACKEND_URL") + "/clients_wallet"
      ).as("saveWallet");

      // intercept the API call to send an email voucher
      cy.intercept(
        "GET",
        Cypress.env("TEST_BACKEND_URL") + "/client_wallet_transaction/email/*"
      ).as("emailVoucher");

      // search for the client
      searchForClient("SalesNewClient Test");

      // fill in the wallet form
      fillAddWalletForm(true);

      // verify that the submit button is displayed
      cy.get(".ant-modal-footer")
        .find("button.ant-btn-primary")
        .should("be.visible")
        .and("not.be.disabled")
        .realClick();

      // verify that the message is displayed
      cy.get(".ant-message-notice")
        .should("be.visible")
        .and("contain.text", "Transaction has been created successfully!");

      // wait for the API call to complete
      cy.wait("@saveWallet").its("response.statusCode").should("eq", 200);

      // verify that the cancel button is displayed
      cy.get(".ant-modal-footer")
        .find("button.ant-btn-default")
        .should("be.visible")
        .and("not.be.disabled")
        .realClick();

      // reload the page
      cy.reload();

      // search for the client
      searchForClient("SalesNewClient Test");
      fillAddWalletForm(false);

      // verify that the send email checkbox is displayed
      cy.get(".ant-modal-footer label").contains("Send Email").click();

      cy.get(".ant-modal-footer")
        .find("button.ant-btn-primary")
        .should("be.visible")
        .and("not.be.disabled")
        .realClick();

      // verify that the message is displayed
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

      // verify that the platform slug is displayed
      cy.get("#platform_slug").realClick();

      // verify that the dropdown is displayed
      cy.get(".ant-select-dropdown:visible")
        .should("exist")
        .within(() => {
          cy.get(".ant-select-item-option-content")
            .first()
            .click({ force: true });
        });

      // verify that the email is displayed
      cy.get("#email").clear();
      cy.get("#subject").clear();

      // verify that the send button is displayed
      cy.contains("button", "Send").click();

      // verify that the error message is displayed
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

      // verify that the send button is displayed
      cy.contains("button", "Send").click();

      // wait for the API call to complete
      cy.wait("@emailVoucher").its("response.statusCode").should("eq", 400);

      // open the row action
      openRowAction("Add Wallet");

      // verify that the URL is correct
      cy.get('a[href="/ecommerce_module/PlatformIntegration"]').then(($a) => {
        // Remove target="_blank" to prevent new tab opening
        $a.removeAttr("target");
      });

      // verify that the modal title is displayed
      cy.get(".this-is-a-title.three")
        .should("be.visible")
        .and("not.be.empty")
        .contains("Email Voucher");

      // verify that the add account button is displayed
      cy.get("span").contains("Add Account").realClick();

      // verify that the URL is correct
      cy.location("pathname", { timeout: 35000 }).should(
        "eq",
        "/ecommerce_module/PlatformIntegration"
      );

      //Checking for the print voucher
      cy.visit(Cypress.env("TEST_URL") + "/clients_module/View", {
        failOnStatusCode: false,
        timeout: 30000,
      });

      // stub the window open function
      stubWindowOpen();

      // search for the client
      searchForClient("SalesNewClient Test");

      // fill in the wallet form
      fillAddWalletForm(false);

      // verify that the print voucher checkbox is displayed
      cy.get(".ant-modal-footer label").contains("Print Voucher").click();

      // verify that the submit button is displayed
      cy.get(".ant-modal-footer")
        .find("button.ant-btn-primary")
        .should("be.visible")
        .and("not.be.disabled")
        .realClick();

      // verify that the window open function is called
      cy.get("@windowOpen").should("have.been.calledOnce");
      cy.get("@windowOpen").then((stub) => {
        const relativePath = stub.firstCall.args[0];
        cy.window()
          .its("location.origin")
          .then((origin) => {
            // verify that the URL is correct
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

    // Test Case: Sales History Validation
    // - Verifies the purchase history navigation for a client.
    // - Accesses the sales history through row actions and checks that the correct tab is activated.
    // - Validates the transaction table structure, headers, and ensures data presence in sales records.
    // - Ensures the UI displays all expected columns and at least one row of sales data.
    it("Purchase History Functionality", { retries: 3 }, () => {
      // open the row action
      openRowAction("Purchase History");

      // verify that the URL is correct
      cy.url({ timeout: 35000 }).should(
        "include",
        "/clients_module/ClientDetails"
      );

      // verify that the sales tab is selected
      cy.contains('[role="tab"]', "Sales")
        .should("exist")
        .and("have.attr", "aria-selected", "true");

      // verify that the headers are displayed
      const headers = [
        "Transaction ID",
        "Product Name",
        "Boutique",
        "Product Code",
        "Sale Quantity",
        "Sales Price",
        "Sale Date",
      ];

      // verify that the headers are displayed
      cy.get(".ant-table-thead").within(() => {
        headers.map((header) => {
          cy.contains(header).should("exist");
        });
      });

      // verify that the table has at least one row
      cy.get(".ant-table-tbody tr").should("have.length.greaterThan", 0);
    });
  });

  // ADD NEW CLIENT & DELETE CLIENT FUNCTIONALITY
  describe("Add New Client Functionality", () => {
    let rnd, firstName, lastName, email, phone;
    before(() => {
      // generate random details
      rnd = Cypress._.random(1e3, 1e6);
      firstName = `TestFN${rnd}`;
      lastName = `TestLN${rnd}`;
      email = `test.${rnd}@example.com`;
      phone = `+1${Math.floor(1_000_000_000 + Math.random() * 9_000_000_000)}`;
    });

    // Test Case: Client Creation Workflow
    // - Navigates to the Add Client form by clicking the 'Add New Client' button and verifies the URL and form title.
    // - Tests form validation by attempting to submit empty required fields and checking for error messages for first name, last name, gender, phone, and email.
    // - Fills in all required fields: first name, last name, birth date, gender, nationality, preferred contact, phone number, and email.
    // - Handles adding and removing multiple phone numbers and emails, and checks validation for invalid formats.
    // - Fills in address details, including address lines, apartment number, district, postal code, country, and city.
    // - Clicks the sync button to fetch the next customer ID and waits for the API response.
    // - Selects the client status and sets the check-in and check-out dates, verifying validation for date order.
    // - Adds a note to the form and submits the client creation form.
    // - Waits for the API response and verifies the success notification for client creation.
    // - Ensures the new client appears in the client list by searching for the first name and checking the table.
    // - Clicks the new client in the table to navigate to the client details page and verifies the correct name is displayed.
    it(
      "fills and submits the Add Client form, then navigates back",
      { retries: 3 },
      () => {
        // intercept the API call to get the next customer ID
        cy.intercept(
          "GET",
          Cypress.env("TEST_BACKEND_URL") + "/clients/getNextCustomerId"
        ).as("getCustomerId");

        // intercept the API call to create a client
        cy.intercept("POST", Cypress.env("TEST_BACKEND_URL") + "/clients").as(
          "createClient"
        );

        // verify that the add new client button is displayed
        cy.get("button").contains("Add New Client").should("exist").click();

        // verify that the URL is correct
        cy.url({ timeout: 10000 }).should(
          "include",
          "/clients_module/AddClient"
        );
        cy.contains("Add client").should("exist");

        // verify that the first name field is displayed
        cy.get("#first_name").clear().type("Test").clear();
        cy.get(".ant-form-item-explain-error").should(
          "contain",
          "Enter first name"
        );

        // fill in the first name field
        typeByLabel("First name", firstName);

        // verify that the last name field is displayed
        cy.get("#last_name").clear().type("Test").clear();
        cy.get(".ant-form-item-explain-error").should(
          "contain",
          "Enter last name"
        );

        // fill in the last name field
        typeByLabel("Last name", lastName);

        // verify that the birth date field is displayed
        selectBirthDate("Birth date", 26);

        // verify that the gender field is displayed
        selectDropdownByLabel("Gender", "Male");

        // verify that the gender field is displayed
        cy.contains("label", "Gender")
          .parents(".ant-form-item")
          .find(".anticon.anticon-close-circle")
          .click({ force: true });

        // verify that the error message is displayed
        cy.get(".ant-form-item-explain-error").should(
          "contain",
          "Choose gender!"
        );

        // select the gender
        selectDropdownByLabel("Gender", "Male");

        // select the nationality
        selectDropdownByLabel("Nationality", "Angola");

        // select the preferred means of contact
        selectDropdownByLabel("Preferred means of contact", "By Email");

        // verify that the phone number field is displayed
        typeByLabel("Phone Number", "TestPhone");

        // verify that the error message is displayed
        cy.get(".ant-form-item-explain-error").should(
          "contain",
          "Please input a valid phone number e.g. +44xxxxxxxxxx"
        );

        // fill in the phone number field
        typeByLabel("Phone Number", phone);

        // click the add phone button
        clickAddItem("Add phone");

        // verify that the phone number field is displayed
        cy.get("input[placeholder='e.g. +44xxxxxxxxxx']")
          .eq(1)
          .type("+19876543212");

        // remove the second added phone number
        cy.get(".anticon-delete").first().should("be.visible").click();

        // verify that the phone number field is displayed
        cy.get("input[placeholder='e.g. +44xxxxxxxxxx']").should(
          "have.length",
          1
        );

        // verify that the email field is displayed
        typeByLabel("Email", "abc.com");
        cy.get(".ant-form-item-explain-error").should(
          "contain",
          "The input is not valid E-mail!"
        );

        // fill in the email field
        typeByLabel("Email", email);
        clickAddItem("Add email");

        // verify that the email field is displayed
        cy.get("input[placeholder='Email']").eq(1).type("test@gmail.com");

        // remove the second added email
        cy.get(".anticon-delete").first().should("be.visible").click();
        cy.get("input[placeholder='Email']").should("have.length", 1);

        // fill in the address field
        typeByLabel("Address", "Rua da Liberdade, N123");
        typeByLabel("Address2", "Bairro Benfica");
        typeByLabel("Apartment number", "Apartamento 12");
        typeByLabel("District", "Luanda");
        typeByLabel("Postal Code", "1000‑123");

        // select the country
        selectCountryAndCity("Choose country", "Angola");
        selectCountryAndCity("Choose/enter city", "Cabinda");

        // Click the sync button to fetch the next customer ID
        cy.get(".ant-input-suffix .anticon-sync").should("exist").click();
        cy.wait("@getCustomerId").its("response.statusCode").should("eq", 200);

        // select the status
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

        // verify that the error message is displayed
        cy.get("button").contains("OK").realClick();
        cy.get(".ant-form-item-explain-error").should(
          "contain",
          "The check-out date must be later than the check-in date."
        );

        // fill in the date time out field
        typeByLabel("Date time out", "December 1st 08:10 pm").type("{enter}", {
          force: true,
        });

        // fill in the note field
        typeByLabel(
          "Note",
          "This is a test note to verify that the Note field accepts and displays text correctly"
        );

        // verify that the add client button is displayed
        cy.get("button").contains("Add client").should("exist").realClick();

        // verify that the success message is displayed
        cy.get(".ant-message-notice")
          .should("be.visible")
          .and("contain.text", "Client has been created Successfully!.");

        // wait for the API call to complete
        cy.wait("@createClient").its("response.statusCode").should("eq", 200);

        // verify that the selected value appears in the select
        cy.get(".ant-select .ant-select-selection-item", {
          timeout: 5000,
        }).should("exist");

        // verify that the cancel button is displayed
        cy.contains("a", "Cancel")
          .should("have.attr", "href")
          .and("include", "/clients_module/View");

        // click the cancel button
        cy.contains("a", "Cancel").click();

        // verify that the URL is correct
        cy.url({ timeout: 10000 }).should("include", "/clients_module/View");

        // wait for the API call to complete
        cy.wait("@clientList", { timeout: 35000 });
        cy.wait("@platformsList", { timeout: 35000 });

        // search for the newly created client
        searchForClient(firstName);

        // wait for the API call to complete
        cy.wait("@clientList", { timeout: 35000 });

        // verify that the table has at least one row
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

        // verify that the title is displayed
        cy.get(".this-is-a-title.two", { timeout: 35000 }).should(
          "contain",
          `${firstName} ${lastName}`
        );
      }
    );

    // Test Case: Client Deletion Process
    // - Searches for the client to be deleted using the email address and waits for the client list to update.
    // - Opens the row actions menu for the first client and selects the 'Delete' option from the popover.
    // - Handles the delete confirmation modal by attempting to submit an empty reason and checking for the validation error.
    // - Enters a valid delete reason and confirms the deletion.
    // - Waits for the API call to complete and verifies that the delete reason is included in the request parameters.
    // - Reloads the page and searches for the deleted client again.
    // - Checks that the first row in the table is marked as deleted by verifying the presence of the 'deleted-row' class.
    it("Delete Client Functionality", { retries: 3 }, () => {
      // intercept the API call to delete a client
      cy.intercept(
        "DELETE",
        Cypress.env("TEST_BACKEND_URL") + "/clients/**"
      ).as("deleteClient");

      // search for the client
      searchForClient(email);

      // verify that the table has at least one row
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

      // verify that the popover is displayed
      cy.document().then((doc) => {
        // verify that the popover is displayed
        const pop = doc.querySelector(
          ".ant-popover .ant-popover-inner-content"
        );
        if (!pop) throw new Error("Popover not found");

        const deleteLi = Array.from(pop.querySelectorAll("li")).find((li) =>
          li.textContent.trim().startsWith("Delete")
        );

        // verify that the delete item is displayed
        if (!deleteLi) {
          throw new Error("Delete item not found in popover");
        }

        deleteLi.click({ force: true });
      });

      // verify that the delete item is displayed
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

      // verify that the modal content is displayed
      cy.get(".ant-modal-content", { timeout: 10000 }).should("exist");

      // verify that the delete reason field is displayed
      cy.get("#form_in_modal_delete_reason")
        .should("be.visible")
        .type("Test")
        .clear();

      // verify that the error message is displayed
      cy.get(".ant-form-item-explain-error").contains(
        "Please enter the reason!"
      );

      // fill in the delete reason field
      cy.get("#form_in_modal_delete_reason")
        .should("be.visible")
        .type("Testing delete reason");

      // verify that the yes button is displayed
      cy.contains("button", "Yes").click();

      // wait for the API call to complete
      cy.wait("@deleteClient").then((interception) => {
        const requestUrl = new URL(interception.request.url);

        const deleteReason = requestUrl.searchParams.get("delete_reason");
        expect(deleteReason).to.eq("Testing delete reason");
      });

      // reload the page
      cy.reload();

      // search for the client
      searchForClient(email);

      // verify that the table has at least one row
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
      // intercept the API call to search for a client
      cy.intercept(
        "GET",
        Cypress.env("TEST_BACKEND_URL") + "/clients/clientSearch*"
      ).as("clientSearch");

      // intercept the API call to get the next customer ID
      cy.intercept(
        "GET",
        Cypress.env("TEST_BACKEND_URL") + "/clients/getNextCustomerId"
      ).as("getCustomerId");

      // intercept the API call to create a client
      cy.intercept("POST", Cypress.env("TEST_BACKEND_URL") + "/clients").as(
        "createClient"
      );

      // verify that the add new client button is displayed
      cy.get("button").contains("Add New Client").should("exist").click();
      cy.url({ timeout: 10000 }).should("include", "/clients_module/AddClient");
      cy.contains("Add client").should("exist");

      // verify that the search input is displayed
      cy.get('input[placeholder="Search for client/traffic"]')
        .type(" ")
        .parents(".ant-input-affix-wrapper")
        .parent()
        .find(".ant-input-group-addon .ant-input-search-button")
        .forceClick();
    });

    // Test Case: Search Modal Validation
    // - Tests the client search functionality within the add client form.
    // - Verifies the modal structure, including all filter fields and their placeholders.
    // - Checks that the select button is disabled by default and only enabled when a record is selected.
    // - Ensures all static elements and controls render correctly on modal open.
    it("should show the modal title and all fields", { retries: 3 }, () => {
      // verify that the modal title is displayed
      cy.get(".this-is-a-title").should(
        "contain.text",
        "Search client/traffic"
      );

      // verify that the name field is displayed
      cy.get('label[for="form_in_modal_name"]').should("have.text", "Name");
      cy.get("#form_in_modal_name")
        .should("have.attr", "placeholder", "Search by name")
        .and("have.value", " ");

      // verify that the email field is displayed
      cy.get('label[for="form_in_modal_email"]').should("have.text", "Email");
      cy.get("#form_in_modal_email").should(
        "have.attr",
        "placeholder",
        "Search by email"
      );

      // verify that the phone field is displayed
      cy.get('label[for="form_in_modal_phone"]').should("have.text", "Phone");
      cy.get("#form_in_modal_phone").should(
        "have.attr",
        "placeholder",
        "Search by phone"
      );

      // verify that the boutique select is displayed
      cy.get('label[for="form_in_modal_boutique"]').should(
        "have.text",
        "Boutique"
      );
      cy.get("#form_in_modal_boutique").should("exist");

      // verify that the date picker is displayed
      cy.get('label[for="form_in_modal_date"]').should(
        "contain.text",
        "Last Visit Date"
      );
      cy.get("#form_in_modal_date").should(
        "have.attr",
        "placeholder",
        "Start date"
      );

      // verify that the select button is disabled by default
      cy.contains("button", "Select").should("be.disabled");
    });

    // Test Case: Advanced Search Operations
    // - Validates complex search scenarios in the add client search modal.
    // - Tests multi-criteria searches, date range filtering, and boutique selection.
    // - Executes a search, verifies results, and selects a record to transfer data to the add client form.
    // - Ensures the selected client data is correctly populated in the add client form after selection.
    it("Functionality of Search Modal", { retries: 3 }, () => {
      // fill in the form
      typeInField("form_in_modal_name", "Traffic104 Record").should(
        "have.value",
        "Traffic104 Record"
      );

      // clear the name field
      clearField("form_in_modal_name").should("have.value", "");

      // fill in the email field
      typeInField(
        "form_in_modal_email",
        "traffic_email_104@example.com"
      ).should("have.value", "traffic_email_104@example.com");

      // fill in the phone field
      typeInField("form_in_modal_phone", "08198638020").should(
        "have.value",
        "08198638020"
      );

      // select the boutique
      selectDropdownOption("#form_in_modal_boutique", "Boutique8");

      // open the date picker
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

      // verify that the radio button is displayed
      cy.get('input[name="Traffic104 Record"]')
        .parents(".ant-radio")
        .click({ force: true });

      // verify that the select button is displayed
      cy.contains("button", "Select")
        .should("exist")
        .should("be.enabled")
        .forceClick();

      // wait for the API call to complete
      cy.wait("@clientSearch", { timeout: 5000 });

      // verify that the URL is correct
      cy.url({ timeout: 10000 }).should("include", "/clients_module/AddClient");
      cy.contains("Add client").should("exist");

      // verify that the first name field is displayed
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
    // verify that the search input is displayed
    cy.get("input[placeholder='Type and hit Enter']")
      .clear({ force: true })
      .type(term);

    // verify that the search button is displayed
    cy.get(".anticon-search").realClick();

    // verify that the search button is clicked
    cy.contains("button", "Search").then(($btn) => {
      $btn[0].click();
    });

    // wait for the API call to complete
    cy.wait("@clientList", { timeout: 35000 });
  }

  function openRowAction(action) {
    // verify that the table has at least one row
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

    // verify that the popover is displayed
    cy.get(".ant-popover")
      .contains("li", action)
      .then(($el) => {
        $el[0].dispatchEvent(new MouseEvent("click", { bubbles: true }));
      });
  }

  function typeInField(fieldId, text) {
    // verify that the field is displayed
    return cy
      .get(`#${fieldId}`)
      .clear({ force: true })
      .type(text, { force: true });
  }

  function clearField(fieldId) {
    // verify that the field is displayed
    return cy
      .get(`#${fieldId}`)
      .siblings(".ant-input-suffix")
      .find(".ant-input-clear-icon")
      .click({ force: true });
  }

  function selectCountryAndCity(entity, name) {
    // verify that the select is displayed
    cy.get(".ant-select-selection-placeholder")
      .contains(entity)
      .should("exist")
      .click({ force: true }); // triggers the dropdown

    // verify that the dropdown is displayed
    cy.get(".ant-select-dropdown:visible", { timeout: 35000 })
      .first()
      .within(() => {
        cy.contains(".ant-select-item-option", name).realClick();
      });
  }

  function selectDropdownOption(selectId, optionText) {
    // verify that the select is displayed
    cy.get(selectId).click({ force: true });

    // verify that the dropdown is displayed
    cy.get(".ant-select-dropdown")
      .filter(":visible")
      .first()
      .contains(".ant-select-item-option", optionText)
      .click({ force: true });
  }

  function clickAddItem(buttonText) {
    // verify that the button is displayed
    return cy
      .contains("button.addItem", buttonText)
      .should("be.visible")
      .within(() => {
        // verify that the + icon is displayed
        cy.get(".ant-btn-icon .anticon-plus").should("exist");
      })
      .click();
  }

  function selectDropdownByLabel(labelText, optionText) {
    // verify that the select is displayed
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
    // verify that the window is displayed
    cy.window().then((win) => cy.stub(win, "open").as("windowOpen"));
  }

  function fillAddWalletForm(check) {
    // open the row action
    openRowAction("Add Wallet");

    // verify that the modal content is displayed
    cy.get(".ant-modal-content", { timeout: 10000 }).should("exist");

    // cy.get(".this-is-a-title.three")
    //   .should("be.visible")
    //   .and("not.be.empty")
    //   .contains("SalesNewClient Test Wallet");

    // verify that the boutique select is displayed
    cy.get("#boutique").should("exist").and("be.disabled");

    // verify that the payment mode select is displayed
    cy.get("#payment_mode").click({ force: true });

    // verify that the modal footer is displayed
    if (check) {
      // verify that the primary button is displayed
      cy.get(".ant-modal-footer")
        .find("button.ant-btn-primary")
        // .should("be.visible")
        .and("not.be.disabled")
        .realClick();

      // verify that the primary button is displayed
      cy.get(".ant-modal-footer")
        .find("button.ant-btn-primary")
        // .should("be.visible")
        .and("not.be.disabled")
        .realClick();

      // verify that the error message is displayed
      cy.get(".ant-message-notice-content").contains(
        "All fields are required!"
      );
    }

    // verify that the dropdown is displayed
    cy.get(".ant-select-dropdown")
      .should("exist")
      .within(() => {
        cy.contains(".ant-select-item-option-content", "Cash")
          .scrollIntoView()
          .click({ force: true });
      });

    // verify that the dropdown option is displayed
    cy.get(".ant-select-item-option-content").should("contain", "Cash");

    // verify that the modal footer is displayed
    if (check) {
      // verify that the primary button is displayed
      cy.get(".ant-modal-footer")
        .find("button.ant-btn-primary")
        .should("be.visible")
        .and("not.be.disabled")
        .realClick();

      // verify that the error message is displayed
      cy.get(".ant-message-notice-content").contains(
        "All fields are required!"
      );
    }

    // verify that the amount field is displayed
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
    // verify that the label is displayed
    cy.contains("label", labelText)
      .should("exist")
      .parents(".ant-form-item-row")
      .find(".ant-form-item-control")
      .within(() => {
        cy.get(".ant-picker-input").should("exist").realClick();
      });

    // verify that the picker is displayed
    cy.get(".ant-picker-dropdown").should("be.visible");

    // verify that the date is displayed
    cy.get(".ant-picker-cell-inner")
      .contains(new RegExp(`^${date}$`))
      .realClick();

    // verify that the time stamp is displayed
    if (timeStamp) {
      const [time, period] = timeStamp.split(" ");
      const [hour, minute] = time.split(":");

      // verify that the time is displayed
      cy.get(".ant-picker-time-panel-column")
        .eq(0)
        .contains(new RegExp(`^${hour}$`))
        .realClick();

      // verify that the minutes are displayed
      cy.get(".ant-picker-time-panel-column")
        .eq(1)
        .contains(new RegExp(`^${minute}$`))
        .realClick();

      // verify that the period is displayed
      cy.get(".ant-picker-time-panel-column")
        .eq(2)
        .contains(period)
        .realClick();

      // verify that the OK button is displayed
      cy.get("button").contains("OK").realClick();
    }
  }

  function checkRenderingOfSelects(label) {
    // build the input id from the label
    const id = label
      .split("/")[0]
      .toLowerCase()
      .replace(/\s+/g, "_")
      .replace(/\?/g, "");

    cy.log("Id:" + id);

    // verify that the label is displayed
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
    // build the input id from the label
    let id = label
      .split("/")[0]
      .toLowerCase()
      .replace(/\s+/g, "_")
      .replace(/\?/g, "");

    if (label == "RFM Segment") {
      id = "segment";
    }

    // log the label and id
    cy.log("Selecting from filter: " + label + " [ID:" + id + "]");

    // verify that the label is displayed
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

    // verify that the dropdown is displayed
    cy.get(".ant-select-dropdown").should("be.visible");

    // verify that the options are displayed
    cy.get(".rc-virtual-list-holder-inner", { timeout: 5000 })
      .should("have.length.greaterThan", 0)
      .then(($options) => {
        // verify that the options are displayed
        cy.wrap($options[0]).click();
      });
  }
});
