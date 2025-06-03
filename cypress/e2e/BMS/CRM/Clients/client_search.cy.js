const {
  testSearchFunctionality,
  testSyncButton,
  testExpandButton,
  testPagination,
  testColumnToggling,
  testRowNavigation,
} = require("../../Shared/view.cy");

/// <reference types="cypress" />
require("dotenv").config();

describe("Clients Search Page Tests", () => {
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
    cy.intercept("GET", "**/ClientSearch").as("clientSearch");
    cy.intercept("GET", "**/clientSearch*").as("apiClientSearch");

    // configure the test environment
    configureTestEnvironment();

    // login
    cy.login();

    // visit the client search page
    cy.visit(Cypress.env("TEST_URL") + "/clients_module/ClientSearch", {
      failOnStatusCode: false,
      timeout: 30000,
    });

    // wait for the client search API call to complete
    cy.wait("@clientSearch", { timeout: 35000 });

    // verify that the page title is displayed
    cy.contains("Client Search", { timeout: 35000 }).should("be.visible");
  });

  // INITIAL RENDERING TESTS
  describe("Initial Rendering Tests", () => {
    // Test Case: Initial Rendering of Client Search Page
    // - Ensures the main title is visible and matches "Client Search".
    // - Validates the presence and correct placeholder of the search input.
    // - Checks that the search button is visible and functional.
    // - Simulates typing a search term and clicking the search button.
    // - Waits for the API call and verifies the close (clear) button resets the input.
    // - Confirms the presence of all action buttons (more, expand, sync).
    // - Verifies the table column headers are correct and in order.
    // - Checks that the initial empty-state placeholder is displayed when no search is performed.
    it("should render the page correctly", { retries: 3 }, () => {
      // Ensure the main title is visible and correct
      // check for the title element
      cy.get(".this-is-a-title")
        .should("be.visible")
        .and("have.text", "Client Search");

      // Validate that the search input exists with correct placeholder
      cy.get('input[type="text"]')
        .should("be.visible")
        .and("have.attr", "placeholder", "Type and hit Enter");

      // verify that the search button is displayed
      cy.get("button.ant-input-search-button")
        .find('span[role="img"]')
        .should("have.attr", "aria-label", "search");

      // verify that the search button is displayed
      cy.get("button.ant-input-search-button").should("be.visible");

      // type the search term and press enter
      cy.get("input[placeholder='Type and hit Enter']").type("test");
      cy.get("button.ant-input-search-button").realClick();

      // wait for the API call to complete
      cy.wait("@apiClientSearch", { timeout: 35000 });

      // verify that the close button is displayed
      cy.get("span.anticon-close-circle").should("be.visible").realClick();
      cy.get("input[placeholder='Type and hit Enter']").should(
        "have.value",
        ""
      );

      // verify that all action buttons are present
      cy.get('span[aria-label="more"]').should("be.visible");
      cy.get('span[aria-label="expand"]').should("be.visible");
      cy.get('span[aria-label="sync"]').should("be.visible");

      // verify that the table column headers and empty placeholder are displayed
      verifyTableHeaders();
      verifyInitialEmptyState();
    });
  });

  // SEARCH FUNCTIONALITY TESTS
  describe("Search Functionality Tests", () => {
    // verify that the search functionality is working
    testSearchFunctionality({
      searchTerm: "test",
      defaultRowCount: 0,
      clientSearch: true,
    });

    // verify that the sync button re-fetches data
    testSyncButton({
      apiAlias: "apiClientSearch",
      clientSearch: true,
    });

    // verify that the expand/fullscreen toggling behavior is working
    testExpandButton({ SalesPage: true });

    // verify that the show/hide columns via "More" menu is working
    testColumnToggling({
      columnsToToggle: [
        { name: "Gender", shouldExist: false },
        { name: "Address", shouldExist: false },
        { name: "Source", shouldExist: false },
        { name: "Preferred Contact", shouldExist: false },
      ],
      clientSearch: true,
      apiAlias: "apiClientSearch",
    });

    // verify that the pagination controls and page-size changes are working
    testPagination({
      clientSearch: true,
      apiAlias: "apiClientSearch",
    });

    // verify that clicking a row's link navigates to details page
    testRowNavigation({
      clientSearch: true,
      apiAlias: "apiClientSearch",
      urlPattern: "/clients_module/ClientDetails?given_client_id=",
      titleRegex: /test/i,
    });

    // Test Case: Full Row Data Validation After Search
    // - Types a specific search term and submits it.
    // - Waits for the API call and ensures a successful response.
    // - Validates every column in the first result row:
    //   - Full Name: Link href contains the search term.
    //   - Gender: Matches expected value.
    //   - Boutique: Matches expected value.
    //   - Birth Date: Matches expected value.
    //   - Email: Contains all expected email addresses.
    //   - Phone: Contains all expected phone numbers.
    //   - Preferred Contact: Matches expected value.
    //   - Nationality: Matches expected value.
    //   - Address: Matches expected value.
    //   - Is Active: Matches expected value.
    //   - Source: Matches expected value.
    //   - Actions: Ensures the ellipsis icon is present.
    it(
      "searches for a term and validates every column in the first result row",
      { retries: 3 },
      () => {
        // type the search term and press Enter
        const searchTerm = "test@gmail.com";
        cy.get("input[placeholder='Type and hit Enter']")
          .clear()
          .type(`${searchTerm}{enter}`);

        // wait for the API call to complete
        cy.wait(`@apiClientSearch`, { timeout: 35000 })
          .its("response.statusCode")
          .should("eq", 200);

        // grab the first row and validate each cell
        cy.get("tbody tr")
          .first()
          .within(() => {
            // verify that the full name column is displayed
            cy.get("td")
              .eq(0)
              .find("a")
              .should("have.attr", "href")
              .and("include", `search_term=${searchTerm}`);

            // Gender column
            cy.get("td").eq(1).should("have.text", "Female");

            // Boutique column
            cy.get("td").eq(2).should("have.text", "Boutique8");

            // Birth Date column
            cy.get("td").eq(3).should("have.text", "2023-10-29");

            // Email column: span text should contain both addresses
            cy.get("td")
              .eq(4)
              .find("span")
              .invoke("text")
              .then((text) => {
                expect(text).to.contain("test@gmail.com");
                expect(text).to.contain("test2@gmail.com");
              });

            // Phone column: span text should contain both numbers
            cy.get("td")
              .eq(5)
              .find("span")
              .invoke("text")
              .then((text) => {
                expect(text).to.contain("+987656544332");
                expect(text).to.contain("+907654456777");
              });

            // Preferred Contact column
            cy.get("td").eq(6).should("have.text", "Any");

            // Nationality column
            cy.get("td").eq(7).should("have.text", "Algeria");

            // Address column
            cy.get("td").eq(8).should("have.text", "testing");

            // Is Active column
            cy.get("td").eq(9).should("have.text", "No");

            // Source column
            cy.get("td").eq(10).should("have.text", "From Traffic");

            // Actions column: ensure the ellipsis icon is present
            cy.get("td").eq(11).find("span.anticon-ellipsis").should("exist");
          });
      }
    );

    // Test Case: Purchase History Functionality
    // - Types a search term and submits it to populate the table.
    // - Waits for the API call and ensures a successful response.
    // - Opens the "Purchase History" action from the row's ellipsis menu.
    // - Verifies navigation to the correct client details URL.
    // - Checks that the "Sales" tab is active by default.
    // - Validates the presence of all expected table headers in the Sales tab.
    // - Ensures that at least one row of sales data is present in the table.
    it("Purchase History Functionality", { retries: 3 }, () => {
      // type the search term and press Enter
      cy.get("input[placeholder='Type and hit Enter']").type("test {enter}");

      // wait for the API call to complete
      cy.wait(`@apiClientSearch`, { timeout: 35000 })
        .its("response.statusCode")
        .should("eq", 200);

      // open the purchase history action
      openRowAction("Purchase History");

      // verify that the URL is correct
      cy.url({ timeout: 35000 }).should(
        "include",
        "/clients_module/ClientDetails"
      );

      // verify that the sales tab is active
      cy.contains('[role="tab"]', "Sales")
        .should("exist")
        .and("have.attr", "aria-selected", "true");

      // verify that the table headers are displayed
      const headers = [
        "Transaction ID",
        "Product Name",
        "Boutique",
        "Product Code",
        "Sale Quantity",
        "Sales Price",
        "Sale Date",
      ];

      // verify that the table headers are displayed
      cy.get(".ant-table-thead").within(() => {
        headers.map((header) => {
          cy.contains(header).should("exist");
        });
      });

      // verify that the table is displayed
      cy.get(".ant-table-tbody tr").should("have.length.greaterThan", 0);
    });
  });

  //HELPER FUNCTIONS

  function verifyTableHeaders() {
    // verify that the table column headers match expected order
    const expectedHeaders = [
      "Full Name",
      "Gender",
      "Boutique",
      "Birth Date",
      "Email",
      "Phone",
      "Preferred Contact",
      "Nationality",
      "Address",
      "Is Active",
      "Source",
      "Actions",
    ];

    // verify that the table headers are displayed
    cy.get(".ant-table-thead th").each(($el, index) => {
      expect($el.text()).to.equal(expectedHeaders[index]);
    });
  }

  function verifyInitialEmptyState() {
    // verify that the initial empty-state placeholder text is displayed
    cy.get(".ant-table-tbody .ant-table-placeholder").should(
      "contain",
      "Waiting for your search word..."
    );
  }

  function openRowAction(action) {
    // open an action from the row's ellipsis menu
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

    // verify that the action is displayed
    cy.get(".ant-popover")
      .contains("li", action)
      .then(($el) => {
        $el[0].dispatchEvent(new MouseEvent("click", { bubbles: true }));
      });
  }
});
