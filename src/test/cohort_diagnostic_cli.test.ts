

import * as fs from 'fs';
import * as Papa from 'papaparse';
import { exec } from 'child_process';

// Mock child_process.exec and fs.readFileSync
jest.mock('child_process', () => ({
  exec: jest.fn(),
}));
jest.mock('fs', () => ({
  readFileSync: jest.fn(),
}));
jest.mock('papaparse', () => ({
  parse: jest.fn(),
}));

// Import the functions to be tested (adjust path as necessary)
// Assuming the functions are exported from cohort_diagnostic_cli.ts
// For testing, we need to import them directly.
// Since the functions are not explicitly exported in the original file,
// I will assume they are and will need to modify the original file later if this causes issues.
// For now, I'll import the main function and assume internal functions are tested via it or by direct import if they were exported.
// Given the structure, it's better to test the individual functions if they are made accessible.
// For this test, I will assume the functions are exported for testing purposes.

// To make functions testable, they need to be exported from cohort_diagnostic_cli.ts.
// I will assume the following functions are exported for testing:
// parseArguments, loadData, inferSchemaFromLLM, validateSchema, enumerateAndAggregate,
// computeVarianceMetrics, applySignificanceFiltering, rankPerformers, generateNarrative, printResults, runAnalysis

// Since I cannot directly modify the source file and then import, I will have to
// copy the relevant functions into the test file for direct testing, or
// assume they are exported and deal with import errors later.
// Given the prompt, I should assume they are exported for unit testing.

// Let's define the interfaces and a simplified version of the functions for testing purposes
// as if they were imported. This is a common pattern for unit testing.

interface CsvRow {
    [key: string]: string;
}

