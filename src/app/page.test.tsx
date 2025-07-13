import '@testing-library/jest-dom';
import { render, screen } from '@testing-library/react';
import { inferDataType, isLikelyDate, cleanAndConvertValue } from '@/lib/utils/dataTypeUtils';
import Home from './page';

// Mock the dynamic imports and external dependencies
jest.mock('@/components/ChatUI', () => {
  return {
    __esModule: true,
    default: jest.fn(() => <div data-testid="chat-ui">Chat UI</div>),
  };
});

jest.mock('@/components/DataGrid', () => {
  return jest.fn(() => <div data-testid="data-grid">Data Grid</div>);
});

jest.mock('@/lib/ollama', () => ({
  checkOllamaStatus: jest.fn().mockResolvedValue(false),
  getOllamaModels: jest.fn().mockResolvedValue([]),
  chatWithOllama: jest.fn().mockResolvedValue('Mock response'),
}));

jest.mock('papaparse', () => ({
  parse: jest.fn(),
}));

describe('Data Type Utils', () => {
  describe('inferDataType', () => {
    it('should correctly infer number type', () => {
      expect(inferDataType('123')).toBe('number');
      expect(inferDataType('$123.45')).toBe('number');
      expect(inferDataType('-10')).toBe('number');
      expect(inferDataType(42)).toBe('number');
    });

    it('should correctly infer boolean type', () => {
      expect(inferDataType('true')).toBe('boolean');
      expect(inferDataType('FALSE')).toBe('boolean');
      expect(inferDataType(true)).toBe('boolean');
      expect(inferDataType(false)).toBe('boolean');
    });

    it('should correctly infer date type', () => {
      expect(inferDataType('2023-01-15')).toBe('date');
      // Note: Some date formats may be interpreted differently by the regex
      expect(inferDataType('2023-12-31')).toBe('date');
    });

    it('should default to string type', () => {
      expect(inferDataType('hello')).toBe('string');
      expect(inferDataType('Main Street')).toBe('string'); // Pure text
      expect(inferDataType('')).toBe('string');
      expect(inferDataType(null)).toBe('string');
      expect(inferDataType(undefined)).toBe('string');
    });
  });

  describe('isLikelyDate', () => {
    it('should return true for valid date strings', () => {
      expect(isLikelyDate('2023-01-15')).toBe(true);
      expect(isLikelyDate('01/15/2023')).toBe(true);
      expect(isLikelyDate('1/1/2023')).toBe(true);
    });

    it('should return false for invalid date strings', () => {
      expect(isLikelyDate('not a date')).toBe(false);
      expect(isLikelyDate('2023-13-01')).toBe(false); // Invalid month
      expect(isLikelyDate('2023-01-32')).toBe(false); // Invalid day
      expect(isLikelyDate('')).toBe(false);
    });
  });

  describe('cleanAndConvertValue', () => {
    it('should convert number strings to numbers', () => {
      expect(cleanAndConvertValue('123', 'number')).toBe(123);
      expect(cleanAndConvertValue('$123.45', 'number')).toBe(123.45);
      expect(cleanAndConvertValue('-10.5', 'number')).toBe(-10.5);
    });

    it('should convert boolean strings to booleans', () => {
      expect(cleanAndConvertValue('true', 'boolean')).toBe(true);
      expect(cleanAndConvertValue('false', 'boolean')).toBe(false);
      expect(cleanAndConvertValue('FALSE', 'boolean')).toBe(false);
    });

    it('should convert date strings to dates or keep as string if invalid', () => {
      const validDate = cleanAndConvertValue('2023-01-15', 'date');
      expect(validDate).toBeInstanceOf(Date);
      expect((validDate as Date).getFullYear()).toBe(2023);

      const invalidDate = cleanAndConvertValue('invalid-date', 'date');
      expect(typeof invalidDate).toBe('string');
    });

    it('should handle null/undefined values', () => {
      expect(cleanAndConvertValue(null, 'string')).toBe('');
      expect(cleanAndConvertValue(undefined, 'string')).toBe('');
    });

    it('should convert other types to strings', () => {
      expect(cleanAndConvertValue('hello', 'string')).toBe('hello');
      expect(cleanAndConvertValue(123, 'string')).toBe('123');
    });
  });
});

describe('Home Component', () => {
  it('should render without crashing', () => {
    render(<Home />);
    expect(screen.getByText('🚀 Quant Commander')).toBeInTheDocument();
    expect(screen.getByText('Advanced Financial Data Analysis Platform with AI-Powered Insights')).toBeInTheDocument();
  });

  it('should render main navigation tabs', () => {
    render(<Home />);
    expect(screen.getByRole('button', { name: 'Data Grid' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Analysis' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Documents' })).toBeInTheDocument();
  });

  it('should show Ollama status', () => {
    render(<Home />);
    expect(screen.getByText('Ollama Status:')).toBeInTheDocument();
  });
});