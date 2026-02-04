// Options page script
const ANALYTICS_KEY = 'focusFlowAnalytics';

// Reset button
document.getElementById('resetBtn').addEventListener('click', async () => {
  if (confirm('Are you sure you want to reset all settings to defaults?')) {
    try {
      await chrome.storage.local.set({
        enabled: true,
        hideSidebar: true,
        hideComments: true,
        hideHomeGrid: true,
        whitelistedChannels: [],
        blacklistedChannels: []
      });
      alert('Settings reset successfully! Please refresh your YouTube tabs.');
    } catch (error) {
      console.error('Error resetting settings:', error);
      alert('Error resetting settings. Please try again.');
    }
  }
});

// Analytics viewing
document.getElementById('viewAnalytics').addEventListener('click', async () => {
  const display = document.getElementById('analyticsDisplay');
  
  if (display.style.display === 'none') {
    try {
      const data = await chrome.storage.local.get([ANALYTICS_KEY]);
      const analytics = data[ANALYTICS_KEY] || {};
      
      if (!analytics.installDate) {
        display.innerHTML = '<p>No analytics data available yet.</p>';
        display.style.display = 'block';
        return;
      }
      
      const installDate = new Date(analytics.installDate);
      const lastActive = analytics.lastActiveDate ? new Date(analytics.lastActiveDate) : null;
      const totalTime = analytics.totalTimeActive || 0;
      const hours = Math.floor(totalTime / (1000 * 60 * 60));
      const minutes = Math.floor((totalTime % (1000 * 60 * 60)) / (1000 * 60));
      
      let html = `
        <h3 style="margin-top: 0; color: #030303;">Usage Statistics</h3>
        <p><strong>Installed:</strong> ${installDate.toLocaleDateString()}</p>
        <p><strong>Total Sessions:</strong> ${analytics.totalSessions || 0}</p>
        <p><strong>Total Active Time:</strong> ${hours}h ${minutes}m</p>
        <p><strong>Total Toggles:</strong> ${analytics.togglesCount || 0}</p>
      `;
      
      if (lastActive) {
        html += `<p><strong>Last Active:</strong> ${lastActive.toLocaleDateString()}</p>`;
      }
      
      if (analytics.featuresUsed) {
        html += `<h4 style="margin-top: 16px; color: #030303;">Feature Usage:</h4>`;
        html += `<ul style="list-style: none; padding-left: 0;">`;
        if (analytics.featuresUsed.hideSidebar) {
          html += `<li>Sidebar hidden: ${analytics.featuresUsed.hideSidebar} times</li>`;
        }
        if (analytics.featuresUsed.hideComments) {
          html += `<li>Comments hidden: ${analytics.featuresUsed.hideComments} times</li>`;
        }
        if (analytics.featuresUsed.hideHomeGrid) {
          html += `<li>Home grid hidden: ${analytics.featuresUsed.hideHomeGrid} times</li>`;
        }
        html += `</ul>`;
      }
      
      if (analytics.channelsWhitelisted || analytics.channelsBlacklisted) {
        html += `<h4 style="margin-top: 16px; color: #030303;">Channel Management:</h4>`;
        html += `<ul style="list-style: none; padding-left: 0;">`;
        if (analytics.channelsWhitelisted) {
          html += `<li>Channels whitelisted: ${analytics.channelsWhitelisted}</li>`;
        }
        if (analytics.channelsBlacklisted) {
          html += `<li>Channels blacklisted: ${analytics.channelsBlacklisted}</li>`;
        }
        html += `</ul>`;
      }
      
      display.innerHTML = html;
      display.style.display = 'block';
    } catch (error) {
      console.error('Error loading analytics:', error);
      display.innerHTML = '<p style="color: #f44336;">Error loading analytics data.</p>';
      display.style.display = 'block';
    }
  } else {
    display.style.display = 'none';
  }
});
