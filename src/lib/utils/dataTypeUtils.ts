/**
 * Data Type Utilities
 * Functions for inferring and converting data types from CSV data
 */

/**
 * Infers the most appropriate data type for a given value
 * @param value - The value to analyze
 * @returns The inferred data type as a string
 */
export const inferDataType = (value: unknown): string => {
  if (value === null || value === undefined || value === '') return 'string';
  if (typeof value === 'boolean') return 'boolean';
  if (typeof value === 'number') return 'number';
  if (typeof value === 'string') {
    if (value.toLowerCase() === 'true' || value.toLowerCase() === 'false') return 'boolean';
    const cleanedValue = value.replace(/[^0-9.-]/g, '');
    if (!isNaN(Number(cleanedValue)) && cleanedValue.trim().length > 0) return 'number';
    if (isLikelyDate(value)) return 'date';
  }
  return 'string';
};

/**
 * Determines if a string value likely represents a date
 * @param value - The string value to check
 * @returns True if the value appears to be a date
 */
export const isLikelyDate = (value: string): boolean => {
  const dateRegex = new RegExp('^\\d{4}[-/]\\d{2}[-/]\\d{2}$|^\\d{2}[-/]\\d{2}[-/]\\d{4}$|^\\d{1,2}/\\d{1,2}/\\d{2,4}$');
  if (dateRegex.test(value)) {
    const date = new Date(value);
    return !isNaN(date.getTime());
  }
  return false;
};

/**
 * Cleans and converts a value to the specified type
 * @param value - The value to convert
 * @param type - The target data type
 * @returns The converted value
 */
export const cleanAndConvertValue = (value: unknown, type: string): string | number | Date | boolean => {
  if (value === null || value === undefined) return '';
  if (type === 'number') {
    const cleaned = String(value).replace(/[^0-9.-]/g, '');
    return parseFloat(cleaned);
  }
  if (type === 'boolean') {
    return String(value).toLowerCase() === 'true';
  }
  if (type === 'date') {
    const date = new Date(String(value));
    return isNaN(date.getTime()) ? String(value) : date;
  }
  return String(value);
};
