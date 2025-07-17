

import * as fs from 'fs';
import * as path from 'path';
import * as Papa from 'papaparse';
import { parse, subMonths, format, lastDayOfMonth } from 'date-fns';
import * as readline from 'readline';

interface CsvRow {
  Date: string;
  Product: string;
  Actuals: string;
}

interface ProductTotal {
  Product: string;
  TotalActuals: number;
}

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

function calculateTTM(data: CsvRow[], endDate: Date): ProductTotal[] {
  const startDate = subMonths(endDate, 11);
  // Set to the first day of the start month
  startDate.setDate(1);

  console.log(`
Calculating TTM for the period: ${format(startDate, 'yyyy-MM-dd')} to ${format(endDate, 'yyyy-MM-dd')}`);

  const ttmData = data.filter(row => {
    try {
      const rowDate = parse(row.Date, 'yyyy-MM-dd', new Date());
      return rowDate >= startDate && rowDate <= endDate;
    } catch (e) {
      return false;
    }
  });

  const productTotals: Record<string, number> = {};

  for (const row of ttmData) {
    const actuals = parseFloat(row.Actuals);
    if (!isNaN(actuals)) {
      productTotals[row.Product] = (productTotals[row.Product] || 0) + actuals;
    }
  }

  const rankedProducts: ProductTotal[] = Object.entries(productTotals)
    .map(([Product, TotalActuals]) => ({ Product, TotalActuals }))
    .sort((a, b) => b.TotalActuals - a.TotalActuals);

  return rankedProducts;
}

function displayResults(rankedProducts: ProductTotal[]) {
  console.log("\n--- TTM Analysis Results ---");
  if (rankedProducts.length === 0) {
    console.log("No data found for the specified period.");
    return;
  }
  rankedProducts.forEach((p, index) => {
    console.log(`${index + 1}. ${p.Product}: $${p.TotalActuals.toFixed(2)}`);
  });
}

function promptForEndDate(data: CsvRow[]) {
  rl.question('\nEnter the end month for TTM analysis (YYYY-MM) or type "exit" to quit: ', (answer) => {
    if (answer.toLowerCase() === 'exit') {
      rl.close();
      return;
    }

    try {
      // Parse the input as the first day of the given month
      const firstDayOfMonth = parse(answer, 'yyyy-MM', new Date());
      if (isNaN(firstDayOfMonth.getTime())) {
          throw new Error("Invalid date format");
      }
      // Get the last day of that month to ensure the full month is included
      const endOfMonth = lastDayOfMonth(firstDayOfMonth);
      
      const results = calculateTTM(data, endOfMonth);
      displayResults(results);
    } catch (e) {
      console.log("Invalid date format. Please use YYYY-MM.");
    }
    promptForEndDate(data);
  });
}

function launchTTMAnalysisTool(filePath: string) {
  console.log("Loading and parsing data...");
  const csvFile = fs.readFileSync(filePath, 'utf8');

  Papa.parse<CsvRow>(csvFile, {
    header: true,
    skipEmptyLines: true,
    complete: (results) => {
      console.log(`Data loaded. Found ${results.data.length} records.`);
      promptForEndDate(results.data);
    },
    error: (err) => {
        console.error("Error parsing CSV:", err);
        rl.close();
    }
  });
}

const filePath = path.resolve('F:/GEMINI/Projects/beautiful/Sample Data/12k.csv');
launchTTMAnalysisTool(filePath);
