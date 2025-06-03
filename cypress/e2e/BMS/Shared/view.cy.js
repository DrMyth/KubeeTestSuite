require("dotenv").config();

// Test Case: Search Functionality
// Tests the search input and table interaction.
// Types a search term and submits it.
// Verifies the search input value is set.
// Checks that table results match the search term.
// For client search, checks href contains the search term.
// For server search, checks first column includes the search term.
// Tests the clear button resets the input and table.
// Verifies the table row count resets to default.
export const testSearchFunctionality = (config) => {
  it(
    "Tests search functionality with table interaction",
    { retries: 3 },
    () => {
      const {
        searchTerm,
        inputSelector = '.ant-input[placeholder="Type and hit Enter"]',
        clearSelector = ".ant-input-clear-icon",
        rowSelector = ".ant-table-row",
        defaultRowCount,
        clientSearch = false,
      } = config;

      // Type and submit search
      cy.get(inputSelector).type(searchTerm).type("{enter}");

      // Verify search input value
      cy.get(inputSelector).should("have.value", searchTerm);

      // Verify table results
      if (clientSearch) {
        cy.get(rowSelector)
          .should("have.length.gt", 0)
          .each(($row) => {
            // verify the <a> href contains our searchTerm query param:
            cy.wrap($row)
              .find("a")
              .should("have.attr", "href")
              .and("include", `search_term=${encodeURIComponent(searchTerm)}`);
          });
      } else {
        // Verify the table results
        cy.get(rowSelector)
          .should("have.length.gt", 0)
          .each(($row) => {
            cy.wrap($row)
              .find("td")
              .eq(0)
              .should("include.text", searchTerm.substring(0, 10));
          });
      }

      // Test clear functionality
      cy.get(clearSelector).click();
      cy.get(inputSelector).should("have.value", "");

      // Verify table reset
      cy.get(rowSelector).should("have.length", defaultRowCount);
    }
  );
};

// Test Case: Sync Button Functionality
// Tests the Sync button for refreshing data.
// For client search, types a term and waits for API response.
// For invoice search, clears Employee filter and searches for a term.
// Clicks the Sync button and checks for loading spinner.
// Waits for API response and verifies table rows are present.
export const testSyncButton = (config) => {
  it("Tests Sync button functionality", { retries: 3 }, () => {
    const {
      buttonSelector = ".anticon-sync",
      loadingSelector = ".ant-spin-nested-loading",
      apiAlias,
      tableRowSelector = ".ant-table-row",
      clientSearch = false,
      invoiceSearch = false,
    } = config;

    // If the search is for a client, type a term and wait for API response
    if (clientSearch) {
      // Type and submit search
      cy.get(`.ant-input[placeholder="Type and hit Enter"]`).type(
        "test {enter}"
      );
      cy.wait(`@${apiAlias}`).its("response.statusCode").should("eq", 200);
      cy.wait(3000);
    } else if (invoiceSearch) {
      // Clear the Employee filter
      cy.contains("label", "Employee")
        .parents(".ant-form-item-row")
        .find("[data-icon='close-circle']")
        .realClick();

      // Type and submit search
      cy.get(`.ant-input[placeholder="Type and hit Enter"]`).type(
        "AddClient Test {enter}"
      );
      cy.wait(`@${apiAlias}`).its("response.statusCode").should("eq", 200);
      cy.get(tableRowSelector).should("have.length.gt", 0);
    }

    // Click the Sync button
    cy.get(buttonSelector).closest("button").realClick();

    // Verify the loading spinner is visible
    cy.get(loadingSelector).should("be.visible");

    // Wait for the API response and verify the table rows are present
    cy.wait(`@${apiAlias}`).its("response.statusCode").should("eq", 200);
    cy.get(tableRowSelector).should("have.length.gt", 0);
  });
};

