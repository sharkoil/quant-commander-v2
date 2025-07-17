"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __generator = (this && this.__generator) || function (thisArg, body) {
    var _ = { label: 0, sent: function() { if (t[0] & 1) throw t[1]; return t[1]; }, trys: [], ops: [] }, f, y, t, g = Object.create((typeof Iterator === "function" ? Iterator : Object).prototype);
    return g.next = verb(0), g["throw"] = verb(1), g["return"] = verb(2), typeof Symbol === "function" && (g[Symbol.iterator] = function() { return this; }), g;
    function verb(n) { return function (v) { return step([n, v]); }; }
    function step(op) {
        if (f) throw new TypeError("Generator is already executing.");
        while (g && (g = 0, op[0] && (_ = 0)), _) try {
            if (f = 1, y && (t = op[0] & 2 ? y["return"] : op[0] ? y["throw"] || ((t = y["return"]) && t.call(y), 0) : y.next) && !(t = t.call(y, op[1])).done) return t;
            if (y = 0, t) op = [op[0] & 2, t.value];
            switch (op[0]) {
                case 0: case 1: t = op; break;
                case 4: _.label++; return { value: op[1], done: false };
                case 5: _.label++; y = op[1]; op = [0]; continue;
                case 7: op = _.ops.pop(); _.trys.pop(); continue;
                default:
                    if (!(t = _.trys, t = t.length > 0 && t[t.length - 1]) && (op[0] === 6 || op[0] === 2)) { _ = 0; continue; }
                    if (op[0] === 3 && (!t || (op[1] > t[0] && op[1] < t[3]))) { _.label = op[1]; break; }
                    if (op[0] === 6 && _.label < t[1]) { _.label = t[1]; t = op; break; }
                    if (t && _.label < t[2]) { _.label = t[2]; _.ops.push(op); break; }
                    if (t[2]) _.ops.pop();
                    _.trys.pop(); continue;
            }
            op = body.call(thisArg, _);
        } catch (e) { op = [6, e]; y = 0; } finally { f = t = 0; }
        if (op[0] & 5) throw op[1]; return { value: op[0] ? op[1] : void 0, done: true };
    }
};
var __spreadArray = (this && this.__spreadArray) || function (to, from, pack) {
    if (pack || arguments.length === 2) for (var i = 0, l = from.length, ar; i < l; i++) {
        if (ar || !(i in from)) {
            if (!ar) ar = Array.prototype.slice.call(from, 0, i);
            ar[i] = from[i];
        }
    }
    return to.concat(ar || Array.prototype.slice.call(from));
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.parseArguments = parseArguments;
exports.loadData = loadData;
exports.inferSchemaFromLLM = inferSchemaFromLLM;
exports.validateSchema = validateSchema;
exports.enumerateAndAggregate = enumerateAndAggregate;
exports.computeVarianceMetrics = computeVarianceMetrics;
exports.applySignificanceFiltering = applySignificanceFiltering;
exports.rankPerformers = rankPerformers;
exports.generateNarrative = generateNarrative;
exports.printResults = printResults;
exports.runAnalysis = runAnalysis;
var fs = require("fs");
var Papa = require("papaparse");
var readline = require("readline");
var child_process_1 = require("child_process");
// --- Constants ---
var rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
});
// --- Helper Functions ---
function parseArguments(args) {
    var file = '';
    var min_budget = 0;
    var top_n = 5;
    for (var i = 0; i < args.length; i++) {
        if (args[i] === '--file') {
            file = args[++i];
        }
        else if (args[i] === '--min_budget') {
            min_budget = parseFloat(args[++i]);
        }
        else if (args[i] === '--top_n') {
            top_n = parseInt(args[++i], 10);
        }
    }
    return { file: file, min_budget: min_budget, top_n: top_n };
}
function askQuestion(query) {
    return new Promise(function (resolve) { return rl.question(query, resolve); });
}
function runCommand(command) {
    return __awaiter(this, void 0, void 0, function () {
        return __generator(this, function (_a) {
            console.log("Executing command: ".concat(command));
            return [2 /*return*/, new Promise(function (resolve, reject) {
                    // Increased maxBuffer to handle potentially large LLM responses
                    (0, child_process_1.exec)(command, { maxBuffer: 1024 * 1024 * 5 }, function (error, stdout, stderr) {
                        if (stdout) {
                            console.log("Command stdout (first 500 chars): ".concat(stdout.substring(0, 500), "..."));
                        }
                        if (stderr) {
                            console.warn("Command stderr (first 500 chars): ".concat(stderr.substring(0, 500), "..."));
                        }
                        if (error) {
                            console.error("Command exec error: ".concat(error.message));
                            reject(error);
                            return;
                        }
                        resolve(stdout);
                    });
                })];
        });
    });
}
// --- Core Algorithm Functions ---
function loadData(filePath) {
    return __awaiter(this, void 0, void 0, function () {
        var csvFile_1;
        return __generator(this, function (_a) {
            console.log("Loading data from: ".concat(filePath));
            try {
                csvFile_1 = fs.readFileSync(filePath, 'utf8');
                return [2 /*return*/, new Promise(function (resolve, reject) {
                        Papa.parse(csvFile_1, {
                            header: true,
                            skipEmptyLines: true,
                            dynamicTyping: false,
                            complete: function (results) {
                                console.log("Loaded ".concat(results.data.length, " rows."));
                                if (results.data.length === 0) {
                                    console.warn("Warning: Loaded CSV contains no data rows.");
                                }
                                resolve(results.data);
                            },
                            error: function (err) {
                                console.error("Error during CSV parsing:", err);
                                reject(err);
                            }
                        });
                    })];
            }
            catch (error) {
                console.error("Failed to read file ".concat(filePath, ": ").concat(error.message));
                throw error;
            }
            return [2 /*return*/];
        });
    });
}
function inferSchemaFromLLM(headers) {
    return __awaiter(this, void 0, void 0, function () {
        var prompt, ollamaCommand, llmOutput, jsonMatch, jsonString, inferred, error_1;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    console.log("Inferring schema using Ollama/Gemma3...");
                    prompt = "Given the following CSV column headers, identify the 'time_col', 'planned_val_col', 'actual_val_col', and 'dimensions'. The 'planned_val_col' and 'actual_val_col' should be numeric. The 'dimensions' should be categorical fields for slicing. Output only a JSON object with these keys. Example: {\"time_col\": \"Date\", \"planned_val_col\": \"Budget\", \"actual_val_col\": \"Actuals\", \"dimensions\": [\"Product\", \"Category\"]}\nHeaders: ".concat(headers.join(', '));
                    _a.label = 1;
                case 1:
                    _a.trys.push([1, 3, , 4]);
                    ollamaCommand = "ollama run gemma3 \"".concat(prompt, "\"");
                    return [4 /*yield*/, runCommand(ollamaCommand)];
                case 2:
                    llmOutput = _a.sent();
                    console.log("Attempting to parse LLM output:", llmOutput.trim());
                    jsonMatch = llmOutput.match(/```json\n([\s\S]*?)\n```/);
                    jsonString = llmOutput;
                    if (jsonMatch && jsonMatch[1]) {
                        jsonString = jsonMatch[1];
                        console.log("Extracted JSON string from markdown block.");
                    }
                    else {
                        console.log("No JSON markdown block found. Attempting to parse raw output as JSON.");
                    }
                    inferred = JSON.parse(jsonString);
                    console.log("LLM Inferred Schema:", inferred);
                    return [2 /*return*/, inferred];
                case 3:
                    error_1 = _a.sent();
                    console.error("Failed to infer schema from LLM: ".concat(error_1.message));
                    throw new Error("LLM schema inference failed. Check Ollama server and model, and LLM output format.");
                case 4: return [2 /*return*/];
            }
        });
    });
}
function validateSchema(data, schema) {
    console.log("Validating inferred schema against data headers...");
    var headers = Object.keys(data[0] || {});
    var requiredCols = __spreadArray([schema.time_col, schema.planned_val_col, schema.actual_val_col], schema.dimensions, true);
    for (var _i = 0, requiredCols_1 = requiredCols; _i < requiredCols_1.length; _i++) {
        var col = requiredCols_1[_i];
        if (!headers.includes(col)) {
            console.error("Error: Inferred schema column '".concat(col, "' not found in data file headers."));
            return false;
        }
    }
    console.log("Schema validated successfully.");
    return true;
}
function enumerateAndAggregate(data, schema) {
    console.log("Enumerating permutations and aggregating metrics...");
    var aggregatedMetrics = new Map();
    for (var _i = 0, data_1 = data; _i < data_1.length; _i++) {
        var row = data_1[_i];
        var dimensions = {};
        var dimensionValues = [];
        for (var _a = 0, _b = schema.dimensions; _a < _b.length; _a++) {
            var dim = _b[_a];
            var value = row[dim];
            if (value === undefined) {
                // console.warn(`Warning: Dimension '${dim}' not found in row. Skipping row.`);
                continue; // Skip row if a dimension is missing
            }
            dimensions[dim] = value;
            dimensionValues.push("".concat(dim, "=").concat(value));
        }
        var groupKey = dimensionValues.join(';');
        var group = aggregatedMetrics.get(groupKey);
        if (!group) {
            group = {
                group_key: groupKey,
                dimensions: dimensions,
                Budget: 0,
                Actuals: 0,
                Delta: 0,
                PerformanceRatio: 0
            };
            aggregatedMetrics.set(groupKey, group);
        }
        var budget = parseFloat(row[schema.planned_val_col]);
        var actuals = parseFloat(row[schema.actual_val_col]);
        if (!isNaN(budget)) {
            group.Budget += budget;
        }
        else {
            // console.warn(`Skipping invalid Budget value for group ${groupKey}: ${row[schema.planned_val_col]}`);
        }
        if (!isNaN(actuals)) {
            group.Actuals += actuals;
        }
        else {
            // console.warn(`Skipping invalid Actuals value for group ${groupKey}: ${row[schema.actual_val_col]}`);
        }
    }
    console.log("Aggregated metrics for ".concat(aggregatedMetrics.size, " unique groups."));
    return aggregatedMetrics;
}
function computeVarianceMetrics(metrics) {
    console.log("Computing variance metrics...");
    metrics.forEach(function (group) {
        group.Delta = group.Actuals - group.Budget;
        if (group.Budget !== 0) {
            group.PerformanceRatio = group.Actuals / group.Budget;
        }
        else {
            group.PerformanceRatio = group.Actuals > 0 ? Infinity : (group.Actuals < 0 ? -Infinity : 0); // Handle Budget = 0
        }
    });
    console.log("Computed variance metrics for all groups.");
    return metrics;
}
function applySignificanceFiltering(metrics, minBudget) {
    console.log("Applying significance filtering with min_budget: ".concat(minBudget, "..."));
    var filtered = Array.from(metrics.values()).filter(function (group) { return group.Budget >= minBudget; });
    console.log("Filtered to ".concat(filtered.length, " groups with Budget >= ").concat(minBudget, "."));
    return filtered;
}
function rankPerformers(filteredMetrics, topN) {
    console.log("Ranking performers for top_n: ".concat(topN, "..."));
    var sortedByDelta = __spreadArray([], filteredMetrics, true).sort(function (a, b) { return b.Delta - a.Delta; });
    var overPerformers = sortedByDelta.slice(0, topN);
    // Ensure we don't get the same elements if filteredMetrics.length <= topN * 2
    var underPerformers = sortedByDelta.slice(Math.max(0, sortedByDelta.length - topN)).sort(function (a, b) { return a.Delta - b.Delta; });
    console.log("Ranked top ".concat(overPerformers.length, " over-performers and top ").concat(underPerformers.length, " under-performers."));
    return { overPerformers: overPerformers, underPerformers: underPerformers };
}
function generateNarrative(group, schema) {
    var dimParts = schema.dimensions.map(function (dim) { return "".concat(dim, "=").concat(group.dimensions[dim]); }).join(', ');
    var performanceWord = group.Delta > 0 ? 'exceeding' : 'below';
    var deltaAbs = Math.abs(group.Delta);
    var ratioPercent = 'N/A';
    if (isFinite(group.PerformanceRatio)) {
        ratioPercent = (group.PerformanceRatio * 100).toFixed(0);
    }
    else if (group.PerformanceRatio === Infinity) {
        ratioPercent = '>1000'; // Arbitrary large number for very high performance
    }
    else if (group.PerformanceRatio === -Infinity) {
        ratioPercent = '<0'; // Arbitrary small number for very low performance
    }
    // Assuming time_col is not used in narrative for this POC as per spec's template example
    return "".concat(dimParts, " had Actuals ").concat(performanceWord, " Budget by $").concat(deltaAbs.toLocaleString(), " (").concat(ratioPercent, "%).");
}
function printResults(overPerformers, underPerformers, schema) {
    console.log('\n--- Top Over-Performers ---');
    if (overPerformers.length === 0) {
        console.log('No over-performing groups found.');
    }
    else {
        overPerformers.forEach(function (group) { return console.log(generateNarrative(group, schema)); });
    }
    console.log('\n--- Top Under-Performers ---');
    if (underPerformers.length === 0) {
        console.log('No under-performing groups found.');
    }
    else {
        underPerformers.forEach(function (group) { return console.log(generateNarrative(group, schema)); });
    }
    console.log('\n--- Detailed Tabular Results (Top/Bottom) ---');
    var allRanked = __spreadArray(__spreadArray([], overPerformers, true), underPerformers, true);
    if (allRanked.length === 0) {
        console.log('No results to display in tabular format.');
    }
    else {
        var tableHeaders = __spreadArray(__spreadArray([], schema.dimensions, true), ['Budget', 'Actuals', 'Delta', 'PerformanceRatio'], false);
        console.log(tableHeaders.join('\t')); // Use tab for better column separation
        allRanked.forEach(function (group) {
            var rowValues = schema.dimensions.map(function (dim) { return group.dimensions[dim]; });
            rowValues.push(group.Budget.toFixed(2));
            rowValues.push(group.Actuals.toFixed(2));
            rowValues.push(group.Delta.toFixed(2));
            rowValues.push(group.PerformanceRatio.toFixed(2));
            console.log(rowValues.join('\t'));
        });
    }
}
// --- Main Execution Flow ---
function runAnalysis(params) {
    return __awaiter(this, void 0, void 0, function () {
        var data, headers, inferredSchema, metrics, filteredMetrics, _a, overPerformers, underPerformers, error_2;
        return __generator(this, function (_b) {
            switch (_b.label) {
                case 0:
                    console.log("\nStarting analysis with parameters:", params);
                    _b.label = 1;
                case 1:
                    _b.trys.push([1, 4, , 5]);
                    return [4 /*yield*/, loadData(params.file)];
                case 2:
                    data = _b.sent();
                    if (data.length === 0) {
                        console.log("No data to analyze. Exiting.");
                        return [2 /*return*/];
                    }
                    headers = Object.keys(data[0]);
                    return [4 /*yield*/, inferSchemaFromLLM(headers)];
                case 3:
                    inferredSchema = _b.sent();
                    if (!validateSchema(data, inferredSchema)) {
                        console.error("Schema validation failed. Exiting.");
                        return [2 /*return*/];
                    }
                    metrics = enumerateAndAggregate(data, inferredSchema);
                    metrics = computeVarianceMetrics(metrics);
                    filteredMetrics = applySignificanceFiltering(metrics, params.min_budget);
                    _a = rankPerformers(filteredMetrics, params.top_n), overPerformers = _a.overPerformers, underPerformers = _a.underPerformers;
                    console.log("Printing results...");
                    printResults(overPerformers, underPerformers, inferredSchema);
                    return [3 /*break*/, 5];
                case 4:
                    error_2 = _b.sent();
                    console.error("Analysis failed: ".concat(error_2.message));
                    return [3 /*break*/, 5];
                case 5: return [2 /*return*/];
            }
        });
    });
}
function main() {
    return __awaiter(this, void 0, void 0, function () {
        var args, _a, file, min_budget, top_n, continueAnalysis, nextAction, newMinBudget, newTopN;
        return __generator(this, function (_b) {
            switch (_b.label) {
                case 0:
                    console.log("Cohort Diagnostic CLI Tool Initializing...");
                    args = process.argv.slice(2);
                    _a = parseArguments(args), file = _a.file, min_budget = _a.min_budget, top_n = _a.top_n;
                    if (!!file) return [3 /*break*/, 2];
                    console.log("Usage: node cohort_diagnostic_cli.js --file <path_to_csv> [--min_budget <number>] [--top_n <number>]");
                    return [4 /*yield*/, askQuestion("Please enter the path to your data file (e.g., F:/GEMINI/Projects/beautiful/Sample Data/12k.csv): ")];
                case 1:
                    file = _b.sent();
                    if (!file) {
                        console.log("No file path provided. Exiting.");
                        rl.close();
                        return [2 /*return*/];
                    }
                    _b.label = 2;
                case 2:
                    continueAnalysis = true;
                    _b.label = 3;
                case 3:
                    if (!continueAnalysis) return [3 /*break*/, 10];
                    return [4 /*yield*/, runAnalysis({ file: file, min_budget: min_budget, top_n: top_n })];
                case 4:
                    _b.sent();
                    return [4 /*yield*/, askQuestion("\nOptions:\n(1) Run again with new parameters\n(2) Exit\n> ")];
                case 5:
                    nextAction = _b.sent();
                    if (!(nextAction === '1')) return [3 /*break*/, 8];
                    return [4 /*yield*/, askQuestion("Enter new min_budget (current: ".concat(min_budget, ", press Enter to keep): "))];
                case 6:
                    newMinBudget = _b.sent();
                    if (newMinBudget)
                        min_budget = parseFloat(newMinBudget);
                    return [4 /*yield*/, askQuestion("Enter new top_n (current: ".concat(top_n, ", press Enter to keep): "))];
                case 7:
                    newTopN = _b.sent();
                    if (newTopN)
                        top_n = parseInt(newTopN, 10);
                    return [3 /*break*/, 9];
                case 8:
                    if (nextAction === '2') {
                        continueAnalysis = false;
                    }
                    else {
                        console.log("Invalid option. Please choose 1 or 2.");
                    }
                    _b.label = 9;
                case 9: return [3 /*break*/, 3];
                case 10:
                    rl.close();
                    console.log("Exiting Cohort Diagnostic CLI.");
                    return [2 /*return*/];
            }
        });
    });
}
main();
