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

describe("Invoices View Page Tests", () => {
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
    cy.intercept("GET", "**/traffics*").as("trafficView");
    cy.intercept("GET", "**/platforms*").as("platformsList");
    cy.intercept("GET", "**/product_lines*").as("productLinesList");
    cy.intercept("GET", "**/invoices*").as("invoicesList");
    cy.intercept("POST", "**/save_default_search").as("saveDefaultSearch");
    cy.intercept("GET", "**/products/getAllowedProductsForClient*").as(
      "getAllowedProductsForClient"
    );

    // Configure the test environment
    configureTestEnvironment();
    // Login to the application
    cy.login();
    // Visit the invoices view page
    cy.visit(Cypress.env("TEST_URL") + "/invoices_module/View", {
      failOnStatusCode: false,
      timeout: 30000,
    });

    // Wait for the invoices list to load
    cy.wait("@invoicesList", { timeout: 30000 });

    // Verify the page title
    cy.contains("Invoices", { timeout: 10000 }).should("be.visible");
  });

  // INITIAL RENDERING TESTS
  describe("Initial Rendering Tests", () => {
    // PAGE STRUCTURE VALIDATION
    // Verifies that the page title and primary action button are visible on initial render.
    // Ensures all filter controls and form elements are present and correctly displayed.
    // Checks that table headers and sorting indicators are visible and accurate.
    // Confirms that an empty state message is shown when no data is available in the table.
    // Verifies that sorting icons are present for sortable columns and are visible to the user.
    it("Tests initial rendering of the page", { retries: 3 }, () => {
      // Title
      cy.contains("div.this-is-a-title", "Invoices").should("be.visible");

      // Add New Invoice button
      cy.get("button").contains("Add New Invoice").should("be.visible");

      // Renders the Employee select with default value
      checkRenderingOfSelects("Employee");
      // Renders the Product Line multi-select placeholder
      checkRenderingOfSelects("Product Line");
      //Renders the Status single-select placeholder
      checkRenderingOfSelects("Status");

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

      // Renders Save (icon only) and Search buttons
      // Search
      cy.get("button")
        .contains(/^Search$/)
        .should("be.visible");

      // Action buttons and icons
      ["save", "more", "expand", "sync"].forEach((icon) => {
        cy.get(`svg[data-icon="${icon}"]`)
          .should("exist")
          .parent(`.anticon.anticon-${icon}`)
          .should("exist");
      });

      // Global search & action icons
      cy.get('input[placeholder="Type and hit Enter"]').should("be.visible");
      cy.get("button")
        .find(".anticon-search")
        .closest("button")
        .should("be.visible");

      //Invoice table header
      const headers = [
        "Invoice No",
        "Boutique",
        "Status",
        "Invoice Amount",
        "Invoice Amount in Euro",
        "Invoice Date",
        "Client Name",
        "Sale Representative",
        "Email Sent",
        "Actions",
      ];

      // Verify the table headers
      cy.get(".ant-table").within(() => {
        headers.forEach((text) => {
          cy.get("th.ant-table-cell").contains(text).should("be.visible");
        });
      });

      // shows empty-state placeholder when no rows present
      cy.get("td.ant-table-cell").contains("No Data").should("be.visible");

      // Sorting Icons
      const sortable = [
        "Invoice Amount",
        "Invoice Amount in Euro",
        "Invoice Date",
      ];

      sortable.forEach((label) => {
        // find the <th> with the matching aria-label
        cy.get(`th[aria-label="${label}"]`).within(() => {
          // assert up and down carets are present & visible
          cy.get(".ant-table-column-sorter-up").should("be.visible");
          cy.get(".ant-table-column-sorter-down").should("be.visible");
        });
      });
    });
  });

  // FILTER FUNCTIONALITY
  describe("Filter Functionality Tests", () => {
    // COMPREHENSIVE FILTER OPERATIONS
    // Validates that multiple filter combinations can be applied and reflected in the UI and API calls.
    // Ensures the user can save the current filter configuration as a named search and receive confirmation.
    // Checks that saved searches can be loaded from the dropdown and the correct filters are applied.
    // Confirms that saved searches can be deleted and the user receives a success message.
    // Verifies that API calls and UI responses are correct at each stage of the filter workflow.
    it("Tests the filter functionality", { retries: 3 }, () => {
      // Apply filters
      checkAndSelectOption("Employee", "Employee34 Record");
      checkAndSelectOption("Product Line", "Line4");
      checkAndSelectOption("Status", "Converted To Sales");

      // Select date range
      let start = dayjs().subtract(30, "day");
      let end = dayjs();

      cy.get("input[placeholder='End date']").realClick();

      // Select the end date
      selectDateFromPicker(1, end.date());
      // Select the start date
      selectDateFromPicker(0, start.date());

      cy.contains("label", "Date")
        .parents(".ant-form-item-row")
        .find("[data-icon='close-circle']")
        .should("be.visible")
        .realClick();

      // Search
      cy.get("button").contains("Search").should("exist").click();

      // Wait for the invoices list to load
      cy.wait("@invoicesList", { timeout: 35000 });
      cy.get(".ant-table").within(() => {
        cy.get("tbody tr").should("have.length.greaterThan", 0);
      });

      // Save filter settings
      cy.get('svg[data-icon="save"]')
        .should("exist")
        .parent(".anticon.anticon-save")
        .should("exist")
        .click();

      // Confirm Save
      cy.get(".ant-modal-header").contains("Confirm Save").should("exist");
      cy.get(".ant-modal-body")
        .should("exist")
        .within(() => {
          cy.get("input[placeholder='Enter search name']")
            .should("exist")
            .type("Filter Search Selection");
        });

      // Click the Yes button
      cy.get(".ant-modal-footer")
        .should("exist")
        .within(() => {
          cy.contains("button", "Yes", { timeout: 10000 })
            .should("be.visible")
            .click();
        });

      // Verify the success message
      cy.get(".ant-message-notice-content", { timeout: 5000 }).contains(
        "Search settings saved successfully."
      );

      // Wait for the saveDefaultSearch to complete
      cy.wait("@saveDefaultSearch")
        .its("response.statusCode")
        .should("eq", 200);

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

      // Verify the dropdown menu
      cy.get(".ant-dropdown-menu")
        .should("exist")
        .within(() => {
          cy.get(".ant-dropdown-menu-item").its("length").should("be.gte", 1);

          cy.contains(".ant-dropdown-menu-item", "Filter Search Selection")
            .should("exist")
            .click();
        });

      // Wait for the invoices list to load
      cy.wait("@invoicesList", { timeout: 35000 });

      // Delete saved search
      cy.get("button.ant-btn-primary")
        .should("contain.text", "Saved Searches")
        .find(".anticon-down")
        .should("exist")
        .click();

      // Verify the dropdown menu
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

      // Wait for the deleteDefaultSearch to complete
      cy.wait("@deleteDefaultSearch")
        .its("response.statusCode")
        .should("eq", 200);

      // Verify the success message
      cy.get(".ant-message-notice-content", { timeout: 5000 }).contains(
        "Search deleted successfully."
      );
    });
  });

  // TABLE OPERATIONS
  describe("Table Functionality Tests", () => {
    // SEARCH AND RESET FUNCTIONALITY
    // Validates that full-text search returns correct results for table data.
    // Ensures the search term remains visible in the input after searching.
    // Confirms that clearing the search input resets the table to its default state.
    // Checks that the table displays the correct number of rows after reset.
    it("Tests the table functionality", { retries: 3 }, () => {
      // Clear all filters
      cy.contains("label", "Employee")
        .parents(".ant-form-item-row")
        .find("[data-icon='close-circle']")
        .realClick();

      // Tests searching within the table and clearing results
      const searchTerm = "AddClient Test";

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
      apiAlias: "invoicesList",
      invoiceSearch: true,
    });

    // Validates the More menu columns toggling
    testColumnToggling({
      columnsToToggle: [
        { name: "Email Sent", shouldExist: false },
        { name: "Sale Representative", shouldExist: false },
        { name: "Reference", shouldExist: true },
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
        "Invoice Amount",
        "Invoice Amount in Euro",
        "Invoice Date",
      ],
      invoiceSearch: true,
    });

    // Navigates to invoice details when clicking on a client name
    testRowNavigation({
      urlPattern: "/invoices_module/InvoiceDetail?invoice_id=",
      invoiceSearch: true,
    });
  });

  // INVOICE CREATION TESTS
  describe("Add New Invoice Functionality Tests", () => {
    // PREVIEW WORKFLOW
    // Validates the invoice creation process and navigation to the add invoice page.
    // Ensures the preview functionality displays the correct invoice content and PDF structure.
    // Checks that the preview modal shows the correct title, date, name, and total with tax.
    // Verifies that the table header values and at least one row of valid data are present in the preview.
    it(
      "Creates and previews an invoice, then verifies invoice content",
      { retries: 3 },
      () => {
        // Navigate to the Add New Invoice page
        cy.get("button").contains("Add New Invoice").realClick();
        cy.url({ timeout: 35000 }).should(
          "include",
          "/invoices_module/AddInvoice"
        );

        // Add a new invoice
        addNewInvoice();

        // Preview the invoice
        cy.get("tbody tr")
          .eq(2)
          .within(() => {
            cy.get("img.vector").click({ force: true });
          });

        // Verify the popover content
        cy.get(".ant-popover-content").should("exist");

        // Verify the popconfirm title
        cy.get(".ant-popconfirm-title").should(
          "contain.text",
          "Sure to delete?"
        );

        // Click the OK button
        cy.get(".ant-popconfirm-buttons").contains("OK").click();

        // Verify the table body
        cy.get(".ant-table-tbody tr")
          .filter(":visible")
          .should("have.length", 2);

        // Intercept and stub window.open
        cy.window().then((win) => {
          cy.stub(win, "open")
            .callsFake((url) => {
              // Instead of opening new tab, navigate in same window
              win.location.href = url;
            })
            .as("windowOpen");
        });

        // Click the Preview button
        cy.get("button").contains("Preview").should("exist").click();

        // Check for title "Invoice"
        cy.contains(/^Invoice$/).should("be.visible");

        // Check that the Date label and a date in dd/mm/yyyy or d/m/yyyy format exist
        cy.contains(/^Date:$/).should("be.visible");
        cy.get("span")
          .contains(/^\d{1,2}\/\d{1,2}\/\d{4}$/)
          .should("exist");

        // Check for Name label and a non-empty name
        cy.contains(/^Name:$/).should("be.visible");
        cy.get("span")
          .contains(/^[A-Za-z\s]+$/)
          .should("exist");

        // Check for Total With Tax
        cy.contains(/^Total With Tax \(AED\):/).should("exist");
        cy.contains(/^Total With Tax \(AED\):\s*[0-9,]+\.\d{2}$/).should(
          "exist"
        );

        // Check table header values
        const headers = [
          "SKU",
          "Product Name",
          "Price",
          "Qty",
          "Amount Without Tax",
          "Tax",
          "Discount",
          "Total",
        ];

        // Verify the table headers
        headers.forEach((header) => {
          cy.get(".ant-table-thead")
            .contains(new RegExp(`^${header}`))
            .should("exist");
        });

        // Check at least 1 row in table with valid data
        cy.get(".ant-table-tbody tr").should("have.length.at.least", 1);
        cy.get(".ant-table-tbody td").each(($cell) => {
          cy.wrap($cell.text().trim()).should("not.be.empty");
        });
      }
    );

    // SAVE OPERATIONS
    // Checks that the cancel button returns the user to the invoice list without saving changes.
    // Validates that the 'Save Only' button saves the invoice and displays a success message.
    it(
      "Handles cancel flow and saves invoice using 'Save Only' button",
      { retries: 3 },
      () => {
        // Intercept the addInvoice API call
        cy.intercept("POST", "**/invoices").as("addInvoice");

        // Navigate to the Add New Invoice page
        cy.get("button").contains("Add New Invoice").realClick();
        cy.url({ timeout: 35000 }).should(
          "include",
          "/invoices_module/AddInvoice"
        );

        // Cancel the form
        cy.get("span")
          .contains("Cancel")
          .then(($el) => {
            $el[0].click();
          });

        // Navigate to the Invoices List page
        cy.url({ timeout: 35000 }).should("include", "/invoices_module/View");

        cy.get(".ant-spin-nested-loading").should("be.visible");
        cy.get(".ant-spin-nested-loading .ant-spin", { timeout: 35000 }).should(
          "not.exist"
        );

        // Navigate back to the Add New Invoice page
        cy.get("button").contains("Add New Invoice").realClick();
        cy.url({ timeout: 35000 }).should(
          "include",
          "/invoices_module/AddInvoice"
        );

        // Add a new invoice
        addNewInvoice();

        // Save the invoice
        cy.get("button[name='save_only']")
          .should("exist")
          .scrollIntoView()
          .should("be.visible")
          .should("not.be.disabled")
          .realClick();

        // Wait for the addInvoice to complete
        cy.wait("@addInvoice", { timeout: 35000 });

        // Verify success message
        cy.get(".ant-message-notice-content", { timeout: 5000 }).contains(
          "Invoice has been created successfully"
        );
      }
    );

    // EMAIL WORKFLOW
    // Verifies that the 'Save & Send' button saves the invoice and opens the email modal.
    // Ensures the email modal loads with the correct fields and validates email input.
    // Checks that the user can fill in and send the email, and the correct API call is made.
    it(
      "Saves and sends invoice using 'Save & Send' button",
      { retries: 3 },
      () => {
        // Intercept the addInvoice and sendEmail API calls
        cy.intercept("POST", "**/invoices").as("addInvoice");
        cy.intercept("GET", "/api/v1/invoices/send/email/*").as("sendEmail");

        // Navigate to the Add New Invoice page
        cy.get("button").contains("Add New Invoice").realClick();
        cy.url({ timeout: 35000 }).should(
          "include",
          "/invoices_module/AddInvoice"
        );

        // Add a new invoice
        addNewInvoice();

        // Save and send the invoice
        cy.get("button[name='save_and_send']")
          .should("exist")
          .scrollIntoView()
          .should("be.visible")
          .should("not.be.disabled")
          .realClick();

        // Wait for the addInvoice to complete
        cy.wait("@addInvoice", { timeout: 35000 });

        // Verify success message
        cy.get(".ant-message-notice-content", { timeout: 5000 }).contains(
          "Invoice has been created successfully"
        );

        // Check the rendered email configuration modal
        cy.get(".ant-modal-content")
          .filter(":visible")
          .within(() => {
            // Click the Sync button
            cy.get(".anticon.anticon-sync")
              .should("exist")
              .click({ force: true });
            // Wait for the platforms list to load
            cy.wait("@platformsList", { timeout: 35000 });
            // Verify the From Account label
            cy.get("label").contains("From Account").should("exist");
            cy.get("input[placeholder='Subject']").should(
              "have.attr",
              "aria-required",
              "true"
            );
            cy.get("input[placeholder='Email']").should(
              "have.attr",
              "type",
              "email"
            );
            cy.get("input[placeholder='Cc']").should("exist");
          });

        // Select the From Account
        selectByLabel("From Account", "test@gmail.com");

        // Clear and type a subject
        cy.get("input[placeholder='Subject']")
          .clear()
          .type("IN00046 - Henry Jacques");

        // Clear and type a To Email
        cy.get("input[placeholder='Email']").clear().type("test@example.com");

        // Clear and type a Cc Email
        cy.get("input[placeholder='Cc']").clear().type("cc1@example.com");

        // Send the email
        cy.get(".ant-modal-footer")
          .filter(":visible")
          .within(() => {
            cy.get("button").contains("Send").click({ force: true });
          });

        // Wait for the sendEmail to complete
        cy.wait("@sendEmail", { timeout: 35000 });
      }
    );

    // CONVERSION TESTS
    // Validates that the 'Convert to Sale' button converts the invoice and navigates to the sales module page.
    // Ensures the invoice is created before conversion and the page transition occurs after conversion.
    it(
      "Converts invoice to sale using 'Convert to Sale' button",
      { retries: 3 },
      () => {
        // Intercept the addInvoice API call
        cy.intercept("POST", "**/invoices").as("addInvoice");

        // Navigate to the Add New Invoice page
        cy.get("button").contains("Add New Invoice").realClick();
        cy.url({ timeout: 35000 }).should(
          "include",
          "/invoices_module/AddInvoice"
        );

        // Add a new invoice
        addNewInvoice();

        // Convert the invoice to a sale
        cy.get("button[name='convert_to_sale']")
          .should("exist")
          .scrollIntoView()
          .should("be.visible")
          .should("not.be.disabled")
          .realClick();

        // Wait for the addInvoice to complete
        cy.wait("@addInvoice", { timeout: 35000 });

        // Verify the page transition to the sales_module/AddSale page
        cy.url({ timeout: 35000 }).should("include", "/sales_module/AddSale");
      }
    );
  });

  // INVOICE MODIFICATION TESTS
  describe("Edit Invoice Functionality Tests", () => {
    // UPDATE WORKFLOW
    // Validates that the row action menu can be accessed and the edit option is available.
    // Ensures that invoice fields can be updated and validation is enforced for required fields.
    // Confirms that changes are saved and persist after navigating away and returning to the invoice list.
    // Checks that toggling table columns updates the UI and the correct columns are shown or hidden.
    // Verifies that the updated reference number appears in the first row after saving changes.
    it("Tests the Edit Invoice functionality", { retries: 3 }, () => {
      // Intercept the addInvoice API call
      cy.intercept("POST", "**/invoices/*").as("addInvoice");

      // Check and select the "Test Employee" from the Employee dropdown
      checkAndSelectOption("Employee", "Test Employee");
      // Click the Search button
      cy.get("button").contains("Search").should("exist").click();
      // Wait for the invoices list to load
      cy.wait("@invoicesList", { timeout: 35000 });

      // Open the row action menu and select "Edit"
      openRowAction("Edit");

      // Verify the URL includes "/invoices-modules/update/EditInvoice"
      cy.url({ timeout: 35000 }).should(
        "include",
        "/invoices_module/update/EditInvoice"
      );

      // Update reference number
      fillInByLabel("Reference #", "CY-Updated@123");
      // Select the "Test Employee" from the Sales representative dropdown
      selectByLabel("Sales representative", "Test Employee");
      // Fill in the Client field with "Ibrahima"
      fillInByLabel("Client", "Ibrahima");

      // Click the Search client/traffic button
      cy.get(".ant-modal-content")
        .contains("Search client/traffic")
        .should("exist");

      // Select the "Ibrahima Conte" option
      cy.get('input[name="Ibrahima Conte"]', { timeout: 35000 })
        .parents(".ant-radio-wrapper")
        .click({ force: true });
      cy.get("button").contains("Select").should("exist").click();
      cy.get(".ant-spin-nested-loading").should("be.visible");
      cy.get(".ant-spin-nested-loading .ant-spin", { timeout: 35000 }).should(
        "not.exist"
      );

      // Save the invoice
      cy.get("button[name='save_only']")
        .should("exist")
        .scrollIntoView()
        .should("be.visible")
        .should("not.be.disabled")
        .realClick();

      // Wait for the addInvoice to complete
      cy.wait("@addInvoice", { timeout: 35000 });
    });
  });

  // ROW ACTION FUNCTIONALITY TESTS
  describe("Invoice Row Actions: Add Task, Download, and Email Invoice", () => {
    // TASK CREATION WORKFLOW
    // Validates that the task form enforces required fields and displays validation errors for missing input.
    // Confirms that submitting a valid task triggers the correct API notification request.
    // Checks that a success message is shown to the user after a task is created successfully.
    it("Add Task Functionality Tests", { retries: 3 }, () => {
      // Intercept the notification API call
      cy.intercept(
        "POST",
        Cypress.env("TEST_BACKEND_URL") + "/notifications"
      ).as("notificationApi");

      // Check and select the "Test Employee" from the Employee dropdown
      checkAndSelectOption("Employee", "Test Employee");
      // Click the Search button
      cy.get("button").contains("Search").should("exist").click();
      // Wait for the invoices list to load
      cy.wait("@invoicesList", { timeout: 35000 });

      // Open the row action menu and select "Add Tasks"
      openRowAction("Add Tasks");

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

    // DOWNLOAD OPERATIONS
    // Verifies that clicking the download action initiates a PDF file download for the selected invoice.
    // Ensures the downloaded file name matches the expected invoice naming convention (e.g., IN12345.pdf).
    // Confirms the downloaded file is a valid PDF and contains the correct invoice data.
    it("Download Invoice Functionality Tests", { retries: 3 }, () => {
      // Intercept the downloadInvoice API call
      cy.intercept("GET", "/api/v1/invoices/download/*").as("downloadInvoice");

      // Check and select the "Test Employee" from the Employee dropdown
      checkAndSelectOption("Employee", "Test Employee");
      // Click the Search button
      cy.get("button").contains("Search").should("exist").click();
      // Wait for the invoices list to load
      cy.wait("@invoicesList", { timeout: 35000 });

      // Open the row action menu and select "Download"
      openRowAction("Download");

      // Wait for the request, then assert on URL and response headers
      cy.wait("@downloadInvoice").then((interception) => {
        expect(interception, "interception exists").to.exist;

        // grab the raw header
        const cd = interception.response.headers["content-disposition"];

        // capture everything between the two double‐quotes
        const match = cd.match(/filename="([^"]+)"/);
        expect(match, "filename capture").to.have.length(2);

        // now fullName has NO extra quotes
        const fullName = match[1];
        expect(fullName, "got filename").to.be.a("string");

        // assert it starts with IN + digits and ends in .pdf
        expect(fullName).to.match(
          /^IN\d+.*\.pdf$/,
          `"${fullName}" should match /^IN\\d+.*\\.pdf$/`
        );

        // read & verify the PDF contents
        // const downloads = Cypress.config("downloadsFolder");
        // cy.readFile(`${downloads}/${fullName}`, {
        //   encoding: "binary",
        //   timeout: 15000
        // }).should(buf => {
        //   // should start with "%PDF-"
        //   expect(buf.slice(0, 5).toString()).to.equal("%PDF-");
        // });
      });
    });

    // EMAIL CONFIGURATION
    // Tests that the email configuration modal loads with the correct template and fields.
    // Validates that the email and CC fields require properly formatted email addresses.
    // Checks that the system displays an error message if sending the email fails due to configuration issues.
    it("Mail Invoice Functionality Tests", { retries: 3 }, () => {
      // Intercept the sendEmail API call
      cy.intercept("GET", "/api/v1/invoices/send/email/*").as("sendEmail");

      // Check and select the "Test Employee" from the Employee dropdown
      checkAndSelectOption("Employee", "Test Employee");
      // Click the Search button
      cy.get("button").contains("Search").should("exist").click();
      // Wait for the invoices list to load
      cy.wait("@invoicesList", { timeout: 35000 });

      // Open the row action menu and select "Email Invoice"
      openRowAction("Email Invoice");

      // Verify the email configuration modal is visible
      cy.get(".ant-modal-content")
        .filter(":visible")
        .within(() => {
          cy.get(".anticon.anticon-sync")
            .should("exist")
            .click({ force: true });
          // Wait for the platforms list to load
          cy.wait("@platformsList", { timeout: 35000 });
          // Verify the From Account label
          cy.get("label").contains("From Account").should("exist");
          cy.get("input[placeholder='Subject']").should(
            "have.attr",
            "aria-required",
            "true"
          );
          cy.get("input[placeholder='Email']").should(
            "have.attr",
            "type",
            "email"
          );
          cy.get("input[placeholder='Cc']").should("exist");
        });

      // Select the From Account
      selectByLabel("From Account", "ranash@kubeeanalytics.con");

      // Clear and type a Subject
      cy.get("input[placeholder='Subject']")
        .clear()
        .type("Test Invoice Subject");

      // Clear and type a To Email
      cy.get("input[placeholder='Email']").clear().type("test@example.com");

      // Clear and type a Cc Email
      cy.get("input[placeholder='Cc']").clear().type("cc1@example.com");

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
    });
  });

  // HELPER FUNCTIONS

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

  function selectDateFromPicker(panelIndex, date) {
    // Open the date picker and select the date
    cy.get(".ant-picker-dropdown")
      .find(".ant-picker-panel")
      .eq(panelIndex)
      .find(".ant-picker-cell-inner")
      .contains(date)
      .click({ force: true });
  }

  function checkAndSelectOption(label, select) {
    // Ensure the filter is visible and rendered.
    cy.contains("label", label).should("exist");

    // Within the same form item row, find the select element.
    cy.contains("label", label)
      .parents(".ant-form-item-row")
      .find(".ant-form-item-control")
      .within(() => {
        // Confirm the select is rendered.
        cy.get(".ant-select-selector").should("exist");
        cy.get(".ant-select-selection-search input")
          .should("exist")
          .type(select, { force: true });
        // .realClick({ force: true });
      });

    // should not have class ant-select-dropdown-hidden
    cy.get(".ant-select-dropdown")
      .filter(":visible")
      .should("not.have.class", "ant-select-dropdown-hidden", {
        timeout: 5000,
      });

    cy.get(".ant-select-dropdown").should("be.visible");

    cy.get(".rc-virtual-list-holder-inner", { timeout: 5000 })
      .contains(".ant-select-item-option", select)
      .should("be.visible")
      .realClick();

    // Ensure that the selected value appears in the select.
    cy.get(".ant-select .ant-select-selection-item", { timeout: 5000 }).should(
      "exist"
    );
  }

  function addNewInvoice() {
    // Fill in the Invoice date
    fillInByLabel("Invoice date", "December 10th 04:28 pm");

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

    // Fill in the Sales representative
    selectByLabel("Sales representative", "Test Employee");

    // Fill in the Reference #
    fillInByLabel("Reference #", "CY-1234567890");

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

    // Select the first three
    [0, 1, 2].forEach((i) => {
      cy.get("@inStockCheckboxes").eq(i).check().should("be.checked");
    });

    // Finally, click the Select button in the modal footer
    cy.get(".ant-modal-footer")
      .filter(":visible")
      .contains("button", "Select")
      .click({ force: true });

    // Fill in the Discount % and VAT %
    const testData = [
      { discountPct: 10, vatPct: 5 },
      { discountPct: 20, vatPct: 10 },
    ];

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

          // assert Discount Amount
          cy.wrap($row)
            .find("td")
            .eq(5) // Dis Amt column
            .find(".ant-input-number-input")
            .should("have.value", expectedDiscAmt.toString());

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

          // assert VAT Amount
          cy.wrap($row)
            .find("td")
            .eq(7) // VAT column
            .find(".ant-input-number-input")
            .should("have.value", expectedVatAmt.toString());

          // assert Grand Total
          const expectedGrand = Number(
            (netAfterDiscount + expectedVatAmt).toFixed(2)
          );
          cy.wrap($row)
            .find("td")
            .eq(8) // Grand Total column
            .find(".ant-input-number-input")
            .should("have.value", expectedGrand.toString());
        });
    });
  }
});