// Test Case: More Menu Column Toggling
// Tests toggling column visibility via the More menu.
// For client search, types a term and waits for API response.
// Opens the More menu and checks the dropdown appears.
// Toggles columns by clicking their names in the popover.
// Verifies columns are shown or hidden as expected in the table.
export const testColumnToggling = (config) => {
  it("Tests More menu functionality", { retries: 3 }, () => {
    const {
      menuButtonSelector = ".anticon-more",
      columnsToToggle,
      clientSearch = false,
      apiAlias,
    } = config;

    // If the search is for a client, type a term and wait for API response
    if (clientSearch) {
      // Type and submit search
      cy.get(`.ant-input[placeholder="Type and hit Enter"]`).type(
        "test {enter}"
      );
      cy.wait(`@${apiAlias}`).its("response.statusCode").should("eq", 200);
    }

    // Verify dropdown menu appears
    cy.get(menuButtonSelector).click();
    cy.get(".ant-popover").should("be.visible");

    // Toggle visibility of specific columns by checking/unchecking them from the popover
    cy.get(".ant-popover-inner-content").within(() => {
      // Toggle the columns
      columnsToToggle.forEach((column) => {
        cy.contains(column.name).click();
      });
    });

    // Verify the columns are shown or hidden as expected in the table
    cy.get(".ant-table").within(() => {
      columnsToToggle.forEach((column) => {
        const assertion = column.shouldExist ? "exist" : "not.exist";
        cy.contains("th", column.name).should(assertion);
      });
    });
  });
};

// Test Case: Expand Button Functionality
// Tests the expand (full-screen) button for the table.
// For SalesPage, clicks expand and compress, checks full-screen wrapper.
// For other pages, checks expand shows and compress hides the wrapper.
export const testExpandButton = (config) => {
  it(
    "Tests Expand button functionality based on full-screen wrapper",
    { retries: 3 },
    () => {
      const {
        expandButtonSelector = ".anticon-expand",
        compressButtonSelector = ".anticon-compress",
        fullscreenWrapperSelector = 'div[style*="position: fixed"][style*="width: 100vw"]',
        SalesPage = false,
      } = config;

      if (SalesPage) {
        // Click the expand button
        cy.get(expandButtonSelector).click();

        // Verify the fullscreen wrapper is visible
        cy.get(fullscreenWrapperSelector).should("exist");

        // Click the compress button
        cy.get(compressButtonSelector).eq(1).click();
        return;
      }

      // Verify the fullscreen wrapper is not visible
      cy.get(fullscreenWrapperSelector).should("not.exist");

      // Click the expand button
      cy.get(expandButtonSelector).click();

      // Verify the fullscreen wrapper is visible
      cy.get(fullscreenWrapperSelector).should("exist");

      // Click the compress button
      cy.get(compressButtonSelector).eq(1).click();

      // Verify the fullscreen wrapper is not visible
      cy.get(fullscreenWrapperSelector).should("not.exist");
    }
  );
};

// Test Case: Pagination Functionality
// Tests pagination controls and page size changes.
// For client search, types a term and waits for API response.
// For invoice search, loads invoice data.
// Checks previous button is disabled on first page.
// Verifies active page and page size selector.
// Navigates to next and previous pages.
// Changes page size and checks row count.
// Uses quick jumper to go to a specific page.
export const testPagination = (config) => {
  it("Pagination Tests", { retries: 3 }, () => {
    const {
      prevSelector = ".ant-pagination-prev",
      nextSelector = ".ant-pagination-next",
      pageSizeSelector = ".ant-pagination-options .ant-select-selector",
      quickJumperSelector = ".ant-pagination-options-quick-jumper input",
      defaultPageSize = 10,
      rowSelector = "tbody tr",
      pageSizeOptions = [25, 50, 100],
      clientSearch = false,
      invoiceSearch = false,
      apiAlias,
    } = config;

    // If the search is for a client, type a term and wait for API response
    if (clientSearch) {
      cy.get(`.ant-input[placeholder="Type and hit Enter"]`).type(
        "test {enter}"
      );
      cy.wait(`@${apiAlias}`).its("response.statusCode").should("eq", 200);
    }

    // If the search is for an invoice, load invoice data
    if (invoiceSearch) {
      loadInvoiceData();
    }

    // Initial state
    // Previous button is disabled on first page
    cy.get(prevSelector).should("have.attr", "aria-disabled", "true");
    // First page is active
    cy.get(".ant-pagination-item-active").should("contain", "1");
    // Page size selector shows default
    cy.get(pageSizeSelector).contains(`${defaultPageSize} / page`);
    // Total items text
    cy.contains("span", /^Total \d+ items$/).should("exist");

    // Navigation (Should navigate to next and previous pages)
    // Go to next page
    cy.get(nextSelector).click();
    cy.get(".ant-pagination-item-active").should("contain", "2");
    // Go back to previous page
    cy.get(prevSelector).click();
    cy.get(".ant-pagination-item-active").should("contain", "1");

    // Should change page size and reflect correct row count

    // Page size changes
    pageSizeOptions.forEach((size) => {
      // Open page size dropdown
      cy.get(pageSizeSelector).click();
      // Select size per page
      cy.contains(".ant-select-item-option", `${size} / page`).click();
      // Table should show size rows
      cy.get(rowSelector, { timeout: 25000 }).should("have.length", size);
    });

    // Quick jumper (Should jump to a specific page via quick jumper)
    cy.get(quickJumperSelector).clear().type("2{enter}");
    cy.get(".ant-pagination-item-active", { timeout: 30000 }).should(
      "contain",
      "2"
    );
  });
};

