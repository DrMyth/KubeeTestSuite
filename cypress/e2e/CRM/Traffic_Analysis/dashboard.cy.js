/// <reference types="cypress" />
import dayjs from "dayjs";

describe("Traffic Dashboard Page Tests", () => {
  function configureTestEnvironment() {
    cy.on("uncaught:exception", (err) => {
      console.error("Uncaught exception:", err.message);
      return false;
    });
    cy.viewport(1280, 720);
  }

  beforeEach(() => {
    cy.intercept("GET", "**/traffics/dashboard*").as("dashboardData");
    cy.intercept("GET", "**/boutiques*").as("boutiquesList");
    cy.intercept("GET", "**/product_lines*").as("productLinesList");

    configureTestEnvironment();
    cy.login();
    cy.visit(
      "https://bmsredesign.kubeedevelopment.com/traffics_module/Dashboard",
      {
        failOnStatusCode: false,
        timeout: 30000,
      }
    );

    cy.wait("@dashboardData", { timeout: 10000 });
    cy.wait("@productLinesList", { timeout: 10000 });

    cy.contains("Traffic Dashboard", { timeout: 10000 }).should("be.visible");
  });

  // Initial Page Render Tests
  describe.skip("Initial Render Tests", () => {
    it("should display all main page elements correctly", () => {
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
    });
  });

  // Filter Functionality Tests
  describe.skip("Dashboard Filter Functionality Tests", () => {
    // Tests product line selection and search execution
    context("Product Line Filter", () => {
      it("should update product line filter", () => {
        // Opens the product line filter, selects an option, and triggers a search
        cy.get(".ant-select-selector").first().forceClick();
        cy.get(".ant-select-item-option")
          .contains("Line4")
          .click({ force: true });
        cy.contains("button", "Search").forceClick();
        cy.wait(["@dashboardData"]);
      });
    });

    // Verifies Date Range Picker functionality
    context("Date Range Validation", () => {
      it("should validate date range selection", () => {
        const year = new Date().getFullYear();

        cy.contains("label", "Year").should("exist").forceClick();
        cy.get(".ant-select-selector")
          .eq(1)
          .should("exist")
          .contains(year)
          .click({ force: true });

        cy.contains("button", "Search").forceClick();
        cy.wait(["@dashboardData"]);

        // Cycle through Year, Month and Week filters
        clickAndVerifyFilter("Month");
        clickAndVerifyFilter("Year"); //Comment out this
        clickAndVerifyFilter("Week");

        // Validate Date Picker with 31-days error (on day granularity filter)
        cy.contains("label", "Day").should("exist").forceClick();
        let start = dayjs().subtract(39, "day");
        let end = dayjs();

        cy.get("input[placeholder='End date']").click({ force: true });

        // Select the end date
        cy.get(".ant-picker-dropdown")
          .find(".ant-picker-panel")
          .eq(1)
          .find(".ant-picker-cell-inner")
          .contains(end.date())
          .click({ force: true });

        // Select the start date
        cy.get(".ant-picker-dropdown")
          .find(".ant-picker-panel")
          .eq(0)
          .find(".ant-picker-cell-inner")
          .contains(start.date())
          .click({ force: true });

        // Search
        cy.contains("button", "Search").forceClick();

        // Check for error message
        cy.get(".ant-message-notice-content")
          .contains("Please select 31 days only .")
          .should("exist");

        // Validate Date Picker with valid date range and trigger search
        start = dayjs().subtract(30, "day");
        end = dayjs();

        // Select the start date
        cy.get("input[placeholder='End date']").click({ force: true });
        cy.get(".ant-picker-dropdown")
          .find(".ant-picker-panel")
          .eq(0)
          .find(".ant-picker-cell-inner")
          .contains(end.date())
          .click({ force: true });

        // Select the end date
        cy.get(".ant-picker-dropdown")
          .find(".ant-picker-panel")
          .eq(1)
          .find(".ant-picker-cell-inner")
          .contains(start.date())
          .click({ force: true });

        // Search
        cy.contains("button", "Search").forceClick();

        // Check for success API response
        cy.wait(["@dashboardData"]);

        //Need to check these are not working!
        cy.get("#from").click({ force: true }).type("00:00");
        cy.get("#from").type("{enter}");
        cy.get("#to").click({ force: true }).type("23:59");
        cy.get("#to").type("{enter}");
        cy.contains("button", "Search").forceClick();
        cy.wait(["@dashboardData"]);
      });
    });
  });

  // Metric Card Tests
  describe("Metric Card Tests", () => {
    it("should update metric cards after applying a filter change", () => {
      const metrics = [
        "Avg Traffic Points",
        "Traffic",
        "Avg Traffic Time",
        "Group New Traffic",
        "Boutique New Traffic",
        "Boutique Returning Traffic",
        "Group Existing Traffic",
      ];

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
            const oldVal = initialValues[metric];
            const newVal = newText.trim();
            updatedValues[metric] = newVal;

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
    });
  });

  // Charts and Graphs Tests
  describe("Charts and Graphs Tests", () => {
    it("should display charts and graphs correctly", () => {
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

  //Helper Functions
  
  function loadData() {
    cy.get(".ant-select-selector").first().forceClick();
    cy.get(".ant-select-item-option").contains("Line4").click({ force: true });

    cy.contains("label", "Year").should("exist").forceClick();

    cy.get(".ant-select-selector").eq(1).should("exist").click({ force: true });
    // ["2024", "2023", "2022"].forEach((year) => {
    //   cy.get(".ant-select-selector").eq(1).type(`${year}{enter}`);
    // });
    ["2024", "2023", "2022"].forEach((year) => {
      cy.get(".ant-select-dropdown")
        .last()
        .find(".ant-select-item-option")
        .contains(year)
        .click({ force: true });
    });

    cy.get(".ant-select-selector")
      .eq(1)
      .contains("2025")
      .click({ force: true });

    cy.contains("button", "Search").forceClick();

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
          cy.get(".text-wrapper")
            .invoke("text")
            .should("match", card.sinceRegex);
        }
      });
  }

  function verifyChartCard(cardTitle, checkBarChart = true) {
    cy.contains(".this-is-a-title.four", cardTitle)
      .closest(".ant-card")
      .should("exist")
      .within(() => {
        if (checkBarChart) {
          cy.get(".kubee-bar-chart").should("exist");
        }
        // cy.contains("span", "No data", {timeout: 30000}).should("exist");
        // cy.get('img[src="/images/no-data.svg"]').should("exist");
      });
  }

  function clickAndVerifyFilter(label) {
    cy.contains("label", label).should("exist").forceClick();
    cy.get(".ant-select-selector").eq(1).should("exist");
  }

  function verifyChartAndTooltip(selector) {
    cy.get(selector, { timeout: 10000 })
      .first()
      .should("exist")
      .within(() => {
        cy.get("canvas")
          .should("be.visible")
          .and(($canvas) => {
            expect($canvas[0].width).to.be.greaterThan(0);
            expect($canvas[0].height).to.be.greaterThan(0);
          });

        // Simulate mouse hover over the chart canvas to trigger tooltip display
        cy.get("canvas").scrollIntoView().realHover({ position: "center" });
      });

    // cy.get(".g2-tooltip").should("exist").and("be.visible");
  }

  function validateChartCardData(
    title,
    hasData,
    chartSelector = ".kubee-bar-chart"
  ) {
    cy.contains(".this-is-a-title.four", title)
      .closest(".ant-card")
      .within(() => {
        if (hasData) {
          cy.contains("span", "No data").should("not.exist");
          cy.get('img[src="/images/no-data.svg"]').should("not.exist");
          cy.get(chartSelector).should("exist").realHover();
          // cy.get(".g2-tooltip").should("exist").and("be.visible");
        } else {
          cy.contains("span", "No data").should("exist");
          cy.get('img[src="/images/no-data.svg"]').should("exist");
        }
      });
  }
});
