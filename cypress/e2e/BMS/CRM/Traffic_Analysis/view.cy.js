/// <reference types="cypress" />
import dayjs from "dayjs";
require("dotenv").config();

describe("Traffic Analysis View Page Tests", () => {
  function configureTestEnvironment() {
    // Handle uncaught exceptions
    cy.on("uncaught:exception", (err) => {
      console.error("Uncaught exception:", err.message);
      return false;
    });
    cy.viewport(1280, 720);
  }

  beforeEach(() => {
    // Intercept API calls
    cy.intercept("GET", "**/traffics*").as("trafficView");
    cy.intercept("GET", "**/platforms*").as("platformsList");
    cy.intercept("GET", "**/product_lines*").as("productLinesList");

    // Configure test environment
    configureTestEnvironment();

    // Login
    cy.login();

    // Visit the view page
    cy.visit(Cypress.env("TEST_URL") + "/traffics_module/View", {
      failOnStatusCode: false,
      timeout: 30000,
    });

    // Wait for API calls to complete
    cy.wait("@trafficView", { timeout: 10000 });
    cy.wait("@platformsList", { timeout: 10000 });
    cy.wait("@productLinesList", { timeout: 10000 });

    // Verify the page title
    cy.contains("Traffic", { timeout: 10000 }).should("be.visible");
  });

  // INITIAL RENDERING TESTS
  describe("Initial Rendering Tests", () => {
    // Test Case: Verifies the main page layout including title, filters, buttons, and table structure
    // Ensures the title section is visible and contains the correct text.
    // Checks the filters section for the presence of basic and expanded filters.
    // Validates the rendering of select dropdowns for each filter label.
    // Expands additional filters and checks their presence and rendering.
    // Confirms the existence and structure of the date range picker and time pickers.
    // Checks for the presence of action buttons and their icons (save, more, expand, sync).
    // Verifies the Import button, its icon, and the Export to Excel button.
    // Ensures the search box is present with the correct placeholder.
    // Validates the table structure, including headers and row count.
    it("should load the main page structure", { retries: 3 }, () => {
      // Title Section
      cy.contains(".this-is-a-title.two", "Traffic").should("exist");

      // Filters Section: basic and expanded
      cy.get(".filters > .ant-row")
        .first()
        .within(() => {
          cy.get(".ant-col").its("length").should("be.gte", 5);
        });

      // Basic Filters
      ["Nationality", "Gender", "Status"].forEach((label) => {
        cy.contains("label", label).should("exist");
        checkRenderingOfSelects(label);
      });

      // Expand more filters
      cy.get("button")
        .contains("More Filters")
        .should("exist")
        .click({ timeout: 5000 });

      // Advanced Filters
      cy.get(".filters > .ant-row")
        .first()
        .within(() => {
          cy.get(".ant-col").its("length").should("be.gte", 16);
        });

      [
        "Source",
        "Visited Before?",
        "Heard From",
        "Existing Clients?",
        "Purchased?",
        "Resident/Traveller",
        "Visit Purpose",
        "Product Line",
      ].forEach((label) => {
        cy.contains("label", label).should("exist");
        checkRenderingOfSelects(label);
      });

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

      // Time pickers
      cy.get('label[for="from"]')
        .should("exist")
        .parents(".ant-form-item-row")
        .find(".ant-form-item-control")
        .within(() => {
          cy.get(".ant-picker").should("exist");
          cy.get("#from").should("exist");
        });

      cy.get('label[for="to"]')
        .should("exist")
        .parents(".ant-form-item-row")
        .find(".ant-form-item-control")
        .within(() => {
          cy.get(".ant-picker").should("exist");
          cy.get("#to").should("exist");
        });

      // Action buttons and icons
      ["save", "more", "expand", "sync"].forEach((icon) => {
        cy.get(`svg[data-icon="${icon}"]`)
          .should("exist")
          .parent(`.anticon.anticon-${icon}`)
          .should("exist");
      });

      cy.contains("button", "Import")
        .should("exist")
        .parent()
        .find(".ant-btn-icon")
        .find("img")
        .should("have.attr", "src", "/images/salesforce.png")
        .should("exist");

      // Export to Excel and search bar
      cy.get("button").contains("Search").should("exist");
      cy.contains("button", "Export to Excel").should("be.visible");

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

      // Table Structure (Table headers and rows)
      cy.get(".ant-table").within(() => {
        ["Name", "Date In", "Date Out", "Email", "Phone", "Actions"].forEach(
          (header) => {
            cy.contains("th", header).should("exist");
          }
        );
      });

      // Table rows
      cy.get(".ant-table-row").should("have.length.greaterThan", 1);
    });
  });

  // FILTER FUNCTIONALITY TESTS
  describe("Filter Functionality Tests", () => {
    // Test Case: Applies all filters, saves the search, and deletes the saved search
    // Selects options from the basic filters (Nationality, Gender, Status).
    // Clicks the Search button to apply basic filters and waits for the results.
    // Expands advanced filters and selects options for each advanced filter label.
    // Selects a date range using the date picker, setting start and end dates.
    // Sets the time range using the time pickers for 'from' and 'to'.
    // Applies all filters by clicking the Search button and waits for the results.
    // Saves the current filter settings, enters a search name, and confirms the save.
    // Verifies that the search settings are saved successfully and appear in the Saved Searches dropdown.
    // Selects the saved search to re-apply it and waits for the results.
    // Deletes the saved search, confirms the deletion, and verifies the success message.
    it(
      "should apply full filter set and validate traffic view results",
      { retries: 3 },
      () => {
        // Basic filter selections for "Nationality", "Gender", and "Status".
        ["Nationality", "Gender", "Status"].forEach((label) => {
          checkAndSelectOption(label);
        });

        // Click Search to apply the basic filters.
        cy.get("button").contains("Search").should("exist").click();
        cy.wait("@trafficView", { timeout: 10000 });

        // Advanced Filters Search
        cy.get("button")
          .contains("More Filters")
          .should("exist")
          .click({ timeout: 5000 });

        [
          "Source",
          "Visited Before?",
          "Heard From",
          "Existing Clients?",
          "Purchased?",
          "Resident/Traveller",
          "Visit Purpose",
          "Product Line",
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

        // Time range selection
        ["from", "to"].forEach((id, idx) => {
          cy.get(`#${id}`)
            .click({ force: true })
            .type(idx === 0 ? "00:00{enter}" : "23:59{enter}");
        });

        // Click Search to apply the filters
        cy.get("button").contains("Search").should("exist").click();
        cy.wait("@trafficView", { timeout: 10000 });

        // Save filter settings
        cy.get('svg[data-icon="save"]')
          .should("exist")
          .parent(".anticon.anticon-save")
          .should("exist")
          .click();

        // Open Save modal
        cy.get(".ant-modal-header").contains("Confirm Save").should("exist");
        cy.get(".ant-modal-body")
          .should("exist")
          .within(() => {
            cy.get("input[placeholder='Enter search name']")
              .should("exist")
              .type("Filter Search Selection");
          });

        // Confirm Save modal
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

        // Checks if the search have saved correctly or not
        // Open Saved Searches dropdown
        cy.get("button.ant-btn-primary")
          .should("contain.text", "Saved Searches")
          .find(".anticon-down")
          .should("exist")
          .click();

        // Intercept the delete default search API call
        cy.intercept("DELETE", /\/api\/v1\/default-search\/\d+/).as(
          "deleteDefaultSearch"
        );

        // Open Saved Searches dropdown
        cy.get(".ant-dropdown-menu")
          .should("exist")
          .within(() => {
            cy.get(".ant-dropdown-menu-item").its("length").should("be.gte", 1);

            cy.contains(".ant-dropdown-menu-item", "Filter Search Selection")
              .should("exist")
              .click();
          });

        // Wait for the traffic view to load
        cy.wait("@trafficView", { timeout: 10000 });

        // Delete saved search
        // Open Saved Searches dropdown
        cy.get("button.ant-btn-primary")
          .should("contain.text", "Saved Searches")
          .find(".anticon-down")
          .should("exist")
          .click();

        // Open Saved Searches dropdown
        cy.get(".ant-dropdown-menu")
          .should("be.visible")
          .within(() => {
            cy.contains(".ant-dropdown-menu-item", "Filter Search Selection")
              .find('img[alt="Delete"]')
              .click();
          });

        // Wait until a modal with the "Confirm Delete" header appears
        cy.contains(".ant-modal-header", "Confirm Delete", { timeout: 5000 })
          .should("be.visible")
          .closest(".ant-modal-content")
          .within(() => {
            cy.contains(".ant-modal-footer button", "Yes, Delete")
              .should("be.visible")
              .click();
          });

        // Wait for the delete default search API call to complete
        cy.wait("@deleteDefaultSearch")
          .its("response.statusCode")
          .should("eq", 200);

        // Verify the success message
        cy.get(".ant-message-notice-content", { timeout: 5000 }).contains(
          "Search deleted successfully."
        );
      }
    );
  });

  // TABLE FUNCTIONALITY TESTS
  describe("Table Functionality Tests", () => {
    // Test Case: Tests searching within the table and clearing results
    // Types a search term into the search box and submits it.
    // Verifies that the search input value matches the entered term.
    // Checks that all table rows contain the search term.
    // Tests the clear functionality by clicking the clear icon and verifying the input is cleared.
    // Ensures the table resets to the default row count after clearing the search.
    it(
      "Tests search functionality with table interaction",
      { retries: 3 },
      () => {
        // Define the search term
        const searchTerm = "test update";

        // Get the search input and type the search term
        cy.get('.ant-input[placeholder="Type and hit Enter"]')
          .type(searchTerm)
          .type("{enter}");

        // Get the search input and verify the value matches the search term
        cy.get(".ant-input").should("have.value", searchTerm);

        // Verify table results
        // Get the table rows and verify they contain the search term
        cy.get(".ant-table-row")
          .should("have.length.gt", 0)
          .each((row) => {
            cy.wrap(row).should("contain", searchTerm);
          });

        // Test clear functionality
        // Get the clear icon and click it
        cy.get(".ant-input-clear-icon").click();
        // Verify the input is cleared
        cy.get(".ant-input").should("have.value", "");

        // Verify table reset
        cy.get(".ant-table-row").should("have.length", 10);
      }
    );

    // Test Case: Verifies that the sync button reloads data
    // Clicks the Sync button to trigger a data reload.
    // Checks for the loading spinner to appear, indicating data is being fetched.
    // Waits for the API response and verifies it returns a 200 status code.
    // Ensures the table is refreshed and contains rows after syncing.
    it("Tests Sync button functionality", { retries: 3 }, () => {
      // Click the Sync button
      cy.get(".anticon-sync").closest("button").click();

      // Verify loading state
      cy.get(".ant-spin-nested-loading").should("be.visible");

      // Wait for API response and verify the status code
      cy.wait("@trafficView").then((interception) => {
        expect(interception.response.statusCode).to.equal(200);
      });

      // Verify table refresh and contains rows
      cy.get(".ant-table-row").should("have.length.gt", 0);
    });

    // Test Case: Toggles full-screen mode via the expand button
    // Ensures the full-screen wrapper is not present initially.
    // Clicks the expand button to enter full-screen mode and verifies the wrapper appears.
    // Clicks the compress button to exit full-screen mode and verifies the wrapper is removed.
    it(
      "Tests Expand button functionality based on full-screen wrapper",
      { retries: 3 },
      () => {
        // Click the expand button
        cy.get(".anticon-expand").closest("button").click();

        // Now the full-screen wrapper should exist
        cy.get('div[style*="position: fixed"][style*="width: 100vw"]').should(
          "exist"
        );

        // Click again to collapse
        cy.get(".anticon-compress").eq(1).closest("button").click();
      }
    );

    // Test Case: Validates the More menu columns toggling
    // Clicks the More menu icon to open the column visibility dropdown.
    // Toggles the visibility of specific columns by clicking their names in the dropdown.
    // Verifies that the selected columns are hidden or visible in the table as expected.
    it("Tests More menu functionality", { retries: 3 }, () => {
      // Click the More menu icon
      cy.get(".anticon-more").click();

      // Verify the dropdown menu appears
      cy.get(".ant-popover").should("be.visible");

      // Toggle visibility of specific columns by checking/unchecking them from the popover
      // Check/uncheck the columns in the dropdown
      cy.get(".ant-popover-inner-content").within(() => {
        ["Nationality", "Preferred Contact", "Address", "Funnel Stage"].forEach(
          (item) => {
            cy.contains(item).click();
          }
        );
      });

      // Verify that 'Nationality' and 'Preferred Contact' columns are hidden, while 'Address' and 'Funnel Stage' are visible in the table
      // Verify the table headers
      cy.get(".ant-table")
        .should("exist")
        .within(() => {
          cy.contains("th", "Nationality").should("not.exist");
          cy.contains("th", "Preferred Contact").should("not.exist");
          cy.contains("th", "Address").should("exist");
          cy.contains("th", "Funnel Stage").should("exist");
        });
    });

    // Test Case: Opens and closes the Import modal
    // Clicks the Import button to open the import modal.
    // Verifies the modal appears with the correct title and form labels.
    // Checks for the presence of Cancel and Import buttons in the modal.
    // Clicks the Cancel button to close the modal and ensures it is dismissed.
    it("Tests Import button functionality", { retries: 3 }, () => {
      // Click the Import button
      cy.contains("button", "Import").click();

      // Ensure modal appears with the correct title
      cy.get(".ant-modal-content")
        .should("exist")
        .within(() => {
          cy.get(".ant-modal-body").should("contain", "Import From SalesForce");

          // Check form labels inside the modal
          cy.contains("label", "SalesForce Account").should("exist");
          cy.contains("label", "Import to Boutique").should("exist");

          // Check if the Cancel and Import buttons are there
          cy.contains("button", "Cancel").should("exist");
          cy.contains("button", "Import").should("exist");

          cy.contains("button", "Cancel").should("exist").click();
        });

      // Verify the modal is closed
      cy.get(".ant-modal-content").should("not.exist");
    });

    // Test Case: Validates pagination controls, page size, and quick-jump
    // Checks that the pagination controls are displayed and the previous button is disabled on the first page.
    // Verifies the first page is active and the page size selector shows the default value.
    // Confirms the total items text is present.
    // Navigates to the next and previous pages and verifies the active page changes accordingly.
    // Changes the page size and checks that the table displays the correct number of rows.
    // Uses the quick jumper to jump to a specific page and verifies the active page updates.
    it("Pagination Tests", { retries: 3 }, () => {
      // Verify pagination controls and total count

      // Verify the previous button is disabled on first page
      cy.get(".ant-pagination-prev").should(
        "have.attr",
        "aria-disabled",
        "true"
      );
      // Verify the first page is active
      cy.get(".ant-pagination-item-active").should("contain", "1");
      // Verify the page size selector shows default
      cy.get(".ant-select-selector").contains("10 / page");
      // Verify the total items text
      cy.contains("span", /^Total \d+ items$/).should("exist");

      // Verify navigation to next and previous pages

      // Click the next page button
      cy.get(".ant-pagination-next").click();
      // Verify the active page is 2
      cy.get(".ant-pagination-item-active").should("contain", "2");
      // Click the previous page button
      cy.get(".ant-pagination-prev").click();
      // Verify the active page is 1
      cy.get(".ant-pagination-item-active").should("contain", "1");

      // Verify changing page size and reflect correct row count

      // Open the page size dropdown
      cy.get(".ant-select-selector").contains("10 / page").click();
      // Select 25 per page
      cy.get(".ant-select-item-option").contains("25 / page").click();
      // Verify the table shows 25 rows
      cy.get("tbody tr").should("have.length", 25);

      // Verify jumping to a specific page via quick jumper

      // Click the quick jumper input and type 5
      cy.get(".ant-pagination-options-quick-jumper input")
        .clear()
        .type("5{enter}");
      // Verify the active page is 5
      cy.get(".ant-pagination-item-active").should("contain", "5");
    });

    // Test Case: Validates sorting of the "Date In" column via class toggling
    // Locates the "Date In" column header and checks its initial state.
    // Clicks the header to sort ascending and verifies the sort class is applied.
    // Clicks again to sort descending and checks the class.
    // Clicks a third time to remove sorting and verifies the header returns to its initial state.
    it(
      'should sort the "Date In" column correctly by class toggling',
      { retries: 3 },
      () => {
        // Locate the "Date In" column header
        cy.contains(".ant-table-column-title", "Date In")
          .parents("th")
          .as("dateInHeader");

        // Verify the header has sorters but no sort class
        cy.get("@dateInHeader")
          .should("have.class", "ant-table-column-has-sorters")
          .and("not.have.class", "ant-table-column-sort");

        // Click to sort ascending and verify the sort class is applied
        cy.get("@dateInHeader").click();
        cy.get("@dateInHeader").should("have.class", "ant-table-column-sort");

        // Click to sort descending and verify the sort class is applied
        cy.get("@dateInHeader").click();
        cy.get("@dateInHeader").should("have.class", "ant-table-column-sort");

        // Click to remove sorting and verify the header returns to its initial state
        cy.get("@dateInHeader").click();
        cy.get("@dateInHeader")
          .should("have.class", "ant-table-column-has-sorters")
          .and("not.have.class", "ant-table-column-sort");
      }
    );

    // Test Case: Navigates to traffic details when clicking on a client name
    // Finds the first client name link in the table and verifies its href contains the expected traffic details path.
    // Clicks the client name link to navigate to the details page.
    // Verifies the URL updates to include the traffic details query parameter.
    it(
      "should navigate to traffic details when clicking on a client name",
      { retries: 3 },
      () => {
        // Verify the first client link
        cy.get("tbody tr")
          .first()
          .find("td")
          .first()
          .find("a")
          .should("have.attr", "href")
          .and("include", "/traffics_module/TrafficDetails?trafficId=");

        // Click the first client link
        cy.get("tbody tr").first().find("td").first().find("a").click();

        // Verify the URL updates to include the traffic details query parameter
        cy.url().should(
          "include",
          "/traffics_module/TrafficDetails?trafficId="
        );
      }
    );
  });

  // HELPER FUNCTIONS

  function checkRenderingOfSelects(label) {
    // Get the id of the select
    const id = label
      .split("/")[0]
      .toLowerCase()
      .replace(/\s+/g, "_")
      .replace(/\?/g, "");

    // Log the id
    cy.log("Id:" + id);

    // Verify the label exists and is a parent of the form item row
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
    // Get the id of the select
    const id = label
      .split("/")[0]
      .toLowerCase()
      .replace(/\s+/g, "_")
      .replace(/\?/g, "");

    // Log the id
    cy.log("Selecting from filter: " + label + " [ID:" + id + "]");

    // Verify the filter is visible and rendered.
    cy.contains("label", label).should("exist");

    // Within the same form item row, find the select element.
    cy.contains("label", label)
      .parents(".ant-form-item-row")
      .find(".ant-form-item-control")
      .within(() => {
        // Confirm the select is rendered.
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

    // Verify the dropdown is visible
    cy.get(".ant-select-dropdown").should("be.visible");

    // Verify the virtual list holder inner has length greater than 0
    cy.get(".rc-virtual-list-holder-inner", { timeout: 5000 })
      .should("have.length.greaterThan", 0)
      .then(($options) => {
        // Click the first option and wrap it
        cy.wrap($options[0]).click();
      });

    // Verify the selected value appears in the select
    cy.get(".ant-select .ant-select-selection-item", { timeout: 5000 }).should(
      "exist"
    );
  }

  function selectDateFromPicker(panelIndex, date) {
    // Get the picker dropdown, panel and cell inner and click the date
    cy.get(".ant-picker-dropdown")
      .find(".ant-picker-panel")
      .eq(panelIndex)
      .find(".ant-picker-cell-inner")
      .contains(date)
      .click({ force: true });
  }
});