// Test Case: Column Sorting Functionality
// Tests sorting columns by clicking sorters.
// For invoice search, loads invoice data.
// For each column header, checks initial, ascending, descending, and unsorted states.
export const testColumnSorting = (config) => {
  it("Tests column sorting functionality", { retries: 3 }, () => {
    const {
      columnHeaders = [],
      sortButtonSelector = ".ant-table-column-sorters",
      unsortedClass = "ant-table-column-has-sorters",
      sortedClass = "ant-table-column-sort",
      invoiceSearch = false,
    } = config;

    // If the search is for an invoice, load invoice data
    if (invoiceSearch) {
      loadInvoiceData();
    }

    columnHeaders.forEach((columnHeader) => {
      //should sort the "Date In" column correctly by class toggling
      cy.contains(".ant-table-column-title", columnHeader)
        .parents("th")
        .as("columnHeader");

      // Initially, header has sorters but no sort class
      cy.get("@columnHeader")
        .should("have.class", unsortedClass)
        .and("not.have.class", sortedClass);

      // Test ascending sort
      cy.get("@columnHeader").find(sortButtonSelector).forceClick();
      cy.get("@columnHeader").should("have.class", sortedClass);

      // Test descending sort
      cy.get("@columnHeader").find(sortButtonSelector).forceClick();
      cy.get("@columnHeader").should("have.class", sortedClass);

      // Test return to unsorted
      cy.get("@columnHeader").find(sortButtonSelector).forceClick();
      cy.get("@columnHeader")
        .should("have.class", unsortedClass)
        .and("not.have.class", sortedClass);
    });
  });
};

// Test Case: Row Navigation to Details Page
// Tests navigation from a table row to a details page.
// For client search, types a term and waits for API response.
// For invoice search, loads invoice data.
// Clicks the first row link and checks the URL pattern.
// Verifies the details page loads and title is present.
export const testRowNavigation = (config) => {
  it("Tests navigation to details page", { retries: 3 }, () => {
    const {
      rowSelector = "tbody tr",
      linkSelector = "td",
      urlPattern,
      clientSearch = false,
      invoiceSearch = false,
      apiAlias,
      titleRegex,
    } = config;

    // If the search is for a client, type a term and wait for API response
    if (clientSearch) {
      cy.get(`.ant-input[placeholder="Type and hit Enter"]`).type(
        "test {enter}"
      );
      cy.wait(`@${apiAlias}`).its("response.statusCode").should("eq", 200);
    }

    // If the search is for an invoice, load invoice data
    if (invoiceSearch) {
      loadInvoiceData();
    }

    // Click first client link
    cy.get(rowSelector)
      .first()
      .find(linkSelector)
      .find("a")
      .should("have.attr", "href")
      .and("include", urlPattern);

    // Click the first row link
    cy.get(rowSelector).first().find(linkSelector).first().find("a").click();
    cy.url({ timeout: 35000 }).should("include", urlPattern);

    // Verify the title is present
    if (clientSearch) {
      cy.contains(".this-is-a-title.two", titleRegex, {
        timeout: 45000,
      }).should("exist");
    }
  });
};

// Test Case: Invoice Data Loading (Helper)
// Clears all filters for Employee.
// Types and submits a search term for invoices.
// Verifies the search input value is set.
function loadInvoiceData() {
  // Clear all filters
  cy.contains("label", "Employee")
    .parents(".ant-form-item-row")
    .find("[data-icon='close-circle']")
    .realClick();

  const searchTerm = "AddClient Test";

  // Type and submit search
  cy.get('.ant-input[placeholder="Type and hit Enter"]')
    .type(searchTerm)
    .type("{enter}");

  // Verify search input value
  cy.get(".ant-input").should("have.value", searchTerm);
}
