/**
 * WebScraper Pro - Data Quality Validator
 * Validates and improves extracted data quality
 */

(function() {
  'use strict';

  class DataValidator {
    /**
     * Validate extracted results
     * @param {Array} results - Extracted data
     * @returns {Object} Validation report
     */
    static validate(results) {
      if (!results || results.length === 0) {
        return {
          valid: false,
          score: 0,
          issues: ['No data extracted'],
          suggestions: ['Try different selectors or check if page loaded correctly']
        };
      }

      const issues = [];
      const suggestions = [];
      let totalScore = 0;
      let validRecords = 0;

      // Check each record
      results.forEach((record, index) => {
        const recordIssues = [];
        let recordScore = 100;

        // Check for empty records
        const nonEmptyFields = Object.values(record).filter(v => 
          v !== null && v !== undefined && v !== '' && 
          !(Array.isArray(v) && v.length === 0)
        ).length;

        if (nonEmptyFields === 0) {
          recordIssues.push('Empty record');
          recordScore -= 50;
        } else if (nonEmptyFields < 2) {
          recordIssues.push('Record has very few fields');
          recordScore -= 20;
        }

        // Check for duplicate records
        if (index > 0) {
          const isDuplicate = results.slice(0, index).some(prevRecord => {
            return JSON.stringify(prevRecord) === JSON.stringify(record);
          });
          if (isDuplicate) {
            recordIssues.push('Duplicate record');
            recordScore -= 30;
          }
        }

        // Validate field values
        Object.entries(record).forEach(([key, value]) => {
          if (key.startsWith('_')) return; // Skip metadata

          // Check for suspicious patterns
          if (typeof value === 'string') {
            // Too short
            if (value.length < 2) {
              recordIssues.push(`Field "${key}" is too short`);
              recordScore -= 5;
            }
            
            // Too long (likely CSS/noise)
            if (value.length > 5000) {
              recordIssues.push(`Field "${key}" is suspiciously long (possible CSS/noise)`);
              recordScore -= 15;
            }

            // All same value (suspicious)
            if (index > 0 && results.slice(0, index).every(r => r[key] === value)) {
              recordIssues.push(`Field "${key}" has same value across all records`);
              recordScore -= 10;
            }

            // Validate specific formats
            if (key.toLowerCase().includes('email') && !this.isValidEmail(value)) {
              recordIssues.push(`Field "${key}" doesn't look like a valid email`);
              recordScore -= 5;
            }

            if (key.toLowerCase().includes('price') && !this.isValidPrice(value)) {
              recordIssues.push(`Field "${key}" doesn't look like a valid price`);
              recordScore -= 5;
            }

            if (key.toLowerCase().includes('url') && !this.isValidUrl(value)) {
              recordIssues.push(`Field "${key}" doesn't look like a valid URL`);
              recordScore -= 5;
            }
          }
        });

        if (recordScore > 70) {
          validRecords++;
        }

        if (recordIssues.length > 0) {
          issues.push({
            recordIndex: index + 1,
            issues: recordIssues,
            score: recordScore
          });
        }

        totalScore += recordScore;
      });

      const averageScore = totalScore / results.length;
      const validPercentage = (validRecords / results.length) * 100;

      // Generate suggestions
      if (validPercentage < 50) {
        suggestions.push('Less than 50% of records are valid. Consider refining your selectors.');
      }

      if (issues.length > results.length * 0.3) {
        suggestions.push('Many records have issues. Check if selectors are too broad or too narrow.');
      }

      const emptyFields = this.findEmptyFields(results);
      if (emptyFields.length > 0) {
        suggestions.push(`Fields with many empty values: ${emptyFields.slice(0, 3).join(', ')}. Consider removing or fixing these selectors.`);
      }

      return {
        valid: averageScore > 70,
        score: Math.round(averageScore),
        validRecords: validRecords,
        totalRecords: results.length,
        validPercentage: Math.round(validPercentage),
        issues: issues,
        suggestions: suggestions,
        emptyFields: emptyFields
      };
    }

    /**
     * Find fields with many empty values
     */
    static findEmptyFields(results) {
      const fieldStats = {};
      
      results.forEach(record => {
        Object.keys(record).forEach(key => {
          if (!fieldStats[key]) {
            fieldStats[key] = { total: 0, empty: 0 };
          }
          fieldStats[key].total++;
          const value = record[key];
          if (value === null || value === undefined || value === '' || 
              (Array.isArray(value) && value.length === 0)) {
            fieldStats[key].empty++;
          }
        });
      });

      return Object.entries(fieldStats)
        .filter(([key, stats]) => (stats.empty / stats.total) > 0.5)
        .map(([key, stats]) => ({
          field: key,
          emptyPercentage: Math.round((stats.empty / stats.total) * 100)
        }))
        .sort((a, b) => b.emptyPercentage - a.emptyPercentage);
    }

    /**
     * Clean and normalize results
     */
    static clean(results) {
      return results.map(record => {
        const cleaned = {};
        
        Object.entries(record).forEach(([key, value]) => {
          // Skip metadata fields
          if (key.startsWith('_')) {
            cleaned[key] = value;
            return;
          }

          if (typeof value === 'string') {
            // Trim whitespace
            value = value.trim();
            
            // Remove excessive whitespace
            value = value.replace(/\s+/g, ' ');
            
            // Skip if too short or suspiciously long
            if (value.length < 2 || value.length > 10000) {
              return;
            }
          }

          cleaned[key] = value;
        });

        // Only return if has at least one non-metadata field
        const hasData = Object.keys(cleaned).some(k => !k.startsWith('_') && cleaned[k]);
        return hasData ? cleaned : null;
      }).filter(r => r !== null);
    }

    /**
     * Validate email format
     */
    static isValidEmail(email) {
      if (!email || typeof email !== 'string') return false;
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      return emailRegex.test(email);
    }

    /**
     * Validate price format
     */
    static isValidPrice(price) {
      if (!price || typeof price !== 'string') return false;
      const priceRegex = /[\$£€¥]?\s*\d+([.,]\d{2})?/;
      return priceRegex.test(price);
    }

    /**
     * Validate URL format
     */
    static isValidUrl(url) {
      if (!url || typeof url !== 'string') return false;
      try {
        new URL(url);
        return true;
      } catch {
        return false;
      }
    }
  }

  // Export
  if (typeof module !== 'undefined' && module.exports) {
    module.exports = DataValidator;
  } else {
    window.DataValidator = DataValidator;
  }

  console.log('[DataValidator] Module loaded');

})();
