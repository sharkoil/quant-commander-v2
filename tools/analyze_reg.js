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
function printAnalysis(periodType, data, topN, bottomN) {
    console.log("\n--- Analysis by ".concat(periodType, " (Top ").concat(topN, ", Bottom ").concat(bottomN, ") ---"));
    var _loop_1 = function (period) {
        var products = data[period];
        var totalActuals = Object.values(products).reduce(function (sum, val) { return sum + val; }, 0);
        var sortedProducts = Object.entries(products)
            .map(function (_a) {
            var productName = _a[0], actuals = _a[1];
            return ({
                Product: productName,
                Actuals: actuals,
                Percentage: (actuals / totalActuals) * 100,
            });
        })
            .sort(function (a, b) { return b.Actuals - a.Actuals; });
        console.log("\n".concat(periodType, ": ").concat(period));
        var top_1 = sortedProducts.slice(0, topN);
        var bottom = sortedProducts.slice(-bottomN).reverse();
        console.log("  Top ".concat(topN, " Products:"));
        top_1.forEach(function (p) {
            var _a;
            console.log("    - ".concat(p.Product, ": ").concat(p.Actuals.toFixed(2), " (").concat((_a = p.Percentage) === null || _a === void 0 ? void 0 : _a.toFixed(2), "%)"));
        });
        console.log("  Bottom ".concat(bottomN, " Products:"));
        bottom.forEach(function (p) {
            var _a;
            console.log("    - ".concat(p.Product, ": ").concat(p.Actuals.toFixed(2), " (").concat((_a = p.Percentage) === null || _a === void 0 ? void 0 : _a.toFixed(2), "%)"));
        });
    };
    for (var period in data) {
        _loop_1(period);
    }
}
function startInteractiveSession(analysisData, currentPeriod, currentTopN, currentBottomN) {
    printAnalysis(currentPeriod, analysisData[currentPeriod], currentTopN, currentBottomN);
    rl.question('\nWhat would you like to do next?\n(1) Change time scale\n(2) Change Top/Bottom N\n(3) Exit\n> ', function (answer) {
        if (answer === '1') {
            rl.question('Enter new time scale (Year, Quarter, Month): ', function (scale) {
                var newScale = scale.trim().charAt(0).toUpperCase() + scale.trim().slice(1).toLowerCase();
                if (newScale === 'Year' || newScale === 'Quarter' || newScale === 'Month') {
                    startInteractiveSession(analysisData, newScale, currentTopN, currentBottomN);
                }
                else {
                    console.log("Invalid time scale. Please try again.");
                    startInteractiveSession(analysisData, currentPeriod, currentTopN, currentBottomN);
                }
            });
        }
        else if (answer === '2') {
            rl.question('Enter Top N: ', function (topNStr) {
                var topN = parseInt(topNStr, 10);
                rl.question('Enter Bottom N: ', function (bottomNStr) {
                    var bottomN = parseInt(bottomNStr, 10);
                    if (!isNaN(topN) && !isNaN(bottomN) && topN > 0 && bottomN > 0) {
                        startInteractiveSession(analysisData, currentPeriod, topN, bottomN);
                    }
                    else {
                        console.log("Invalid number. Please enter positive integers.");
                        startInteractiveSession(analysisData, currentPeriod, currentTopN, currentBottomN);
                    }
                });
            });
        }
        else if (answer === '3') {
            rl.close();
        }
        else {
            console.log("Invalid option. Please try again.");
            startInteractiveSession(analysisData, currentPeriod, currentTopN, currentBottomN);
        }
    });
}
function launchAnalysisTool(filePath) {
    var csvFile = fs.readFileSync(filePath, 'utf8');
    var yearlyTotals = {};
    var quarterlyTotals = {};
    var monthlyTotals = {};
    Papa.parse(csvFile, {
        header: true,
        skipEmptyLines: true,
        complete: function (results) {
            for (var _i = 0, _a = results.data; _i < _a.length; _i++) {
                var row = _a[_i];
                if (!row.Date || !row.Product || !row.Actuals)
                    continue;
                try {
                    var date = (0, date_fns_1.parse)(row.Date, 'M/d/yyyy', new Date());
                    var actuals = parseFloat(row.Actuals);
                    if (isNaN(actuals))
                        continue;
                    var product = row.Product;
                    var year = (0, date_fns_1.getYear)(date).toString();
                    var quarter = "Q".concat((0, date_fns_1.getQuarter)(date), " ").concat(year);
                    var month = "".concat((0, date_fns_1.getMonth)(date) + 1, "/").concat(year);
                    if (!yearlyTotals[year])
                        yearlyTotals[year] = {};
                    yearlyTotals[year][product] = (yearlyTotals[year][product] || 0) + actuals;
                    if (!quarterlyTotals[quarter])
                        quarterlyTotals[quarter] = {};
                    quarterlyTotals[quarter][product] = (quarterlyTotals[quarter][product] || 0) + actuals;
                    if (!monthlyTotals[month])
                        monthlyTotals[month] = {};
                    monthlyTotals[month][product] = (monthlyTotals[month][product] || 0) + actuals;
                }
                catch (error) {
                    console.error("Skipping invalid date format: ".concat(row.Date));
                    continue;
                }
            }
            var analysisData = { Year: yearlyTotals, Quarter: quarterlyTotals, Month: monthlyTotals };
            startInteractiveSession(analysisData, 'Month', 2, 2);
        },
    });
}
var filePath = path.resolve('F:/GEMINI/Projects/beautiful/Sample Data/REG.csv');
launchAnalysisTool(filePath);
