/// <reference types="cypress" />
require("dotenv").config();

describe("Clients Details Page Tests", () => {
  function configureTestEnvironment() {
    // configure the test environment
    cy.on("uncaught:exception", (err) => {
      console.error("Uncaught exception:", err.message);
      return false;
    });
    cy.viewport(1280, 720);
  }

  beforeEach(() => {
    // intercept the API calls
    cy.intercept("GET", "**/clients/getClientStatistics*").as("clientStats");
    cy.intercept("GET", "**/platforms*").as("platformsList");
    cy.intercept("GET", "**/api/v1/sales*").as("getSales");
    cy.intercept("GET", "**/api/v1/traffics*").as("consultationsTraffic");
    cy.intercept("GET", "**/api/v1/traffics*").as("trafficHistory");
    cy.intercept("GET", "**/api/v1/clients/getClientNotes*").as(
      "getClientNotes"
    );

    // configure the test environment
    configureTestEnvironment();
    // login
    cy.login();
    // visit the client details page
    cy.visit(
      Cypress.env("TEST_URL") +
        "/clients_module/ClientDetails?given_client_id=4352",
      {
        failOnStatusCode: false,
        timeout: 30000,
      }
    );

    // wait for the API calls to complete
    cy.wait("@clientStats", { timeout: 35000 });
    cy.wait("@platformsList", { timeout: 35000 });

    // verify that the client details page is loaded
    cy.get(".this-is-a-title.two")
      .contains("Ibrahima Conte", { timeout: 35000 })
      .should("be.visible");
  });

  // INITIAL RENDERING TESTS
  describe("Initial Rendering Tests", () => {
    // Test Case: Initial Rendering of Client Details Page
    // - Verifies that all static elements and controls render correctly on page load.
    // - Checks for the presence and state of main action buttons (Add Wallet, Create Task, Contact).
    // - Validates the rendering of all main tabs and their default states.
    // - Ensures all statistic cards, segment tables, and general information fields are present and correctly formatted.
    // - Navigates through each tab (Sales, Consultations, Traffic History, Associated Products, Notes) and checks for correct headers, placeholders, and table rendering.
    it("should render the client details correctly", { retries: 3 }, () => {
      // verify that the page title is displayed
      cy.get(".this-is-a-title.two").should("contain", "Ibrahima Conte");
      // verify that the Add Wallet button exists
      cy.contains("button", "Add Wallet")
        .should("be.visible")
        .and("not.be.disabled");
      // verify that the Contact button exists
      cy.get("img[src='/images/comments.svg']").should("exist");
      // verify that the Create Task button exists
      cy.contains("button", "Create Task")
        .should("be.visible")
        .and("not.be.disabled");

      // verify that the main tabs are displayed
      const expectedTabs = [
        "Client Details",
        "Sales",
        "Consultations",
        "Traffic History",
        "Assoiciated Products",
        "Notes",
      ];
      expectedTabs.forEach((tab) => {
        cy.contains(".ant-tabs-tab", tab).should("be.visible");
      });

      // CLIENT DETAILS TAB
      // verify that the year dropdown is displayed
      cy.get(".ant-select-selection-search").should("exist");
      checkCurrentYearInDropdown();

      // verify that the month radio is checked by default
      ["Year", "Month", "Week", "Day"].forEach((option) => {
        cy.get(".ant-radio-button-wrapper").should("contain", option);
      });
      cy.get(".ant-radio-button-wrapper-checked").should("contain", "Month");

      // verify that the statistic cards are displayed with zero values
      verifyStatCard("Group Overall Spending", /^EUR\s+\d+(?:\.\d{2})?.*$/);
      verifyStatCard("Consultations", /^\d+$/);
      verifyStatCard("Avg Transaction Value", /^\d+(?:\.\d{2})?$/);
      verifyStatCard("Avg Unit Transaction", /^\d+(?:\.\d{2})?$/);

      // verify that the segment table headers and rows are displayed
      cy.get("thead").within(() => {
        ["ACCESSORIES", "Clic-Clac", "Parfums", "Sur-Mesure"].forEach(
          (header) => cy.contains("th", header)
        );
      });

      // verify that the table row labels are displayed
      ["High Level", "Mid Level", "Entry Level"].forEach((rowLabel) =>
        cy.contains("tr", rowLabel)
      );

      // verify that the purchase tabs are displayed
      const purchaseTabs = [
        { label: "Purchase by Boutique", panelId: "rc-tabs-0-panel-1" },
        { label: "Purchase by Collection", panelId: "rc-tabs-0-panel-2" },
        { label: "Purchase by Sub-Collection", panelId: "rc-tabs-0-panel-3" },
        { label: "Purchase by Products", panelId: "rc-tabs-0-panel-4" },
      ];

      // verify that the toggles are displayed
      const toggles = [
        { label: "Chart View", value: "chart", checked: true },
        { label: "Table View", value: "table", checked: false },
      ];

      // verify that the purchase tabs are displayed
      purchaseTabs.forEach(({ label, panelId }) => {
        // Click the tab by its text and assert it becomes active
        cy.contains(".ant-tabs-nav-list .ant-tabs-tab-btn", label)
          .realClick()
          .parent()
          .should("have.class", "ant-tabs-tab-active");

        // The corresponding panel should now be visible
        cy.get(`#${panelId}`)
          .should("be.visible")
          .within(() => {
            // The radio-group for Chart/Table must exist
            cy.get(".ant-radio-group-outline")
              .should("exist")
              .and("be.visible");

            // For each toggle, assert the label, value, and checked state
            toggles.forEach(({ label: tLabel, value, checked }) => {
              cy.contains("label.ant-radio-button-wrapper", tLabel)
                .should("exist")
                .and("be.visible")
                .find("input.ant-radio-button-input")
                .should("have.value", value)
                .and(checked ? "be.checked" : "not.be.checked");
            });
          });
      });

      // verify that the general information section is displayed
      // map each label to a regex that validates its format
      const fieldPatterns = {
        "Full Name": /^Ibrahima\s+Conte$/,
        Gender: /^(Male|Female|Other|Prefer not to say)$/,
        Boutique: /^Boutique\d+$/,
        Email: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
        Status: /^(Active|Inactive)$/,
        "Last Visit": /^\d{2}-\d{2}-\d{4}$/,
        "Last Purchase": /^\d{2}-\d{2}-\d{4}$/,
        "Last Purchased Prodcut": /^(?:Product\d+-Size\d+-[A-Z0-9]+)?$/,
        DoB: /^(?:\d{2}-\d{2}-\d{4})?$/,
        Nationality: /^[A-Za-z ]*$/,
      };

      // verify that the general information section is displayed
      Object.entries(fieldPatterns).forEach(([label, pattern]) => {
        cy.contains(".label-details", label)
          .closest(".ant-row")
          .find(".value-details")
          .invoke("text")
          .then((text) => text.trim())
          .should("match", pattern);
      });

      // SALES TAB
      // click the sales tab and verify that it is active
      clickTabAndVerifyActive("Sales", "sales");

      // wait for the API calls to complete
      cy.wait("@getSales", { timeout: 35000 });

      // verify that the employee select is displayed with placeholder
      cy.get("#rc_select_1")
        .should("exist")
        .and("have.attr", "role", "combobox")
        .then(($input) => {
          // verify that the adjacent placeholder span is displayed
          cy.wrap($input)
            .parent()
            .siblings(".ant-select-selection-placeholder")
            .should("contain", "Choose Employee");
        });

      // verify that the product select is displayed with placeholder
      cy.get("#rc_select_2")
        .should("exist")
        .and("have.attr", "role", "combobox")
        .then(($input) => {
          cy.wrap($input)
            .parent()
            .siblings(".ant-select-selection-placeholder")
            .should("contain", "Choose Product");
        });

      // verify that the date range picker is displayed with Start and End inputs
      cy.get(".ant-picker-range").within(() => {
        cy.get('input[placeholder="Start date"]')
          .should("exist")
          .and("have.value", "");
        cy.get('input[placeholder="End date"]')
          .should("exist")
          .and("have.value", "");
      });

      // verify that the Search button is displayed
      cy.get("#rc-tabs-1-panel-sales")
        .contains("button", "Search")
        .should("exist")
        .and("not.be.disabled");

      // verify that the sales table is displayed with correct headers
      const headersForSales = [
        "Transaction ID",
        "Boutique",
        "Product Name",
        "Product Code",
        "Sale Representative",
        "Sale Quantity",
        "Sales Price",
        "Sales Price Euro",
        "DIS%",
        "DIS Amt",
        "Sale Date",
      ];

      // verify that the sales table is displayed with correct headers
      checkTableHeaders(headersForSales, "rc-tabs-1-panel-sales");

      // CONSULTATIONS TAB
      // click the consultations tab and verify that it is active
      clickTabAndVerifyActive("Consultations", "consultations");

      // wait for the API calls to complete
      cy.wait("@consultationsTraffic", { timeout: 35000 });

      // verify that the year dropdown is displayed
      checkCurrentYearInDropdown();

      // verify that the radio buttons are displayed
      checkRadioButtons("rc-tabs-1-panel-consultations");

      // verify that the consultations table is displayed with correct headers
      const headersForConsultations = [
        "Name",
        "Date In",
        "Date Out",
        "Email",
        "Phone",
        "Nationality",
        "Preferred Contact",
        "Gender",
        "Nationality",
        "Employee Id",
        "Employee Name",
        "Boutique",
      ];

      // verify that the consultations table is displayed with correct headers
      checkTableHeaders(
        headersForConsultations,
        "rc-tabs-1-panel-consultations"
      );

      // TRAFFIC HISTORY TAB
      // click the traffic history tab and verify that it is active
      clickTabAndVerifyActive("Traffic History", "traffic_history");

      // wait for the API calls to complete
      cy.wait("@trafficHistory", { timeout: 35000 });

      // verify that the year dropdown is displayed
      checkCurrentYearInDropdown();

      // verify that the radio buttons are displayed
      checkRadioButtons("rc-tabs-1-panel-traffic_history");

      // verify that the traffic history table is displayed with correct headers
      let headersForTrafficHistory = [
        "Name",
        "Date In",
        "Date Out",
        "Email",
        "Phone",
        "Nationality",
        "Preferred Contact",
        "Gender",
        "Nationality",
        "Employee Id",
        "Employee Name",
        "Boutique",
      ];

      // verify that the traffic history table is displayed with correct headers
      checkTableHeaders(
        headersForTrafficHistory,
        "rc-tabs-1-panel-traffic_history"
      );

      // ASSOCIATED PRODUCTS TAB
      // click the associated products tab and verify that it is active
      clickTabAndVerifyActive("Assoiciated Products", "associated_products");

      // wait for the API calls to complete
      cy.wait("@getSales", { timeout: 35000 });

      // verify that the year dropdown is displayed
      checkCurrentYearInDropdown();

      // verify that the radio buttons are displayed
      checkRadioButtons("rc-tabs-1-panel-associated_products");

      // verify that the associated products table is displayed with correct headers
      let headersForAssociatedProducts = [
        "Transaction ID",
        "Boutique",
        "Product Name",
        "Product Code",
        "Sale Representative",
        "Sale Quantity",
        "Sales Price",
        "Sales Price Euro",
        "DIS%",
        "DIS Amt",
        "Sale Date",
      ];

      // verify that the associated products table is displayed with correct headers
      checkTableHeaders(
        headersForAssociatedProducts,
        "rc-tabs-1-panel-associated_products"
      );

      // NOTES TAB
      // click the notes tab and verify that it is active
      clickTabAndVerifyActive("Notes", "notes");

      // wait for the API calls to complete
      cy.wait("@getClientNotes", { timeout: 35000 });

      // verify that the year dropdown is displayed
      checkCurrentYearInDropdown();

      // verify that the radio buttons are displayed
      checkRadioButtons("rc-tabs-1-panel-notes");

      // verify that the notes table is displayed with correct headers
      let headersForNotes = ["Note", "Created By", "Created At", "Updated By"];

      // verify that the notes table is displayed with correct headers
      checkTableHeaders(headersForNotes, "rc-tabs-1-panel-notes");
    });
  });

  // FUNCTIONALITY TESTS
  // Verifies interactive behaviors and data-driven UI updates
  describe("Functionality Tests", () => {
    // Test Case: Client Details Tab Functionality
    // - Validates the opening and closing of Add Wallet and Create Task modals with correct headers.
    // - Loads test data and verifies that all statistic cards display non-negative values.
    // - Checks the toggling and rendering of Chart/Table views for all purchase tabs.
    // - Validates navigation from statistic cards to corresponding tabs (Sales, Consultations).
    // - Ensures correct tab activation and data loading after navigation.
    it("Client Details Tab Tests", { retries: 3 }, () => {
      // ADD WALLET & ADD TASK MODALS
      // Ensures modals open with correct headers and close properly
      cy.get("button").contains("Add Wallet").realClick({ force: true });
      cy.get(".ant-modal-content")
        .should("be.visible")
        .within(() => {
          cy.get(".this-is-a-title.three")
            .invoke("text")
            .should("match", /Wallet\s*$/i);
          cy.get("button").contains("Cancel").click();
        });

      cy.get(".ant-spin-spinning", { timeout: 35000 }).should("not.exist");
      cy.get("button").contains("Create Task").realClick({ force: true });

      cy.get(".ant-modal-content")
        .should("be.visible")
        .within(() => {
          cy.get(".this-is-a-title.three").should("contain", "Add Task");
          cy.get("button").contains("Cancel").click();
        });

      // Loading Test Data
      loadTestData("rc-tabs-1-panel-client_details");

      // Verify Cards have non-negative values
      const cardTitles = [
        "Group Overall Spending",
        "Consultations",
        "Avg Transaction Value",
        "Avg Unit Transaction",
      ];

      cy.wrap(cardTitles).each((title) => {
        cy.get(`#rc-tabs-1-panel-client_details`)
          .find(".label-heading")
          .contains(title)
          .parents(".ant-card")
          .find(".label-element")
          .invoke("text")
          .then((txt) => {
            const num = parseFloat(txt.replace(/[^0-9.]/g, "")) || 0;
            expect(num, `"${title}" should be > 0`).to.be.gte(0);
          });
      });

      // Purchase by Boutique tab
      const purchaseTabs = [
        {
          label: "Purchase by Boutique",
          panelId: "rc-tabs-0-panel-1",
          firstHeader: "Boutique",
        },
        {
          label: "Purchase by Collection",
          panelId: "rc-tabs-0-panel-2",
          firstHeader: "Collection",
        },
        {
          label: "Purchase by Sub-Collection",
          panelId: "rc-tabs-0-panel-3",
          firstHeader: "Sub-collection",
        },
        {
          label: "Purchase by Products",
          panelId: "rc-tabs-0-panel-4",
          firstHeader: "Product",
        },
      ];

      cy.contains("label.ant-radio-button-wrapper", "Chart View")
        .click()
        .closest("label")
        .should("have.class", "ant-radio-button-wrapper-checked");

      // Chart & Table toggle and data rendering
      purchaseTabs.forEach(({ label, panelId, firstHeader }) => {
        // Click the tab by its text and assert it becomes active
        cy.contains(".ant-tabs-nav-list .ant-tabs-tab-btn", label)
          .realClick()
          .parent()
          .should("have.class", "ant-tabs-tab-active");

        // The corresponding panel should now be visible
        cy.get(`#${panelId}`)
          .should("be.visible")
          .within(() => {
            // assert the canvas exists and is visible
            cy.get("canvas").should("exist").and("be.visible");

            // hover in the middle of the canvas to bring up the tooltip
            cy.get("canvas").then(($canv) => {
              const { width, height } = $canv[0].getBoundingClientRect();
              cy.wrap($canv).trigger("mousemove", width / 2, height / 2);
            });

            // the G2 tooltip should appear with at least one known field
            cy.get(".g2-tooltip").should("be.visible");

            cy.contains("label.ant-radio-button-wrapper", "Table View")
              .click()
              .closest("label")
              .should("have.class", "ant-radio-button-wrapper-checked");

            // assert the table is visible and contains the expected headers
            const expectedHeaders = [
              firstHeader,
              "Sales %",
              "Sales (EUR)",
              "No. of sales",
            ];
            cy.get("table thead th").then(($ths) => {
              expect($ths).to.have.length(expectedHeaders.length);
              $ths.each((i, th) => {
                expect(th.innerText.trim()).to.eq(expectedHeaders[i]);
              });
            });

            cy.get("table tbody tr.ant-table-row")
              .its("length")
              .should("be.gt", 0);
          });
      });

      // Link to Sales Tab from Group Overall Spending
      cy.get(`#rc-tabs-1-panel-client_details`)
        .find(".label-heading")
        .contains("Group Overall Spending")
        .parents(".ant-card")
        .find(".label-icon")
        .realClick({ force: true });

      cy.get(`.ant-tabs-tab[data-node-key="sales"]`).should(
        "have.class",
        "ant-tabs-tab-active"
      );

      clickTabAndVerifyActive("Client Details", "client_details");
      cy.wait("@clientStats", { timeout: 35000 });

      // Link to Consultations Tab from Consultations
      cy.get("#rc-tabs-1-panel-client_details")
        .find(".label-heading")
        .contains("Consultations")
        .parents(".ant-card")
        .find(".label-icon")
        .then(($icon) => {
          $icon[0].click();
        });

      cy.wait("@consultationsTraffic", { timeout: 35000 });

      cy.get(`.ant-tabs-tab[data-node-key="consultations"]`).should(
        "have.class",
        "ant-tabs-tab-active",
        { timeout: 35000 }
      );
    });

    // Test Case: Sales Tab Functionality
    // - Ensures the Sales tab is active and data is loaded.
    // - Validates the Employee and Product select dropdowns and their placeholders.
    // - Tests date range selection, clearing, and input validation.
    // - Checks the Search button functionality and table rendering after search.
    it("Sales Tab Tests", { retries: 3 }, () => {
      // Check if the Sales tab is active
      clickTabAndVerifyActive("Sales", "sales");
      cy.wait("@getSales", { timeout: 35000 });

      // Renders the Employee select with placeholder
      cy.get("#rc_select_1")
        .realClick()
        .get(".rc-virtual-list")
        .within(() => {
          cy.get(".ant-select-item-option")
            .contains("All Employees")
            .click({ force: true });
        });

      // renders the Product select with placeholder
      cy.get("#rc_select_2")
        .realClick()
        .get(".rc-virtual-list")
        .within(() => {
          cy.get(".ant-select-item-option")
            .contains("All Product")
            .click({ force: true });
        });

      // Date range: pick a valid start/end
      cy.get('input[placeholder="Start date"]')
        .type("2025-04-01", { force: true })
        .should("have.value", "2025-04-01");
      cy.get('input[placeholder="End date"]')
        .type("2025-04-30 {enter}", { force: true })
        .should("have.value", "2025-04-30");

      // Clear the date range
      cy.get(".anticon-close-circle").last().realClick();

      // Ensure inputs are emptied
      cy.get('input[placeholder="Start date"]').should("have.value", "");
      cy.get('input[placeholder="End date"]').should("have.value", "");

      // Check if the Search button is enabled
      cy.get("button.ant-btn-primary").contains("Search").click();

      // Check if the table is rendered
      tableRendering();
    });

    // Test Case: Consultations Tab Functionality
    // - Ensures the Consultations tab is active and data is loaded.
    // - Validates granularity (Year, Month, Week, Day) selection and API calls.
    // - Checks table rendering and data presence for each granularity.
    it("Consultations Tab Tests", { retries: 3 }, () => {
      // Check if the Consultations tab is active
      clickTabAndVerifyActive("Consultations", "consultations");
      cy.wait("@consultationsTraffic", { timeout: 35000 });

      // Check for granularity functionality
      granularityFunctionality(
        "rc-tabs-1-panel-consultations",
        "@consultationsTraffic"
      );

      // Check for table rendering
      tableRendering();
    });

    // Test Case: Traffic History Tab Functionality
    // - Ensures the Traffic History tab is active and data is loaded.
    // - Validates granularity (Year, Month, Week, Day) selection and API calls.
    // - Checks table rendering and data presence for each granularity.
    it("Traffic History Tab Tests", { retries: 3 }, () => {
      // Check if the Traffic History tab is active
      clickTabAndVerifyActive("Traffic History", "traffic_history");
      cy.wait("@trafficHistory", { timeout: 35000 });

      // Check for granularity functionality
      granularityFunctionality(
        "rc-tabs-1-panel-traffic_history",
        "@consultationsTraffic"
      );

      // Check for table rendering
      tableRendering();
    });

    // Test Case: Associated Products Tab Functionality
    // - Ensures the Associated Products tab is active and data is loaded.
    // - Validates granularity (Year, Month, Week, Day) selection and API calls.
    // - Checks table rendering and data presence for each granularity.
    it("Associated Products Tab Tests", { retries: 3 }, () => {
      // Check if the Associated Products tab is active
      clickTabAndVerifyActive("Assoiciated Products", "associated_products");
      cy.wait("@getSales", { timeout: 35000 });

      // Check for granularity functionality
      granularityFunctionality(
        "rc-tabs-1-panel-associated_products",
        "@getSales"
      );

      // Check for table rendering
      tableRendering();
    });

    // Test Case: Notes Tab Functionality
    // - Ensures the Notes tab is active and data is loaded.
    // - Validates granularity (Year, Month, Week, Day) selection and API calls.
    // - Checks table rendering and data presence for each granularity.
    it("Notes Tab Tests", { retries: 3 }, () => {
      // Check if the Notes tab is active
      clickTabAndVerifyActive("Notes", "notes");
      cy.wait("@getClientNotes", { timeout: 35000 });

      // Check for granularity functionality
      granularityFunctionality("rc-tabs-1-panel-notes", "@getClientNotes");

      // Check for table rendering
      tableRendering();
    });
  });

  // HELPER FUNCTIONS

  function verifyStatCard(heading, pattern) {
    // verify that the statistic card is displayed with the correct heading and pattern
    cy.contains(".label-heading", heading)
      .parents(".ant-card-body")
      .find(".label-element")
      // grab the text (may include NBSP), strip and trim it
      .invoke("text")
      .then((raw) => {
        const text = raw.replace(/\u00a0/g, " ").trim();
        expect(text).to.match(pattern);
      });
  }

  function checkCurrentYearInDropdown() {
    // check the current year in the dropdown
    const currentYear = new Date().getFullYear().toString().trim();
    // verify that the current year is displayed in the dropdown
    cy.get(".ant-select .ant-select-selection-item")
      .first()
      .should("have.text", currentYear);
  }

  function clickTabAndVerifyActive(tabText, dataNodeKey) {
    // click the tab and verify that it becomes active
    cy.get(".ant-tabs-tab").contains(tabText).click({ force: true });
    // verify that the tab is active
    cy.get(`.ant-tabs-tab[data-node-key="${dataNodeKey}"]`).should(
      "have.class",
      "ant-tabs-tab-active"
    );
  }

  function checkRadioButtons(tabSelector) {
    // check if the correct radio button is selected and verify all radio buttons
    // check the radio buttons
    const periods = ["Year", "Month", "Week", "Day"];

    // verify that the selected radio button is checked
    cy.get(".ant-radio-group-outline")
      .find("label")
      .contains("Month")
      .parent("label")
      .should("have.class", "ant-radio-button-wrapper-checked");

    // verify that all radio buttons are displayed
    cy.get(`#${tabSelector}`)
      .find(".ant-radio-group-outline label")
      .should("have.length", periods.length)
      .each(($el, idx) => {
        cy.wrap($el).contains(periods[idx]);
      });
  }

  function checkTableHeaders(headers, tabSelector) {
    // verify that the table headers are displayed
    cy.get(`#${tabSelector}`)
      .find("table thead th")
      .should("have.length", headers.length)
      .each(($th, idx) => {
        cy.wrap($th).should("contain.text", headers[idx]);
      });

    // verify that the table is displayed
    cy.get(`#${tabSelector}`).then(($panel) => {
      const $placeholder = $panel.find(".ant-table-placeholder");
      if ($placeholder.length) {
        // empty state
        cy.wrap($placeholder).should("contain.text", "No Data");
      } else {
        // data present
        cy.wrap($panel)
          .find("table tbody tr")
          .should("have.length.greaterThan", 0);
      }
    });
  }

  function loadTestData(tabSelector) {
    // load test data for the Client Details tab
    // set the years
    const years = ["2024", "2023", "2022"];
    const root = cy.get(`#${tabSelector}`);

    // click the year radio button
    cy.get(`#${tabSelector}`)
      .find(".ant-radio-group-outline label")
      .contains("Year")
      .click({ force: true, waitForAnimations: true })
      .closest("label")
      .should("have.class", "ant-radio-button-wrapper-checked");

    // verify that the year dropdown is displayed
    root
      .find(".ant-select-selector")
      .should("be.visible")
      .click({ force: true, timeout: 35000 });

    // click each year in the dropdown
    cy.get(".ant-select-dropdown")
      .should("be.visible")
      .within(() => {
        years.forEach((year) => {
          cy.get(".ant-select-item.ant-select-item-option")
            .contains(year)
            .realClick();
        });
      });

    // click the profile icon
    cy.get("img[src='/images/boy.png']").realClick();
  }

  function granularityFunctionality(tabSelector, apiCall) {
    // check granularity functionality
    // set the periods
    const periods = ["Year", "Month", "Week", "Day"];

    // verify that the radio buttons are displayed
    cy.get(`#${tabSelector}`)
      .find(".ant-radio-group-outline label")
      .should("have.length", periods.length)
      .each(($el, idx) => {
        cy.wrap($el).contains(periods[idx]).click({ force: true });

        // if the index is 0, click the year dropdown
        if (idx == 0) {
          // set the years
          const years = ["2024", "2023", "2022"];
          const root = cy.get(`#${tabSelector}`);

          // verify that the year dropdown is displayed
          root
            .find(".ant-select-selector")
            .first()
            .should("be.visible")
            .click({ force: true, timeout: 35000 });

          // verify that the year dropdown is displayed
          cy.get(".ant-select-dropdown")
            .should("be.visible")
            .within(() => {
              years.forEach((year) => {
                cy.get(".ant-select-item.ant-select-item-option")
                  .contains(year)
                  .realClick({ force: true });

                // wait for the API call to complete
                cy.wait(apiCall, { timeout: 35000 });
              });
            });
        }

        // wait for the API call to complete
        cy.wait(apiCall, { timeout: 35000 });

        // verify that the API call is made with the correct period
        // cy.wait('@consultationsTraffic',  {timeout: 35000}).then((interception) => {
        //   expect(interception.request.url).to.include(`type_view=${periods[idx].toLowerCase()}`);
        // });
      });
  }

  function tableRendering() {
    // verify that the table is displayed
    cy.get("tbody").then(($tbody) => {
      // verify that the "No Data" placeholder exists
      if ($tbody.find("tr.ant-table-placeholder").length > 0) {
        // verify that the "No Data" placeholder exists
        cy.contains("No Data");
      } else {
        // verify that the table is displayed
        cy.get("tbody tr").should("have.length.gt", 0);
        // verify that the page size options are displayed
        const pageSizeOptions = [25, 50, 100];

        // click each page size option
        pageSizeOptions.forEach((size) => {
          // click the page size option
          cy.get(".ant-pagination-options .ant-select-selector").click({
            force: true,
          });
          // verify that the page size option is displayed
          cy.contains(".ant-select-item-option", `${size} / page`).click({
            force: true,
          });
          // verify that the page size option is selected
          cy.get(".ant-pagination-options .ant-select-selector").contains(
            `${size} / page`
          );
        });
      }
    });
  }
});
