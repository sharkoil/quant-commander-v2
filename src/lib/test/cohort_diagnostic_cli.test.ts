import {
    parseArguments,
    loadData,
    inferSchemaFromLLM,
    validateSchema,
    enumerateAndAggregate,
    computeVarianceMetrics,
    applySignificanceFiltering,
    rankPerformers,
    generateNarrative,
    printResults,
    runAnalysis
} from '../../../../tools/cohort_diagnostic_cli';

import * as fs from 'fs';
import * as Papa from 'papaparse';
import { exec } from 'child_process';

// Mock external dependencies
jest.mock('fs');
jest.mock('papaparse');
jest.mock('child_process');

describe('cohort_diagnostic_cli', () => {

    beforeEach(() => {
        jest.clearAllMocks();
    });

    describe('parseArguments', () => {
        it('should parse file argument correctly', () => {
            const args = ['--file', 'test.csv'];
            const result = parseArguments(args);
            expect(result.file).toBe('test.csv');
            expect(result.min_budget).toBe(0);
            expect(result.top_n).toBe(5);
        });

        it('should parse min_budget argument correctly', () => {
            const args = ['--min_budget', '100'];
            const result = parseArguments(args);
            expect(result.file).toBe('');
            expect(result.min_budget).toBe(100);
            expect(result.top_n).toBe(5);
        });

        it('should parse top_n argument correctly', () => {
            const args = ['--top_n', '10'];
            const result = parseArguments(args);
            expect(result.file).toBe('');
            expect(result.min_budget).toBe(0);
            expect(result.top_n).toBe(10);
        });

        it('should parse all arguments correctly', () => {
            const args = ['--file', 'data.csv', '--min_budget', '500', '--top_n', '3'];
            const result = parseArguments(args);
            expect(result.file).toBe('data.csv');
            expect(result.min_budget).toBe(500);
            expect(result.top_n).toBe(3);
        });

        it('should handle missing arguments with default values', () => {
            const args: string[] = [];
            const result = parseArguments(args);
            expect(result.file).toBe('');
            expect(result.min_budget).toBe(0);
            expect(result.top_n).toBe(5);
        });

        it('should handle invalid numeric arguments gracefully', () => {
            const args = ['--min_budget', 'abc', '--top_n', 'xyz'];
            const result = parseArguments(args);
            expect(result.min_budget).toBeNaN(); // parseFloat('abc') is NaN
            expect(result.top_n).toBeNaN();     // parseInt('xyz') is NaN
        });
    });

    describe('loadData', () => {
        const mockCsvContent = "header1,header2\nvalue1,value2";
        const mockParsedData = [{ header1: 'value1', header2: 'value2' }];

        beforeEach(() => {
            (fs.readFileSync as jest.Mock).mockReturnValue(mockCsvContent);
            (Papa.parse as jest.Mock).mockImplementation((csvString, options) => {
                options.complete({ data: mockParsedData });
            });
        });

        it('should load data successfully from a given file path', async () => {
            const filePath = 'test.csv';
            const data = await loadData(filePath);

            expect(fs.readFileSync).toHaveBeenCalledWith(filePath, 'utf8');
            expect(Papa.parse).toHaveBeenCalledWith(mockCsvContent, expect.any(Object));
            expect(data).toEqual(mockParsedData);
        });

        it('should throw an error if file reading fails', async () => {
            (fs.readFileSync as jest.Mock).mockImplementation(() => {
                throw new Error('File not found');
            });

            await expect(loadData('nonexistent.csv')).rejects.toThrow('File not found');
        });

        it('should throw an error if CSV parsing fails', async () => {
            (Papa.parse as jest.Mock).mockImplementation((csvString, options) => {
                options.error(new Error('Parsing error'));
            });

            await expect(loadData('bad.csv')).rejects.toThrow('Parsing error');
        });

        it('should return empty array if CSV contains no data rows', async () => {
            (fs.readFileSync as jest.Mock).mockReturnValue("header1,header2\n");
            (Papa.parse as jest.Mock).mockImplementation((csvString, options) => {
                options.complete({ data: [] });
            });
            const data = await loadData('empty.csv');
            expect(data).toEqual([]);
        });
    })

    describe('inferSchemaFromLLM', () => {
        const mockRunCommand = exec as jest.Mock;

        it('should infer schema correctly from LLM output', async () => {
            mockRunCommand.mockImplementation((command, options, callback) => {
                callback(null, '```json\n{"time_col": "Date", "planned_val_col": "Budget", "actual_val_col": "Actuals", "dimensions": ["Product"]}\n```', '');
            });

            const headers = ['Date', 'Budget', 'Actuals', 'Product'];
            const schema = await inferSchemaFromLLM(headers);

            expect(mockRunCommand).toHaveBeenCalledWith(
                expect.stringContaining('ollama run gemma3'),
                expect.any(Object),
                expect.any(Function)
            );
            expect(schema).toEqual({
                time_col: 'Date',
                planned_val_col: 'Budget',
                actual_val_col: 'Actuals',
                dimensions: ['Product']
            });
        });

        it('should handle LLM output without markdown block', async () => {
            mockRunCommand.mockImplementation((command, options, callback) => {
                callback(null, '{"time_col": "Time", "planned_val_col": "Plan", "actual_val_col": "Actual", "dimensions": []}', '');
            });

            const headers = ['Time', 'Plan', 'Actual'];
            const schema = await inferSchemaFromLLM(headers);

            expect(schema).toEqual({
                time_col: 'Time',
                planned_val_col: 'Plan',
                actual_val_col: 'Actual',
                dimensions: []
            });
        });

        it('should throw an error if LLM command fails', async () => {
            mockRunCommand.mockImplementation((command, options, callback) => {
                callback(new Error('Ollama error'), '', 'stderr output');
            });

            await expect(inferSchemaFromLLM(['h1'])).rejects.toThrow('Ollama error');
        });

        it('should throw an error if LLM output is invalid JSON', async () => {
            mockRunCommand.mockImplementation((command, options, callback) => {
                callback(null, 'invalid json', '');
            });

            await expect(inferSchemaFromLLM(['h1'])).rejects.toThrow('LLM schema inference failed');
        });
    });

    describe('validateSchema', () => {
        const mockData = [
            { Date: '2023-01-01', Budget: '100', Actuals: '90', Product: 'A' },
            { Date: '2023-01-01', Budget: '200', Actuals: '180', Product: 'B' },
        ];

        it('should return true for a valid schema', () => {
            const schema = {
                time_col: 'Date',
                planned_val_col: 'Budget',
                actual_val_col: 'Actuals',
                dimensions: ['Product']
            };
            expect(validateSchema(mockData, schema)).toBe(true);
        });

        it('should return false if time_col is missing', () => {
            const schema = {
                time_col: 'MissingDate',
                planned_val_col: 'Budget',
                actual_val_col: 'Actuals',
                dimensions: ['Product']
            };
            expect(validateSchema(mockData, schema)).toBe(false);
        });

        it('should return false if planned_val_col is missing', () => {
            const schema = {
                time_col: 'Date',
                planned_val_col: 'MissingBudget',
                actual_val_col: 'Actuals',
                dimensions: ['Product']
            };
            expect(validateSchema(mockData, schema)).toBe(false);
        });

        it('should return false if actual_val_col is missing', () => {
            const schema = {
                time_col: 'Date',
                planned_val_col: 'Budget',
                actual_val_col: 'MissingActuals',
                dimensions: ['Product']
            };
            expect(validateSchema(mockData, schema)).toBe(false);
        });

        it('should return false if a dimension column is missing', () => {
            const schema = {
                time_col: 'Date',
                planned_val_col: 'Budget',
                actual_val_col: 'Actuals',
                dimensions: ['MissingProduct']
            };
            expect(validateSchema(mockData, schema)).toBe(false);
        });

        it('should return true for empty dimensions', () => {
            const schema = {
                time_col: 'Date',
                planned_val_col: 'Budget',
                actual_val_col: 'Actuals',
                dimensions: []
            };
            expect(validateSchema(mockData, schema)).toBe(true);
        });

        it('should handle empty data array gracefully', () => {
            const schema = {
                time_col: 'Date',
                planned_val_col: 'Budget',
                actual_val_col: 'Actuals',
                dimensions: ['Product']
            };
            expect(validateSchema([], schema)).toBe(true); // No headers to validate against
        });
    });

    describe('enumerateAndAggregate', () => {
        const mockData = [
            { Date: '2023-01-01', Budget: '100', Actuals: '90', Product: 'A', Region: 'East' },
            { Date: '2023-01-01', Budget: '200', Actuals: '180', Product: 'B', Region: 'West' },
            { Date: '2023-01-02', Budget: '150', Actuals: '160', Product: 'A', Region: 'East' },
            { Date: '2023-01-02', Budget: '50', Actuals: '40', Product: 'C', Region: 'East' },
            { Date: '2023-01-03', Budget: '100', Actuals: '110', Product: 'A', Region: 'West' },
        ];

        const schema = {
            time_col: 'Date',
            planned_val_col: 'Budget',
            actual_val_col: 'Actuals',
            dimensions: ['Product', 'Region']
        };

        it('should correctly aggregate data based on dimensions', () => {
            const result = enumerateAndAggregate(mockData, schema);
            expect(result.size).toBe(4); // A;East, B;West, C;East, A;West

            const groupA_East = result.get('Product=A;Region=East');
            expect(groupA_East).toBeDefined();
            expect(groupA_East?.Budget).toBe(250); // 100 + 150
            expect(groupA_East?.Actuals).toBe(250); // 90 + 160

            const groupB_West = result.get('Product=B;Region=West');
            expect(groupB_West).toBeDefined();
            expect(groupB_West?.Budget).toBe(200);
            expect(groupB_West?.Actuals).toBe(180);

            const groupC_East = result.get('Product=C;Region=East');
            expect(groupC_East).toBeDefined();
            expect(groupC_East?.Budget).toBe(50);
            expect(groupC_East?.Actuals).toBe(40);

            const groupA_West = result.get('Product=A;Region=West');
            expect(groupA_West).toBeDefined();
            expect(groupA_West?.Budget).toBe(100);
            expect(groupA_West?.Actuals).toBe(110);
        });

        it('should handle rows with missing dimension values gracefully', () => {
            const dataWithMissingDim = [
                { Date: '2023-01-01', Budget: '100', Actuals: '90', Product: 'A' }, // Missing Region
            ];
            const result = enumerateAndAggregate(dataWithMissingDim, schema);
            expect(result.size).toBe(0); // Row should be skipped if dimension is missing
        });

        it('should handle non-numeric budget/actuals values', () => {
            const dataWithInvalidNumbers = [
                { Date: '2023-01-01', Budget: 'abc', Actuals: '90', Product: 'A', Region: 'East' },
                { Date: '2023-01-01', Budget: '100', Actuals: 'xyz', Product: 'B', Region: 'West' },
            ];
            const result = enumerateAndAggregate(dataWithInvalidNumbers, schema);

            const groupA_East = result.get('Product=A;Region=East');
            expect(groupA_East?.Budget).toBe(0); // 'abc' is not added
            expect(groupA_East?.Actuals).toBe(90);

            const groupB_West = result.get('Product=B;Region=West');
            expect(groupB_West?.Budget).toBe(100);
            expect(groupB_West?.Actuals).toBe(0); // 'xyz' is not added
        });

        it('should handle empty data array', () => {
            const result = enumerateAndAggregate([], schema);
            expect(result.size).toBe(0);
        });

        it('should handle empty dimensions in schema', () => {
            const schemaNoDim = {
                time_col: 'Date',
                planned_val_col: 'Budget',
                actual_val_col: 'Actuals',
                dimensions: []
            };
            const result = enumerateAndAggregate(mockData, schemaNoDim);
            expect(result.size).toBe(1); // All data aggregates into one group
            const totalGroup = result.get('');
            expect(totalGroup?.Budget).toBe(600); // 100+200+150+50+100
            expect(totalGroup?.Actuals).toBe(580); // 90+180+160+40+110
        });
    });

    describe('computeVarianceMetrics', () => {
        it('should correctly compute Delta and PerformanceRatio', () => {
            const initialMetrics = new Map();
            initialMetrics.set('group1', { group_key: 'group1', dimensions: {}, Budget: 100, Actuals: 120, Delta: 0, PerformanceRatio: 0 });
            initialMetrics.set('group2', { group_key: 'group2', dimensions: {}, Budget: 200, Actuals: 150, Delta: 0, PerformanceRatio: 0 });
            initialMetrics.set('group3', { group_key: 'group3', dimensions: {}, Budget: 50, Actuals: 50, Delta: 0, PerformanceRatio: 0 });

            const computedMetrics = computeVarianceMetrics(initialMetrics);

            const group1 = computedMetrics.get('group1');
            expect(group1?.Delta).toBe(20);
            expect(group1?.PerformanceRatio).toBe(1.2);

            const group2 = computedMetrics.get('group2');
            expect(group2?.Delta).toBe(-50);
            expect(group2?.PerformanceRatio).toBe(0.75);

            const group3 = computedMetrics.get('group3');
            expect(group3?.Delta).toBe(0);
            expect(group3?.PerformanceRatio).toBe(1);
        });

        it('should handle Budget of zero correctly for PerformanceRatio', () => {
            const initialMetrics = new Map();
            initialMetrics.set('group_zero_budget_positive_actuals', { group_key: 'g1', dimensions: {}, Budget: 0, Actuals: 100, Delta: 0, PerformanceRatio: 0 });
            initialMetrics.set('group_zero_budget_negative_actuals', { group_key: 'g2', dimensions: {}, Budget: 0, Actuals: -50, Delta: 0, PerformanceRatio: 0 });
            initialMetrics.set('group_zero_budget_zero_actuals', { group_key: 'g3', dimensions: {}, Budget: 0, Actuals: 0, Delta: 0, PerformanceRatio: 0 });

            const computedMetrics = computeVarianceMetrics(initialMetrics);

            expect(computedMetrics.get('group_zero_budget_positive_actuals')?.PerformanceRatio).toBe(Infinity);
            expect(computedMetrics.get('group_zero_budget_negative_actuals')?.PerformanceRatio).toBe(-Infinity);
            expect(computedMetrics.get('group_zero_budget_zero_actuals')?.PerformanceRatio).toBe(0);
        });

        it('should return the same map instance', () => {
            const initialMetrics = new Map();
            const computedMetrics = computeVarianceMetrics(initialMetrics);
            expect(computedMetrics).toBe(initialMetrics);
        });
    });

    describe('applySignificanceFiltering', () => {
        const mockMetrics = new Map();
        mockMetrics.set('g1', { group_key: 'g1', dimensions: {}, Budget: 100, Actuals: 120, Delta: 20, PerformanceRatio: 1.2 });
        mockMetrics.set('g2', { group_key: 'g2', dimensions: {}, Budget: 50, Actuals: 40, Delta: -10, PerformanceRatio: 0.8 });
        mockMetrics.set('g3', { group_key: 'g3', dimensions: {}, Budget: 200, Actuals: 210, Delta: 10, PerformanceRatio: 1.05 });
        mockMetrics.set('g4', { group_key: 'g4', dimensions: {}, Budget: 20, Actuals: 30, Delta: 10, PerformanceRatio: 1.5 });

        it('should filter groups based on minBudget', () => {
            const minBudget = 100;
            const filtered = applySignificanceFiltering(mockMetrics, minBudget);
            expect(filtered.length).toBe(2);
            expect(filtered).toContainEqual(mockMetrics.get('g1'));
            expect(filtered).toContainEqual(mockMetrics.get('g3'));
            expect(filtered).not.toContainEqual(mockMetrics.get('g2'));
            expect(filtered).not.toContainEqual(mockMetrics.get('g4'));
        });

        it('should return all groups if minBudget is 0', () => {
            const minBudget = 0;
            const filtered = applySignificanceFiltering(mockMetrics, minBudget);
            expect(filtered.length).toBe(4);
        });

        it('should return an empty array if no groups meet the criteria', () => {
            const minBudget = 500;
            const filtered = applySignificanceFiltering(mockMetrics, minBudget);
            expect(filtered.length).toBe(0);
        });

        it('should handle empty input map', () => {
            const emptyMap = new Map();
            const filtered = applySignificanceFiltering(emptyMap, 100);
            expect(filtered.length).toBe(0);
        });
    });

    describe('rankPerformers', () => {
        const mockFilteredMetrics = [
            { group_key: 'g1', dimensions: {}, Budget: 100, Actuals: 120, Delta: 20, PerformanceRatio: 1.2 },
            { group_key: 'g2', dimensions: {}, Budget: 50, Actuals: 40, Delta: -10, PerformanceRatio: 0.8 },
            { group_key: 'g3', dimensions: {}, Budget: 200, Actuals: 210, Delta: 10, PerformanceRatio: 1.05 },
            { group_key: 'g4', dimensions: {}, Budget: 20, Actuals: 30, Delta: 10, PerformanceRatio: 1.5 },
            { group_key: 'g5', dimensions: {}, Budget: 100, Actuals: 50, Delta: -50, PerformanceRatio: 0.5 },
            { group_key: 'g6', dimensions: {}, Budget: 100, Actuals: 100, Delta: 0, PerformanceRatio: 1.0 },
        ];

        it('should correctly rank over and under performers', () => {
            const topN = 2;
            const { overPerformers, underPerformers } = rankPerformers(mockFilteredMetrics, topN);

            expect(overPerformers.length).toBe(topN);
            expect(overPerformers[0].Delta).toBe(20); // g1
            expect(overPerformers[1].Delta).toBe(10); // g3 or g4

            expect(underPerformers.length).toBe(topN);
            expect(underPerformers[0].Delta).toBe(-50); // g5
            expect(underPerformers[1].Delta).toBe(-10); // g2
        });

        it('should handle topN larger than available metrics', () => {
            const topN = 10;
            const { overPerformers, underPerformers } = rankPerformers(mockFilteredMetrics, topN);

            expect(overPerformers.length).toBe(6);
            expect(underPerformers.length).toBe(6);
        });

        it('should handle empty input array', () => {
            const topN = 2;
            const { overPerformers, underPerformers } = rankPerformers([], topN);

            expect(overPerformers.length).toBe(0);
            expect(underPerformers.length).toBe(0);
        });

        it('should handle topN of 0', () => {
            const topN = 0;
            const { overPerformers, underPerformers } = rankPerformers(mockFilteredMetrics, topN);

            expect(overPerformers.length).toBe(0);
            expect(underPerformers.length).toBe(0);
        });
    });
});
