// Utility functions for cleaning up demo data references
// and ensuring only real CSV data is used

/**
 * Validates that data is from real CSV upload, not demo data
 * @param data - Array of data rows from CSV
 * @returns boolean indicating if data is valid real data
 */
export const isRealCSVData = (data: unknown[]): boolean => {
  if (!data || data.length === 0) return false;
  
  // Check for demo data patterns that should be removed
  const demoPatterns = [
    'Premium Laptop Pro',
    'Smart Home Security System',
    'Wireless Gaming Headset',
    'sample_data',
    'test_data',
    'demo_'
  ];
  
  const firstRow = data[0] as Record<string, unknown>;
  const values = Object.values(firstRow).join(' ').toLowerCase();
  
  return !demoPatterns.some(pattern => values.includes(pattern.toLowerCase()));
};

/**
 * Filters out any demo data from uploaded CSV
 * @param data - Raw CSV data
 * @returns Cleaned data with demo entries removed
 */
export const removeDemoData = (data: unknown[]): unknown[] => {
  if (!data || data.length === 0) return [];
  
  return data.filter(row => {
    const rowData = row as Record<string, unknown>;
    const rowString = Object.values(rowData).join(' ').toLowerCase();
    
    // Remove rows that contain demo data indicators
    const demoIndicators = [
      'demo', 'sample', 'test_', 'mock_', 'fake_',
      'premium laptop pro', 'smart home security'
    ];
    
    return !demoIndicators.some(indicator => 
      rowString.includes(indicator.toLowerCase())
    );
  });
};
