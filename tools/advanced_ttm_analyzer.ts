

import * as fs from 'fs';
import * as path from 'path';
import * as Papa from 'papaparse';
import * as readline from 'readline';

// --- Interfaces ---

interface CsvRow {
    Date: string;
    Product: string;
    Category: string;
    Region: string;
    Country: string;
    City: string;
    Budget: string;
    Actuals: string;
    Channel: string;
    Quarter: string;
    Month: string;
}

interface Schema {
    time_col: string;
    planned_val_col: string;
    actual_val_col: string;
    dimensions: string[];
}

interface GroupMetrics {
    group_key: string;
    dimensions: Record<string, string>;
    Budget: number;
    Actuals: number;
    Delta: number;
    PerformanceRatio: number;
}

// --- Constants ---

// Simulated LLM Schema Inference (Option A: Hardcoded for POC)
const inferredSchema: Schema = {
    time_col: 'Date',
    planned_val_col: 'Budget',
    actual_val_col: 'Actuals',
    dimensions: ['Product', 'Category', 'Region', 'Country', 'City', 'Channel']
};

const DATA_FILE_PATH = path.resolve('F:/GEMINI/Projects/beautiful/Sample Data/12k.csv');

const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
});

// --- Helper Functions ---

function parseArguments(args: string[]): { file: string; min_budget: number; top_n: number } {
    let file = '';
    let min_budget = 0;
    let top_n = 5;

    for (let i = 0; i < args.length; i++) {
        if (args[i] === '--file') {
            file = args[++i];
        } else if (args[i] === '--min_budget') {
            min_budget = parseFloat(args[++i]);
        } else if (args[i] === '--top_n') {
            top_n = parseInt(args[++i], 10);
        }
    }
    return { file, min_budget, top_n };
}

function askQuestion(query: string): Promise<string> {
    return new Promise(resolve => rl.question(query, resolve));
}

// --- Core Algorithm Functions ---

async function loadData(filePath: string): Promise<CsvRow[]> {
    console.log(`Loading data from: ${filePath}`);
    const csvFile = fs.readFileSync(filePath, 'utf8');
    return new Promise((resolve, reject) => {
        Papa.parse<CsvRow>(csvFile, {
            header: true,
            skipEmptyLines: true,
            dynamicTyping: false, // We'll handle typing manually for better control
            complete: (results) => {
                console.log(`Loaded ${results.data.length} rows.`);
                if (results.data.length === 0) {
                    console.warn("Warning: Loaded CSV contains no data rows.");
                }
                resolve(results.data);
            },
            error: (err: any) => {
                console.error("Error during CSV parsing:", err);
                reject(err);
            }
        });
    });
}

function validateSchema(data: CsvRow[], schema: Schema): boolean {
    console.log("Validating schema...");
    const headers = Object.keys(data[0] || {});
    const requiredCols = [schema.time_col, schema.planned_val_col, schema.actual_val_col, ...schema.dimensions];

    for (const col of requiredCols) {
        if (!headers.includes(col)) {
            console.error(`Error: Schema column '${col}' not found in data file headers.`);
            return false;
        }
    }
    console.log("Schema validated successfully against data headers.");
    return true;
}

function enumerateAndAggregate(data: CsvRow[], schema: Schema): Map<string, GroupMetrics> {
    console.log("Enumerating and aggregating metrics...");
    const aggregatedMetrics = new Map<string, GroupMetrics>();

    for (const row of data) {
        const dimensions: Record<string, string> = {};
        const dimensionValues: string[] = [];

        for (const dim of schema.dimensions) {
            const value = row[dim as keyof CsvRow] as string;
            dimensions[dim] = value;
            dimensionValues.push(`${dim}=${value}`);
        }

        const groupKey = dimensionValues.join(';');

        let group = aggregatedMetrics.get(groupKey);
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

        const budget = parseFloat(row[schema.planned_val_col as keyof CsvRow] as string);
        const actuals = parseFloat(row[schema.actual_val_col as keyof CsvRow] as string);

        if (!isNaN(budget)) {
            group.Budget += budget;
        } else {
            console.warn(`Skipping invalid Budget value for group ${groupKey}: ${row[schema.planned_val_col as keyof CsvRow]}`);
        }
        if (!isNaN(actuals)) {
            group.Actuals += actuals;
        } else {
            console.warn(`Skipping invalid Actuals value for group ${groupKey}: ${row[schema.actual_val_col as keyof CsvRow]}`);
        }
    }
    console.log(`Aggregated metrics for ${aggregatedMetrics.size} unique groups.`);
    return aggregatedMetrics;
}

function computeVarianceMetrics(metrics: Map<string, GroupMetrics>): Map<string, GroupMetrics> {
    console.log("Computing variance metrics...");
    metrics.forEach(group => {
        group.Delta = group.Actuals - group.Budget;
        if (group.Budget !== 0) {
            group.PerformanceRatio = group.Actuals / group.Budget;
        } else {
            group.PerformanceRatio = group.Actuals > 0 ? Infinity : (group.Actuals < 0 ? -Infinity : 0); // Handle Budget = 0
        }
    });
    console.log("Computed variance metrics for all groups.");
    return metrics;
}

function applySignificanceFiltering(metrics: Map<string, GroupMetrics>, minBudget: number): GroupMetrics[] {
    console.log(`Applying significance filtering with min_budget: ${minBudget}...`);
    const filtered = Array.from(metrics.values()).filter(group => group.Budget >= minBudget);
    console.log(`Filtered to ${filtered.length} groups with Budget >= ${minBudget}.`);
    return filtered;
}