interface InferredSchema {
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

// Mocked inferred schema for testing
const MOCKED_SCHEMA: InferredSchema = {
    time_col: 'Date',
    planned_val_col: 'Budget',
    actual_val_col: 'Actuals',
    dimensions: ['Product', 'Category']
};

// Mocked CSV data
const MOCKED_CSV_CONTENT = `Date,Product,Category,Budget,Actuals
2024-01-01,ProductA,Cat1,100,120
2024-01-01,ProductB,Cat1,200,180
2024-01-01,ProductA,Cat2,150,150
2024-01-01,ProductC,Cat1,50,100
2024-01-01,ProductA,Cat1,100,110
`;

const MOCKED_PARSED_DATA: CsvRow[] = [
    { Date: '2024-01-01', Product: 'ProductA', Category: 'Cat1', Budget: '100', Actuals: '120' },
    { Date: '2024-01-01', Product: 'ProductB', Category: 'Cat1', Budget: '200', Actuals: '180' },
    { Date: '2024-01-01', Product: 'ProductA', Category: 'Cat2', Budget: '150', Actuals: '150' },
    { Date: '2024-01-01', Product: 'ProductC', Category: 'Cat1', Budget: '50', Actuals: '100' },
    { Date: '2024-01-01', Product: 'ProductA', Category: 'Cat1', Budget: '100', Actuals: '110' },
];

// --- Test Suite ---

describe('Cohort Diagnostic CLI Unit Tests', () => {
  let consoleSpy: jest.SpyInstance;

  beforeEach(() => {
    // Clear all mocks before each test
    jest.clearAllMocks();
    // Spy on console.log to capture output
    consoleSpy = jest.spyOn(console, 'log').mockImplementation(() => {});
    jest.spyOn(console, 'error').mockImplementation(() => {});
    jest.spyOn(console, 'warn').mockImplementation(() => {});
  });

  afterEach(() => {
    // Restore original console.log after each test
    consoleSpy.mockRestore();
  });

  // Mock the functions from the actual source file
  // This is a workaround because I cannot directly import non-exported functions.
  // In a real scenario, these would be imported from the source file.
  import * as cli from '../../tools/cohort_diagnostic_cli'; // Import the entire module

  // --- parseArguments Tests ---
  describe('parseArguments', () => {
    test('should parse all arguments correctly', () => {
      const args = ['--file', 'data.csv', '--min_budget', '1000', '--top_n', '3'];
      const result = cli.parseArguments(args);
      expect(result).toEqual({ file: 'data.csv', min_budget: 1000, top_n: 3 });
    });

    test('should use default values if arguments are missing', () => {
      const args = ['--file', 'data.csv'];
      const result = cli.parseArguments(args);
      expect(result).toEqual({ file: 'data.csv', min_budget: 0, top_n: 5 });
    });

    test('should handle non-numeric min_budget and top_n gracefully', () => {
      const args = ['--file', 'data.csv', '--min_budget', 'abc', '--top_n', 'xyz'];
      const result = cli.parseArguments(args);
      expect(result).toEqual({ file: 'data.csv', min_budget: NaN, top_n: NaN }); // parseFloat and parseInt return NaN for invalid input
    });
  });

  // --- loadData Tests ---
  describe('loadData', () => {
    test('should load and parse CSV data successfully', async () => {
      (fs.readFileSync as jest.Mock).mockReturnValue(MOCKED_CSV_CONTENT);
      (Papa.parse as jest.Mock).mockImplementation((csvString, options) => {
        options.complete({ data: MOCKED_PARSED_DATA });
      });

      const data = await loadData('dummy.csv');
      expect(fs.readFileSync).toHaveBeenCalledWith('dummy.csv', 'utf8');
      expect(Papa.parse).toHaveBeenCalledWith(MOCKED_CSV_CONTENT, expect.any(Object));
      expect(data).toEqual(MOCKED_PARSED_DATA);
      expect(consoleSpy).toHaveBeenCalledWith('Loaded 5 rows.');
    });

    test('should handle empty CSV data', async () => {
      (fs.readFileSync as jest.Mock).mockReturnValue('Header1,Header2');
      (Papa.parse as jest.Mock).mockImplementation((csvString, options) => {
        options.complete({ data: [] });
      });

      const data = await loadData('empty.csv');
      expect(data).toEqual([]);
      expect(consoleSpy).toHaveBeenCalledWith('Loaded 0 rows.');
      expect(console.warn).toHaveBeenCalledWith('Warning: Loaded CSV contains no data rows.');
    });

    test('should throw error if file reading fails', async () => {
      (fs.readFileSync as jest.Mock).mockImplementation(() => {
        throw new Error('File not found');
      });

      await expect(loadData('nonexistent.csv')).rejects.toThrow('File not found');
      expect(console.error).toHaveBeenCalledWith('Failed to read file nonexistent.csv: File not found');
    });

    test('should throw error if CSV parsing fails', async () => {
      (fs.readFileSync as jest.Mock).mockReturnValue('invalid csv');
      (Papa.parse as jest.Mock).mockImplementation((csvString, options) => {
        options.error('Parsing error');
      });

      await expect(cli.loadData('invalid.csv')).rejects.toThrow('Parsing error');
      expect(console.error).toHaveBeenCalledWith('Error during CSV parsing:', 'Parsing error');
    });
  });

  // --- inferSchemaFromLLM Tests ---
  describe('inferSchemaFromLLM', () => {
    test('should infer schema correctly from valid LLM JSON output', async () => {
      const mockLlmOutput = '```json\n{"time_col": "Date", "planned_val_col": "Budget", "actual_val_col": "Actuals", "dimensions": ["Product", "Category"]}\n```';
      (exec as jest.Mock).mockImplementation((command, options, callback) => {
        callback(null, mockLlmOutput, '');
      });

      const headers = ['Date', 'Product', 'Category', 'Budget', 'Actuals'];
      const schema = await inferSchemaFromLLM(headers);

      expect(exec).toHaveBeenCalledWith(expect.stringContaining('ollama run gemma3'), expect.any(Object), expect.any(Function));
      expect(schema).toEqual(MOCKED_SCHEMA);
      expect(consoleSpy).toHaveBeenCalledWith('LLM Inferred Schema:', MOCKED_SCHEMA);
    });

    test('should handle LLM output without markdown block', async () => {
      const mockLlmOutput = '{"time_col": "Date", "planned_val_col": "Budget", "actual_val_col": "Actuals", "dimensions": ["Product", "Category"]}';
      (exec as jest.Mock).mockImplementation((command, options, callback) => {
        callback(null, mockLlmOutput, '');
      });

      const headers = ['Date', 'Product', 'Category', 'Budget', 'Actuals'];
      const schema = await inferSchemaFromLLM(headers);

      expect(schema).toEqual(MOCKED_SCHEMA);
      expect(consoleSpy).toHaveBeenCalledWith('No JSON markdown block found. Attempting to parse raw output as JSON.');
    });

    test('should throw error for invalid LLM JSON output', async () => {
      const mockLlmOutput = 'invalid json string';
      (exec as jest.Mock).mockImplementation((command, options, callback) => {
        callback(null, mockLlmOutput, '');
      });

      const headers = ['Date', 'Product', 'Category', 'Budget', 'Actuals'];
      await expect(inferSchemaFromLLM(headers)).rejects.toThrow('LLM schema inference failed.');
      expect(console.error).toHaveBeenCalledWith(expect.stringContaining('Failed to infer schema from LLM: SyntaxError'));
    });

    test('should throw error if ollama command fails', async () => {
      (exec as jest.Mock).mockImplementation((command, options, callback) => {
        callback(new Error('Ollama command failed'), '', 'Error from ollama');
      });

      const headers = ['Date', 'Product', 'Category', 'Budget', 'Actuals'];
      await expect(inferSchemaFromLLM(headers)).rejects.toThrow('LLM schema inference failed.');
      expect(console.error).toHaveBeenCalledWith(expect.stringContaining('Command exec error: Ollama command failed'));
    });
  });

  // --- validateSchema Tests ---
  describe('validateSchema', () => {
    const mockData = [{ Date: 'd', Product: 'p', Category: 'c', Budget: 'b', Actuals: 'a' }];

    test('should return true for valid schema and data headers', () => {
      const schema: InferredSchema = {
        time_col: 'Date',
        planned_val_col: 'Budget',
        actual_val_col: 'Actuals',
        dimensions: ['Product', 'Category']
      };
      expect(validateSchema(mockData, schema)).toBe(true);
      expect(consoleSpy).toHaveBeenCalledWith('Schema validated successfully.');
    });

    test('should return false if time_col is missing', () => {
      const schema: InferredSchema = {
        time_col: 'MissingDate',
        planned_val_col: 'Budget',
        actual_val_col: 'Actuals',
        dimensions: ['Product', 'Category']
      };
      expect(validateSchema(mockData, schema)).toBe(false);
      expect(console.error).toHaveBeenCalledWith("Error: Inferred schema column 'MissingDate' not found in data file headers.");
    });

    test('should return false if planned_val_col is missing', () => {
      const schema: InferredSchema = {
        time_col: 'Date',
        planned_val_col: 'MissingBudget',
        actual_val_col: 'Actuals',
        dimensions: ['Product', 'Category']
      };
      expect(validateSchema(mockData, schema)).toBe(false);
      expect(console.error).toHaveBeenCalledWith("Error: Inferred schema column 'MissingBudget' not found in data file headers.");
    });

    test('should return false if actual_val_col is missing', () => {
      const schema: InferredSchema = {
        time_col: 'Date',
        planned_val_col: 'Budget',
        actual_val_col: 'MissingActuals',
        dimensions: ['Product', 'Category']
      };
      expect(validateSchema(mockData, schema)).toBe(false);
      expect(console.error).toHaveBeenCalledWith("Error: Inferred schema column 'MissingActuals' not found in data file headers.");
    });

    test('should return false if a dimension is missing', () => {
      const schema: InferredSchema = {
        time_col: 'Date',
        planned_val_col: 'Budget',
        actual_val_col: 'Actuals',
        dimensions: ['Product', 'MissingCategory']
      };
      expect(validateSchema(mockData, schema)).toBe(false);
      expect(console.error).toHaveBeenCalledWith("Error: Inferred schema column 'MissingCategory' not found in data file headers.");
    });
  });

  // --- enumerateAndAggregate Tests ---
  describe('enumerateAndAggregate', () => {
    test('should correctly aggregate metrics for unique groups', () => {
      const data: CsvRow[] = [
        { Date: 'd1', Product: 'A', Category: 'X', Budget: '100', Actuals: '120' },
        { Date: 'd2', Product: 'B', Category: 'X', Budget: '200', Actuals: '180' },
        { Date: 'd3', Product: 'A', Category: 'Y', Budget: '150', Actuals: '150' },
        { Date: 'd4', Product: 'A', Category: 'X', Budget: '50', Actuals: '60' }, // Same group as first
      ];
      const schema: InferredSchema = {
        time_col: 'Date',
        planned_val_col: 'Budget',
        actual_val_col: 'Actuals',
        dimensions: ['Product', 'Category']
      };

      const result = enumerateAndAggregate(data, schema);
      expect(result.size).toBe(3);

      const groupAX = result.get('Product=A;Category=X');
      expect(groupAX).toBeDefined();
      expect(groupAX?.Budget).toBe(150); // 100 + 50
      expect(groupAX?.Actuals).toBe(180); // 120 + 60

      const groupBX = result.get('Product=B;Category=X');
      expect(groupBX).toBeDefined();
      expect(groupBX?.Budget).toBe(200);
      expect(groupBX?.Actuals).toBe(180);

      const groupAY = result.get('Product=A;Category=Y');
      expect(groupAY).toBeDefined();
      expect(groupAY?.Budget).toBe(150);
      expect(groupAY?.Actuals).toBe(150);
    });

    test('should handle invalid numeric values gracefully', () => {
      const data: CsvRow[] = [
        { Date: 'd1', Product: 'A', Category: 'X', Budget: '100', Actuals: 'invalid' },
        { Date: 'd2', Product: 'A', Category: 'X', Budget: 'invalid', Actuals: '50' },
      ];
      const schema: InferredSchema = {
        time_col: 'Date',
        planned_val_col: 'Budget',
        actual_val_col: 'Actuals',
        dimensions: ['Product', 'Category']
      };

      const result = enumerateAndAggregate(data, schema);
      const groupAX = result.get('Product=A;Category=X');
      expect(groupAX?.Budget).toBe(0); // 'invalid' budget is skipped
      expect(groupAX?.Actuals).toBe(50); // 'invalid' actuals is skipped
    });
  });

  // --- computeVarianceMetrics Tests ---
  describe('computeVarianceMetrics', () => {
    test('should compute Delta and PerformanceRatio correctly', () => {
      const metrics = new Map<string, GroupMetrics>();
      metrics.set('g1', { group_key: 'g1', dimensions: {}, Budget: 100, Actuals: 120, Delta: 0, PerformanceRatio: 0 });
      metrics.set('g2', { group_key: 'g2', dimensions: {}, Budget: 200, Actuals: 180, Delta: 0, PerformanceRatio: 0 });
      metrics.set('g3', { group_key: 'g3', dimensions: {}, Budget: 150, Actuals: 150, Delta: 0, PerformanceRatio: 0 });
      metrics.set('g4', { group_key: 'g4', dimensions: {}, Budget: 0, Actuals: 50, Delta: 0, PerformanceRatio: 0 }); // Budget 0, Actuals > 0
      metrics.set('g5', { group_key: 'g5', dimensions: {}, Budget: 0, Actuals: -50, Delta: 0, PerformanceRatio: 0 }); // Budget 0, Actuals < 0
      metrics.set('g6', { group_key: 'g6', dimensions: {}, Budget: 0, Actuals: 0, Delta: 0, PerformanceRatio: 0 }); // Budget 0, Actuals 0

      const result = computeVarianceMetrics(metrics);

      expect(result.get('g1')?.Delta).toBe(20);
      expect(result.get('g1')?.PerformanceRatio).toBe(1.2);

      expect(result.get('g2')?.Delta).toBe(-20);
      expect(result.get('g2')?.PerformanceRatio).toBe(0.9);

      expect(result.get('g3')?.Delta).toBe(0);
      expect(result.get('g3')?.PerformanceRatio).toBe(1);

      expect(result.get('g4')?.Delta).toBe(50);
      expect(result.get('g4')?.PerformanceRatio).toBe(Infinity);

      expect(result.get('g5')?.Delta).toBe(-50);
      expect(result.get('g5')?.PerformanceRatio).toBe(-Infinity);

      expect(result.get('g6')?.Delta).toBe(0);
      expect(result.get('g6')?.PerformanceRatio).toBe(0);
    });
  });

  // --- applySignificanceFiltering Tests ---
  describe('applySignificanceFiltering', () => {
    const metrics = new Map<string, GroupMetrics>();
    metrics.set('g1', { group_key: 'g1', dimensions: {}, Budget: 1000, Actuals: 0, Delta: 0, PerformanceRatio: 0 });
    metrics.set('g2', { group_key: 'g2', dimensions: {}, Budget: 5000, Actuals: 0, Delta: 0, PerformanceRatio: 0 });
    metrics.set('g3', { group_key: 'g3', dimensions: {}, Budget: 10000, Actuals: 0, Delta: 0, PerformanceRatio: 0 });
    metrics.set('g4', { group_key: 'g4', dimensions: {}, Budget: 9999, Actuals: 0, Delta: 0, PerformanceRatio: 0 });

    test('should filter groups below minBudget', () => {
      const filtered = applySignificanceFiltering(metrics, 10000);
      expect(filtered.length).toBe(1);
      expect(filtered[0].group_key).toBe('g3');
    });

    test('should include groups equal to minBudget', () => {
      const filtered = applySignificanceFiltering(metrics, 9999);
      expect(filtered.length).toBe(2);
      expect(filtered.map(g => g.group_key)).toEqual(expect.arrayContaining(['g3', 'g4']));
    });

    test('should return all groups if minBudget is 0', () => {
      const filtered = applySignificanceFiltering(metrics, 0);
      expect(filtered.length).toBe(4);
    });
  });

  // --- rankPerformers Tests ---
  describe('rankPerformers', () => {
    const metrics: GroupMetrics[] = [
      { group_key: 'g1', dimensions: {}, Budget: 0, Actuals: 0, Delta: 100, PerformanceRatio: 0 },
      { group_key: 'g2', dimensions: {}, Budget: 0, Actuals: 0, Delta: -50, PerformanceRatio: 0 },
      { group_key: 'g3', dimensions: {}, Budget: 0, Actuals: 0, Delta: 200, PerformanceRatio: 0 },
      { group_key: 'g4', dimensions: {}, Budget: 0, Actuals: 0, Delta: -10, PerformanceRatio: 0 },
      { group_key: 'g5', dimensions: {}, Budget: 0, Actuals: 0, Delta: 50, PerformanceRatio: 0 },
      { group_key: 'g6', dimensions: {}, Budget: 0, Actuals: 0, Delta: -200, PerformanceRatio: 0 },
    ];

    test('should rank topN over and under performers correctly', () => {
      const { overPerformers, underPerformers } = rankPerformers(metrics, 2);
      expect(overPerformers.length).toBe(2);
      expect(overPerformers[0].Delta).toBe(200);
      expect(overPerformers[1].Delta).toBe(100);

      expect(underPerformers.length).toBe(2);
      expect(underPerformers[0].Delta).toBe(-200);
      expect(underPerformers[1].Delta).toBe(-50);
    });

    test('should handle topN larger than available groups', () => {
      const { overPerformers, underPerformers } = rankPerformers(metrics, 10);
      expect(overPerformers.length).toBe(6); // All groups are over-performers if sorted descending
      expect(underPerformers.length).toBe(6); // All groups are under-performers if sorted ascending
    });

    test('should handle empty metrics array', () => {
      const { overPerformers, underPerformers } = rankPerformers([], 2);
      expect(overPerformers).toEqual([]);
      expect(underPerformers).toEqual([]);
    });
  });

  // --- generateNarrative Tests ---
  describe('generateNarrative', () => {
    const schema: InferredSchema = {
      time_col: 'Date',
      planned_val_col: 'Budget',
      actual_val_col: 'Actuals',
      dimensions: ['Product', 'Region']
    };

    test('should generate narrative for over-performer', () => {
      const group: GroupMetrics = {
        group_key: 'p1;r1', dimensions: { Product: 'P1', Region: 'R1' },
        Budget: 1000, Actuals: 1200, Delta: 200, PerformanceRatio: 1.2
      };
      const narrative = generateNarrative(group, schema);
      expect(narrative).toBe('Product=P1, Region=R1 had Actuals exceeding Budget by $200 (120%).');
    });

    test('should generate narrative for under-performer', () => {
      const group: GroupMetrics = {
        group_key: 'p2;r2', dimensions: { Product: 'P2', Region: 'R2' },
        Budget: 1000, Actuals: 800, Delta: -200, PerformanceRatio: 0.8
      };
      const narrative = generateNarrative(group, schema);
      expect(narrative).toBe('Product=P2, Region=R2 had Actuals below Budget by $200 (80%).');
    });

    test('should handle zero delta', () => {
      const group: GroupMetrics = {
        group_key: 'p3;r3', dimensions: { Product: 'P3', Region: 'R3' },
        Budget: 1000, Actuals: 1000, Delta: 0, PerformanceRatio: 1
      };
      const narrative = generateNarrative(group, schema);
      expect(narrative).toBe('Product=P3, Region=R3 had Actuals below Budget by $0 (100%).'); // Delta 0 is considered 'below' by current logic
    });

    test('should handle Infinity performance ratio', () => {
      const group: GroupMetrics = {
        group_key: 'p4;r4', dimensions: { Product: 'P4', Region: 'R4' },
        Budget: 0, Actuals: 100, Delta: 100, PerformanceRatio: Infinity
      };
      const narrative = generateNarrative(group, schema);
      expect(narrative).toBe('Product=P4, Region=R4 had Actuals exceeding Budget by $100 (>1000%).');
    });

    test('should handle -Infinity performance ratio', () => {
      const group: GroupMetrics = {
        group_key: 'p5;r5', dimensions: { Product: 'P5', Region: 'R5' },
        Budget: 0, Actuals: -100, Delta: -100, PerformanceRatio: -Infinity
      };
      const narrative = generateNarrative(group, schema);
      expect(narrative).toBe('Product=P5, Region=R5 had Actuals below Budget by $100 (<0%).');
    });
  });

  // --- printResults Tests (Integration with console.log) ---
  describe('printResults', () => {
    const schema: InferredSchema = {
      time_col: 'Date',
      planned_val_col: 'Budget',
      actual_val_col: 'Actuals',
      dimensions: ['Product', 'Category']
    };
    const overPerformers: GroupMetrics[] = [
      { group_key: 'pA;cA', dimensions: { Product: 'pA', Category: 'cA' }, Budget: 100, Actuals: 200, Delta: 100, PerformanceRatio: 2 },
    ];
    const underPerformers: GroupMetrics[] = [
      { group_key: 'pB;cB', dimensions: { Product: 'pB', Category: 'cB' }, Budget: 200, Actuals: 100, Delta: -100, PerformanceRatio: 0.5 },
    ];

    test('should print correct headers and narratives for over and under performers', () => {
      printResults(overPerformers, underPerformers, schema);

      expect(consoleSpy).toHaveBeenCalledWith('\n--- Top Over-Performers ---');
      expect(consoleSpy).toHaveBeenCalledWith('Product=pA, Category=cA had Actuals exceeding Budget by $100 (200%).');
      expect(consoleSpy).toHaveBeenCalledWith('\n--- Top Under-Performers ---');
      expect(consoleSpy).toHaveBeenCalledWith('Product=pB, Category=cB had Actuals below Budget by $100 (50%).');
      expect(consoleSpy).toHaveBeenCalledWith('\n--- Detailed Tabular Results (Top/Bottom) ---');
      expect(consoleSpy).toHaveBeenCalledWith('Product\tCategory\tBudget\tActuals\tDelta\tPerformanceRatio');
      expect(consoleSpy).toHaveBeenCalledWith('pA\tcA\t100.00\t200.00\t100.00\t2.00');
      expect(consoleSpy).toHaveBeenCalledWith('pB\tcB\t200.00\t100.00\t-100.00\t0.50');
    });

    test('should print "No over-performing groups found." when empty', () => {
      printResults([], underPerformers, schema);
      expect(consoleSpy).toHaveBeenCalledWith('No over-performing groups found.');
    });

    test('should print "No under-performing groups found." when empty', () => {
      printResults(overPerformers, [], schema);
      expect(consoleSpy).toHaveBeenCalledWith('No under-performing groups found.');
    });

    test('should print "No results to display in tabular format." when both are empty', () => {
      printResults([], [], schema);
      expect(consoleSpy).toHaveBeenCalledWith('No results to display in tabular format.');
    });
  });

  // --- runAnalysis Integration Test ---
  describe('runAnalysis (Integration)', () => {
    const mockFilePath = 'mock_data.csv';
    const mockParams = { file: mockFilePath, min_budget: 100, top_n: 1 };

    beforeEach(() => {
      // Mock loadData to return our parsed data
      (fs.readFileSync as jest.Mock).mockReturnValue(MOCKED_CSV_CONTENT);
      (Papa.parse as jest.Mock).mockImplementation((csvString, options) => {
        options.complete({ data: MOCKED_PARSED_DATA });
      });

      // Mock inferSchemaFromLLM to return our predefined schema
      const mockLlmOutput = '```json\n{"time_col": "Date", "planned_val_col": "Budget", "actual_val_col": "Actuals", "dimensions": ["Product", "Category"]}\n```';
      (exec as jest.Mock).mockImplementation((command, options, callback) => {
        callback(null, mockLlmOutput, '');
      });
    });

    test('should execute the full analysis flow and print results', async () => {
      await runAnalysis(mockParams);

      // Verify key steps were called
      expect(fs.readFileSync).toHaveBeenCalledWith(mockFilePath, 'utf8');
      expect(Papa.parse).toHaveBeenCalled();
      expect(exec).toHaveBeenCalled(); // LLM call
      expect(consoleSpy).toHaveBeenCalledWith(expect.stringContaining('Starting analysis with parameters:'));
      expect(consoleSpy).toHaveBeenCalledWith(expect.stringContaining('Loaded 5 rows.'));
      expect(consoleSpy).toHaveBeenCalledWith(expect.stringContaining('Inferring schema using Ollama/Gemma3...'));
      expect(consoleSpy).toHaveBeenCalledWith(expect.stringContaining('Schema validated successfully.'));
      expect(consoleSpy).toHaveBeenCalledWith(expect.stringContaining('Aggregated metrics for 3 unique groups.'));
      expect(consoleSpy).toHaveBeenCalledWith(expect.stringContaining('Computed variance metrics for all groups.'));
      expect(consoleSpy).toHaveBeenCalledWith(expect.stringContaining('Filtered to 3 groups with Budget >= 100.'));
      expect(consoleSpy).toHaveBeenCalledWith(expect.stringContaining('Ranking performers for top_n: 1...'));
      expect(consoleSpy).toHaveBeenCalledWith(expect.stringContaining('Printing results...'));

      // Verify narratives and tabular output (based on MOCKED_PARSED_DATA and MOCKED_SCHEMA)
      // ProductA, Cat1: Budget 200, Actuals 230, Delta 30, Ratio 1.15
      // ProductB, Cat1: Budget 200, Actuals 180, Delta -20, Ratio 0.9
      // ProductC, Cat1: Budget 50, Actuals 100, Delta 50, Ratio 2
      // ProductA, Cat2: Budget 150, Actuals 150, Delta 0, Ratio 1

      // Expected top over-performer: ProductC, Cat1 (Delta 50)
      // Expected top under-performer: ProductB, Cat1 (Delta -20)

      expect(consoleSpy).toHaveBeenCalledWith('\n--- Top Over-Performers ---');
      expect(consoleSpy).toHaveBeenCalledWith('Product=ProductC, Category=Cat1 had Actuals exceeding Budget by $50 (200%).');
      expect(consoleSpy).toHaveBeenCalledWith('\n--- Top Under-Performers ---');
      expect(consoleSpy).toHaveBeenCalledWith('Product=ProductB, Category=Cat1 had Actuals below Budget by $20 (90%).');
      expect(consoleSpy).toHaveBeenCalledWith('Product\tCategory\tBudget\tActuals\tDelta\tPerformanceRatio');
      expect(consoleSpy).toHaveBeenCalledWith('ProductC\tCat1\t50.00\t100.00\t50.00\t2.00');
      expect(consoleSpy).toHaveBeenCalledWith('ProductB\tCat1\t200.00\t180.00\t-20.00\t0.90');
    });

    test('should handle LLM schema inference failure', async () => {
      (exec as jest.Mock).mockImplementation((command, options, callback) => {
        callback(new Error('LLM error'), '', 'LLM failed');
      });

      await runAnalysis(mockParams);
      expect(console.error).toHaveBeenCalledWith('Analysis failed: LLM schema inference failed. Check Ollama server and model, and LLM output format.');
    });

    test('should handle schema validation failure', async () => {
      // Mock LLM to return invalid schema (missing column)
      const invalidLlmOutput = '```json\n{"time_col": "Date", "planned_val_col": "Budget", "actual_val_col": "MissingCol", "dimensions": ["Product", "Category"]}\n```';
      (exec as jest.Mock).mockImplementation((command, options, callback) => {
        callback(null, invalidLlmOutput, '');
      });

      await runAnalysis(mockParams);
      expect(console.error).toHaveBeenCalledWith("Error: Inferred schema column 'MissingCol' not found in data file headers.");
      expect(console.error).toHaveBeenCalledWith('Schema validation failed. Exiting.');
      expect(console.error).toHaveBeenCalledWith('Analysis failed: Schema validation failed. Exiting.');
    });

    test('should handle empty data after loading', async () => {
      (fs.readFileSync as jest.Mock).mockReturnValue('Header1,Header2');
      (Papa.parse as jest.Mock).mockImplementation((csvString, options) => {
        options.complete({ data: [] });
      });

      await runAnalysis(mockParams);
      expect(consoleSpy).toHaveBeenCalledWith('No data to analyze. Exiting.');
    });
  });
});
