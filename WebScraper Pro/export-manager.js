/**
 * WebScraper Pro - Export Manager
 * CSV/JSON export functionality
 */

(function() {
  'use strict';

  // ============================================================================
  // EXPORT MANAGER CLASS
  // ============================================================================
  
  class ExportManager {
    /**
     * Export results to CSV
     */
    static exportToCSV(results, filename = 'webscraper-export.csv') {
      if (!results || results.length === 0) {
        throw new Error('No data to export');
      }

      // Get all unique keys from all results
      const allKeys = new Set();
      results.forEach(item => {
        Object.keys(item).forEach(key => allKeys.add(key));
      });

      const headers = Array.from(allKeys);
      
      // Build CSV rows
      const rows = [headers.join(',')];
      
      results.forEach(item => {
        const row = headers.map(header => {
          const value = item[header];
          
          if (value === null || value === undefined) {
            return '';
          }
          
          // Handle arrays and objects
          if (typeof value === 'object') {
            return JSON.stringify(value).replace(/"/g, '""');
          }
          
          // Escape quotes and wrap in quotes if contains comma
          const stringValue = String(value);
          if (stringValue.includes(',') || stringValue.includes('"') || stringValue.includes('\n')) {
            return `"${stringValue.replace(/"/g, '""')}"`;
          }
          
          return stringValue;
        });
        
        rows.push(row.join(','));
      });

      const csvContent = rows.join('\n');
      
      // Download file
      this.downloadFile(csvContent, filename, 'text/csv');
      
      return csvContent;
    }

    /**
     * Export results to JSON
     */
    static exportToJSON(results, filename = 'webscraper-export.json') {
      if (!results || results.length === 0) {
        throw new Error('No data to export');
      }

      const jsonContent = JSON.stringify(results, null, 2);
      
      // Download file
      this.downloadFile(jsonContent, filename, 'application/json');
      
      return jsonContent;
    }

    /**
     * Export results to XLSX (Excel)
     * Note: Requires SheetJS library, falls back to CSV if not available
     */
    static exportToXLSX(results, filename = 'webscraper-export.xlsx') {
      // Check if SheetJS is available
      if (typeof XLSX === 'undefined') {
        console.warn('[ExportManager] XLSX library not available, falling back to CSV');
        return this.exportToCSV(results, filename.replace('.xlsx', '.csv'));
      }

      if (!results || results.length === 0) {
        throw new Error('No data to export');
      }

      // Get all unique keys
      const allKeys = new Set();
      results.forEach(item => {
        Object.keys(item).forEach(key => allKeys.add(key));
      });

      const headers = Array.from(allKeys);
      
      // Build worksheet data
      const worksheetData = [headers];
      
      results.forEach(item => {
        const row = headers.map(header => {
          const value = item[header];
          
          if (value === null || value === undefined) {
            return '';
          }
          
          if (typeof value === 'object') {
            return JSON.stringify(value);
          }
          
          return value;
        });
        
        worksheetData.push(row);
      });

      // Create workbook
      const wb = XLSX.utils.aoa_to_sheet(worksheetData);
      const workbook = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(workbook, wb, 'Sheet1');

      // Generate file
      XLSX.writeFile(workbook, filename);
      
      return true;
    }

    /**
     * Download file
     */
    static downloadFile(content, filename, mimeType) {
      const blob = new Blob([content], { type: mimeType });
      const url = URL.createObjectURL(blob);
      
      const a = document.createElement('a');
      a.href = url;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      
      // Clean up
      setTimeout(() => URL.revokeObjectURL(url), 100);
    }

    /**
     * Export to clipboard
     */
    static async exportToClipboard(results, format = 'csv') {
      let content;
      
      if (format === 'csv') {
        content = this.exportToCSV(results, 'temp.csv');
      } else {
        content = this.exportToJSON(results, 'temp.json');
      }
      
      try {
        await navigator.clipboard.writeText(content);
        return true;
      } catch (error) {
        console.error('[ExportManager] Clipboard write failed:', error);
        return false;
      }
    }

    /**
     * Flatten nested objects for export - IMPROVED to handle objects properly
     */
    static flattenResults(results) {
      return results.map(item => {
        const flattened = {};
        
        const flatten = (obj, prefix = '') => {
          Object.keys(obj).forEach(key => {
            // Skip internal metadata fields
            if (key.startsWith('_') && key !== '_index') {
              return;
            }
            
            const value = obj[key];
            const newKey = prefix ? `${prefix}.${key}` : key;
            
            if (value === null || value === undefined) {
              flattened[newKey] = '';
            } else if (Array.isArray(value)) {
              // Handle arrays - extract strings, skip objects
              const cleanArray = value
                .map(v => {
                  if (typeof v === 'string') return v;
                  if (typeof v === 'object' && v !== null) {
                    // Try to extract meaningful data from objects
                    if (v.url) return v.url;
                    if (v.text) return v.text;
                    if (v.src) return v.src;
                    return JSON.stringify(v);
                  }
                  return String(v);
                })
                .filter(v => v && v.trim().length > 0 && !this.isCSSContent(v));
              
              flattened[newKey] = cleanArray.join('; ');
            } else if (typeof value === 'object') {
              // Handle objects - extract meaningful properties
              if (value.url) {
                flattened[newKey] = value.url;
              } else if (value.text) {
                flattened[newKey] = value.text;
              } else if (value.src) {
                flattened[newKey] = value.src;
              } else {
                // Try to stringify, but filter out CSS
                const str = JSON.stringify(value);
                if (!this.isCSSContent(str)) {
                  flattened[newKey] = str;
                } else {
                  flattened[newKey] = '';
                }
              }
            } else {
              // String or number - filter CSS content
              const strValue = String(value);
              if (!this.isCSSContent(strValue)) {
                flattened[newKey] = strValue;
              } else {
                flattened[newKey] = '';
              }
            }
          });
        };
        
        flatten(item);
        return flattened;
      });
    }
    
    /**
     * Check if content is CSS/style code
     */
    static isCSSContent(text) {
      if (!text || typeof text !== 'string') return false;
      
      const cssPatterns = [
        /^\._[a-zA-Z0-9_-]+{/,
        /@media\s*\(/,
        /background-color:/,
        /border-radius:/,
        /display:\s*-webkit-box/,
        /\.cropped-image-link/,
        /\._cropped-image-link/,
        /function\([^)]*\)\s*\{/,
        /\.style_/,
        /padding:\s*\d+px/,
        /margin:\s*\d+px/,
        /font-size:\s*\d+px/,
        /color:\s*#[0-9a-fA-F]{3,6}/
      ];
      
      // If text is very long and contains many CSS patterns, it's likely CSS
      if (text.length > 500) {
        const cssMatches = cssPatterns.filter(pattern => pattern.test(text)).length;
        if (cssMatches > 3) return true;
      }
      
      // Check for specific CSS patterns
      return cssPatterns.some(pattern => pattern.test(text));
    }

    /**
     * Export to TXT (plain text)
     */
    static exportToTXT(results, filename = 'webscraper-export.txt') {
      if (!results || results.length === 0) {
        throw new Error('No data to export');
      }

      // Get all unique keys
      const allKeys = new Set();
      results.forEach(item => {
        Object.keys(item).forEach(key => allKeys.add(key));
      });
      const headers = Array.from(allKeys).sort();

      // Build text content
      const lines = [];
      
      // Header
      lines.push('='.repeat(80));
      lines.push('WEB SCRAPER EXPORT');
      lines.push('='.repeat(80));
      lines.push(`Total Records: ${results.length}`);
      lines.push(`Export Date: ${new Date().toLocaleString()}`);
      lines.push('='.repeat(80));
      lines.push('');

      // Data rows
      results.forEach((item, index) => {
        lines.push(`--- Record ${index + 1} ---`);
        headers.forEach(header => {
          const value = item[header];
          let displayValue = '';
          
          if (value === null || value === undefined) {
            displayValue = '[empty]';
          } else if (Array.isArray(value)) {
            // Clean array values
            const cleanValues = value
              .map(v => {
                if (typeof v === 'string') return this.isCSSContent(v) ? '' : v;
                if (typeof v === 'object' && v !== null) {
                  if (v.url) return v.url;
                  if (v.text) return v.text;
                  if (v.src) return v.src;
                  return '';
                }
                return String(v);
              })
              .filter(v => v && v.trim().length > 0);
            displayValue = cleanValues.join(', ') || '[empty]';
          } else if (typeof value === 'object') {
            // Extract meaningful data from objects
            if (value.url) {
              displayValue = value.url;
            } else if (value.text) {
              displayValue = value.text;
            } else if (value.src) {
              displayValue = value.src;
            } else {
              const str = JSON.stringify(value);
              displayValue = this.isCSSContent(str) ? '[empty]' : str;
            }
          } else {
            const strValue = String(value);
            displayValue = this.isCSSContent(strValue) ? '[empty]' : strValue;
          }
          
          // Truncate very long values
          if (displayValue.length > 500) {
            displayValue = displayValue.substring(0, 500) + '... [truncated]';
          }
          
          lines.push(`${header}: ${displayValue}`);
        });
        lines.push('');
      });

      const txtContent = lines.join('\n');
      
      // Download file
      this.downloadFile(txtContent, filename, 'text/plain');
      
      return txtContent;
    }

    /**
     * Format filename with timestamp
     */
    static formatFilename(baseName, extension, includeTimestamp = true) {
      let filename = baseName;
      
      if (includeTimestamp) {
        const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, -5);
        filename = `${baseName}_${timestamp}`;
      }
      
      return `${filename}.${extension}`;
    }
  }

  // ============================================================================
  // EXPORT
  // ============================================================================
  
  if (typeof module !== 'undefined' && module.exports) {
    module.exports = ExportManager;
  } else {
    window.ExportManager = ExportManager;
  }

  console.log('[ExportManager] Module loaded');

})();
