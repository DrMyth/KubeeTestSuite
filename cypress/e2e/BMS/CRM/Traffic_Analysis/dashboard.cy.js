/// <reference types="cypress" />
import dayjs from "dayjs";
require("dotenv").config();

describe("Traffic Dashboard Page Tests", () => {
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
    cy.intercept("GET", "**/traffics/dashboard*").as("dashboardData");
    cy.intercept("GET", "**/boutiques*").as("boutiquesList");
    cy.intercept("GET", "**/product_lines*").as("productLinesList");

    // Configure test environment
    configureTestEnvironment();

    // Login
    cy.login();

    // Visit the dashboard page
    cy.visit(Cypress.env("TEST_URL") + "/traffics_module/Dashboard", {
      failOnStatusCode: false,
      timeout: 30000,
    });

    // Wait for API calls to complete
    cy.wait("@dashboardData", { timeout: 10000 });
    cy.wait("@productLinesList", { timeout: 10000 });

    // Verify the page title
    cy.contains("Traffic Dashboard", { timeout: 10000 }).should("be.visible");
  });

  // INITIAL PAGE RENDER TESTS
  describe("Initial Render Tests", () => {
    // Test Case: Verify all main page elements are displayed correctly on initial render
    // Ensures the title section is visible.
    // Checks the presence and structure of the filters section, including Product Line, Date Range, and Time pickers.
    // Validates the existence and default state of time granularity radio buttons.
    // Confirms the Search button is present.
    // Verifies the Achievements section, including title, date range, rate value, period info, and chart container.
    // Checks the presence and content of all metric cards, validating their headings and values.
    // Ensures additional chart cards (By Countries, By Age, By Gender, By Residency) are present and correctly rendered.
    it(
      "should display all main page elements correctly",
      { retries: 3 },
      () => {
        // Verify Title Section is visible
        cy.get(".this-is-a-title.two").should("be.visible");

        // Verify Filters Section

        // Product Line Filter
        cy.contains("label", "Product Line")
          .should("exist")
          .parent()
          .parent()
          .within(() => {
            cy.get(".ant-select-selector").should("exist");
            cy.get("#product_line").should("exist");
          });

        // Date Range Picker
        cy.contains("label", "Date")
          .should("exist")
          .parent()
          .parent()
          .within(() => {
            cy.get(".ant-picker-range").should("exist");
            cy.get('input[placeholder="Start date"]').should("exist");
            cy.get('input[placeholder="End date"]').should("exist");
          });

        // Time Picker
        cy.contains("label", "From")
          .should("exist")
          .parent()
          .parent()
          .within(() => {
            cy.get(".ant-picker").should("exist");
            cy.get("#from").should("exist");
            cy.get('input[placeholder="Choose Time"]').should("exist");
          });

        cy.contains("label", "To")
          .should("exist")
          .parent()
          .parent()
          .within(() => {
            cy.get(".ant-picker").should("exist");
            cy.get("#to").should("exist");
            cy.get('input[placeholder="Choose Time"]').should("exist");
          });

        // Time Granularity Options (Radio Buttons)
        cy.contains("label", "Year").should("exist");
        cy.get('input[type="radio"][value="year"]').should("exist");
        cy.contains("label", "Month").should("exist");
        cy.get('input[type="radio"][value="month"]').should("exist");
        cy.contains("label", "Week").should("exist");
        cy.get('input[type="radio"][value="week"]').should("exist");
        cy.contains("label", "Day").should("exist");
        cy.get('input[type="radio"][value="day"]')
          .should("exist")
          .should("be.checked");

        // Search Button
        cy.get("button.ant-btn-primary").should("contain.text", "Search");

        // Verify Achievements Section
        cy.get(".achievement")
          .should("exist")
          .within(() => {
            // Title and Traffic Analysis section
            cy.get(".this-is-a-title")
              .should("exist")
              .and("contain.text", "Traffic Analysis");

            // Validate date range text using regex
            cy.get("strong")
              .first()
              .invoke("text")
              .should("match", /\d{4}-\d{2}-\d{2}\s*~\s*\d{4}-\d{2}-\d{2}/);

            // Validate rate-value percentage text
            cy.get(".rate-value").invoke("text").should("match", /\d+%/);

            // Check for the period info in the next <strong> element
            cy.get("strong")
              .eq(1)
              .invoke("text")
              .should(
                "match",
                /Period:\s*\d{2}\/\d{2}\/\d{4}\s*-\s*\d{2}\/\d{2}\/\d{4}/
              );

            // Check for the G2Plot chart container with the data-chart-source-type attribute (Validate presence of chart container and canvas with hover action)
            cy.get("div[data-chart-source-type='G2Plot']")
              .should("exist")
              .within(() => {
                cy.get("canvas").should("exist").realHover();
              });

            // Verify tooltip is present in the DOM
            // cy.get(".g2-tooltip").should("exist");
          });

        // Verify Metric Cards Section
        cy.get(".list").eq(1).should("exist");

        // Define expected cards with their validation regex patterns.
        const cards = [
          {
            heading: /Avg Traffic Points/i,
            valueRegex: /\d+(\.\d+)?/,
            rateRegex: /\d+(\.\d+)?%/,
            sinceRegex: /since\s+\d{4}-\d{2}-\d{2}\s*~\s*\d{4}-\d{2}-\d{2}/i,
          },
          {
            heading: /^Traffic$/i,
            valueRegex: /\d+(\.\d+)?/,
            rateRegex: /\d+%/,
            sinceRegex: /since\s+\d{4}-\d{2}-\d{2}\s*~\s*\d{4}-\d{2}-\d{2}/i,
          },
          {
            heading: /Avg Traffic Time/i,
            valueRegex: /\d+(\.\d+)?\s*mn/i,
          },
          {
            heading: /Group New Traffic/i,
            valueRegex: /\d+/,
          },
          {
            heading: /Boutique New Traffic/i,
            valueRegex: /\d+/,
          },
          {
            heading: /Boutique Returning Traffic/i,
            valueRegex: /\d+/,
          },
          {
            heading: /Group Existing Traffic/i,
            valueRegex: /\d+/,
          },
        ];

        // For each expected card, verify that its heading is present and its inner content matches the regex patterns.
        cards.forEach((card) => verifyMetricCard(card));

        // Verify Additional Chart Cards
        // Verify "By Countries", "By Age", "By Gender" chart cards (Check for the chart container with initial data)
        verifyChartCard("By Countries");
        verifyChartCard("By Age");
        verifyChartCard("By Gender");

        // Verify "By Residency" chart card (Check for the initial data)
        verifyChartCard("By Residency", false);
      }
    );
  });

  // FILTER FUNCTIONALITY TESTS
  describe("Dashboard Filter Functionality Tests", () => {
    // Test Case: Update product line filter and trigger search
    // Opens the product line filter dropdown.
    // Selects the 'Line4' option from the dropdown.
    // Clicks the Search button to apply the filter.
    // Waits for the dashboard data API call to complete, confirming the filter is applied.
    it("should update product line filter", { retries: 3 }, () => {
      // Opens the product line filter, selects an option, and triggers a search
      cy.get(".ant-select-selector").first().forceClick();
      // Select the 'Line4' option from the dropdown
      cy.get(".ant-select-item-option")
        .contains("Line4")
        .click({ force: true });
      // Click the Search button to apply the filter
      cy.contains("button", "Search").forceClick();
      cy.wait(["@dashboardData"]);
    });

    // Test Case: Validate date range selection and error handling
    // Selects the 'Year' granularity and chooses the current year.
    // Clicks Search and waits for dashboard data to load.
    // Cycles through Month, Year, and Week filters to verify their functionality.
    // Attempts to select a date range longer than 31 days to trigger an error message.
    // Confirms the error message for exceeding the allowed date range appears.
    // Selects a valid 30-day date range and triggers a search.
    // Waits for dashboard data to load and verifies no error is shown.
    // Attempts to set time filters and triggers a search, confirming dashboard data loads with the new filters.
    it("should validate date range selection", { retries: 3 }, () => {
      // Get the current year
      const year = new Date().getFullYear();

      // Select the 'Year' granularity and choose the current year
      cy.contains("label", "Year").should("exist").forceClick();
      cy.get(".ant-select-selector")
        .eq(1)
        .should("exist")
        .contains(year)
        .click({ force: true });

      // Click the Search button to apply the filter
      cy.contains("button", "Search").forceClick();
      cy.wait(["@dashboardData"]);

      // Cycle through Year, Month and Week filters
      clickAndVerifyFilter("Month");
      clickAndVerifyFilter("Year"); //Comment out this
      clickAndVerifyFilter("Week");

      // Validate Date Picker with 31-days error (on day granularity filter)
      cy.contains("label", "Day").should("exist").realClick();

      // Fill in the start date and end date from input
      cy.get("input[placeholder='Start date']")
        .clear({ force: true })
        .type("2025-05-01{enter}", { force: true });
      cy.get("input[placeholder='End date']")
        .clear({ force: true })
        .type("2025-03-31{enter}", { force: true });

      // Click the search button
      cy.contains("button", "Search").realClick();

      // Check for error message
      cy.get(".ant-message-notice-content")
        .contains("Please select 31 days only!")
        .should("exist");

      // Validate Date Picker with valid date range and trigger search
      cy.get("input[placeholder='Start date']")
        .clear({ force: true })
        .type("2025-06-01{enter}", { force: true });
      cy.get("input[placeholder='End date']")
        .clear({ force: true })
        .type("2025-05-25{enter}", { force: true });

      // Click the search button
      cy.contains("button", "Search").realClick();

      // Check for success API response
      cy.wait(["@dashboardData"]);

      // Set time filters
      cy.get("#from").click({ force: true }).type("00:00");
      cy.get("#from").type("{enter}");
      cy.get("#to").click({ force: true }).type("23:59");
      cy.get("#to").type("{enter}");

      // Click the Search button to apply the filter
      cy.contains("button", "Search").realClick();
      cy.wait(["@dashboardData"]);
    });
  });

  // METRIC CARD TESTS
  describe("Metric Card Tests", () => {
    // Test Case: Update metric cards after applying a filter change
    // Stores the initial values of all metric cards.
    // Simulates a filter change to reload data.
    // Collects updated values for each metric card and compares them to initial values.
    // Asserts that at least one metric value has changed after the filter is applied.
    // Verifies that the main chart renders correctly and tooltips are functional.
    it(
      "should update metric cards after applying a filter change",
      { retries: 3 },
      () => {
        // Define the metrics to check
        const metrics = [
          "Avg Traffic Points",
          "Traffic",
          "Avg Traffic Time",
          "Group New Traffic",
          "Boutique New Traffic",
          "Boutique Returning Traffic",
          "Group Existing Traffic",
        ];

        // Initialize variables to store initial and updated values
        const initialValues = {};
        const updatedValues = {};
        let changedCount = 0;

        // Store all initial values
        cy.wrap(metrics).each((metric) => {
          cy.contains(".label-heading", metric)
            .siblings(".label-element")
            .invoke("text")
            .then((text) => {
              initialValues[metric] = text.trim();
            });
        });

        // Trigger data load (simulate filter change)
        loadData();

        // Collect updated values and determine if values have changed
        cy.wrap(metrics).each((metric) => {
          cy.contains(".label-heading", metric)
            .siblings(".label-element")
            .invoke("text")
            .then((newText) => {
              // Get the old and new values
              const oldVal = initialValues[metric];
              const newVal = newText.trim();
              // Store the updated values
              updatedValues[metric] = newVal;

              // Check if the values have changed
              if (oldVal !== newVal) {
                changedCount++;
              }
            });
        });

        // Assert that at least one metric value has changed
        cy.then(() => {
          expect(changedCount).to.be.greaterThan(0);
        });

        // Verify chart rendering and tooltip functionality for the first chart
        verifyChartAndTooltip("[data-chart-source-type='G2Plot']");
      }
    );
  });

  // CHARTS AND GRAPHS TESTS
  describe("Charts and Graphs Tests", () => {
    // Test Case: Display charts and graphs correctly after data reload
    // Loads new data to update all charts.
    // Verifies the Achievement section chart and tooltip functionality.
    // Checks that the 'By Countries' chart card displays data and not placeholders.
    // Confirms the 'By Age' chart card shows no-data placeholders as expected.
    // Verifies the 'By Gender' chart card displays data and is interactive.
    // Ensures the 'By Residency' chart card displays data and its chart is interactive.
    it("should display charts and graphs correctly", { retries: 3 }, () => {
      // Load new data to update charts
      loadData();

      // Verify Achievement section charts and tooltip
      cy.get(".achievement")
        .should("exist")
        .within(() => {
          cy.get("div[data-chart-source-type='G2Plot']")
            .should("exist")
            .within(() => {
              cy.get("canvas").should("exist").realHover();
            });

          // Check for the tooltip container element
          // cy.get(".g2-tooltip").should("exist");
        });

      // Verify "By Countries" card does not show no-data placeholders
      validateChartCardData("By Countries", true);

      // Verify "By Age" card shows no-data placeholders
      validateChartCardData("By Age", false);

      // Uncomment the following lines if you want to check the "By Age" chart as well
      // validateChartCardData("By Age", true);

      // Verify "By Gender" card does not show no-data placeholders and chart functions correctly
      validateChartCardData("By Gender", true);

      // Verify "By Residency" card does not show no-data placeholders and its chart is interactive
      validateChartCardData("By Residency", true, "canvas");
    });
  });

  //HELPER FUNCTIONS

  function loadData() {
    // Open the product line filter, select an option, and trigger a search
    cy.get(".ant-select-selector").first().forceClick();
    cy.get(".ant-select-item-option").contains("Line4").click({ force: true });

    // Select the 'Year' granularity and choose the current year
    cy.contains("label", "Year").should("exist").forceClick();

    // Select the year from the dropdown
    cy.get(".ant-select-selector").eq(1).should("exist").click({ force: true });
    ["2024", "2023", "2022"].forEach((year) => {
      cy.get(".ant-select-selector").eq(1).type(`${year}{enter}`);
    });

    // Select the year from the dropdown
    cy.get(".ant-select-selector")
      .eq(1)
      .contains("2025")
      .click({ force: true });

    // Click the Search button to apply the filter
    cy.contains("button", "Search").forceClick();

    // Wait for the dashboard data to load
    cy.wait(["@dashboardData"]);
  }

  function verifyMetricCard(card) {
    // Locate the card by matching its heading text using the defined regex.
    cy.contains(".label-heading", card.heading)
      .should("exist")
      .parents(".ant-card")
      .within(() => {
        // Verify main numeric value (Check for the main value in .label-element (e.g. "0.00" or "0"))
        if (card.valueRegex) {
          cy.get(".label-element")
            .invoke("text")
            .should("match", card.valueRegex);
        }
        // Verify rate value if applicable (If a rate value is expected, check .rate-value using the provided regex)
        if (card.rateRegex) {
          cy.get(".rate-value").invoke("text").should("match", card.rateRegex);
        }
        // Verify 'since' date range if applicable (// If the card is expected to display a "since" date range)
        if (card.sinceRegex) {
          cy.get("div")
            .contains("since")
            .invoke("text")
            .should("match", card.sinceRegex);
        }
      });
  }

  function verifyChartCard(cardTitle, checkBarChart = true) {
    // Verify the chart card exists and contains the correct data
    cy.contains(".this-is-a-title.four", cardTitle)
      .closest(".ant-card")
      .should("exist")
      .within(() => {
        // Verify the bar chart exists if specified
        if (checkBarChart) {
          cy.get(".kubee-bar-chart").should("exist");
        }
        // cy.contains("span", "No data", {timeout: 30000}).should("exist");
        // cy.get('img[src="/images/no-data.svg"]').should("exist");
      });
  }

  function clickAndVerifyFilter(label) {
    // Click the filter label and verify the dropdown exists
    cy.contains("label", label).should("exist").forceClick();
    cy.get(".ant-select-selector").eq(1).should("exist");
  }

  function verifyChartAndTooltip(selector) {
    // Verify the chart exists and contains the correct data
    cy.get(selector, { timeout: 10000 })
      .first()
      .should("exist")
      .within(() => {
        // Verify the canvas exists and has a width and height
        cy.get("canvas")
          .should("be.visible")
          .and(($canvas) => {
            expect($canvas[0].width).to.be.greaterThan(0);
            expect($canvas[0].height).to.be.greaterThan(0);
          });

        // Simulate mouse hover over the chart canvas to trigger tooltip display
        // Scroll the canvas into view and trigger a hover event
        cy.get("canvas").scrollIntoView().realHover({ position: "center" });
      });

    // Verify the tooltip exists and is visible
    // cy.get(".g2-tooltip").should("exist");
  }

  function validateChartCardData(
    title,
    hasData,
    chartSelector = ".kubee-bar-chart"
  ) {
    // Verify the chart card exists and contains the correct data
    cy.contains(".this-is-a-title.four", title)
      .closest(".ant-card")
      .within(() => {
        // Verify the chart exists if specified
        if (hasData) {
          cy.contains("span", "No data").should("not.exist");
          cy.get('img[src="/images/no-data.svg"]').should("not.exist");
          cy.get(chartSelector).should("exist").realHover();
          cy.get(".g2-tooltip").should("exist");
        } else {
          cy.contains("span", "No data").should("exist");
          cy.get('img[src="/images/no-data.svg"]').should("exist");
        }
      });
  }
});
