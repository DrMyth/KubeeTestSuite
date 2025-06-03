import dayjs from "dayjs";
import {
  testColumnSorting,
  testColumnToggling,
  testExpandButton,
  testRowNavigation,
  testSyncButton,
  testPagination,
} from "../Shared/view.cy";
require("dotenv").config();

describe("Sales View Page Tests", () => {
  function configureTestEnvironment() {
    // Ignore uncaught exceptions
    cy.on("uncaught:exception", (err) => {
      console.error("Uncaught exception:", err.message);
      return false;
    });
    cy.viewport(1280, 720);
  }

  beforeEach(() => {
    // Intercept the API calls
    cy.intercept("GET", "**/platforms*").as("platformsList");
    cy.intercept("GET", "**/products/getAllowedProductsForClient*").as(
      "getAllowedProductsForClient"
    );
    cy.intercept("POST", "**/sales").as("addSale");
    cy.intercept("GET", "**/sales*").as("salesList");

    // Configure the test environment
    configureTestEnvironment();
    // Login to the application
    cy.login();
    // Visit the sales view page
    cy.visit(Cypress.env("TEST_URL") + "/sales_module/ViewSales", {
      failOnStatusCode: false,
      timeout: 30000,
    });

    // Wait for the sales list to load
    cy.wait("@salesList", { timeout: 30000 });

    // Verify the page title
    cy.contains("Sales", { timeout: 10000 }).should("be.visible");
  });

  // INITIAL RENDERING TESTS
  describe("Initial Rendering Tests", () => {
    // Test Case: Initial Rendering of Sales View Page
    // Verifies the presence and correct rendering of all main UI elements:
    // - Page header, "Add New Sale" button, and icons.
    // - All filter dropdowns (Boutique, Client, Employee, Date, and advanced filters).
    // - Search bar and action buttons (save, more, expand, sync, export to Excel).
    // - Table headers, sorting icons, and pagination controls.
    // Ensures that clicking "More Filters" reveals additional filter options.
    // Checks that the table structure and all expected columns are present and visible.
    it("Should render all page elements correctly", { retries: 3 }, () => {
      // Verify Header Section
      cy.get(".this-is-a-title").should("contain", "Sales");
      cy.contains("button", "Add New Sale")
        .should("be.visible")
        .and("contain", "Add New Sale")
        .find(".anticon-plus")
        .should("exist");

      // Validate Filters Section
      // Boutique Filter
      checkRenderingOfSelects("Boutique");

      // Client Filter
      checkRenderingOfSelects("Client");

      // Employee Filter
      checkRenderingOfSelects("Employee");

      // Date range picker
      cy.contains("label", "Date")
        .should("exist")
        .parents(".ant-form-item-row")
        .find(".ant-form-item-control")
        .within(() => {
          cy.get(".ant-picker-range-separator").should("exist");
          cy.get('input[placeholder="Start date"]').should("exist");
          cy.get('input[placeholder="End date"]').should("exist");
          cy.get(".ant-picker").should("exist");
        });

      // Action Buttons
      cy.get("button")
        .contains("More Filters")
        .should("exist")
        .click({ timeout: 5000 });

      // Advanced Filters
      [
        "Product Category",
        "Product Collection",
        "Product Sub-Collection",
        "Product Line",
        "status",
        "Gender",
        "Products",
      ].forEach((label) => {
        cy.contains("label", label).should("exist");
        checkRenderingOfSelects(label);
      });

      // Search Button
      cy.contains("button", "Search").should("exist");

      // Save Button
      cy.get("button").find('[aria-label="save"]').should("exist");

      // Verify Search Bar
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

      // Action buttons and icons
      ["save", "more", "expand", "sync"].forEach((icon) => {
        cy.get(`svg[data-icon="${icon}"]`)
          .should("exist")
          .parent(`.anticon.anticon-${icon}`)
          .should("exist");
      });

      // Export to Excel Button
      cy.contains("button", "Export to Excel")
        .should("exist")
        .parent()
        .find(".ant-btn-icon")
        .find(".anticon-file-excel")
        .should("exist");

      // Clear Button (Clears all the filters)
      cy.contains("label", "Employee")
        .should("exist")
        .parents(".ant-form-item-row")
        .find(".ant-form-item-control")
        .within(() => {
          cy.get(".anticon-close-circle")
            .should("exist")
            .click({ force: true });
        });

      // Search Button
      cy.get("button")
        .contains("Search")
        .should("exist")
        .click({ force: true });

      // Check Data Table Structure
      // Table Headers
      const headers = [
        "Transaction ID",
        "Product Name",
        "Boutique",
        "Sale Representative",
        "Sale Quantity",
        "Sales Price",
        "Sales Price in Euro",
        "DIS Amt",
        "Sale Date",
        "Client",
        "Actions",
      ];

      // Verify the table headers
      cy.get(".ant-table").within(() => {
        headers.forEach((text) => {
          cy.get("th.ant-table-cell").contains(text).should("be.visible");
        });
      });

      // Sorting Icons
      const sortable = [
        "Transaction ID",
        "Sales Price",
        "Sales Price in Euro",
        "Sale Date",
      ];

      // Verify the sorting icons
      sortable.forEach((label) => {
        cy.get(`th[aria-label="${label}"]`).within(() => {
          // assert up and down carets are present & visible
          cy.get(".ant-table-column-sorter-up").should("be.visible");
          cy.get(".ant-table-column-sorter-down").should("be.visible");
        });
      });

      // Validate Pagination Controls
      cy.get(".ant-pagination").within(() => {
        cy.get(".ant-pagination-prev").should("exist");
        cy.get(".ant-pagination-next").should("exist");
        cy.contains("10 / page").should("exist");
        cy.get(".ant-pagination-item-active").should("contain", "1");
      });
    });
  });

  // FILTER FUNCTIONALITY TESTS
  describe("Filter Functionality Tests", () => {
    // Test Case: Full Filter Application and Saved Search Management
    // - Applies all available filters (basic: Client, Employee; advanced: Product Category, Product Collection, Product Sub-Collection, Product Line, Status, Gender, Products).
    // - Selects a date range using the date picker (last 30 days).
    // - Executes a search and validates that the table updates with filtered results (at least one row is present).
    // - Saves the current filter set as a named search and confirms the save notification.
    // - Loads the saved search to ensure it is retrievable and applies correctly.
    // - Deletes the saved search and confirms successful deletion via notification.
    // This test ensures that all filter controls work as expected, the search results update accordingly, and the saved search feature (save, load, delete) functions correctly end-to-end.
    it(
      "Should apply full filter set and validate results",
      { retries: 3 },
      () => {
        // Basic filter selections for "Nationality", "Gender", and "Status".
        ["Client", "Employee"].forEach((label) => {
          checkAndSelectOption(label);
        });

        // Advanced Filters Search
        cy.get("button")
          .contains("More Filters")
          .should("exist")
          .click({ timeout: 5000 });

        [
          "Product Category",
          "Product Collection",
          "Product Sub-Collection",
          "Product Line",
          "status",
          "Gender",
          "Products",
        ].forEach((label) => {
          checkAndSelectOption(label);
        });

        // Date range selection using dayjs to compute start/end
        let start = dayjs().subtract(30, "day");
        let end = dayjs();

        cy.get("input[placeholder='End date']").realClick();

        // Select the end date
        selectDateFromPicker(1, end.date());
        // Select the start date
        selectDateFromPicker(0, start.date());

        // Click the Search button
        cy.get("button")
          .contains("Search")
          .should("exist")
          .click({ force: true });
        cy.wait("@salesList", { timeout: 10000 });

        // Validate the table is not empty
        cy.get(".ant-table-tbody").should("exist");
        cy.get(".ant-table-tbody").should("have.length.greaterThan", 0);

        // Validate the table has rows
        cy.get(".ant-table-tbody").within(() => {
          cy.get("tr").should("have.length.greaterThan", 0);
        });

        // Save filter settings
        cy.get('svg[data-icon="save"]')
          .should("exist")
          .parent(".anticon.anticon-save")
          .should("exist")
          .click();

        // Validate the save modal is visible
        cy.get(".ant-modal-header").contains("Confirm Save").should("exist");
        cy.get(".ant-modal-body")
          .should("exist")
          .within(() => {
            cy.get("input[placeholder='Enter search name']")
              .should("exist")
              .type("Filter Search Selection");
          });

        // Click the Save button
        cy.get(".ant-modal-footer")
          .should("exist")
          .within(() => {
            cy.contains("button", "Yes", { timeout: 10000 })
              .should("be.visible")
              .click();
          });

        // Validate the save notification
        cy.get(".ant-message-notice-content", { timeout: 5000 }).contains(
          "Search settings saved successfully."
        );

        // Checks if the search have saved correctly or not
        cy.get("button.ant-btn-primary")
          .should("contain.text", "Saved Searches")
          .find(".anticon-down")
          .should("exist")
          .click();

        // Intercept the deleteDefaultSearch API call
        cy.intercept("DELETE", /\/api\/v1\/default-search\/\d+/).as(
          "deleteDefaultSearch"
        );

        // Validate the dropdown menu is visible
        cy.get(".ant-dropdown-menu")
          .should("exist")
          .within(() => {
            cy.get(".ant-dropdown-menu-item").its("length").should("be.gte", 1);

            // Click the saved search
            cy.contains(".ant-dropdown-menu-item", "Filter Search Selection")
              .should("exist")
              .click();
          });

        cy.wait("@salesList", { timeout: 10000 });

        // Delete saved search
        cy.get("button.ant-btn-primary")
          .should("contain.text", "Saved Searches")
          .find(".anticon-down")
          .should("exist")
          .click();

        // Validate the dropdown menu is visible
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

        // Validate the delete request
        cy.wait("@deleteDefaultSearch")
          .its("response.statusCode")
          .should("eq", 200);

        // Validate the delete notification
        cy.get(".ant-message-notice-content", { timeout: 5000 }).contains(
          "Search deleted successfully."
        );
      }
    );
  });

  // TABLE FUNCTIONALITY TESTS
  describe("Table Functionality Tests", () => {
    // Test Case: Table Search and Reset Functionality
    // Clears all filters and performs a full-text search in the table.
    // Verifies that the search term is retained in the input and that all visible rows contain the search term.
    // Tests the clear (reset) functionality of the search input.
    // Ensures that clearing the search input resets the table to its default state and row count.
    it("Tests the table functionality", { retries: 3 }, () => {
      // Clear all filters
      cy.contains("label", "Employee")
        .parents(".ant-form-item-row")
        .find("[data-icon='close-circle']")
        .realClick();

      // Tests searching within the table and clearing results
      const searchTerm = "AddClient Te";

      // Type and submit search
      cy.get('.ant-input[placeholder="Type and hit Enter"]')
        .type(searchTerm)
        .type("{enter}");

      // Verify search input value
      cy.get(".ant-input").should("have.value", searchTerm);

      // Verify table results (adjust selector based on your table structure)
      cy.get(".ant-table-row")
        .should("have.length.gt", 0)
        .each((row) => {
          cy.wrap(row).should("contain", searchTerm);
        });

      // Test clear functionality
      cy.get(".ant-input-clear-icon").click();
      cy.get(".ant-input").should("have.value", "");

      // Verify table reset
      cy.get(".ant-table-row").should("have.length", 10);
    });

    // Sync Button Functionality
    testSyncButton({
      apiAlias: "salesList",
      invoiceSearch: true,
    });

    // Validates the More menu columns toggling
    testColumnToggling({
      columnsToToggle: [
        { name: "Transaction ID", shouldExist: false },
        { name: "Sale Representative", shouldExist: false },
        { name: "Collection", shouldExist: true },
        { name: "Barcode", shouldExist: true },
      ],
    });

    // Toggles full-screen mode via the expand button
    testExpandButton({ SalesPage: true });

    // Validates pagination controls, page size, and quick-jump
    testPagination({
      defaultPageSize: 10,
      pageSizeOptions: [10],
      invoiceSearch: true,
    });

    // Validates sorting of the "Invoice Amount", "Invoice Amount in Euro", "Invoice Date" columns via class toggling
    testColumnSorting({
      columnHeaders: [
        "Transaction ID",
        "Sales Price",
        "Sales Price in Euro",
        "Sale Date",
      ],
      invoiceSearch: true,
    });

    // Navigates to invoice details when clicking on a client name
    testRowNavigation({
      urlPattern: "/sales_module/SaleDetail?sale_id=",
      invoiceSearch: true,
    });

    // Test Case: Export to Excel Functionality
    // Selects "All Employees" in the Employee filter and performs a search.
    // Clicks the "Export to Excel" button.
    // Waits for the export API request and validates that a .xlsx file is downloaded.
    // Checks that the downloaded file has the correct format (zip magic bytes for .xlsx).
    it(
      "Should trigger an export request and download a .xlsx file",
      { retries: 3 },
      () => {
        // Intercept the exportSales API call
        cy.intercept("GET", "/api/v1/sales?purpose=export*").as("exportSales");

        // Select All Employees
        checkAndSelectOption("Employee", "All Employees");

        // Click the Search button
        cy.get("button").contains("Search").should("exist").click();

        // Wait for the invoices list to load
        cy.wait("@salesList", { timeout: 35000 });

        // Click the Export to Excel button
        cy.get("button")
          .contains("Export to Excel")
          .should("be.visible")
          .click({ force: true });

        // Wait for the request, then assert on URL and response headers
        cy.wait("@exportSales", { timeout: 35000 }).then(() => {
          const fileName = "sales.xlsx";
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
  });

  // ADD NEW SALE FUNCTIONALITY TESTS
  describe("Add New Sale Functionality", () => {
    // Test Case: Add New Sale Functionality
    // Clicks the "Add New Sale" button and navigates to the Add Sale page.
    // Executes the full add sale flow using the addSale() helper:
    //   - Fills in sale date, boutique, client, sales representatives, transaction ID, and products.
    //   - Applies discounts, VAT, and verifies calculations.
    //   - Handles payment modes and validates error/success messages.
    // Ensures all steps and validations in the add sale process are covered.
    it("Should add a new sale", { retries: 3 }, () => {
      // Click the Add New Sale button
      cy.contains("button", "Add New Sale")
        .should("exist")
        .click({ force: true });

      // Verify the Add Sale page is loaded
      cy.url({ timeout: 35000 }).should("include", "/sales_module/AddSale");

      // Execute the full add sale flow
      addSale();
    });
  });

  // SALE MANAGEMENT FUNCTIONALITY TESTS
  describe("Sale Management Functionality", () => {
    // Test Case: Add Task to Sale
    // Intercepts notification API for task creation.
    // Filters by Employee and searches for sales.
    // Opens the row action menu and selects "Add Task".
    // Validates the task creation modal and form validation errors.
    // Fills in task details, selects an assignee, and submits the form.
    // Verifies success message after task creation.
    it("Should add a task to a sale", { retries: 3 }, () => {
      // Intercept the notification API call
      cy.intercept(
        "POST",
        Cypress.env("TEST_BACKEND_URL") + "/notifications"
      ).as("notificationApi");

      // Select All Employees
      checkAndSelectOption("Employee", "All Employees");

      // Click the Search button
      cy.get("button").contains("Search").should("exist").click();

      // Wait for the invoices list to load
      cy.wait("@salesList", { timeout: 35000 });

      // Open the row action menu and select "Add Task"
      openRowAction("Add Task");

      // Verify the task creation modal is visible
      cy.get(".ant-modal-content").should("be.visible");

      // Check the task form fields
      cy.get("button").contains("Add Task").click();

      // Check for form validation errors
      cy.get(".ant-form-item-explain-error")
        .contains("Enter task name")
        .should("exist");

      // Check for due date validation error
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

      // Select an assignee
      cy.get(".ant-select-item-option")
        .contains("Varun Maramreddy")
        .forceClick();

      // Submit the form
      cy.get("button").contains("Add Task").click();
      cy.wait("@notificationApi").its("response.statusCode").should("eq", 200);

      // Check for success message
      cy.get(".ant-message-notice")
        .should("be.visible")
        .and("contain.text", "Task created successfully");
    });

    // Test Case: Return Sale Functionality
    // Filters by Employee and searches for sales.
    // Opens the row action menu and selects "Return Sale".
    // Navigates to the Return Sale page and interacts with the return form.
    // Selects return quantity, payment mode, and fills in paid amount.
    // Validates error messages for incorrect payment and ensures correct calculation of remaining amount.
    // Submits the return and checks for both error and success messages.
    it(
      "Should process a sale return and validate payment logic",
      { retries: 3 },
      () => {
        // Select All Employees1
        checkAndSelectOption("Employee", "All Employees");

        // Click the Search button
        cy.get("button").contains("Search").should("exist").click();

        // Wait for the invoices list to load
        cy.wait("@salesList", { timeout: 35000 });

        // Open the row action menu and select "Return Sale"
        openRowAction("Return Sale");
        cy.url({ timeout: 35000 }).should(
          "include",
          "/sales_module/ReturnSale"
        );

        // Select the return quantity
        cy.get("tbody tr")
          .find("td")
          .eq(9)
          .find("input")
          .click({ force: true });
        cy.get(".ant-select-item-option").contains("-1").forceClick();

        // Get the remaining amount
        cy.contains("Remaining Amount To Be Returned:")
          .invoke("text")
          .then((txt) => {
            const num = parseFloat(
              txt.replace(/^.*?:\s*/, "").replace(/[^\d.]/g, "")
            );

            cy.wrap(num).as("remainingAmount");
          });

        // Select the payment mode
        selectByLabel("Payment mode", "Cash");

        // Fill in the paid amount
        fillInByLabel("Paid amount", 50);

        // Submit the return
        cy.get("button").contains("Submit").realClick();
        cy.wait("@addSale", { timeout: 35000 });

        // Validate the error message
        cy.get(".ant-message-notice-content").should(
          "contain.text",
          "Total paid price should be equal to total sales price."
        );

        // Fill in the paid amount
        cy.get("@remainingAmount").then((remainingAmount) => {
          fillInByLabel("Paid amount", remainingAmount);
        });

        // Validate the remaining amount
        cy.contains("Remaining Amount To Be Returned:")
          .invoke("text")
          .then((txt) => {
            const num = parseFloat(
              txt.replace(/^.*?:\s*/, "").replace(/[^\d.]/g, "")
            );

            expect(num).to.equal(0);
          });

        // Submit the return
        cy.get("button").contains("Submit").realClick();
        cy.wait("@addSale", { timeout: 35000 })
          .its("response.statusCode")
          .should("eq", 500);

        // Validate the error message
        cy.get(".ant-message-notice-content")
          .should("exist")
          .and("contain", "Oops! Something went wrong. Please contact Admin!");
      }
    );

    // Test Case: Delete Sale Functionality
    // Intercepts the delete sale API.
    // Filters by Employee and searches for sales.
    // Opens the row action menu and selects "Delete".
    // Confirms the delete action in the modal.
    // Waits for the delete API call and verifies the success message.
    it("Should delete a sale and show success message", { retries: 3 }, () => {
      // Intercept the delete sale API call
      cy.intercept("DELETE", Cypress.env("TEST_BACKEND_URL") + "/sales/*").as(
        "deleteSale"
      );

      // Select All Employees
      checkAndSelectOption("Employee", "All Employees");

      // Click the Search button
      cy.get("button").contains("Search").should("exist").click();

      // Wait for the invoices list to load
      cy.wait("@salesList", { timeout: 35000 });

      // Open the row action menu and select "Delete"
      openRowAction("Delete");

      // Verify the delete confirmation modal is visible
      cy.get(".ant-modal-content", { timeout: 10000 }).should("be.visible");

      // Assert the question text is correct
      cy.get(".ant-modal-confirm-title").should(
        "have.text",
        "Are you sure to delete the sale?"
      );

      // Click the "Yes" button in the modal footer
      cy.get(".ant-modal-confirm-btns").contains("button", "Yes").click();

      // Optionally confirm the modal is gone
      cy.get(".ant-modal-content").should("not.exist");

      // Wait for the delete API call
      cy.wait("@deleteSale", { timeout: 35000 });

      // Validate the success message
      cy.get(".ant-message-notice-content").should(
        "contain.text",
        "Sale has been deleted successfully"
      );
    });

    // Test Case: Download Sale PDF Functionality
    // Intercepts the download sale API.
    // Filters by Employee and searches for sales.
    // Opens the row action menu and selects "Download".
    // Waits for the download API call and validates the response headers.
    // Ensures the downloaded file is a PDF and has the correct filename format.
    it(
      "Should download sale as PDF and validate filename",
      { retries: 3 },
      () => {
        // Intercept the download sale API call
        cy.intercept("GET", "/api/v1/sales/download/*").as("downloadSale");

        // Select All Employees
        checkAndSelectOption("Employee", "All Employees");

        // Click the Search button
        cy.get("button").contains("Search").should("exist").click();

        // Wait for the sales list to load
        cy.wait("@salesList", { timeout: 35000 });

        // Open the row action menu and select "Download"
        openRowAction("Download");

        // Wait for the request, then assert on URL and response headers
        cy.wait("@downloadSale").then((interception) => {
          expect(interception, "interception exists").to.exist;

          // grab the raw header
          const cd = interception.response.headers["content-disposition"];

          // capture everything between the two double-quotes
          const match = cd.match(/filename="([^"]+)"/);
          expect(match, "filename capture").to.have.length(2);

          // now fullName has NO extra quotes
          const fullName = match[1];
          expect(fullName, "got filename").to.be.a("string");

          // assert it starts with IN + digits and ends in .pdf
          expect(fullName).to.match(
            /\.pdf$/,
            `"${fullName}" should end with .pdf`
          );
        });
      }
    );

    // Test Case: Email Sale Receipt Functionality
    // Intercepts the send email API.
    // Filters by Employee and searches for sales.
    // Opens the row action menu and selects "Email Receipt".
    // Validates the email configuration modal and its fields.
    // Fills in sender, subject, recipient, and CC fields.
    // Sends the email and waits for the API response.
    // Checks for error message if email configuration is incorrect.
    it(
      "Should send sale receipt email and handle errors",
      { retries: 3 },
      () => {
        // Intercept the send email API call
        cy.intercept("GET", "/api/v1/sales/send/email/*").as("sendEmail");

        // Select All Employees
        checkAndSelectOption("Employee", "All Employees");

        // Click the Search button
        cy.get("button").contains("Search").should("exist").click();

        // Wait for the sales list to load
        cy.wait("@salesList", { timeout: 35000 });

        // Open the row action menu and select "Email Receipt"
        openRowAction("Email Receipt");

        // Verify the email configuration modal is visible
        cy.get(".ant-modal-content")
          .filter(":visible")
          .within(() => {
            cy.get(".anticon.anticon-sync")
              .should("exist")
              .click({ force: true });
            cy.wait("@platformsList", { timeout: 35000 });
            cy.get("label").contains("From Account").should("exist");
            cy.get("input#subject").should("exist");
            cy.get("input#email").should("exist");
            cy.get("input#cc").should("exist");
          });

        // Select the From Account
        selectByLabel("From Account", "ranash@kubeeanalytics.con");

        // Clear and type a Subject
        cy.get("input#subject").clear().type("Test Invoice Subject");

        // Clear and type a To Email
        cy.get("input#email").clear().type("test@example.com");

        // Clear and type a Cc Email
        cy.get("input#cc").clear().type("cc1@example.com");

        // Send the email
        cy.get(".ant-modal-footer")
          .filter(":visible")
          .within(() => {
            cy.get("button").contains("Send").click({ force: true });
          });

        // Wait for the sendEmail to complete
        cy.wait("@sendEmail", { timeout: 35000 });

        // Check for error message
        cy.get(".ant-message-notice")
          .should("be.visible")
          .and(
            "contain.text",
            "Email has not been sent. Your boutique communication email configuration has missing/wrong information"
          );
      }
    );
  });

  // HELPER FUNCTIONS

  function checkRenderingOfSelects(label) {
    // Ensure the label exists and is associated with a form item row
    cy.contains("label", label)
      .should("exist")
      .parents(".ant-form-item-row")
      .find(".ant-form-item-control")
      .within(() => {
        cy.get(".ant-select-selector").should("exist");
        cy.get(".ant-select-selection-search input").should("exist");
      });
  }

  function checkAndSelectOption(label) {
    // Get the ID of the filter
    let id = label
      .split("/")[0]
      .toLowerCase()
      .replace(/\s+/g, "_")
      .replace(/\?/g, "");

    // Log the selection
    cy.log("Selecting from filter: " + label + " [ID:" + id + "]");

    // If the label is a product category, collection, sub-collection, or products, set the ID accordingly
    if (label === "Product Category") {
      id = "category";
    } else if (label === "Product Collection") {
      id = "collection";
    } else if (label === "Product Sub-Collection") {
      id = "sub_collection";
    } else if (label === "Products") {
      id = "product";
    }

    // Ensure the filter is visible and rendered.
    cy.contains("label", label).should("exist");

    // Within the same form item row, find the select element.
    cy.contains("label", label)
      .parents(".ant-form-item-row")
      .find(".ant-form-item-control")
      // .get(".ant-select-selector")
      .within(() => {
        // Confirm the select is rendered.
        // cy.get(".ant-select-selector").should("exist");

        // Click on the select element to open its dropdown.
        cy.get(".ant-select-selector").should("exist").click({ force: true });
        // cy.get(`#${id}`).realClick();
      });

    // should not have class ant-select-dropdown-hidden
    // cy.get(".ant-select-dropdown").should(
    //   "not.have.class",
    //   "ant-select-dropdown-hidden",
    //   { timeout: 100000 }
    // );

    cy.get(".ant-select-dropdown")
      .should("be.visible")
      .find(".rc-virtual-list-holder-inner .ant-select-item-option")
      .first() // or use .contains("your option text") to match text
      .click({ force: true });

    if (label != "Product Collection") {
      // Optionally, ensure that the selected value appears in the select.
      cy.get(".ant-select .ant-select-selection-item", {
        timeout: 5000,
      }).should("exist");
    }
  }

  function selectDateFromPicker(panelIndex, date) {
    // Get the date picker
    cy.get(".ant-picker-dropdown")
      .find(".ant-picker-panel")
      .eq(panelIndex)
      .find(".ant-picker-cell-inner")
      .contains(date)
      .click({ force: true });
  }

  function selectByLabel(label, value) {
    // Ensure the label exists and is associated with a form item row
    cy.contains("label", label)
      .should("exist")
      .parents(".ant-form-item-row")
      .find(".ant-form-item-control")
      .within(() => {
        cy.get(".ant-select-selector").should("exist").realClick();
        cy.get(".ant-select-selection-search input")
          .should("exist")
          .type(`${value}`, { force: true });
      });

    // Click the option
    cy.get(".rc-virtual-list-holder-inner")
      .should("be.visible")
      .contains(".ant-select-item-option", value)
      .click({ force: true });
  }

  function fillInByLabel(label, value) {
    // Ensure the label exists and is associated with a form item row
    cy.contains("label", label)
      .should("exist")
      .parents(".ant-form-item-row")
      .find(".ant-form-item-control")
      .within(() => {
        cy.get("input")
          .should("exist")
          .clear({ force: true })
          .type(`${value} {enter}`, { force: true });
      });
  }

  function addSale() {
    // Fill in the Sale date
    fillInByLabel("Sales date", "December 10th 04:28 pm");

    // Select the Boutique
    selectByLabel("Boutique", "Boutique8");

    // Fill in the Client
    fillInByLabel("Client", "Ibrahima");

    // Search for the Client
    cy.get(".ant-modal-content")
      .contains("Search client/traffic")
      .should("exist");

    // Select the Client
    cy.get('input[name="Ibrahima Conte"]', { timeout: 35000 })
      .parents(".ant-radio-wrapper")
      .click({ force: true });

    // Click the Select button
    cy.get("button").contains("Select").should("exist").click();

    // Wait for the loading to finish
    cy.get(".ant-spin-nested-loading").should("be.visible");
    cy.get(".ant-spin-nested-loading .ant-spin", { timeout: 35000 }).should(
      "not.exist"
    );

    // Fill in the Primary sales representative
    selectByLabel("Primary sales representative", "Test Employee");

    // Fill in the Secondary sales representative
    selectByLabel("Secondary sales representative", "Private Test2312");

    // Fill in the Internal Transaction ID #
    fillInByLabel("Internal Transaction ID #", "CY-1234567890");

    // Wait for the products to load
    cy.wait("@getAllowedProductsForClient", { timeout: 35000 });

    // Click the Add Product button
    cy.get("button").contains("Add Product").should("exist").click();

    // Close the modal (sometimes there is no data displayed)
    cy.contains("Search product")
      .closest(".ant-modal-content")
      .within(() => {
        cy.get(".anticon-close").click({ force: true });
      });

    // Wait for the modal to load
    cy.wait(3000);

    // Click the Add Product button
    cy.get("button").contains("Add Product").should("exist").click();

    // Wait for the in-stock checkboxes to load
    cy.get(".ant-modal-content table tbody tr")
      .find('input[type="checkbox"]', { timeout: 35000 })
      .not("[disabled]")
      .as("inStockCheckboxes");

    // Make sure there are at least two in-stock items
    cy.get("@inStockCheckboxes").should("have.length.gte", 2);

    // click on this ant-pagination-item with text 2
    cy.get(".ant-pagination-item").contains("2").click({ force: true });

    // Select the first three
    [0, 1].forEach((i) => {
      cy.get("@inStockCheckboxes").eq(i).check().should("be.checked");
    });

    // Finally, click the Select button in the modal footer
    cy.get(".ant-modal-footer")
      .eq(1)
      .scrollIntoView()
      .within(() => {
        cy.get("button")
          .contains("Select")
          .should("exist")
          .click({ force: true });
      });

    // Fill in the Discount % and VAT %
    const testData = [
      { discountPct: 10, vatPct: 5 },
      { discountPct: 20, vatPct: 10 },
    ];

    let costOfFirstProduct;
    let costOfSecondProduct;

    cy.get("tbody tr").each(($row, idx) => {
      // Only do the first two rows
      if (idx > 1) return false;

      const { discountPct, vatPct } = testData[idx];

      // grab the sales price
      cy.wrap($row)
        .find("td")
        .eq(3) // Sales Price column
        .find(".ant-input-number-input")
        .invoke("val")
        .then((val) => {
          const salesPrice = parseFloat(val);

          // enter Discount%
          cy.wrap($row)
            .find("td")
            .eq(4) // Discount% column
            .find(".ant-input-number-input")
            .clear({ force: true })
            .type(`${discountPct}`, { force: true })
            .blur();

          // expected discount amount (rounded to 2 decimals)
          const expectedDiscAmt = Number(
            ((salesPrice * discountPct) / 100).toFixed(2)
          );

          // assert Discount Amount (integer only)
          cy.wrap($row)
            .find("td")
            .eq(5) // Dis Amt column
            .find(".ant-input-number-input")
            .invoke("val")
            .then((val) => {
              const actual = Math.floor(parseFloat(val));
              cy.log("actual", actual);
              const expected = Math.floor(expectedDiscAmt);
              cy.log("expected", expected);
              expect(actual).to.equal(expected);
            });

          // enter VAT%
          cy.wrap($row)
            .find("td")
            .eq(6) // VAT% column
            .find(".ant-input-number-input")
            .clear({ force: true })
            .type(`${vatPct}`, { force: true })
            .blur();

          // expected VAT amount on net price
          const netAfterDiscount = salesPrice - expectedDiscAmt;
          const expectedVatAmt = Number(
            ((netAfterDiscount * vatPct) / 100).toFixed(2)
          );

          cy.wrap($row)
            .find("td")
            .eq(7) // VAT column
            .find(".ant-input-number-input")
            .invoke("val")
            .then((val) => {
              const actual = Math.floor(parseFloat(val));
              cy.log("actual", actual);
              const expected = Math.floor(expectedVatAmt);
              cy.log("expected", expected);
              expect(actual).to.equal(expected);
            });

          // assert Grand Total
          const expectedGrand = Number(
            (netAfterDiscount + expectedVatAmt).toFixed(2)
          );

          cy.wrap($row)
            .find("td")
            .eq(8) // Grand Total column
            .find(".ant-input-number-input")
            .invoke("val")
            .then((val) => {
              const actual = Math.floor(parseFloat(val));
              cy.log("actual", actual);
              const expected = Math.floor(expectedGrand);
              cy.log("expected", expected);
              expect(actual).to.equal(expected);
            });

          // store it as an alias
          cy.wrap(expectedGrand).as(`cost${idx}`);

          // Store the cost of the first product
          if (idx === 0) {
            costOfFirstProduct = expectedGrand;
          } else if (idx === 1) {
            costOfSecondProduct = expectedGrand;
          }
        });
    });

    // Log the costs
    cy.log("costOfFirstProduct", costOfFirstProduct);
    cy.log("costOfSecondProduct", costOfSecondProduct);

    // Click the Allow Inventory Update checkbox
    cy.get('input[name="allow_inventory_update"]').realClick();
    cy.get('input[name="allow_inventory_update"]').should("not.be.checked");

    // Click the Create Invoice checkbox
    cy.get('input[name="create_invoice"]').realClick();
    cy.get('input[name="create_invoice"]').should("not.be.checked");

    // Click the Create Invoice checkbox
    cy.get('input[name="create_invoice"]').realClick();
    cy.get('input[name="create_invoice"]').should("be.checked");

    // Submit the form
    cy.contains("Total sales price: ").should("exist");

    // Get the total sales price
    cy.contains("Total sales price:")
      .invoke("text")
      .then((txt) => {
        const num = parseFloat(
          txt.replace(/^.*?:\s*/, "").replace(/[^\d.]/g, "")
        );

        expect(num).to.equal(costOfFirstProduct + costOfSecondProduct);
      });

    selectByLabel("Payment mode", "Cash");

    // Retrieve both aliases and fill the Paid amount
    cy.get("@cost0").then((cost0) => {
      cy.get("@cost1").then((cost1) => {
        const sum = cost0 + cost1;
        cy.log("sum", sum);
        fillInByLabel("Paid amount", sum.toFixed(2));
      });
    });

    // Validate the remaining amount to be paid
    cy.contains("Remaining amount to be paid:")
      .invoke("text")
      .then((txt) => {
        const num = parseFloat(
          txt.replace(/^.*?:\s*/, "").replace(/[^\d.]/g, "")
        );

        // Validate the remaining amount to be paid
        expect(num).to.equal(0);
      });

    // Click the Add payment mode button
    cy.get("span")
      .contains("Add payment mode")
      .should("exist")
      .click({ force: true });

    // Select the payment mode
    cy.get(".ant-select-selector")
      .contains("Choose payment mode")
      .parents(".ant-select-selector")
      .find('input[type="search"]')
      .click()
      .type("{downarrow}{enter}");

    // Enter 200 into the Paid Amount field
    cy.get('input[placeholder="Paid amount"]').eq(1).clear().type("200");

    cy.get("button").contains("Add sale").should("exist").realClick();

    // Wait for the add sale API call
    cy.wait("@addSale", { timeout: 35000 })
      .its("response.statusCode")
      .should("eq", 400);

    // Validate the error message
    cy.get(".ant-message-notice-content")
      .should("exist")
      .and("contain", "Total paid price should be equal to total sales price.");

    // Validate the remaining amount to be paid
    cy.contains("Remaining amount to be paid:")
      .invoke("text")
      .then((txt) => {
        const num = parseFloat(
          txt.replace(/^.*?:\s*/, "").replace(/[^\d.-]/g, "")
        );

        // Validate the remaining amount to be paid
        expect(num).to.equal(-200);
      });

    // Click the trash icon inside a specific payment mode container
    cy.get("#payment_mode_0")
      .find('img.vector[src="/images/trash.svg"]')
      .click({ force: true });

    // Submit the form
    cy.get("button").contains("Add sale").should("exist").realClick();

    // Wait for the add sale API call
    cy.wait("@addSale", { timeout: 35000 })
      .its("response.statusCode")
      .should("eq", 500);

    // Validate the error message
    cy.get(".ant-message-notice-content")
      .should("exist")
      .and("contain", "Oops! Something went wrong. Please contact Admin!");
  }

  function openRowAction(action) {
    // Open the row action menu
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

    // Click the action
    cy.get(".ant-popover")
      .contains("li", action)
      .then(($el) => {
        $el[0].dispatchEvent(new MouseEvent("click", { bubbles: true }));
      });
  }
});
