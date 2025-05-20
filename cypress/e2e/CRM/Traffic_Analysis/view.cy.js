/// <reference types="cypress" />

import dayjs from "dayjs";

describe("Traffic Analysis View Page Tests", () => {
  function configureTestEnvironment() {
    cy.on("uncaught:exception", (err) => {
      console.error("Uncaught exception:", err.message);
      return false;
    });
    cy.viewport(1280, 720);
  }

  beforeEach(() => {
    cy.intercept("GET", "**/traffics*").as("trafficView");
    cy.intercept("GET", "**/platforms*").as("platformsList");
    cy.intercept("GET", "**/product_lines*").as("productLinesList");

    configureTestEnvironment();
    cy.login();
    cy.visit("https://bmsredesign.kubeedevelopment.com/traffics_module/View", {
      failOnStatusCode: false,
      timeout: 30000,
    });

    cy.wait("@trafficView", { timeout: 10000 });
    cy.wait("@platformsList", { timeout: 10000 });
    cy.wait("@productLinesList", { timeout: 10000 });

    cy.contains("Traffic", { timeout: 10000 }).should("be.visible");
  });

  describe("Initial Rendering Tests", () => {
    // Verifies the main page layout including title, filters, buttons, and table structure
    it("should load the main page structure", () => {
      // Title Section
      cy.contains(".this-is-a-title.two", "Traffic").should("exist");

      // Filters Section: basic and expanded
      cy.get(".filters > .ant-row")
        .first()
        .within(() => {
          cy.get(".ant-col").its("length").should("be.gte", 5);
        });

      ["Nationality", "Gender", "Status"].forEach((label) => {
        cy.contains("label", label).should("exist");
        checkRenderingOfSelects(label);
      });

      // Expand more filters
      cy.get("button")
        .contains("More Filters")
        .should("exist")
        .click({ timeout: 5000 });

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

      cy.get(".ant-table-row").should("have.length.greaterThan", 1);
    });
  });

  describe("Filter Functionality Tests", () => {
    // Applies various filters including basic and date/time filters, then saves and deletes the saved search
    it("should apply full filter set and validate traffic view results", () => {
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

      cy.get("button").contains("Search").should("exist").click();
      cy.wait("@trafficView", { timeout: 10000 });

      // Save filter settings
      cy.get('svg[data-icon="save"]')
        .should("exist")
        .parent(".anticon.anticon-save")
        .should("exist")
        .click();

      cy.get(".ant-modal-header").contains("Confirm Save").should("exist");
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
        "Search settings saved successfully."
      );

      // Checks if the search have saved correctly or not

      cy.get("button.ant-btn-primary")
        .should("contain.text", "Saved Searches")
        .find(".anticon-down")
        .should("exist")
        .click();

      cy.intercept(
        "DELETE",
        /https:\/\/api\.kubeedevelopment\.com\/api\/v1\/default-search\/\d+/
      ).as("deleteDefaultSearch");

      cy.get(".ant-dropdown-menu")
        .should("exist")
        .within(() => {
          cy.get(".ant-dropdown-menu-item").its("length").should("be.gte", 1);

          cy.contains(".ant-dropdown-menu-item", "Filter Search Selection")
            .should("exist")
            .click();
        });

      cy.wait("@trafficView", { timeout: 10000 });

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
        "Search deleted successfully."
      );
    });
  });

  describe("Table Functionality Tests", () => {
    // Tests searching within the table and clearing results
    it("Tests search functionality with table interaction", () => {
      const searchTerm = "test update";

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
      cy.get(".ant-table-row").should("have.length", 10); // Update with expected default count
    });

    // Verifies that the sync button reloads data
    it("Tests Sync button functionality", () => {
      cy.get(".anticon-sync").closest("button").click();

      // Verify loading state
      cy.get(".ant-spin-nested-loading").should("be.visible");

      // Wait for API response
      cy.wait("@trafficView").then((interception) => {
        expect(interception.response.statusCode).to.equal(200);
      });

      // Verify table refresh
      cy.get(".ant-table-row").should("have.length.gt", 0);
    });

    // Toggles full-screen mode via the expand button
    it("Tests Expand button functionality based on full-screen wrapper", () => {
      // Ensure the full-screen wrapper does not exist initially
      cy.get('div[style*="position: fixed"][style*="width: 100vw"]').should(
        "not.exist"
      );

      // Click the expand button
      cy.get(".anticon-expand").closest("button").click();

      // Now the full-screen wrapper should exist
      cy.get('div[style*="position: fixed"][style*="width: 100vw"]').should(
        "exist"
      );

      // Click again to collapse
      cy.get(".anticon-compress").eq(1).closest("button").click();

      // Wrapper should be removed again
      cy.get('div[style*="position: fixed"][style*="width: 100vw"]').should(
        "not.exist"
      );
    });

    // Validates the More menu columns toggling
    it("Tests More menu functionality", () => {
      cy.get(".anticon-more").click();

      // Verify dropdown menu appears
      cy.get(".ant-popover").should("be.visible");

      // Toggle visibility of specific columns by checking/unchecking them from the popover
      cy.get(".ant-popover-inner-content").within(() => {
        ["Nationality", "Preferred Contact", "Address", "Funnel Stage"].forEach(
          (item) => {
            cy.contains(item).click();
          }
        );
      });

      // Verify that 'Nationality' and 'Preferred Contact' columns are hidden, while 'Address' and 'Funnel Stage' are visible in the table
      cy.get(".ant-table")
        .should("exist")
        .within(() => {
          cy.contains("th", "Nationality").should("not.exist");
          cy.contains("th", "Preferred Contact").should("not.exist");
          cy.contains("th", "Address").should("exist");
          cy.contains("th", "Funnel Stage").should("exist");
        });
    });

    // Opens and closes the Import modal
    it("Tests Import button functionality", () => {
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

      cy.get(".ant-modal-content").should("not.exist");
    });

    // Validates pagination controls, page size, and quick-jump
    it("Pagination Tests", () => {
      // Should display pagination controls and total count

      // Previous button is disabled on first page
      cy.get(".ant-pagination-prev").should(
        "have.attr",
        "aria-disabled",
        "true"
      );
      // First page is active
      cy.get(".ant-pagination-item-active").should("contain", "1");
      // Page size selector shows default
      cy.get(".ant-select-selector").contains("10 / page");
      // Total items text
      cy.contains("span", /^Total \d+ items$/).should("exist");

      // Should navigate to next and previous pages

      // Go to next page
      cy.get(".ant-pagination-next").click();
      cy.get(".ant-pagination-item-active").should("contain", "2");
      // Go back to previous page
      cy.get(".ant-pagination-prev").click();
      cy.get(".ant-pagination-item-active").should("contain", "1");

      // Should change page size and reflect correct row count

      // Open page size dropdown
      cy.get(".ant-select-selector").contains("10 / page").click();
      // Select 20 per page
      cy.get(".ant-select-item-option").contains("25 / page").click();
      // Table should show 20 rows
      cy.get("tbody tr").should("have.length", 25);

      // Should jump to a specific page via quick jumper

      // Jump to page 5
      cy.get(".ant-pagination-options-quick-jumper input")
        .clear()
        .type("5{enter}");
      cy.get(".ant-pagination-item-active").should("contain", "5");
    });

    // Validates sorting of the "Date In" column via class toggling
    it('should sort the "Date In" column correctly by class toggling', () => {
      cy.contains(".ant-table-column-title", "Date In")
        .parents("th")
        .as("dateInHeader");

      // Initially, header has sorters but no sort class
      cy.get("@dateInHeader")
        .should("have.class", "ant-table-column-has-sorters")
        .and("not.have.class", "ant-table-column-sort");

      // Click to sort ascending
      cy.get("@dateInHeader").click();
      cy.get("@dateInHeader").should("have.class", "ant-table-column-sort");

      // Click to sort descending
      cy.get("@dateInHeader").click();
      cy.get("@dateInHeader").should("have.class", "ant-table-column-sort");

      cy.get("@dateInHeader").click();
      cy.get("@dateInHeader")
        .should("have.class", "ant-table-column-has-sorters")
        .and("not.have.class", "ant-table-column-sort");
    });

    // Navigates to traffic details when clicking on a client name
    it("should navigate to traffic details when clicking on a client name", () => {
      // Click first client link
      cy.get("tbody tr")
        .first()
        .find("td")
        .first()
        .find("a")
        .should("have.attr", "href")
        .and("include", "/traffics_module/TrafficDetails?trafficId=");

      cy.get("tbody tr").first().find("td").first().find("a").click();

      cy.url().should("include", "/traffics_module/TrafficDetails?trafficId=");
    });
  });

  // Helper Functions

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
    const id = label
      .split("/")[0]
      .toLowerCase()
      .replace(/\s+/g, "_")
      .replace(/\?/g, "");

    cy.log("Selecting from filter: " + label + " [ID:" + id + "]");


    // Ensure the filter is visible and rendered.
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

    cy.get(".ant-select-dropdown").should("be.visible");

    cy.get(".rc-virtual-list-holder-inner", { timeout: 5000 })
      .should("have.length.greaterThan", 0)
      .then(($options) => {
        // Click the first option
        cy.wrap($options[0]).click();
      });

    // Optionally, ensure that the selected value appears in the select.
    cy.get(".ant-select .ant-select-selection-item", { timeout: 5000 }).should(
      "exist"
    );
  }

  function selectDateFromPicker(panelIndex, date) {
    cy.get(".ant-picker-dropdown")
      .find(".ant-picker-panel")
      .eq(panelIndex)
      .find(".ant-picker-cell-inner")
      .contains(date)
      .click({ force: true });
  }
});
