// Analyzes CSV data to identify column types and suitable fields
// Helps with automatic field detection and validation

/**
 * Identifies numeric fields suitable for budget/actual analysis
 * @param data - CSV data array
 * @returns Array of numeric field names
 */
export const getNumericFields = (data: unknown[]): string[] => {
  if (!data || data.length === 0) return [];
  
  const firstRow = data[0] as Record<string, unknown>;
  const fields = Object.keys(firstRow);
  
  return fields.filter(field => {
    // Skip fields that look like dates
    if (field.toLowerCase().includes('date') || field.toLowerCase().includes('time')) {
      return false;
    }
    
    // Sample multiple rows to check numeric consistency
    const sampleSize = Math.min(10, data.length);
    const sampleValues = data.slice(0, sampleSize).map(row => {
      const value = (row as Record<string, unknown>)[field];
      
      // Skip date-like values
      if (typeof value === 'string' && /^\d{4}-\d{2}-\d{2}/.test(value)) {
        return NaN;
      }
      
      return parseFloat(String(value || '0'));
    });
    
    const validNumericValues = sampleValues.filter(val => !isNaN(val));
    
    // Field is numeric if 80% of samples are valid numbers
    return validNumericValues.length >= sampleSize * 0.8;
  });
};

/**
 * Identifies date fields suitable for period analysis
 * @param data - CSV data array
 * @returns Array of date field names
 */
export const getDateFields = (data: unknown[]): string[] => {
  if (!data || data.length === 0) return [];
  
  const firstRow = data[0] as Record<string, unknown>;
  const fields = Object.keys(firstRow);
  
  return fields.filter(field => {
    // First check: field name contains "date" or "time"
    const fieldName = field.toLowerCase();
    if (fieldName.includes('date') || fieldName.includes('time')) {
      return true;
    }
    
    // Second check: field contains date-like values
    const sampleSize = Math.min(5, data.length);
    const sampleValues = data.slice(0, sampleSize).map(row => {
      const value = (row as Record<string, unknown>)[field];
      return String(value || '');
    });
    
    const validDateValues = sampleValues.filter(val => {
      // Skip empty values
      if (!val || val.trim() === '') return false;
      
      // Check for common date patterns
      const datePatterns = [
        /^\d{1,2}\/\d{1,2}\/\d{4}$/,     // 1/5/2025, 12/31/2025
        /^\d{4}-\d{2}-\d{2}$/,          // 2025-01-05
        /^\d{2}-\d{2}-\d{4}$/,          // 01-05-2025
        /^\d{1,2}-\d{1,2}-\d{4}$/       // 1-5-2025
      ];
      
      const matchesPattern = datePatterns.some(pattern => pattern.test(val));
      if (matchesPattern) return true;
      
      // Fallback: try to parse as date
      const date = new Date(val);
      return !isNaN(date.getTime()) && val.length >= 6; // Reduced from 8 to 6
    });
    
    // Field is date if 50% of samples are valid dates (reduced from 60%)
    return validDateValues.length >= sampleSize * 0.5;
  });
};

/**
 * Gets default budget column by looking for budget-related field names
 * @param data - CSV data array OR column names array
 * @returns Default budget column name
 */
export const getDefaultBudgetColumn = (data: unknown[] | string[]): string => {
  // Handle column names array (for fallback)
  if (typeof data[0] === 'string') {
    const columns = data as string[];
    const budgetKeywords = ['budget', 'planned', 'target', 'forecast', 'plan'];
    
    for (const keyword of budgetKeywords) {
      const found = columns.find(col => 
        col.toLowerCase().includes(keyword.toLowerCase())
      );
      if (found) return found;
    }
    
    return columns[0] || 'Budget';
  }
  
  // Handle CSV data array (preferred)
  const numericFields = getNumericFields(data);
  
  const budgetKeywords = ['budget', 'planned', 'target', 'forecast', 'plan'];
  
  for (const keyword of budgetKeywords) {
    const found = numericFields.find(field => 
      field.toLowerCase().includes(keyword.toLowerCase())
    );
    if (found) return found;
  }
  
  return numericFields[0] || 'Budget';
};

/**
 * Gets default actual column by looking for actual-related field names
 * @param data - CSV data array OR column names array
 * @returns Default actual column name
 */
export const getDefaultActualColumn = (data: unknown[] | string[]): string => {
  // Handle column names array (for fallback)
  if (typeof data[0] === 'string') {
    const columns = data as string[];
    const actualKeywords = ['actual', 'real', 'achieved', 'result', 'revenue', 'sales'];
    
    for (const keyword of actualKeywords) {
      const found = columns.find(col => 
        col.toLowerCase().includes(keyword.toLowerCase())
      );
      if (found) return found;
    }
    
    return columns[1] || columns[0] || 'Actual';
  }
  
  // Handle CSV data array (preferred)
  const numericFields = getNumericFields(data);
  
  const actualKeywords = ['actual', 'real', 'achieved', 'result', 'revenue', 'sales'];
  
  for (const keyword of actualKeywords) {
    const found = numericFields.find(field => 
      field.toLowerCase().includes(keyword.toLowerCase())
    );
    if (found) return found;
  }
  
  return numericFields[1] || numericFields[0] || 'Actual';
};

/**
 * Analyzes date range and available periods in CSV data
 */
export interface DateRangeAnalysis {
  startDate: Date;
  endDate: Date;
  totalDays: number;
  availablePeriods: {
    weekly: number;
    monthly: number;
    quarterly: number;
    yearly: number;
  };
  dateColumn: string;
  sampleDates: string[];
}

/**
 * Analyzes the complete date range and available periods in CSV data
 * @param data - CSV data array
 * @returns Complete date range analysis
 */
export const analyzeDateRange = (data: unknown[]): DateRangeAnalysis | null => {
  if (!data || data.length === 0) return null;
  
  // Find the date column
  const dateFields = getDateFields(data);
  const dateColumn = dateFields.find(field => 
    field.toLowerCase().includes('date')
  ) || dateFields[0];
  
  if (!dateColumn) return null;
  
  // Extract all dates and convert to Date objects
  const validDates: Date[] = [];
  const sampleDates: string[] = [];
  
  data.forEach(row => {
    const value = (row as Record<string, unknown>)[dateColumn];
    const dateStr = String(value || '').trim();
    
    if (dateStr && dateStr !== '') {
      const date = new Date(dateStr);
      if (!isNaN(date.getTime())) {
        validDates.push(date);
        if (sampleDates.length < 5) {
          sampleDates.push(dateStr);
        }
      }
    }
  });
  
  if (validDates.length === 0) return null;
  
  // Find min and max dates
  validDates.sort((a, b) => a.getTime() - b.getTime());
  const startDate = validDates[0];
  const endDate = validDates[validDates.length - 1];
  
  // Calculate total days
  const totalDays = Math.ceil((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24));
  
  // Calculate available periods
  const startYear = startDate.getFullYear();
  const endYear = endDate.getFullYear();
  const startMonth = startDate.getMonth();
  const endMonth = endDate.getMonth();
  
  const yearly = endYear - startYear + 1;
  const monthly = (endYear - startYear) * 12 + (endMonth - startMonth) + 1;
  const quarterly = Math.ceil(monthly / 3);
  const weekly = Math.ceil(totalDays / 7);
  
  return {
    startDate,
    endDate,
    totalDays,
    availablePeriods: {
      weekly,
      monthly,
      quarterly,
      yearly
    },
    dateColumn,
    sampleDates
  };
};
