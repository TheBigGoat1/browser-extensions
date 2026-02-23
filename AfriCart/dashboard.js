// AfriCart - Dashboard: statistics, charts, activity log, export for CLI/observability

const t = window.t || (k => k);
const getEl = id => document.getElementById(id);

async function loadStats() {
  const data = await chrome.storage.local.get(['usageStats', 'statsByDate', 'activityLog']);
  const stats = data.usageStats || { totalHops: 0, hopsByStore: {}, lastHop: null };
  const byDate = data.statsByDate || {};
  const activity = data.activityLog || [];

  getEl('statTotal').textContent = Number(stats.totalHops).toLocaleString();
  const last = stats.lastHop ? new Date(stats.lastHop).toLocaleString(undefined, { dateStyle: 'short', timeStyle: 'short' }) : '—';
  getEl('statLast').textContent = last;

  const storeEntries = Object.entries(stats.hopsByStore || {}).sort((a, b) => b[1] - a[1]).slice(0, 12);
  const chartStore = getEl('chartByStore');
  const chartEmpty = getEl('chartEmpty');
  chartStore.innerHTML = '';
  if (storeEntries.length === 0) {
    chartEmpty.style.display = 'block';
  } else {
    chartEmpty.style.display = 'none';
    const max = Math.max(...storeEntries.map(([, v]) => v), 1);
    storeEntries.forEach(([name, count]) => {
      const wrap = document.createElement('div');
      wrap.className = 'chart-bar-wrap';
      const bar = document.createElement('div');
      bar.className = 'chart-bar';
      bar.style.height = `${Math.max(4, (count / max) * 100)}%`;
      bar.setAttribute('title', `${name}: ${count}`);
      const label = document.createElement('div');
      label.className = 'chart-label';
      label.textContent = name.length > 12 ? name.slice(0, 11) + '…' : name;
      wrap.appendChild(bar);
      wrap.appendChild(label);
      chartStore.appendChild(wrap);
    });
  }

  const days = 14;
  const today = new Date();
  const dateLabels = [];
  const dateCounts = [];
  for (let i = days - 1; i >= 0; i--) {
    const d = new Date(today);
    d.setDate(d.getDate() - i);
    const key = d.toISOString().slice(0, 10);
    dateLabels.push(key.slice(5));
    dateCounts.push((byDate[key] && byDate[key].count) || 0);
  }
  const chartDate = getEl('chartByDate');
  const dateEmpty = getEl('dateEmpty');
  chartDate.innerHTML = '';
  const maxDate = Math.max(...dateCounts, 1);
  dateLabels.forEach((label, i) => {
    const wrap = document.createElement('div');
    wrap.className = 'chart-bar-wrap';
    const bar = document.createElement('div');
    bar.className = 'chart-bar';
    bar.style.height = `${Math.max(4, (dateCounts[i] / maxDate) * 100)}%`;
    bar.setAttribute('title', `${label}: ${dateCounts[i]}`);
    const l = document.createElement('div');
    l.className = 'chart-label';
    l.textContent = label;
    wrap.appendChild(bar);
    wrap.appendChild(l);
    chartDate.appendChild(wrap);
  });
  if (dateCounts.every(c => c === 0)) dateEmpty.style.display = 'block';
  else dateEmpty.style.display = 'none';

  const list = getEl('activityList');
  const actEmpty = getEl('activityEmpty');
  list.innerHTML = '';
  if (activity.length === 0) {
    actEmpty.style.display = 'block';
  } else {
    actEmpty.style.display = 'none';
    activity.slice(0, 50).forEach(entry => {
      const item = document.createElement('div');
      item.className = 'activity-item';
      const time = new Date(entry.ts).toLocaleString(undefined, { dateStyle: 'short', timeStyle: 'short' });
      item.innerHTML = `<span class="activity-msg">${escapeHtml(entry.message)}</span><span class="activity-meta">${entry.store ? escapeHtml(entry.store) + ' · ' : ''}${time}</span>`;
      list.appendChild(item);
    });
  }
}

function escapeHtml(s) {
  if (!s) return '';
  const div = document.createElement('div');
  div.textContent = s;
  return div.innerHTML;
}

function exportJson() {
  chrome.storage.local.get(['usageStats', 'statsByDate', 'activityLog'], (data) => {
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = `africart-stats-${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(a.href);
  });
}

function exportCsv() {
  chrome.storage.local.get(['usageStats', 'statsByDate'], (data) => {
    const stats = data.usageStats || { totalHops: 0, hopsByStore: {} };
    const byDate = data.statsByDate || {};
    let csv = 'Store,Comparisons\n';
    Object.entries(stats.hopsByStore || {}).sort((a, b) => b[1] - a[1]).forEach(([store, count]) => {
      csv += `"${String(store).replace(/"/g, '""')}",${count}\n`;
    });
    csv += '\nDate,Comparisons\n';
    Object.entries(byDate).sort((a, b) => a[0].localeCompare(b[0])).forEach(([date, o]) => {
      csv += `${date},${(o && o.count) || 0}\n`;
    });
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = `africart-stats-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(a.href);
  });
}

async function applyTranslations() {
  const locale = await (window.initI18n ? initI18n() : Promise.resolve('en'));
  document.documentElement.lang = locale;
  const ids = ['dashboardTitle', 'dashboardNote', 'labelTotal', 'labelLast', 'labelByStore', 'labelByDate', 'labelActivity'];
  const keys = ['statistics', 'statsNote', 'totalComparisons', 'lastActivity', 'comparisonsByStore', 'comparisonsOverDays', 'activityLog'];
  ids.forEach((id, i) => {
    const el = getEl(id);
    if (el && typeof t === 'function') el.textContent = t(keys[i]);
  });
  const btnJson = getEl('exportJson');
  const btnCsv = getEl('exportCSV') || getEl('exportCsv');
  if (btnJson && window.t) btnJson.textContent = t('exportStats');
  if (btnCsv && window.t) btnCsv.textContent = t('exportCSV');
}

getEl('exportJson').addEventListener('click', exportJson);
getEl('exportCsv').addEventListener('click', exportCsv);

(async () => {
  await applyTranslations();
  await loadStats();
})();
