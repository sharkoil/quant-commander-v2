# Current State Analysis Design Document

## Overview

Quant Commander V2 is a sophisticated financial data analysis platform built with modern web technologies. The application follows a component-based architecture using Next.js and React, with a focus on real-time data processing, interactive visualizations, and AI-powered insights.

## Architecture

### High-Level Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                    Quant Commander V2                        │
├─────────────────────────────────────────────────────────────┤
│  Frontend Layer (Next.js 15.3.5 + React 19)               │
│  ├── UI Components (TailwindCSS 4)                         │
│  ├── Analysis Tab (Dynamic Analysis Management)            │
│  ├── Data Grid (CSV Display & Interaction)                 │
│  └── Chat UI (AI Integration)                              │
├─────────────────────────────────────────────────────────────┤
│  Business Logic Layer                                       │
│  ├── Analysis Service (Global State Management)            │
│  ├── Analysis Engines (7 Specialized Analyzers)           │
│  ├── Data Processing (CSV Parsing & Validation)            │
│  └── AI Integration (Ollama Client)                        │
├─────────────────────────────────────────────────────────────┤
│  Data Layer                                                 │
│  ├── In-Memory Data Store (CSV Data)                       │
│  ├── Analysis Results Cache                                 │
│  └── Sample Data Generator                                  │
└─────────────────────────────────────────────────────────────┘
```

### Technology Stack

- **Frontend Framework**: Next.js 15.3.5 with React 19
- **Language**: TypeScript 5 for type safety
- **Styling**: TailwindCSS 4 with custom style guide
- **Data Processing**: PapaParse for CSV handling
- **AI Integration**: Ollama for local AI model interaction
- **UI Interactions**: Shopify Draggable for drag-and-drop functionality
- **Date Handling**: date-fns for temporal operations
- **Testing**: Jest with React Testing Library

## Components and Interfaces

### Core Components

#### 1. Main Application (`src/app/page.tsx`)
- **Purpose**: Root component managing application state and tab navigation
- **Key Features**:
  - Tab management (Grid, Documents, Analysis)
  - CSV data state management
  - Ollama integration status
  - Modal management for analysis configuration
- **State Management**: React hooks for local state, global analysis service for shared state

#### 2. Analysis Tab (`src/components/AnalysisTab.tsx`)
- **Purpose**: Interactive analysis results management interface
- **Key Features**:
  - Drag-and-drop organization using Shopify Draggable
  - Real-time filtering and search
  - Collapsible analysis cards
  - Pin management for important analyses
- **Integration**: Connects to global analysis service for real-time updates

#### 3. Data Grid (`src/components/DataGrid.tsx`)
- **Purpose**: CSV data display and interaction
- **Key Features**:
  - Tabular data visualization
  - Column type detection
  - Data validation feedback
- **Performance**: Optimized for large datasets (1000+ rows)

#### 4. Analysis Controls Components
- **BudgetVarianceControls**: Blue-themed controls for budget vs actual analysis
- **TrendAnalysisControls**: Orange-themed controls with 4-column layout
- **PeriodVarianceControls**: Purple-themed controls for period comparison
- **TopNControls**: Time period and ranking configuration
- **ContributionControls**: Category and value column selection

#### 5. Modal Components
- **ContributionModal**: Configuration interface for contribution analysis
- **OutlierModal**: Statistical outlier detection configuration
- **TopNModal**: Top/Bottom N analysis setup

### Analysis Engines

#### 1. Budget Variance Analyzer
- **Location**: `src/lib/analyzers/budgetVariance*`
- **Capabilities**:
  - Real-time column recalculation
  - Multiple period support (weekly, monthly, quarterly, yearly)
  - Auto date range detection
  - Performance classification (favorable/unfavorable/on-target)

#### 2. Trend Analysis Analyzer
- **Location**: `src/lib/analyzers/trendAnalysis*`
- **Capabilities**:
  - Simple and exponential moving averages
  - Trend direction classification
  - Momentum analysis
  - Volatility measurement

#### 3. Top N/Bottom N Analyzer
- **Location**: `src/lib/analyzers/topN*`
- **Capabilities**:
  - Multi-time scale analysis (Total, Year, Quarter, Month)
  - Smart date column detection
  - Period-specific rankings
  - Growth rate calculations

#### 4. Outlier Detection Analyzer
- **Location**: `src/lib/analyzers/outlierDetection*`
- **Capabilities**:
  - IQR and Z-Score methodologies
  - Variance-based analysis
  - Interactive scatter plot visualization
  - Risk level assessment

#### 5. Contribution Analysis Analyzer
- **Location**: `src/lib/analyzers/contribution*`
- **Capabilities**:
  - Hierarchical breakdowns
  - Quarterly analysis with seasonal patterns
  - Concentration analysis
  - Diversity metrics (Simpson's Index)

#### 6. Period Variance Analyzer
- **Location**: `src/lib/analyzers/periodVariance*`
- **Capabilities**:
  - Period-over-period comparisons
  - Trend detection with emoji indicators
  - Statistical insights
  - Multiple time scale support

#### 7. Column Intelligence Analyzer
- **Location**: `src/lib/analyzers/columnIntelligence*`
- **Capabilities**:
  - Smart column detection and mapping
  - Data quality assessment
  - LLM-powered column interpretation
  - Confidence scoring

## Data Models

### Core Data Types

```typescript
// Analysis Result Structure
interface AnalysisResult {
  id: string;
  type: AnalysisType;
  title: string;
  createdAt: Date;
  htmlOutput: string;
  metadata: AnalysisMetadata;
  parameters: Record<string, unknown>;
  status: 'completed' | 'running' | 'error';
}

