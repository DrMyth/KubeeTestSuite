import dayjs from "dayjs";
require("dotenv").config();

describe("Dashboard Page Tests", () => {
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
    cy.intercept("GET", "**/getStatisticsPart1*").as("getPart1");
    cy.intercept("GET", "**/getStatisticsPart2*").as("getPart2");
    cy.intercept("GET", "**/boutiques?list=1*").as("getBoutiques");
    cy.intercept("GET", "**/product_lines?list=1*").as("getProductLines");

    // login
    cy.login();
    // configure the test environment
    configureTestEnvironment();
    // visit the dashboard page
    cy.visit(Cypress.env("TEST_URL") + "/dashboard_module/Dashboard", {
      failOnStatusCode: false,
      timeout: 30000,
    });
    // verify that the dashboard page is loaded
    cy.contains("Dashboard", { timeout: 10000 }).should("be.visible");
  });

  // INITIAL PAGE RENDER TESTS
  describe("Initial Render Tests", () => {
    // Test Case: Verify that all main page elements (title, filters, metrics, charts, and tables) render correctly
    // Ensures the Dashboard page title is visible and contains the correct text
    // Checks the presence and structure of the filter section, including Product Line, Date Range, and Time Granularity options
    // Validates the Search button is present and labeled correctly
    // Verifies the Sales Achievement section, including period text, percentage, and date format
    // Checks that currency and value displays are correct
    // Ensures all metric cards are rendered, have non-empty labels and values, and contain images
    // Verifies the presence and structure of Best Sellers & Products Sales charts and their radio button groups
    // Checks the Sales by Boutique & Contribution of Sales charts, including radio group for boutique selection
    // Validates the Top Employees table, including headers, data rows, and placeholder for empty data
    it(
      "should display all main page elements correctly",
      { retries: 3 },
      () => {
        // Verify the Page Title
        cy.get(".this-is-a-title.two")
          .should("be.visible")
          .and("contain.text", "Dashboard");

        // Verify Filter Section Elements
        // Product Line Filter
        cy.contains("label", "Product Line").should("be.visible");
        cy.get("input#product_line").should("exist");

        // Date Range Picker
        cy.contains("label", "Date")
          .parent()
          .should("have.class", "ant-form-item-label")
          .parent()
          .within(() => {
            cy.get('input[placeholder="Start date"]').should("exist");
            cy.get('input[placeholder="End date"]').should("exist");
          });

        // Time Granularity Options (Radio Buttons)
        ["Year", "Month", "Week", "Day"].forEach((label) => {
          cy.contains("label", label).should("exist");
        });

        // Search Button
        cy.get("button.ant-btn-primary").should("contain.text", "Search");

        // Verify Sales Achievement Component Section
        // Checks for period text in the format YYYY-MM-DD ~ YYYY-MM-DD
        cy.contains(/sales achievement/i)
          .should("be.visible")
          .closest(".ant-col.title")
          .find("strong")
          .first()
          .invoke("text")
          .should("match", /\d{4}-\d{2}-\d{2} ~ \d{4}-\d{2}-\d{2}/);

        // Verify Sales Achievement Percentage
        cy.get(".rate-value")
          .should("be.visible")
          .first()
          .invoke("text")
          .should("match", /^\d+%$/);

        // Verify Period text with proper label and date format
        cy.get("strong")
          .filter((index, el) => el.textContent.trim().startsWith("Period:"))
          .invoke("text")
          .then((text) => text.trim())
          .should(
            "match",
            /^Period:\s*\d{4}-\d{2}-\d{2}\s*~\s*\d{4}-\d{2}-\d{2}$/
          );

        // Verify currency and value displays
        cy.get(".total-value-text").should("contain.text", "EUR");
        cy.get(".total-value-text-2")
          .invoke("text")
          .should("match", /^\d+(\.\d{2})?$/);

        // Verify Metric Cards Grid Section - checks nine cards and non-empty labels/values
        cy.get(".list")
          .eq(1)
          .find(".ant-card")
          .should("have.length", 9)
          .each(($card) => {
            cy.wrap($card)
              .find(".label-heading")
              .invoke("text")
              .then((text) => {
                expect(text.trim()).to.not.equal("");
              });

            cy.wrap($card)
              .find(".label-element")
              .invoke("text")
              .then((valueText) => {
                expect(valueText.trim()).to.not.equal("");
              });

            cy.wrap($card).find(".ant-image-mask-info").should("exist");
          });

        // Verify Chart and Table Sections for Best Sellers & Products Sales
        cy.get(".list")
          .eq(2)
          .within(() => {
            cy.get(".ant-card").should("have.length", 2);

            cy.get(".ant-card").each(($card, index) => {
              cy.wrap($card).within(() => {
                cy.get(".this-is-a-title")
                  .invoke("text")
                  .should("not.be.empty");

                // For the second card, check that radio button group is displayed
                if (index === 1) {
                  cy.get(".ant-radio-group")
                    .should("exist")
                    .within(() => {
                      cy.get("label").should("have.length.at.least", 2);
                    });
                }
              });
            });
          });

        // Verify Sales by Boutique & Contribution of Sales Charts
        cy.get(".list")
          .eq(3)
          .within(() => {
            cy.get(".ant-card")
              .should("have.length", 2)
              .each(($card, index) => {
                cy.wrap($card).within(() => {
                  cy.get(".this-is-a-title")
                    .invoke("text")
                    .should("not.be.empty");

                  // Check the first card has a radio group for boutique selections
                  if (index === 0) {
                    cy.get(".ant-radio-group").should("exist");
                    cy.get(".ant-radio-button-wrapper").should(
                      "have.length.at.least",
                      2
                    );
                    cy.get(".ant-radio-button-input").each(($radio) => {
                      cy.wrap($radio).should("have.attr", "type", "radio");
                    });
                  } else {
                    cy.get(".ant-radio-group").should("not.exist");
                  }
                });
              });
          });

        // Verify Top Employees Table Section
        cy.get(".list")
          .eq(4)
          .within(() => {
            // Ensure table header and title exists
            cy.contains(".this-is-a-title", "Top Employees").should("exist");
            cy.get(".ant-table").should("exist");

            // Validate table headers exist
            const headers = [
              "Employee Name",
              "Boutique Name",
              "Total Value of Sales",
              "Total Product Sold",
            ];

            headers.forEach((headerText) => {
              cy.get(".ant-table-thead th")
                .contains(headerText)
                .should("exist");
            });

            // Validate table rows contain data or show placeholder if empty
            cy.get(".ant-table-tbody").then(($tbody) => {
              const hasData = $tbody.find("tr.ant-table-row").length > 0;

              if (hasData) {
                cy.get(".ant-table-tbody tr.ant-table-row").each(($row) => {
                  cy.wrap($row)
                    .find("td")
                    .each(($cell) => {
                      cy.wrap($cell).invoke("text").should("not.be.empty");
                    });
                });
              } else {
                cy.get(".ant-table-placeholder").should("exist");
              }
            });
          });
      }
    );
  });

  // FILTER FUNCTIONALITY TESTS
  describe("Dashboard Filter Functionality Tests", () => {
    // Test Case: Verify that selecting a product line updates the filter and triggers the correct API calls
    // Simulates user interaction with the Product Line filter dropdown
    // Selects the first available product line option
    // Clicks the Search button to apply the filter
    // Waits for the relevant API calls to complete, ensuring the filter triggers data reload
    context("Product Line Filter", () => {
      it("should update product line filter", { retries: 3 }, () => {
        // click the product line filter
        cy.get(".ant-select-selector").first().forceClick();
        // click the first product line option
        cy.get(".ant-select-item-option").first().forceClick();
        // click the search button
        cy.contains("button", "Search").forceClick();
        // wait for the API calls to complete
        cy.wait(["@getPart1", "@getPart2"]);
      });
    });

    // Test Case: Validate the date range picker enforces a maximum allowed duration
    // Sets up a date range exceeding the allowed 31 days
    // Opens the date range picker and selects the start and end dates
    // Expects an alert message to appear, confirming the validation logic is triggered
    context("Date Range Validation", () => {
      it("should validate date range selection", { retries: 3 }, () => {
        // set the start and end dates
        const start = dayjs().subtract(35, "day");
        const end = dayjs();

        // Open the date range picker and select a range exceeding the allowed duration
        cy.get(".ant-picker-range").click({ force: true });
        cy.get(".ant-picker-dropdown")
          .find(".ant-picker-panel")
          .eq(0)
          .find(".ant-picker-cell-inner")
          .contains(start.date())
          .click({ force: true });

        // select the end date
        cy.get(".ant-picker-dropdown")
          .find(".ant-picker-panel")
          .eq(1)
          .find(".ant-picker-cell-inner")
          .contains(end.date())
          .click({ force: true });

        // Validate the alert message for invalid date range selection.
        cy.on("window:alert", (alertText) => {
          expect(alertText).to.equal(
            "Please select a range of up to 31 days only."
          );
        });
      });
    });

    // Test Case: Verify that switching between Year, Month, Week, and Day view modes updates the UI appropriately
    // Switches to 'Year' view and checks for the year filter dropdown and available years
    // Switches to 'Month' and 'Week' views and ensures the year filter remains visible
    // Switches back to 'Day' view and checks for the date range picker
    // Triggers a search after changing the view mode to ensure data reloads
    context("View Mode Switching", () => {
      it(
        "should correctly switch between Year, Month, Week, and Day view modes",
        { retries: 3 },
        () => {
          // Switch view modes (Year/Month/Week/Day) and verify UI updates
          // set the current and previous year
          const currentYear = new Date().getFullYear();
          const previousYear = currentYear - 1;
          // switch to 'Year' view and verify the year filter
          cy.contains("label", "Year").forceClick();
          cy.get(".ant-picker-range").should("not.exist");
          // verify the year filter dropdown
          cy.get(".ant-select-selector")
            .eq(1)
            .should("exist")
            .should("contain", currentYear.toString())
            .click();
          // verify the year filter dropdown
          cy.get(".ant-select-dropdown")
            .should("exist")
            .should("contain", previousYear.toString())
            .click();

          // Switch to 'Month' and 'Week' view and check that the year filter is still visible
          cy.contains("label", "Month").forceClick();
          cy.get(".ant-select-selector").eq(1).should("exist");
          // cy.get(".ant-select-dropdown").should("exist").should("contain", previousYear.toString()).click(); //Month is also showing year
          cy.contains("label", "Week").forceClick();
          cy.get(".ant-select-selector").eq(1).should("exist");
          // cy.get(".ant-select-dropdown").should("exist").should("contain", previousYear.toString()).click(); //Week is also showing year

          // Switch back to 'Day' view and check for the date range picker
          cy.contains("label", "Day").forceClick();
          cy.get(".ant-picker-range").should("exist");

          // Trigger a search after view mode change
          cy.contains("button", "Search").forceClick();
        }
      );
    });
  });

  // METRIC CARD TESTS
  describe("Metric Card Tests", () => {
    // Test Case: Verify that metric cards update after applying a filter change
    // Captures initial values of all metric cards
    // Loads new data by changing the year filter and triggering a search
    // Verifies that each metric card value changes after the filter is applied
    // Checks that the chart is rendered and tooltips are active upon hover
    it(
      "should update metric cards after applying a filter change",
      { retries: 3 },
      () => {
        // set the metrics
        const metrics = [
          "Avg Transaction Value",
          "Avg Unit Transaction",
          "Traffic",
          "Group New Clients",
          "Boutique New Clients",
          "Boutique Returning Clients",
          "Conversion Rate",
          "Total Products Sold",
          "Group Existing Clients",
        ];

        // set the initial values of the metrics
        const initialValues = {};

        // capture the initial values of the metrics
        metrics.forEach((m) => captureMetric(m, initialValues));
        // load the data
        loadData();
        // verify that the metric values have changed
        metrics.forEach((m) => verifyMetricChanged(m, initialValues));

        // Verify that the chart is rendered and tooltips are active
        cy.get('[data-chart-source-type="G2Plot"]', { timeout: 10000 })
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

        // verify that the tooltip is displayed
        cy.get(".g2-tooltip").should("exist").and("be.visible");
      }
    );
  });

  // DATA VISUALIZATION TESTS
  describe("Data Visualization Tests", () => {
    // Test Case: Verify that the Best Sellers chart renders with interactive tooltips
    // Loads new data to ensure the chart is populated
    // Locates the Best Sellers chart card and checks for the chart container
    // Simulates mouse hover over the chart canvas to trigger tooltip display
    // Verifies that the tooltip appears and is visible
    it(
      "should render the Best Sellers chart with interactive tooltips",
      { retries: 3 },
      () => {
        // load the data
        loadData();
        // verify that the best sellers chart is displayed
        cy.contains("Best Sellers")
          .parents(".ant-card")
          .within(() => {
            // verify that the chart is displayed
            cy.get(".kubee-bar-chart", { timeout: 10000 }).should("exist");

            // verify that the chart canvas is displayed and simulate hover
            cy.get("div[data-chart-source-type='G2Plot']", { timeout: 5000 })
              .should("exist")
              .within(() => {
                cy.get("canvas").scrollIntoView().realHover();
              });

            // verify that the tooltip is displayed
            cy.get(".g2-tooltip", { timeout: 5000 }).should("exist");
          });
      }
    );

    // Test Case: Verify that the Product Sales chart renders with tooltips and can switch to table view
    // Loads new data to ensure the chart is populated
    // Locates the Products Sales chart card and checks for the chart container
    // Simulates mouse hover over the chart canvas to trigger tooltip display
    // Switches to Table View and checks for the table's existence
    // Validates the presence of expected table headers and at least one data row
    // Scrolls the table content to the right to ensure horizontal scrolling works
    it(
      "should render the Product Sales chart with interactive tooltips && should switch to table view for Products Sales and display valid table headers and data rows",
      { retries: 3 },
      () => {
        // load the data
        loadData();
        // verify that the products sales chart is displayed
        cy.contains("Products Sales")
          .parents(".ant-card")
          .within(() => {
            // verify that the chart is displayed
            cy.get(".chart")
              .should("exist")
              .within(() => {
                cy.get("canvas", { timeout: 4000 })
                  .scrollIntoView()
                  .realHover();
              });

            // verify that the tooltip is displayed
            cy.get(".g2-tooltip").should("exist");

            // switch to table view
            cy.contains("Table View").click();
            cy.get(".ant-table").should("exist");
            // verify that the table headers are displayed
            const headers = ["Product", "Sales %", "Sales", "No. of sales"];
            headers.forEach((header) => {
              // verify that the table header is displayed
              cy.get(".ant-table thead").contains("th", header).should("exist");
            });

            // verify that at least one row is rendered
            cy.get(".ant-table tbody tr").should("have.length.greaterThan", 0);
            cy.get(".ant-table-row.ant-table-row-level-0").should(
              "have.length.greaterThan",
              0
            );
            // scroll the table content to the right
            cy.get(".ant-table-content").scrollTo("right");
          });
      }
    );

    // Test Case: Verify that the Sales by Boutique chart renders with interactive tooltips
    // Loads new data to ensure the chart is populated
    // Locates the Sales by Boutique chart card and checks for the chart container
    // Simulates mouse hover over the chart canvas to trigger tooltip display
    // Verifies that the tooltip appears and is visible
    it(
      "should render the Sales by Boutique chart with interactive tooltips",
      { retries: 3 },
      () => {
        // load the data
        loadData();
        // verify that the sales by boutique chart is displayed
        cy.contains("Sales by Boutique")
          .parents(".ant-card")
          .within(() => {
            // verify that the chart is displayed
            cy.get(".chart", { timeout: 10000 }).should("exist");

            // verify that the chart canvas is displayed and simulate hover
            cy.get("div[data-chart-source-type='G2Plot']", { timeout: 5000 })
              .should("exist")
              .within(() => {
                cy.get("canvas").scrollIntoView().realHover();
              });

            // verify that the tooltip is displayed
            cy.get(".g2-tooltip", { timeout: 5000 }).should("exist");
          });
      }
    );

    // Test Case: Verify that the Contribution of Sales chart renders and responds to click interactions
    // Loads new data to ensure the chart is populated
    // Locates the Contribution of Sales chart card and checks for the chart container
    // Simulates mouse hover and click on the chart canvas to trigger tooltip display
    // Verifies that the tooltip appears and is visible after interaction
    it(
      "should render the Contribution of Sales chart and respond to click interactions",
      { retries: 3 },
      () => {
        // load the data
        loadData();
        // verify that the contribution of sales chart is displayed
        cy.contains("Contribution of Sales in each Market")
          .parents(".ant-card")
          .within(() => {
            // verify that the chart is displayed
            cy.get(".kubee-bar-chart", { timeout: 10000 }).should("exist");

            // verify that the chart canvas is displayed and simulate hover
            cy.get("div[data-chart-source-type='G2Plot']", { timeout: 5000 })
              .should("exist")
              .within(() => {
                cy.get("canvas").should("exist").realHover();
                cy.get("canvas").realHover().realClick({ position: "center" });

                // verify that the tooltip is displayed
                cy.get(".g2-tooltip", { timeout: 5000 }).should("exist");
              });
          });
      }
    );

    // Test Case: Validate the Top Employees table headers and rows data integrity
    // Loads new data to ensure the table is populated
    // Locates the Top Employees table and checks for the correct headers
    // Verifies that at least one data row is rendered
    // Checks that each row has the correct number of columns and no cell is empty
    // Validates the pagination summary text is displayed correctly
    it(
      "should display Top Employees table with correct headers and rows",
      { retries: 3 },
      () => {
        // load the data
        loadData();
        // verify that the top employees table is displayed
        cy.contains("Top Employees")
          .should("exist")
          .parents(".ant-col")
          .eq(1)
          .within(() => {
            // verify that the table is rendered
            cy.get("thead.ant-table-thead tr").within(() => {
              cy.get("th").eq(0).should("have.text", "Employee Name");
              cy.get("th").eq(1).should("have.text", "Boutique Name");
              cy.get("th").eq(2).should("contain", "Total Value of Sales");
              cy.get("th").eq(3).should("have.text", "Total Product Sold");
            });

            // verify that at least one row is rendered
            cy.get("tbody.ant-table-tbody tr").should(
              "have.length.at.least",
              1
            );

            // loop through each row and check column count and that no cell is empty
            cy.get("tbody.ant-table-tbody tr")
              .not(".ant-table-measure-row")
              .each(($row) => {
                cy.wrap($row).within(() => {
                  cy.get("td").should("exist");
                  cy.get("td").each(($cell) => {
                    cy.wrap($cell).invoke("text").should("not.be.empty");
                  });
                });
              });

            // verify that the pagination summary text is displayed correctly
            cy.get(".ant-pagination-prev .ant-col span")
              .invoke("text")
              .should("match", /Total \d+ items/);
          });
      }
    );
  });

  // HELPER FUNCTIONS
  function loadData() {
    // set the current year
    const currentYear = new Date().getFullYear();
    // open the year dropdown
    cy.contains("label", "Year").forceClick();
    cy.get(".ant-select-selector")
      .eq(1)
      .should("contain", currentYear.toString())
      .forceClick();

    // wait for dropdown to appear and click the 2024 option (for demo data)
    ["2024", "2023"].forEach((year) => {
      cy.get(".ant-select-selector").eq(1).type(`${year}{enter}`);
    });

    // click the search button
    cy.contains("button", "Search").click({ force: true });
    // wait for the API calls to complete
    cy.wait(["@getPart1", "@getPart2"]);
    // wait for 3 seconds
    cy.wait(3000);
  }

  function captureMetric(name, store) {
    // verify that the metric is displayed
    cy.contains(name)
      .parents(".ant-card")
      .find(".rate-value, .label-element")
      .invoke("text")
      .then((t) => {
        // store the metric value
        store[name] = t.trim();
      });
  }

  function verifyMetricChanged(name, store) {
    // verify that the metric is displayed
    cy.contains(name)
      .parents(".ant-card")
      .find(".rate-value, .label-element")
      .invoke("text")
      .should((t) => {
        // verify that the metric value has changed
        expect(t.trim()).not.to.eq(store[name]);
      });
  }
});
