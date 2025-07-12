/**
 * TypeScript interfaces for Analysis Tab functionality
 * Provides type safety for analysis results and draggable items
 */

export type AnalysisType = 
  | 'period-variance' 
  | 'budget-variance' 
  | 'trend-analysis' 
  | 'top-n' 
  | 'contribution'
  | 'column-intelligence';

export interface AnalysisResult {
  id: string;
  type: AnalysisType;
  title: string;
  createdAt: Date;
  htmlOutput: string;
  metadata: AnalysisMetadata;
  parameters: Record<string, unknown>;
  status: 'completed' | 'running' | 'error';
}

export interface AnalysisMetadata {
  datasetName: string;
  recordCount: number;
  processingTime: number;
  columns: string[];
  insights: string[];
}

export interface DraggableAnalysisItem {
  id: string;
  order: number;
  isPinned: boolean;
  result: AnalysisResult;
}

export interface AnalysisFilters {
  type?: AnalysisType;
  dateRange?: {
    start: Date;
    end: Date;
  };
  searchQuery?: string;
  showPinnedOnly?: boolean;
}

export interface AnalysisTypeConfig {
  type: AnalysisType;
  icon: string;
  name: string;
  color: string;
  description: string;
}
