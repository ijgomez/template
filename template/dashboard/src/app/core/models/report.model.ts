/**
 * Export format options for reports.
 */
export type ExportFormat = 'PDF' | 'XLSX' | 'CSV' | 'TXT';

/**
 * Represents a report available to the user.
 */
export interface Report {
  id: number;
  name: string;
  description: string;
}

/**
 * Represents a filter definition for a report.
 */
export interface ReportFilter {
  name: string;
  label: string;
  type: 'TEXT' | 'NUMBER' | 'DATE' | 'SELECT';
  required: boolean;
  options?: string[];
}

/**
 * Represents a report execution result page.
 */
export interface ReportResult {
  columns: string[];
  rows: Record<string, string>[];
  totalElements: number;
  totalPages: number;
  size: number;
  number: number;
}
