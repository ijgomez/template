import { Injectable } from '@angular/core';

/**
 * Generic CSV export service.
 * Generates and downloads a CSV file from structured data.
 */
@Injectable({
  providedIn: 'root',
})
export class CsvExportService {
  /**
   * Exports data to a CSV file and triggers a download.
   *
   * @param headers - Array of header labels for the CSV columns.
   * @param rows - Array of row arrays (each row is an array of string values).
   * @param filename - Name of the downloaded file (without extension).
   */
  export(headers: string[], rows: string[][], filename: string): void {
    const csvContent = [
      headers.map(h => this.escapeCsvField(h)).join(','),
      ...rows.map(row => row.map(field => this.escapeCsvField(field)).join(',')),
    ].join('\n');

    const blob = new Blob(['\uFEFF' + csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `${filename}.csv`;
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  }

  /**
   * Escapes a CSV field value to handle commas, quotes, and newlines.
   */
  private escapeCsvField(field: string): string {
    if (field.includes(',') || field.includes('"') || field.includes('\n')) {
      return `"${field.replace(/"/g, '""')}"`;
    }
    return field;
  }
}