function rankPerformers(filteredMetrics: GroupMetrics[], topN: number): { overPerformers: GroupMetrics[]; underPerformers: GroupMetrics[] } {
    console.log(`Ranking performers for top_n: ${topN}...`);
    const sortedByDelta = [...filteredMetrics].sort((a, b) => b.Delta - a.Delta);

    const overPerformers = sortedByDelta.slice(0, topN);
    const underPerformers = sortedByDelta.slice(-topN).sort((a, b) => a.Delta - b.Delta); // Sort ascending for under-performers

    console.log(`Ranked top ${topN} over-performers and top ${topN} under-performers.`);
    return { overPerformers, underPerformers };
}

function generateNarrative(group: GroupMetrics, schema: Schema): string {
    const dimParts = schema.dimensions.map(dim => `${dim}=${group.dimensions[dim]}`).join(', ');
    const performanceWord = group.Delta > 0 ? 'exceeding' : 'below';
    const deltaAbs = Math.abs(group.Delta);
    let ratioPercent = 'N/A';
    if (isFinite(group.PerformanceRatio)) {
        ratioPercent = (group.PerformanceRatio * 100).toFixed(0);
    } else if (group.PerformanceRatio === Infinity) {
        ratioPercent = '>1000'; // Arbitrary large number for very high performance
    } else if (group.PerformanceRatio === -Infinity) {
        ratioPercent = '<0'; // Arbitrary small number for very low performance
    }

    return `${dimParts} had Actuals ${performanceWord} Budget by $${deltaAbs.toLocaleString()} (${ratioPercent}%).`;
}

function printResults(overPerformers: GroupMetrics[], underPerformers: GroupMetrics[], schema: Schema) {
    console.log('\n--- Top Over-Performers ---');
    if (overPerformers.length === 0) {
        console.log('No over-performing groups found.');
    } else {
        overPerformers.forEach(group => console.log(generateNarrative(group, schema)));
    }

    console.log('\n--- Top Under-Performers ---');
    if (underPerformers.length === 0) {
        console.log('No under-performing groups found.');
    } else {
        underPerformers.forEach(group => console.log(generateNarrative(group, schema)));
    }

    console.log('\n--- Detailed Tabular Results (Top/Bottom) ---');
    if (overPerformers.length === 0 && underPerformers.length === 0) {
        console.log('No results to display in tabular format.');
    } else {
        // Prepare headers for tabular display
        const tableHeaders = [...inferredSchema.dimensions, 'Budget', 'Actuals', 'Delta', 'PerformanceRatio'];
        console.log(tableHeaders.join(','));

        [...overPerformers, ...underPerformers].forEach(group => {
            const rowValues = inferredSchema.dimensions.map(dim => group.dimensions[dim]);
            rowValues.push(group.Budget.toFixed(2));
            rowValues.push(group.Actuals.toFixed(2));
            rowValues.push(group.Delta.toFixed(2));
            rowValues.push(group.PerformanceRatio.toFixed(2));
            console.log(rowValues.join(','));
        });
    }
}

// --- Main Execution Flow ---

async function runAnalysis(params: { file: string; min_budget: number; top_n: number }) {
    console.log("\nStarting analysis with parameters:", params);
    try {
        const data = await loadData(params.file);
        if (data.length === 0) {
            console.log("No data to analyze. Exiting.");
            return;
        }

        if (!validateSchema(data, inferredSchema)) {
            console.error("Schema validation failed. Exiting.");
            return;
        }

        let metrics = enumerateAndAggregate(data, inferredSchema);
        metrics = computeVarianceMetrics(metrics);
        const filteredMetrics = applySignificanceFiltering(metrics, params.min_budget);
        const { overPerformers, underPerformers } = rankPerformers(filteredMetrics, params.top_n);

        console.log("Printing results...");
        printResults(overPerformers, underPerformers, inferredSchema);

    } catch (error: any) {
        console.error(`Analysis failed: ${error.message}`);
    }
}

async function main() {
    console.log("Cohort Diagnostic CLI Tool Initializing...");
    const args = process.argv.slice(2);
    let { file, min_budget, top_n } = parseArguments(args);

    if (!file) {
        console.log("Usage: node advanced_ttm_analyzer.js --file <path_to_csv> [--min_budget <number>] [--top_n <number>]");
        file = await askQuestion("Please enter the path to your data file (e.g., F:/GEMINI/Projects/beautiful/Sample Data/12k.csv): ");
        if (!file) {
            console.log("No file path provided. Exiting.");
            rl.close();
            return;
        }
    }

    // Start the interactive loop
    let continueAnalysis = true;
    while (continueAnalysis) {
        await runAnalysis({ file, min_budget, top_n });

        const nextAction = await askQuestion(
            "\nOptions:\n(1) Run again with new parameters\n(2) Exit\n> "
        );

        if (nextAction === '1') {
            const newMinBudget = await askQuestion(`Enter new min_budget (current: ${min_budget}, press Enter to keep): `);
            if (newMinBudget) min_budget = parseFloat(newMinBudget);

            const newTopN = await askQuestion(`Enter new top_n (current: ${top_n}, press Enter to keep): `);
            if (newTopN) top_n = parseInt(newTopN, 10);

        } else if (nextAction === '2') {
            continueAnalysis = false;
        } else {
            console.log("Invalid option. Please choose 1 or 2.");
        }
    }

    rl.close();
    console.log("Exiting Cohort Diagnostic CLI.");
}

main();
