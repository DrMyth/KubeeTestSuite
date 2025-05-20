export const testSearchFunctionality = (config) => {
    it("Tests search functionality with table interaction", () => {
      const {
        searchTerm,
        inputSelector = '.ant-input[placeholder="Type and hit Enter"]',
        clearSelector = '.ant-input-clear-icon',
        rowSelector = '.ant-table-row',
        defaultRowCount,
        clientSearch = false
      } = config;
  
      // Type and submit search
      cy.get(inputSelector)
        .type(searchTerm)
        .type("{enter}");
  
      // Verify search input value
      cy.get(inputSelector).should("have.value", searchTerm);
  
      // Verify table results

      if(clientSearch){
        cy.get(rowSelector)
        .should("have.length.gt", 0)
        .each(($row) => {
          // Instead of checking the truncated link text,
          // verify the <a> href contains our searchTerm query param:
          cy.wrap($row)
            .find("a")
            .should("have.attr", "href")
            .and("include", `search_term=${encodeURIComponent(searchTerm)}`)
        })
      } else {
        cy.get(rowSelector)
        .should("have.length.gt", 0)
        .each(($row) => {
        cy.wrap($row)
            .find("td").eq(0)
            .should("include.text", searchTerm.substring(0, 10)); 
        });
      }
  
      // Test clear functionality
      cy.get(clearSelector).click();
      cy.get(inputSelector).should("have.value", "");
  
      // Verify table reset
      cy.get(rowSelector).should("have.length", defaultRowCount);
    });
  };

// Sync Button Functionality
export const testSyncButton = (config) => {
    it("Tests Sync button functionality", () => {
      const {
        buttonSelector = ".anticon-sync",
        loadingSelector = ".ant-spin-nested-loading",
        apiAlias,
        tableRowSelector = ".ant-table-row",
        clientSearch = false,
        invoiceSearch = false
      } = config;

      if(clientSearch){
        cy.get(`.ant-input[placeholder="Type and hit Enter"]`).type("test {enter}");
        cy.wait(`@${apiAlias}`).its("response.statusCode").should("eq", 200);
        cy.wait(3000);
      } else if(invoiceSearch){
        cy.contains("label", "Employee")
        .parents(".ant-form-item-row")
        .find("[data-icon='close-circle']")
        .realClick();

        cy.get(`.ant-input[placeholder="Type and hit Enter"]`).type("New Sale {enter}");
        cy.wait(`@${apiAlias}`).its("response.statusCode").should("eq", 200);
        cy.get(tableRowSelector).should("have.length.gt", 0);
      }
  
      cy.get(buttonSelector).closest("button").realClick();
      cy.get(loadingSelector).should("be.visible");
      cy.wait(`@${apiAlias}`).its("response.statusCode").should("eq", 200);
      cy.get(tableRowSelector).should("have.length.gt", 0);
    });
  };

  // More Menu Column Toggling
  export const testColumnToggling = (config) => {
    it("Tests More menu functionality", () => {
      const { menuButtonSelector= ".anticon-more", columnsToToggle, clientSearch = false, apiAlias } = config;

      if(clientSearch){
        cy.get(`.ant-input[placeholder="Type and hit Enter"]`).type("test {enter}");
        cy.wait(`@${apiAlias}`).its("response.statusCode").should("eq", 200);
      }
        
      // Verify dropdown menu appears
      cy.get(menuButtonSelector).click();
      cy.get(".ant-popover").should("be.visible");
        
      // Toggle visibility of specific columns by checking/unchecking them from the popover
      cy.get(".ant-popover-inner-content").within(() => {
        columnsToToggle.forEach(column => {
          cy.contains(column.name).click();
        });
      });
  
      cy.get(".ant-table").within(() => {
        columnsToToggle.forEach(column => {
          const assertion = column.shouldExist ? "exist" : "not.exist";
          cy.contains("th", column.name).should(assertion);
        });
      });
    });
  };

  // Expand Button Functionality
export const testExpandButton = (config) => {
    it("Tests Expand button functionality based on full-screen wrapper", () => {
      const {
        expandButtonSelector = ".anticon-expand",
        compressButtonSelector = ".anticon-compress",
        fullscreenWrapperSelector = 'div[style*="position: fixed"][style*="width: 100vw"]'
      } = config;
  
      cy.get(fullscreenWrapperSelector).should("not.exist");
      cy.get(expandButtonSelector).click();
      cy.get(fullscreenWrapperSelector).should("exist");
      cy.get(compressButtonSelector).eq(1).click();
      cy.get(fullscreenWrapperSelector).should("not.exist");
    });
  };

  // Pagination Tests
export const testPagination = (config) => {
    it("Pagination Tests", () => {
      const {
        prevSelector = ".ant-pagination-prev",
        nextSelector = ".ant-pagination-next",
        pageSizeSelector =  ".ant-pagination-options .ant-select-selector",
        quickJumperSelector = ".ant-pagination-options-quick-jumper input",
        defaultPageSize= 10,
        rowSelector = "tbody tr",
        pageSizeOptions= [25, 50, 100],
        clientSearch = false,
        invoiceSearch = false,
        apiAlias
      } = config;

      if(clientSearch){
        cy.get(`.ant-input[placeholder="Type and hit Enter"]`).type("test {enter}");
        cy.wait(`@${apiAlias}`).its("response.statusCode").should("eq", 200);
      }

      if(invoiceSearch){
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
      pageSizeOptions.forEach(size => {
        // Open page size dropdown
        cy.get(pageSizeSelector).click();
        // Select size per page
        cy.contains(".ant-select-item-option", `${size} / page`).click();
        // Table should show size rows
        cy.get(rowSelector, { timeout: 25000 }).should("have.length", size);
      });
  
      // Quick jumper (Should jump to a specific page via quick jumper)
      cy.get(quickJumperSelector).clear().type("2{enter}");
      cy.get(".ant-pagination-item-active", {timeout: 30000}).should("contain", "2");
    });
  };


  // Column Sorting
export const testColumnSorting = (config) => {
    it("Tests column sorting functionality", () => {
      const {
        columnHeaders = [],
        sortButtonSelector = ".ant-table-column-sorters",
        unsortedClass = "ant-table-column-has-sorters",
        sortedClass = "ant-table-column-sort",
        invoiceSearch = false,
      } = config;

      if(invoiceSearch){
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
        cy.get("@columnHeader").should("have.class", unsortedClass).and("not.have.class", sortedClass);
      });
    });
  };

  // Navigation to Details Page
  export const testRowNavigation = (config) => {
    it("Tests navigation to details page", () => {
      const { rowSelector="tbody tr", linkSelector="td", urlPattern, clientSearch=false, invoiceSearch = false, apiAlias, titleRegex } = config;

      if(clientSearch){
        cy.get(`.ant-input[placeholder="Type and hit Enter"]`).type("test {enter}");
        cy.wait(`@${apiAlias}`).its("response.statusCode").should("eq", 200);
      }

      if(invoiceSearch){
        loadInvoiceData();
      }
      
      // Click first client link
      cy.get(rowSelector)
        .first()
        .find(linkSelector)
        .find("a")
        .should("have.attr", "href")
        .and("include", urlPattern);
  
      cy.get(rowSelector).first().find(linkSelector).first().find("a").click();
      cy.url({timeout: 35000}).should("include", urlPattern);

      if(clientSearch){
        cy.contains(".this-is-a-title.two", titleRegex, {timeout: 45000}).should("exist");
      }
    });
  };

  // Invoice Data Loading
  function loadInvoiceData(){
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