// Analysis Types
type AnalysisType = 
  | 'period-variance' 
  | 'budget-variance' 
  | 'trend-analysis' 
  | 'contribution'
  | 'column-intelligence'
  | 'outlier-detection'
  | 'top-n';

// Metadata Structure
interface AnalysisMetadata {
  datasetName: string;
  recordCount: number;
  processingTime: number;
  columns: string[];
  insights: string[];
}
```

### Data Flow

1. **CSV Upload**: User uploads CSV file via drag-and-drop or file picker
2. **Data Processing**: PapaParse converts CSV to structured data array
3. **Column Detection**: Automatic inference of column types (Number/Date/Text)
4. **Analysis Execution**: Selected analyzer processes data with user parameters
5. **Result Generation**: Analysis produces HTML output with insights
6. **State Management**: Results stored in global analysis service
7. **UI Update**: Analysis tab updates with new results via callback system

## Error Handling

### Data Validation
- **CSV Format Validation**: Ensures proper CSV structure and encoding
- **Column Type Validation**: Validates expected data types for analysis
- **Missing Data Handling**: Graceful handling of null/undefined values
- **Date Format Support**: Multiple date format recognition and parsing

### Analysis Error Handling
- **Parameter Validation**: Ensures required parameters are provided
- **Data Sufficiency Checks**: Validates minimum data requirements
- **Calculation Error Recovery**: Handles division by zero and invalid operations
- **User Feedback**: Clear error messages with troubleshooting guidance

### Performance Error Handling
- **Memory Management**: Efficient handling of large datasets
- **Timeout Protection**: Prevents long-running calculations from blocking UI
- **Progressive Loading**: Chunked processing for large data sets

## Testing Strategy

### Unit Testing
- **Component Tests**: React component rendering and interaction tests
- **Analysis Engine Tests**: Comprehensive testing of calculation logic
- **Utility Function Tests**: Data processing and validation function tests
- **Service Layer Tests**: Analysis service and state management tests

### Integration Testing
- **End-to-End Workflows**: Complete analysis workflows from upload to results
- **Cross-Component Communication**: Testing component interaction patterns
- **Data Flow Testing**: Validation of data processing pipelines

### Performance Testing
- **Large Dataset Testing**: Performance validation with 1000+ record datasets
- **Memory Usage Testing**: Memory leak detection and optimization
- **Rendering Performance**: UI responsiveness under load

### Browser Compatibility Testing
- **Cross-Browser Testing**: Chrome, Firefox, Safari, Edge compatibility
- **Mobile Responsiveness**: Touch interface and responsive design validation
- **Accessibility Testing**: Screen reader and keyboard navigation testing

## Security Considerations

### Data Privacy
- **Client-Side Processing**: All data processing occurs in the browser
- **No Data Transmission**: CSV data never leaves the user's machine
- **Local AI Integration**: Ollama runs locally, no cloud AI dependencies

### Input Validation
- **CSV Sanitization**: Proper handling of potentially malicious CSV content
- **Parameter Validation**: Strict validation of user input parameters
- **XSS Prevention**: Safe HTML rendering for analysis results

## Performance Optimizations

### Data Processing
- **Streaming CSV Parsing**: Efficient parsing of large CSV files
- **Lazy Loading**: Dynamic component loading for improved initial load times
- **Memoization**: Caching of expensive calculations
- **Worker Threads**: Background processing for intensive calculations (future enhancement)

### UI Performance
- **Virtual Scrolling**: Efficient rendering of large data tables
- **Debounced Updates**: Optimized real-time parameter updates
- **Component Optimization**: React.memo and useMemo for expensive renders
- **Bundle Optimization**: Code splitting and tree shaking

### Memory Management
- **Garbage Collection**: Proper cleanup of analysis results and event listeners
- **Data Structure Optimization**: Efficient data structures for large datasets
- **Memory Monitoring**: Development tools for memory usage tracking