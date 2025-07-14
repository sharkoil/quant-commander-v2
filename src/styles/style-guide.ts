/**
 * Style Guide for Quant Commander
 * Centralized styling constants to ensure consistent design and accessibility
 * 
 * Design Principles:
 * - High contrast text on all backgrounds
 * - Never use gray/white text on white/gray backgrounds
 * - Consistent color schemes across all components
 * - Accessible color combinations (WCAG AA compliant)
 */

export const StyleGuide = {
  // Color Palette
  colors: {
    // Primary Brand Colors
    primary: {
      blue: '#2563eb',     // Primary blue
      lightBlue: '#3b82f6', // Light blue for hover states
      darkBlue: '#1d4ed8',  // Dark blue for active states
    },
    
    // Status Colors (High Contrast)
    status: {
      favorable: '#059669',   // Strong green for favorable outcomes
      unfavorable: '#dc2626', // Strong red for unfavorable outcomes
      neutral: '#6b7280',     // Medium gray for neutral
      warning: '#d97706',     // Orange for warnings
    },
    
    // Text Colors (Always High Contrast)
    text: {
      primary: '#111827',     // Very dark gray/black for primary text
      secondary: '#374151',   // Dark gray for secondary text
      muted: '#6b7280',      // Medium gray for muted text (only on white backgrounds)
      inverse: '#ffffff',     // White text for dark backgrounds
      light: '#9ca3af',      // Light gray only for dark backgrounds
    },
    
    // Background Colors
    background: {
      white: '#ffffff',       // Pure white
      gray50: '#f9fafb',     // Very light gray
      gray100: '#f3f4f6',    // Light gray
      gray200: '#e5e7eb',    // Medium light gray
      gray800: '#1f2937',    // Dark gray
      gray900: '#111827',    // Very dark gray
    },
    
    // Data Visualization Colors (High Contrast)
    data: {
      budget: '#2563eb',      // Blue for budget values
      actual: '#059669',      // Green for actual values  
      variance: '#dc2626',    // Red for negative variance
      variancePositive: '#059669', // Green for positive variance
    }
  },
  
  // Typography Rules
  typography: {
    // Font sizes with consistent line heights
    sizes: {
      xs: 'text-xs',        // 12px
      sm: 'text-sm',        // 14px
      base: 'text-base',    // 16px
      lg: 'text-lg',        // 18px
      xl: 'text-xl',        // 20px
      '2xl': 'text-2xl',    // 24px
    },
    
    // Font weights
    weights: {
      normal: 'font-normal',
      medium: 'font-medium',
      semibold: 'font-semibold',
      bold: 'font-bold',
    }
  },
  
  // Spacing and Layout
  spacing: {
    // Standard spacing units
    xs: '0.25rem',    // 4px
    sm: '0.5rem',     // 8px
    md: '1rem',       // 16px
    lg: '1.5rem',     // 24px
    xl: '2rem',       // 32px
    '2xl': '3rem',    // 48px
  },
  
  // Component-specific styles
  components: {
    // Card styling
    card: {
      background: 'bg-white',
      border: 'border border-gray-200',
      shadow: 'shadow-sm hover:shadow-md',
      radius: 'rounded-lg',
      padding: 'p-4',
    },
    
    // Table styling for high contrast
    table: {
      header: {
        background: 'bg-gray-100',
        text: 'text-gray-900 font-medium',
        padding: 'px-3 py-2',
      },
      row: {
        even: 'bg-white',
        odd: 'bg-gray-50',
        hover: 'hover:bg-blue-50',
        padding: 'px-3 py-2',
      },
      cell: {
        primary: 'text-gray-900',      // Always dark text for readability
        secondary: 'text-gray-700',    // Slightly lighter but still readable
        number: 'text-gray-900 font-medium', // Numbers should be prominent
      }
    },
    
    // Button styling
    button: {
      primary: 'bg-blue-600 hover:bg-blue-700 text-white',
      secondary: 'bg-gray-200 hover:bg-gray-300 text-gray-900',
      success: 'bg-green-600 hover:bg-green-700 text-white',
      danger: 'bg-red-600 hover:bg-red-700 text-white',
    },
    
    // Form input styling
    input: {
      base: 'border border-gray-300 rounded-lg px-3 py-2 text-gray-900 bg-white',
      focus: 'focus:ring-2 focus:ring-blue-500 focus:border-transparent',
      disabled: 'disabled:bg-gray-100 disabled:text-gray-500',
    }
  },
  
  // Accessibility Rules
  accessibility: {
    // Minimum contrast ratios (WCAG AA)
    minContrast: 4.5,
    
    // Focus indicators
    focus: 'focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2',
    
    // Screen reader text
    srOnly: 'sr-only',
  }
} as const;

/**
 * Helper functions for consistent styling
 */
export const getStatusColor = (status: 'favorable' | 'unfavorable' | 'neutral'): string => {
  const colorMap = {
    favorable: StyleGuide.colors.status.favorable,
    unfavorable: StyleGuide.colors.status.unfavorable,
    neutral: StyleGuide.colors.status.neutral,
  };
  return colorMap[status];
};

export const getTextColorClass = (background: 'white' | 'gray' | 'dark'): string => {
  const colorMap = {
    white: 'text-gray-900',      // Dark text on white background
    gray: 'text-gray-900',       // Dark text on gray background  
    dark: 'text-white',          // White text on dark background
  };
  return colorMap[background];
};

export const getTableCellClass = (type: 'primary' | 'secondary' | 'number' = 'primary'): string => {
  return StyleGuide.components.table.cell[type];
};

export const formatCurrency = (amount: number): string => {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0
  }).format(amount);
};

export const formatPercentage = (value: number, decimals: number = 1): string => {
  return `${value.toFixed(decimals)}%`;
};

/**
 * Style Guide Documentation
 * 
 * NEVER DO:
 * - Use gray text on white backgrounds in data tables
 * - Use white text on gray backgrounds  
 * - Use text-gray-500 or lighter on white/gray backgrounds
 * - Use inconsistent color schemes across components
 * 
 * ALWAYS DO:
 * - Use text-gray-900 for primary text on light backgrounds
 * - Use text-white for text on dark backgrounds
 * - Ensure 4.5:1 contrast ratio minimum
 * - Use consistent colors from this style guide
 * - Test readability on different devices and lighting
 */
