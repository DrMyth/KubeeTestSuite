const {
  testSearchFunctionality,
  testSyncButton,
  testExpandButton,
  testPagination,
  testColumnToggling,
  testRowNavigation,
} = require("../../Shared/view.cy");

describe("Clients View Page Tests", () => {
  function configureTestEnvironment() {
    cy.on("uncaught:exception", (err) => {
      console.error("Uncaught exception:", err.message);
      return false;
    });
    cy.viewport(1280, 720);
  }

  beforeEach(() => {
    cy.intercept("GET", "**/ClientSearch").as("clientSearch");
    cy.intercept("GET", "**/clientSearch*").as("apiClientSearch");

    configureTestEnvironment();
    cy.login();
    cy.visit(
      "https://bmsredesign.kubeedevelopment.com/clients_module/ClientSearch",
      {
        failOnStatusCode: false,
        timeout: 30000,
      }
    );

    cy.wait("@clientSearch", { timeout: 35000 });

    cy.contains("Client Search", { timeout: 35000 }).should("be.visible");
  });

  // INITIAL RENDERING TESTS
  // Validates:
  // 1. Page title and header elements
  // 2. Search input placeholder and clear functionality
  // 3. Action buttons visibility
  // 4. Table headers and empty-state placeholder
  describe("Initial Rendering Tests", () => {
    it("should render the page correctly", () => {
      // Ensure the main title is visible and correct
      // check for the title element
      cy.get(".this-is-a-title")
        .should("be.visible")
        .and("have.text", "Client Search");

      // Validate that the search input exists with correct placeholder
      cy.get('input[type="text"]')
        .should("be.visible")
        .and("have.attr", "placeholder", "Type and hit Enter");
      cy.get("button.ant-input-search-button")
        .find('span[role="img"]')
        .should("have.attr", "aria-label", "search");
      cy.get("button.ant-input-search-button").should("be.visible");

      cy.get("input[placeholder='Type and hit Enter']").type("test");
      cy.get("button.ant-input-search-button").realClick();
      cy.wait("@apiClientSearch", { timeout: 35000 });
      cy.get("span.anticon-close-circle").should("be.visible").realClick();
      cy.get("input[placeholder='Type and hit Enter']").should(
        "have.value",
        ""
      );

      // Validate that all action buttons are present
      cy.get('span[aria-label="more"]').should("be.visible");
      cy.get('span[aria-label="expand"]').should("be.visible");
      cy.get('span[aria-label="sync"]').should("be.visible");

      // Verify table column headers and empty placeholder
      verifyTableHeaders();
      verifyInitialEmptyState();
    });
  });

  // SEARCH FUNCTIONALITY TESTS
  // Tests:
  // 1. Typing into search box and pressing Enter
  // 2. Table population via API alias
  // 3. Truncated link href assertions
  // 4. Clear functionality resets table
  describe("Search Functionality Tests", () => {
    // Helper-driven search & table assertions
    testSearchFunctionality({
      searchTerm: "test",
      defaultRowCount: 0,
      clientSearch: true,
    });

    // Tests sync button re-fetches data
    testSyncButton({
      apiAlias: "apiClientSearch",
      clientSearch: true,
    });

    // Tests expand/fullscreen toggling behavior
    testExpandButton({});

    // Tests show/hide columns via "More" menu
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

    // Tests pagination controls and page-size changes
    testPagination({
      clientSearch: true,
      apiAlias: "apiClientSearch",
    });

    // Tests clicking a row's link navigates to details page
    testRowNavigation({
      clientSearch: true,
      apiAlias: "apiClientSearch",
      urlPattern: "/clients_module/ClientDetails?given_client_id=",
      titleRegex: /test/i,
    });

    // FULL ROW DATA VALIDATION
    // Ensures every column in the first result row after search:
    // - Link href contains correct search_term
    // - Static text columns match expected values
    // - Multi-line email and phone spans contain all entries
    // - Actions column icon is present
    it("searches for a term and validates every column in the first result row", () => {
      // Type the search term and press Enter
      const searchTerm = "test@gmail.com";
      cy.get("input[placeholder='Type and hit Enter']")
        .clear()
        .type(`${searchTerm}{enter}`);

      // Wait for the API call to complete
      cy.wait(`@apiClientSearch`, { timeout: 35000 })
        .its("response.statusCode")
        .should("eq", 200);

      // Grab the first row and validate each cell
      cy.get("tbody tr")
        .first()
        .within(() => {
          // Full Name column: the <a> should include the searchTerm in its href
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
    });

    // PURCHASE HISTORY TAB TEST
    // Verifies:
    // 1. Opening "Purchase History" action
    // 2. URL navigation and active "Sales" tab
    // 3. Presence of expected table headers and at least one row
    it("Purchase History Functionality", () => {
      cy.get("input[placeholder='Type and hit Enter']").type("test {enter}");
      cy.wait(`@apiClientSearch`, { timeout: 35000 })
        .its("response.statusCode")
        .should("eq", 200);

      openRowAction("Purchase History");
      cy.url({ timeout: 35000 }).should(
        "include",
        "/clients_module/ClientDetails"
      );
      cy.contains('[role="tab"]', "Sales")
        .should("exist")
        .and("have.attr", "aria-selected", "true");

      const headers = [
        "Transaction ID",
        "Product Name",
        "Boutique",
        "Product Code",
        "Sale Quantity",
        "Sales Price",
        "Sale Date",
      ];

      cy.get(".ant-table-thead").within(() => {
        headers.map((header) => {
          cy.contains(header).should("exist");
        });
      });

      cy.get(".ant-table-tbody tr").should("have.length.greaterThan", 0);
    });
  });

  //HELPER FUNCTIONS

  // HELPER: Verify table column headers match expected order
  const verifyTableHeaders = () => {
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

    cy.get(".ant-table-thead th").each(($el, index) => {
      expect($el.text()).to.equal(expectedHeaders[index]);
    });
  };

  // HELPER: Verify initial empty-state placeholder text
  const verifyInitialEmptyState = () => {
    cy.get(".ant-table-tbody .ant-table-placeholder").should(
      "contain",
      "Waiting for your search word..."
    );
  };

  // HELPER: Opens an action from the row’s ellipsis menu
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
});
