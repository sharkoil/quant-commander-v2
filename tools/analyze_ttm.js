"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var fs = require("fs");
var path = require("path");
var Papa = require("papaparse");
var date_fns_1 = require("date-fns");
var readline = require("readline");
var rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
});
function calculateTTM(data, endDate) {
    var startDate = (0, date_fns_1.subMonths)(endDate, 11);
    // Set to the first day of the start month
    startDate.setDate(1);
    console.log("\nCalculating TTM for the period: ".concat((0, date_fns_1.format)(startDate, 'yyyy-MM-dd'), " to ").concat((0, date_fns_1.format)(endDate, 'yyyy-MM-dd')));
    var ttmData = data.filter(function (row) {
        try {
            var rowDate = (0, date_fns_1.parse)(row.Date, 'yyyy-MM-dd', new Date());
            return rowDate >= startDate && rowDate <= endDate;
        }
        catch (e) {
            return false;
        }
    });
    var productTotals = {};
    for (var _i = 0, ttmData_1 = ttmData; _i < ttmData_1.length; _i++) {
        var row = ttmData_1[_i];
        var actuals = parseFloat(row.Actuals);
        if (!isNaN(actuals)) {
            productTotals[row.Product] = (productTotals[row.Product] || 0) + actuals;
        }
    }
    var rankedProducts = Object.entries(productTotals)
        .map(function (_a) {
        var Product = _a[0], TotalActuals = _a[1];
        return ({ Product: Product, TotalActuals: TotalActuals });
    })
        .sort(function (a, b) { return b.TotalActuals - a.TotalActuals; });
    return rankedProducts;
}
function displayResults(rankedProducts) {
    console.log("\n--- TTM Analysis Results ---");
    if (rankedProducts.length === 0) {
        console.log("No data found for the specified period.");
        return;
    }
    rankedProducts.forEach(function (p, index) {
        console.log("".concat(index + 1, ". ").concat(p.Product, ": $").concat(p.TotalActuals.toFixed(2)));
    });
}
function promptForEndDate(data) {
    rl.question('\nEnter the end month for TTM analysis (YYYY-MM) or type "exit" to quit: ', function (answer) {
        if (answer.toLowerCase() === 'exit') {
            rl.close();
            return;
        }
        try {
            // Parse the input as the first day of the given month
            var firstDayOfMonth = (0, date_fns_1.parse)(answer, 'yyyy-MM', new Date());
            if (isNaN(firstDayOfMonth.getTime())) {
                throw new Error("Invalid date format");
            }
            // Get the last day of that month to ensure the full month is included
            var endOfMonth = (0, date_fns_1.lastDayOfMonth)(firstDayOfMonth);
            var results = calculateTTM(data, endOfMonth);
            displayResults(results);
        }
        catch (e) {
            console.log("Invalid date format. Please use YYYY-MM.");
        }
        promptForEndDate(data);
    });
}
function launchTTMAnalysisTool(filePath) {
    console.log("Loading and parsing data...");
    var csvFile = fs.readFileSync(filePath, 'utf8');
    Papa.parse(csvFile, {
        header: true,
        skipEmptyLines: true,
        complete: function (results) {
            console.log("Data loaded. Found ".concat(results.data.length, " records."));
            promptForEndDate(results.data);
        },
        error: function (err) {
            console.error("Error parsing CSV:", err);
            rl.close();
        }
    });
}
var filePath = path.resolve('F:/GEMINI/Projects/beautiful/Sample Data/12k.csv');
launchTTMAnalysisTool(filePath);
