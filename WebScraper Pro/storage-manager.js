/**
 * WebScraper Pro - Storage Manager
 * State persistence with chrome.storage.local
 * 
 * Manages:
 * - Sitemaps
 * - Scraping jobs
 * - Results
 * - Settings
 */

(function() {
  'use strict';

  // ============================================================================
  // STORAGE KEYS
  // ============================================================================
  
  const STORAGE_KEYS = {
    SITEMAPS: 'webscraper_sitemaps',
    JOBS: 'webscraper_jobs',
    RESULTS: 'webscraper_results',
    SETTINGS: 'webscraper_settings',
    PENDING_URLS: 'webscraper_pending_urls',
    FAILED_URLS: 'webscraper_failed_urls'
  };

  // ============================================================================
  // STORAGE MANAGER CLASS
  // ============================================================================
  
  class StorageManager {
    /**
     * Save sitemap
     */
    static async saveSitemap(sitemap) {
      const sitemaps = await this.getSitemaps();
      const existingIndex = sitemaps.findIndex(s => s.id === sitemap.id);
      
      if (existingIndex >= 0) {
        sitemaps[existingIndex] = sitemap;
      } else {
        sitemaps.push(sitemap);
      }
      
      await chrome.storage.local.set({ [STORAGE_KEYS.SITEMAPS]: sitemaps });
      return sitemap;
    }

    /**
     * Get all sitemaps
     */
    static async getSitemaps() {
      const result = await chrome.storage.local.get(STORAGE_KEYS.SITEMAPS);
      return result[STORAGE_KEYS.SITEMAPS] || [];
    }

    /**
     * Get sitemap by ID
     */
    static async getSitemap(id) {
      const sitemaps = await this.getSitemaps();
      return sitemaps.find(s => s.id === id);
    }

    /**
     * Delete sitemap
     */
    static async deleteSitemap(id) {
      const sitemaps = await this.getSitemaps();
      const filtered = sitemaps.filter(s => s.id !== id);
      await chrome.storage.local.set({ [STORAGE_KEYS.SITEMAPS]: filtered });
      return true;
    }

    /**
     * Save scraping job
     */
    static async saveJob(job) {
      const jobs = await this.getJobs();
      const existingIndex = jobs.findIndex(j => j.id === job.id);
      
      if (existingIndex >= 0) {
        jobs[existingIndex] = job;
      } else {
        jobs.push(job);
      }
      
      await chrome.storage.local.set({ [STORAGE_KEYS.JOBS]: jobs });
      return job;
    }

    /**
     * Get all jobs
     */
    static async getJobs() {
      const result = await chrome.storage.local.get(STORAGE_KEYS.JOBS);
      return result[STORAGE_KEYS.JOBS] || [];
    }

    /**
     * Get job by ID
     */
    static async getJob(id) {
      const jobs = await this.getJobs();
      return jobs.find(j => j.id === id);
    }

    /**
     * Update job status
     */
    static async updateJobStatus(jobId, status, data = {}) {
      const job = await this.getJob(jobId);
      if (!job) return null;
      
      job.status = status;
      job.updatedAt = Date.now();
      Object.assign(job, data);
      
      return await this.saveJob(job);
    }

    /**
     * Save results
     */
    static async saveResults(jobId, results) {
      const allResults = await this.getResults();
      
      if (!allResults[jobId]) {
        allResults[jobId] = [];
      }
      
      allResults[jobId].push(...results);
      
      await chrome.storage.local.set({ [STORAGE_KEYS.RESULTS]: allResults });
      return allResults[jobId];
    }

    /**
     * Get results for job
     */
    static async getResults(jobId = null) {
      const result = await chrome.storage.local.get(STORAGE_KEYS.RESULTS);
      const allResults = result[STORAGE_KEYS.RESULTS] || {};
      
      if (jobId) {
        return allResults[jobId] || [];
      }
      
      return allResults;
    }

    /**
     * Clear results for job
     */
    static async clearResults(jobId) {
      const allResults = await this.getResults();
      delete allResults[jobId];
      await chrome.storage.local.set({ [STORAGE_KEYS.RESULTS]: allResults });
      return true;
    }

    /**
     * Save pending URLs
     */
    static async savePendingUrls(jobId, urls) {
      const pending = await this.getPendingUrls();
      pending[jobId] = urls;
      await chrome.storage.local.set({ [STORAGE_KEYS.PENDING_URLS]: pending });
      return urls;
    }

    /**
     * Get pending URLs
     */
    static async getPendingUrls(jobId = null) {
      const result = await chrome.storage.local.get(STORAGE_KEYS.PENDING_URLS);
      const allPending = result[STORAGE_KEYS.PENDING_URLS] || {};
      
      if (jobId) {
        return allPending[jobId] || [];
      }
      
      return allPending;
    }

    /**
     * Save failed URLs
     */
    static async saveFailedUrl(jobId, url, error) {
      const failed = await this.getFailedUrls();
      
      if (!failed[jobId]) {
        failed[jobId] = [];
      }
      
      failed[jobId].push({
        url,
        error: error.message || error,
        timestamp: Date.now()
      });
      
      await chrome.storage.local.set({ [STORAGE_KEYS.FAILED_URLS]: failed });
      return failed[jobId];
    }

    /**
     * Get failed URLs
     */
    static async getFailedUrls(jobId = null) {
      const result = await chrome.storage.local.get(STORAGE_KEYS.FAILED_URLS);
      const allFailed = result[STORAGE_KEYS.FAILED_URLS] || {};
      
      if (jobId) {
        return allFailed[jobId] || [];
      }
      
      return allFailed;
    }

    /**
     * Get settings
     */
    static async getSettings() {
      const result = await chrome.storage.local.get(STORAGE_KEYS.SETTINGS);
      return result[STORAGE_KEYS.SETTINGS] || {
        defaultExportFormat: 'csv',
        autoScroll: true,
        maxScrolls: 10,
        scrollDelay: 1000,
        requestDelay: 500
      };
    }

    /**
     * Save settings
     */
    static async saveSettings(settings) {
      const current = await this.getSettings();
      const merged = { ...current, ...settings };
      await chrome.storage.local.set({ [STORAGE_KEYS.SETTINGS]: merged });
      return merged;
    }

    /**
     * Clear all data (for testing/reset)
     */
    static async clearAll() {
      await chrome.storage.local.remove([
        STORAGE_KEYS.SITEMAPS,
        STORAGE_KEYS.JOBS,
        STORAGE_KEYS.RESULTS,
        STORAGE_KEYS.PENDING_URLS,
        STORAGE_KEYS.FAILED_URLS
      ]);
      return true;
    }

    /**
     * Get storage usage
     */
    static async getStorageUsage() {
      const usage = await chrome.storage.local.getBytesInUse(null);
      return {
        bytes: usage,
        mb: (usage / 1024 / 1024).toFixed(2)
      };
    }

    /**
     * Clean up old data based on retention policy
     */
    static async cleanupOldData(retentionDays = 30) {
      const cutoffDate = Date.now() - (retentionDays * 24 * 60 * 60 * 1000);
      
      try {
        const jobs = await this.getJobs();
        const oldJobs = jobs.filter(job => job.createdAt < cutoffDate && job.status === 'completed');
        
        let cleanedCount = 0;
        for (const job of oldJobs) {
          // Delete job results
          await chrome.storage.local.remove(`results_${job.id}`);
          await chrome.storage.local.remove(`pendingUrls_${job.id}`);
          await chrome.storage.local.remove(`failedUrls_${job.id}`);
          
          // Delete job
          const jobs = await this.getJobs();
          const updatedJobs = jobs.filter(j => j.id !== job.id);
          await chrome.storage.local.set({ jobs: updatedJobs });
          
          cleanedCount++;
        }
        
        console.log(`[StorageManager] Cleaned up ${cleanedCount} old jobs`);
        return cleanedCount;
      } catch (error) {
        console.error('[StorageManager] Error cleaning up old data:', error);
        return 0;
      }
    }
    
    /**
     * Get storage statistics
     */
    static async getStorageStats() {
      try {
        const allData = await chrome.storage.local.get(null);
        const size = JSON.stringify(allData).length;
        const jobs = await this.getJobs();
        const sitemaps = await this.getSitemaps();
        
        let totalResults = 0;
        for (const job of jobs) {
          const results = await this.getResults(job.id);
          totalResults += results?.length || 0;
        }
        
        return {
          totalSize: size,
          totalSizeMB: (size / 1024 / 1024).toFixed(2),
          jobsCount: jobs.length,
          sitemapsCount: sitemaps.length,
          totalResults: totalResults,
          estimatedQuota: chrome.storage.local.QUOTA_BYTES || 5242880, // 5MB default
          usagePercent: ((size / (chrome.storage.local.QUOTA_BYTES || 5242880)) * 100).toFixed(2)
        };
      } catch (error) {
        console.error('[StorageManager] Error getting storage stats:', error);
        return null;
      }
    }
    
    /**
     * Export all data
     */
    static async exportAll() {
      const sitemaps = await this.getSitemaps();
      const jobs = await this.getJobs();
      const settings = await this.getSettings();
      
      // Get all results
      const allResults = {};
      for (const job of jobs) {
        try {
          const jobResults = await this.getResults(job.id);
          if (jobResults && jobResults.length > 0) {
            allResults[job.id] = jobResults;
          }
        } catch (e) {
          // Skip if no results
        }
      }
      
      return {
        sitemaps,
        jobs,
        results: allResults,
        settings,
        exportDate: new Date().toISOString(),
        version: '2.1.0'
      };
    }
  }

  // ============================================================================
  // EXPORT
  // ============================================================================
  
  // For service worker context (no window object)
  if (typeof self !== 'undefined') {
    self.StorageManager = StorageManager;
  }
  
  // For window context (sidepanel)
  if (typeof window !== 'undefined') {
    window.StorageManager = StorageManager;
  }

  console.log('[StorageManager] Module loaded');

})();
