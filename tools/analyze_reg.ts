
import * as fs from 'fs';
import * as path from 'path';
import * as Papa from 'papaparse';
import { getYear, getQuarter, getMonth, parse } from 'date-fns';
import * as readline from 'readline';

interface CsvRow {
  Date: string;
  Product: string;
  Actuals: string;
}

interface ProductTotals {
  Product: string;
  Actuals: number;
  Percentage?: number;
}

interface AnalysisData {
    Year: Record<string, Record<string, number>>;
    Quarter: Record<string, Record<string, number>>;
    Month: Record<string, Record<string, number>>;
}

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

function printAnalysis(
  periodType: 'Year' | 'Quarter' | 'Month',
  data: Record<string, Record<string, number>>,
  topN: number,
  bottomN: number
) {
  console.log(`\n--- Analysis by ${periodType} (Top ${topN}, Bottom ${bottomN}) ---`);

  for (const period in data) {
    const products = data[period];
    const totalActuals = Object.values(products).reduce((sum, val) => sum + val, 0);

    const sortedProducts: ProductTotals[] = Object.entries(products)
      .map(([productName, actuals]) => ({
        Product: productName,
        Actuals: actuals,
        Percentage: (actuals / totalActuals) * 100,
      }))
      .sort((a, b) => b.Actuals - a.Actuals);

    console.log(`\n${periodType}: ${period}`);
    
    const top = sortedProducts.slice(0, topN);
    const bottom = sortedProducts.slice(-bottomN).reverse();

    console.log(`  Top ${topN} Products:`);
    top.forEach(p => {
      console.log(`    - ${p.Product}: ${p.Actuals.toFixed(2)} (${p.Percentage?.toFixed(2)}%)`);
    });

    console.log(`  Bottom ${bottomN} Products:`);
    bottom.forEach(p => {
      console.log(`    - ${p.Product}: ${p.Actuals.toFixed(2)} (${p.Percentage?.toFixed(2)}%)`);
    });
  }
}

function startInteractiveSession(
    analysisData: AnalysisData,
    currentPeriod: 'Year' | 'Quarter' | 'Month',
    currentTopN: number,
    currentBottomN: number
) {
    printAnalysis(currentPeriod, analysisData[currentPeriod], currentTopN, currentBottomN);

    rl.question('\nWhat would you like to do next?\n(1) Change time scale\n(2) Change Top/Bottom N\n(3) Exit\n> ', (answer) => {
        if (answer === '1') {
            rl.question('Enter new time scale (Year, Quarter, Month): ', (scale) => {
                const newScale = scale.trim().charAt(0).toUpperCase() + scale.trim().slice(1).toLowerCase();
                if (newScale === 'Year' || newScale === 'Quarter' || newScale === 'Month') {
                    startInteractiveSession(analysisData, newScale, currentTopN, currentBottomN);
                } else {
                    console.log("Invalid time scale. Please try again.");
                    startInteractiveSession(analysisData, currentPeriod, currentTopN, currentBottomN);
                }
            });
        } else if (answer === '2') {
            rl.question('Enter Top N: ', (topNStr) => {
                const topN = parseInt(topNStr, 10);
                rl.question('Enter Bottom N: ', (bottomNStr) => {
                    const bottomN = parseInt(bottomNStr, 10);
                    if (!isNaN(topN) && !isNaN(bottomN) && topN > 0 && bottomN > 0) {
                        startInteractiveSession(analysisData, currentPeriod, topN, bottomN);
                    } else {
                        console.log("Invalid number. Please enter positive integers.");
                        startInteractiveSession(analysisData, currentPeriod, currentTopN, currentBottomN);
                    }
                });
            });
        } else if (answer === '3') {
            rl.close();
        } else {
            console.log("Invalid option. Please try again.");
            startInteractiveSession(analysisData, currentPeriod, currentTopN, currentBottomN);
        }
    });
}

function launchAnalysisTool(filePath: string) {
  const csvFile = fs.readFileSync(filePath, 'utf8');

  const yearlyTotals: Record<string, Record<string, number>> = {};
  const quarterlyTotals: Record<string, Record<string, number>> = {};
  const monthlyTotals: Record<string, Record<string, number>> = {};

  Papa.parse<CsvRow>(csvFile, {
    header: true,
    skipEmptyLines: true,
    complete: (results) => {
      for (const row of results.data) {
        if (!row.Date || !row.Product || !row.Actuals) continue;

        try {
            const date = parse(row.Date, 'M/d/yyyy', new Date());
            const actuals = parseFloat(row.Actuals);
            if (isNaN(actuals)) continue;

            const product = row.Product;
            const year = getYear(date).toString();
            const quarter = `Q${getQuarter(date)} ${year}`;
            const month = `${getMonth(date) + 1}/${year}`;

            if (!yearlyTotals[year]) yearlyTotals[year] = {};
            yearlyTotals[year][product] = (yearlyTotals[year][product] || 0) + actuals;

            if (!quarterlyTotals[quarter]) quarterlyTotals[quarter] = {};
            quarterlyTotals[quarter][product] = (quarterlyTotals[quarter][product] || 0) + actuals;
            
            if (!monthlyTotals[month]) monthlyTotals[month] = {};
            monthlyTotals[month][product] = (monthlyTotals[month][product] || 0) + actuals;
        } catch (error) {
            console.error(`Skipping invalid date format: ${row.Date}`);
            continue;
        }
      }

      const analysisData: AnalysisData = { Year: yearlyTotals, Quarter: quarterlyTotals, Month: monthlyTotals };
      startInteractiveSession(analysisData, 'Month', 2, 2);
    },
  });
}

const filePath = path.resolve('F:/GEMINI/Projects/beautiful/Sample Data/REG.csv');
launchAnalysisTool(filePath);
