describe("Clients View Page Tests", () => {
  function configureTestEnvironment() {
    cy.on("uncaught:exception", (err) => {
      console.error("Uncaught exception:", err.message);
      return false;
    });
    cy.viewport(1280, 720);
  }

  beforeEach(() => {
    cy.intercept("GET", "**/clients/getClientStatistics*").as("clientStats");
    cy.intercept("GET", "**/platforms*").as("platformsList");
    cy.intercept("GET", "**/api/v1/sales*").as("getSales");
    cy.intercept("GET", "**/api/v1/traffics*").as("consultationsTraffic");
    cy.intercept("GET", "**/api/v1/traffics*").as("trafficHistory");
    cy.intercept("GET", "**/api/v1/clients/getClientNotes*").as(
      "getClientNotes"
    );

    configureTestEnvironment();
    cy.login();
    cy.visit(
      "https://bmsredesign.kubeedevelopment.com/clients_module/ClientDetails?given_client_id=4352",
      {
        failOnStatusCode: false,
        timeout: 30000,
      }
    );

    cy.wait("@clientStats", { timeout: 35000 });
    cy.wait("@platformsList", { timeout: 35000 });

    cy.get(".this-is-a-title.two")
      .contains("Ibrahima Conte", { timeout: 35000 })
      .should("be.visible");
  });

  // INITIAL RENDERING TESTS
  // Verifies that all static elements and controls render correctly on page load
  describe("Initial Rendering Tests", () => {
    it("should render the client details correctly", () => {
      // Page title
      cy.get(".this-is-a-title.two").should("contain", "Ibrahima Conte");
      // Add Wallet button exists
      cy.contains("button", "Add Wallet")
        .should("be.visible")
        .and("not.be.disabled");
      // Contact button exists
      cy.get("img[src='/images/comments.svg']").should("exist");
      // Create Task button exists
      cy.contains("button", "Create Task")
        .should("be.visible")
        .and("not.be.disabled");

      // Verify main tabs
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
      // Year dropdown defaults
      cy.get(".ant-select-selection-search").should("exist");
      checkCurrentYearInDropdown();

      // Month radio is checked by default
      ["Year", "Month", "Week", "Day"].forEach((option) => {
        cy.get(".ant-radio-button-wrapper").should("contain", option);
      });
      cy.get(".ant-radio-button-wrapper-checked").should("contain", "Month");

      // should render all statistic cards with zero values
      verifyStatCard("Group Overall Spending", /^EUR\s+\d+(?:\.\d{2})?.*$/);
      verifyStatCard("Consultations", /^\d+$/);
      verifyStatCard("Avg Transaction Value", /^\d+(?:\.\d{2})?$/);
      verifyStatCard("Avg Unit Transaction", /^\d+(?:\.\d{2})?$/);

      // should render the segment table headers and rows
      // Table column headers
      cy.get("thead").within(() => {
        ["ACCESSORIES", "Clic-Clac", "Parfums", "Sur-Mesure"].forEach(
          (header) => cy.contains("th", header)
        );
      });

      // Table row labels
      ["High Level", "Mid Level", "Entry Level"].forEach((rowLabel) =>
        cy.contains("tr", rowLabel)
      );

      const purchaseTabs = [
        { label: "Purchase by Boutique", panelId: "rc-tabs-0-panel-1" },
        { label: "Purchase by Collection", panelId: "rc-tabs-0-panel-2" },
        { label: "Purchase by Sub-Collection", panelId: "rc-tabs-0-panel-3" },
        { label: "Purchase by Products", panelId: "rc-tabs-0-panel-4" },
      ];

      const toggles = [
        { label: "Chart View", value: "chart", checked: true },
        { label: "Table View", value: "table", checked: false },
      ];

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

      // should render General Information section correctly
      // Map each label to a regex that validates its format
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

      // For each label, grab its sibling value and assert it matches the regex
      Object.entries(fieldPatterns).forEach(([label, pattern]) => {
        cy.contains(".label-details", label)
          .closest(".ant-row")
          .find(".value-details")
          .invoke("text")
          .then((text) => text.trim())
          .should("match", pattern);
      });

      // SALES TAB
      clickTabAndVerifyActive("Sales", "sales");

      cy.wait("@getSales", { timeout: 35000 });

      // Renders the Employee select with placeholder
      cy.get("#rc_select_1")
        .should("exist")
        .and("have.attr", "role", "combobox")
        .then(($input) => {
          // The adjacent placeholder span
          cy.wrap($input)
            .parent()
            .siblings(".ant-select-selection-placeholder")
            .should("contain", "Choose Employee");
        });

      // renders the Product select with placeholder
      cy.get("#rc_select_2")
        .should("exist")
        .and("have.attr", "role", "combobox")
        .then(($input) => {
          cy.wrap($input)
            .parent()
            .siblings(".ant-select-selection-placeholder")
            .should("contain", "Choose Product");
        });

      // renders the date range picker with Start and End inputs
      cy.get(".ant-picker-range").within(() => {
        cy.get('input[placeholder="Start date"]')
          .should("exist")
          .and("have.value", "");
        cy.get('input[placeholder="End date"]')
          .should("exist")
          .and("have.value", "");
      });

      // renders the Search button
      cy.get("#rc-tabs-1-panel-sales")
        .contains("button", "Search")
        .should("exist")
        .and("not.be.disabled");

      // renders the sales table with correct headers
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

      checkTableHeaders(headersForSales, "rc-tabs-1-panel-sales");

      // CONSULTATIONS TAB
      clickTabAndVerifyActive("Consultations", "consultations");

      cy.wait("@consultationsTraffic", { timeout: 35000 });

      checkCurrentYearInDropdown();

      checkRadioButtons("rc-tabs-1-panel-consultations");

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

      checkTableHeaders(
        headersForConsultations,
        "rc-tabs-1-panel-consultations"
      );

      // TRAFFIC HISTORY TAB
      clickTabAndVerifyActive("Traffic History", "traffic_history");

      cy.wait("@trafficHistory", { timeout: 35000 });

      checkCurrentYearInDropdown();

      checkRadioButtons("rc-tabs-1-panel-traffic_history");

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
      checkTableHeaders(
        headersForTrafficHistory,
        "rc-tabs-1-panel-traffic_history"
      );

      // ASSOCIATED PRODUCTS TAB
      clickTabAndVerifyActive("Assoiciated Products", "associated_products");

      cy.wait("@getSales", { timeout: 35000 });

      checkCurrentYearInDropdown();
      checkRadioButtons("rc-tabs-1-panel-associated_products");

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

      checkTableHeaders(
        headersForAssociatedProducts,
        "rc-tabs-1-panel-associated_products"
      );

      //NOTES TAB
      clickTabAndVerifyActive("Notes", "notes");

      cy.wait("@getClientNotes", { timeout: 35000 });

      checkCurrentYearInDropdown();
      checkRadioButtons("rc-tabs-1-panel-notes");

      let headersForNotes = ["Note", "Created By", "Created At", "Updated By"];

      checkTableHeaders(headersForNotes, "rc-tabs-1-panel-notes");
    });
  });

  // FUNCTIONALITY TESTS
  // Verifies interactive behaviors and data-driven UI updates
  describe("Functionality Tests", () => {
    it("Client Details Tab", () => {
      // ADD WALLET & ADD TASK MODALS
      // Ensures modals open with correct headers and close properly
      cy.get("button").contains("Add Wallet").realClick({force: true});
      cy.get(".ant-modal-content").should("be.visible").within(()=>{
        cy.get(".this-is-a-title.three")
        .invoke("text")
        .should("match", /Wallet\s*$/i); 
        cy.get("button").contains("Cancel").click();
      })

      cy.get('.ant-spin-spinning', { timeout: 35000 }).should('not.exist');
      cy.get("button").contains("Create Task").realClick({force: true});

      cy.get(".ant-modal-content").should("be.visible").within(()=>{
        cy.get(".this-is-a-title.three")
        .should("contain", "Add Task"); 
        cy.get("button").contains("Cancel").click();
      })
      
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

    // SALES TAB
    it("Sales Tab", () => {
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
            .click({force: true});
        });

      // renders the Product select with placeholder
      cy.get("#rc_select_2")
        .realClick()
        .get(".rc-virtual-list")
        .within(() => {
          cy.get(".ant-select-item-option").contains("All Product").click({force: true});
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

    // CONSULTATIONS TAB
    it("Consultations Tab", () => {
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

    // TRAFFIC HISTORY TAB
    it("Traffic History Tab", () => {
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

    // ASSOCIATED PRODUCTS TAB
    it("Associated Products Tab", () => {
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

    // NOTES TAB
    it("Notes Tab", () => {
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

  // Helper to verify a statistic card by its heading and expected pattern.
  function verifyStatCard(heading, pattern) {
    cy.contains(".label-heading", heading)
      .parents(".ant-card-body")
      .find(".label-element")
      // grab the text (may include NBSP), strip & trim it
      .invoke("text")
      .then((raw) => {
        const text = raw.replace(/\u00a0/g, " ").trim();
        expect(text).to.match(pattern);
      });
  }

  // Helper to check the current year in the dropdown
  function checkCurrentYearInDropdown() {
    const currentYear = new Date().getFullYear().toString().trim();
    cy.get(".ant-select .ant-select-selection-item")
      .first()
      .should("have.text", currentYear);
  }

  // Helper to click a tab and verify it becomes active
  function clickTabAndVerifyActive(tabText, dataNodeKey) {
    cy.get(".ant-tabs-tab").contains(tabText).click({ force: true });
    cy.get(`.ant-tabs-tab[data-node-key="${dataNodeKey}"]`).should(
      "have.class",
      "ant-tabs-tab-active"
    );
  }

  // Function to check if the correct radio button is selected and verify all radio buttons
  function checkRadioButtons(tabSelector) {
    const periods = ["Year", "Month", "Week", "Day"];

    // Verify selected radio button
    cy.get(".ant-radio-group-outline")
      .find("label")
      .contains("Month")
      .parent("label")
      .should("have.class", "ant-radio-button-wrapper-checked");

    // Verify all radio buttons
    cy.get(`#${tabSelector}`)
      .find(".ant-radio-group-outline label")
      .should("have.length", periods.length)
      .each(($el, idx) => {
        cy.wrap($el).contains(periods[idx]);
      });
  };

  // Function to check table headers
  function checkTableHeaders(headers, tabSelector) {
    cy.get(`#${tabSelector}`)
      .find("table thead th")
      .should("have.length", headers.length)
      .each(($th, idx) => {
        cy.wrap($th).should("contain.text", headers[idx]);
      });

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
  };

  // Function to Load test data for the Client Details tab
  function loadTestData(tabSelector) {
    const years = ["2024", "2023", "2022"];
    const root = cy.get(`#${tabSelector}`);

    cy.get(`#${tabSelector}`)
      .find(".ant-radio-group-outline label")
      .contains("Year")
      .click({force: true, waitForAnimations: true})
      .closest("label")
      .should("have.class", "ant-radio-button-wrapper-checked");

    root
      .find(".ant-select-selector")
      .should("be.visible")
      .click({ force: true, timeout: 35000 });

    // 3) Click each year in the dropdown
    cy.get(".ant-select-dropdown")
      .should("be.visible")
      .within(() => {
        years.forEach((year) => {
          cy.get(".ant-select-item.ant-select-item-option")
            .contains(year)
            .realClick();
        });
      });

    // root
    //   .find('.ant-select-selector')
    //   .click({force: true,timeout: 35000});

    cy.get("img[src='/images/boy.png']").realClick();
  }

  // Function to check granularity functionality
  function granularityFunctionality(tabSelector, apiCall) {
    const periods = ["Year", "Month", "Week", "Day"];
    cy.get(`#${tabSelector}`)
      .find(".ant-radio-group-outline label")
      .should("have.length", periods.length)
      .each(($el, idx) => {
        cy.wrap($el).contains(periods[idx]).click({ force: true });

        if (idx == 0) {
          const years = ["2024", "2023", "2022"];
          const root = cy.get(`#${tabSelector}`);

          root
            .find(".ant-select-selector")
            .first()
            .should("be.visible")
            .click({ force: true, timeout: 35000 });

          cy.get(".ant-select-dropdown")
            .should("be.visible")
            .within(() => {
              years.forEach((year) => {
                cy.get(".ant-select-item.ant-select-item-option")
                  .contains(year)
                  .realClick({ force: true });

                cy.wait(apiCall, { timeout: 35000 });
              });
            });
        }
        cy.wait(apiCall, { timeout: 35000 });

        // cy.wait('@consultationsTraffic',  {timeout: 35000}).then((interception) => {
        //   expect(interception.request.url).to.include(`type_view=${periods[idx].toLowerCase()}`);
        // });
      });
  }

  // Function to check table rendering
  function tableRendering() {
    cy.get("tbody").then(($tbody) => {
      // Check if the "No Data" placeholder exists
      if ($tbody.find("tr.ant-table-placeholder").length > 0) {
        cy.contains("No Data"); // or the exact empty state text
      } else {
        cy.get("tbody tr").should("have.length.gt", 0);
        // Else, assert and change page size
        const pageSizeOptions = [25, 50, 100];
        pageSizeOptions.forEach((size) => {
          cy.get(".ant-pagination-options .ant-select-selector")
            .click({force: true});
          cy.contains(".ant-select-item-option", `${size} / page`).click({force: true});
          cy.get(".ant-pagination-options .ant-select-selector").contains(
            `${size} / page`
          );
        });
      }
    });
  }
});
