// src/components/DataGrid.tsx
import React, { useEffect, useRef } from 'react';
import { Grid, h } from 'gridjs';
import "gridjs/dist/theme/mermaid.css";

interface DataGridProps {
  data: (string | number | Date | boolean)[][];
  columns: string[];
}

const DataGrid: React.FC<DataGridProps> = ({ data, columns }) => {
  const wrapperRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // Guard against undefined or empty data/columns
    if (!wrapperRef.current || !data || !columns || data.length === 0 || columns.length === 0) {
      return;
    }

    const grid = new Grid({
      columns: columns.map(col => ({
        name: col,
        formatter: (cell) => {
          if (cell instanceof Date) {
            // Format Date objects to YYYY-MM-DD string
            return h('span', {}, cell.toISOString().split('T')[0]);
          } else if (typeof cell === 'boolean') {
            // Display booleans as 'True' or 'False'
            return h('span', {}, cell ? 'True' : 'False');
          }
          return h('span', {}, cell);
        }
      })),
      data: data,
      pagination: {
        limit: 10,
      },
      sort: true,
      search: true,
      className: {
        table: 'w-full divide-y divide-gray-200',
        thead: 'bg-gray-50',
        th: 'px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider whitespace-nowrap',
        tbody: 'bg-white divide-y divide-gray-200',
        td: 'px-6 py-4 text-sm text-gray-900 whitespace-nowrap',
        footer: 'flex items-center justify-between px-6 py-3 bg-white border-t border-gray-200',
        paginationButton: 'relative inline-flex items-center px-4 py-2 border border-gray-300 bg-white text-sm font-medium text-gray-700 hover:bg-gray-50',
        paginationButtonCurrent: 'z-10 bg-indigo-50 border-indigo-500 text-indigo-600',
        paginationSummary: 'text-sm text-gray-700',
      }
    }).render(wrapperRef.current);

    return () => {
      grid.destroy();
    };
  }, [data, columns]);

  // Show loading or empty state if data is not available
  if (!data || !columns || data.length === 0 || columns.length === 0) {
    return (
      <div className="w-full p-8 text-center text-gray-500">
        <div className="inline-flex items-center justify-center w-16 h-16 bg-gray-100 rounded-full mb-4">
          <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
          </svg>
        </div>
        <h3 className="text-lg font-medium text-gray-900 mb-2">No Data Available</h3>
        <p className="text-gray-500">Please upload a CSV file to view data in the grid.</p>
      </div>
    );
  }

  return <div ref={wrapperRef} className="w-full min-w-0" />;
};

export default DataGrid;