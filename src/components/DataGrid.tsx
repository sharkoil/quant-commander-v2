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
    if (!wrapperRef.current) return;

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

  return <div ref={wrapperRef} className="w-full min-w-0" />;
};

export default DataGrid;