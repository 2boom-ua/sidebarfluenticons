// Fluent System Icons Viewer
// Copyright 2boom, 2026

let FLUENT_ICONS_VERSION = '';
let CDN_BASE = '';

let rawIcons = [];
let groupedIcons = [];
let currentFilter = 'regular';
let searchQuery = '';
let detailData = null;

const gridEl = document.getElementById('grid');
const modalOverlay = document.getElementById('modalOverlay');
const modalContent = document.getElementById('modalContent');
const modalCloseBtn = document.getElementById('modalCloseBtn');
const searchInput = document.getElementById('searchInput');
const clearSearchBtn = document.getElementById('clearSearchBtn');
const counterEl = document.getElementById('counter');
const filterBtns = document.querySelectorAll('.filter-btn');
const tooltipEl = document.getElementById('tooltip');
const updateBtn = document.getElementById('updateIconsBtn');

function _(key) {
  return chrome.i18n.getMessage(key);
}

function applyI18n() {
  document.querySelectorAll('[data-i18n]').forEach(el => {
    const key = el.dataset.i18n;
    const text = _(key);
    if (el.tagName === 'INPUT' || el.tagName === 'TEXTAREA') {
      el.placeholder = text;
    } else {
      el.textContent = text;
    }
  });

  document.querySelectorAll('[data-i18n-tooltip]').forEach(el => {
    if (el.id === 'updateIconsBtn') return;
    const key = el.dataset.i18nTooltip;
    const text = _(key);
    if (text) {
      el.title = text;
    }
  });
}

function setTheme() {
  const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
  if (prefersDark) {
    document.documentElement.setAttribute('data-theme', 'dark');
  } else {
    document.documentElement.removeAttribute('data-theme');
  }
}

setTheme();

window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', setTheme);

function normalizeName(name) {
  return name.replace(/_/g, ' ');
}

function getPreferredSize(sizes) {
  if (sizes.includes(24)) return 24;
  const sorted = [...sizes].sort((a, b) => a - b);
  return sorted[0] || 24;
}

function buildIconMap(items) {
  const map = {};
  for (const item of items) {
    const key = `${item.name}|${item.style}`;
    if (!map[key]) {
      map[key] = {
        name: item.name,
        style: item.style,
        sizes: []
      };
    }
    map[key].sizes.push(item.size);
  }
  for (const key in map) {
    map[key].sizes.sort((a, b) => a - b);
  }
  return Object.values(map);
}

function fetchIconsIndex() {
  return fetch(chrome.runtime.getURL('data/icons.json'))
    .then(r => {
      if (!r.ok) throw new Error('HTTP ' + r.status);
      return r.json();
    })
    .then(data => {
      let iconsArray;
      let version = '1.1.339';
      
      if (Array.isArray(data)) {
        iconsArray = data;
      } else if (data && data.icons && Array.isArray(data.icons)) {
        iconsArray = data.icons;
        version = data.version || version;
      } else {
        throw new Error('Invalid icons.json structure');
      }
      
      if (iconsArray.length === 0) {
        throw new Error('Index is empty');
      }
      
      FLUENT_ICONS_VERSION = version;
      CDN_BASE = `https://cdn.jsdelivr.net/npm/@fluentui/svg-icons@${FLUENT_ICONS_VERSION}/icons/`;
      
      const versionEl = document.querySelector('.footer .version');
      if (versionEl) {
        versionEl.textContent = 'Icons v' + FLUENT_ICONS_VERSION;
      }
      
      return iconsArray;
    });
}

function loadIconsFromStorage() {
  return new Promise((resolve) => {
    chrome.storage.local.get(['iconsData'], function(result) {
      if (result.iconsData && result.iconsData.icons && result.iconsData.icons.length > 0) {
        resolve(result.iconsData);
      } else {
        resolve(null);
      }
    });
  });
}

function saveIconsToStorage(data) {
  return new Promise((resolve) => {
    chrome.storage.local.set({ iconsData: data }, function() {
      resolve();
    });
  });
}

function loadBundledIcons() {
  return fetchIconsIndex();
}

function getFilteredIcons(icons) {
  let result = icons;
  if (currentFilter === 'regular') {
    result = result.filter(ic => ic.style === 'regular');
  } else if (currentFilter === 'filled') {
    result = result.filter(ic => ic.style === 'filled');
  }
  if (searchQuery.trim()) {
    const q = searchQuery.trim().toLowerCase();
    result = result.filter(ic => ic.name.toLowerCase().includes(q));
  }
  return result;
}

function showTooltip(card, text) {
  if (!tooltipEl) return;
  
  const rect = card.getBoundingClientRect();
  const formattedText = text.replace(/\b\w/g, c => c.toUpperCase());
  const tooltipWidth = Math.min(formattedText.length * 7 + 20, 200);
  const tooltipHeight = 28;
  
  let left = rect.left + rect.width / 2 - tooltipWidth / 2;
  let top = rect.top - tooltipHeight - 4;
  
  const padding = 8;
  const maxLeft = window.innerWidth - tooltipWidth - padding;
  const minLeft = padding;
  
  if (left < minLeft) {
    left = minLeft;
  } else if (left > maxLeft) {
    left = maxLeft;
  }
  
  if (top < padding) {
    top = rect.bottom + 8;
  }
  
  tooltipEl.textContent = formattedText;
  tooltipEl.style.left = left + 'px';
  tooltipEl.style.top = top + 'px';
  tooltipEl.style.maxWidth = '200px';
  tooltipEl.style.whiteSpace = 'nowrap';
  tooltipEl.classList.add('visible');
}

function hideTooltip() {
  if (tooltipEl) {
    tooltipEl.classList.remove('visible');
  }
}

function closeModal() {
  modalOverlay.classList.add('hidden');
  gridEl.style.display = '';
  detailData = null;
  hideTooltip();
}

function openModal(name, style, sizes, detailUrl, previewSize) {
  const defaultSize = 24;
  const selectedSize = sizes.includes(defaultSize) ? defaultSize : sizes[0];
  
  detailData = { name, style, sizes, url: detailUrl, previewSize };
  modalOverlay.classList.remove('hidden');
  hideTooltip();
  
  let sizeButtonsHtml = '';
  for (const s of sizes) {
    const activeClass = s === selectedSize ? 'active' : '';
    sizeButtonsHtml += `<button class="size-btn ${activeClass}" data-size="${s}">${s}</button>`;
  }
  
  modalContent.innerHTML = `
    <div class="detail-preview">
      <img src="${detailUrl}" alt="${name}" onerror="this.parentElement.innerHTML='<div class=\\'detail-error\\'>${_('failedLoad')}</div>';" />
    </div>
    <div class="detail-name">${normalizeName(name).replace(/\b\w/g, c => c.toUpperCase())}</div>
    <div class="detail-style">${style.charAt(0).toUpperCase() + style.slice(1)}</div>
    <div class="detail-sizes">
      <span class="sizes-label">${_('sizesLabel')}</span>
      <span class="size-buttons">${sizeButtonsHtml}</span>
    </div>
    <div class="detail-actions">
      <button class="copy-btn" data-i18n-tooltip="copySvg">
        <img src="icons/copy_24_regular.svg" width="20" height="20" alt="Copy" />
      </button>
      <button class="download-btn" data-i18n-tooltip="downloadSvg">
        <img src="icons/arrow_download_24_regular.svg" width="20" height="20" alt="Download" />
      </button>
      <button class="webfont-btn" data-i18n-tooltip="useAsFont">
        <img src="icons/ic_fluent_text_font_24_regular.svg" width="20" height="20" alt="Webfont" />
      </button>
      <button class="export-bg-btn" data-i18n-tooltip="exportBg">
        <img src="icons/ic_fluent_code_24_regular.svg" width="20" height="20" alt="Export BG" />
      </button>
    </div>
  `;

  // Re-apply i18n for dynamically added elements
  document.querySelectorAll('#modalContent [data-i18n-tooltip]').forEach(el => {
    const key = el.dataset.i18nTooltip;
    const text = _(key);
    if (text) {
      el.title = text;
    }
  });

  const previewImg = modalContent.querySelector('.detail-preview img');
  if (previewImg) {
    const targetSize = 56;
    let originalSize;
    if (sizes.includes(24)) {
      originalSize = 24;
    } else {
      const bigger = sizes.filter(s => s > 24).sort((a, b) => a - b);
      if (bigger.length > 0) {
        originalSize = bigger[0];
      } else {
        originalSize = Math.max(...sizes);
      }
    }
    const scale = targetSize / originalSize;
    previewImg.style.transform = `scale(${scale})`;
  }

  let currentSelectedSize = selectedSize;

  document.querySelectorAll('.size-btn').forEach(btn => {
    btn.addEventListener('click', function() {
      document.querySelectorAll('.size-btn').forEach(b => b.classList.remove('active'));
      this.classList.add('active');
      currentSelectedSize = parseInt(this.dataset.size, 10);
    });
  });

  const copyBtn = modalContent.querySelector('.copy-btn');
  const downloadBtn = modalContent.querySelector('.download-btn');
  const webfontBtn = modalContent.querySelector('.webfont-btn');
  const exportBgBtn = modalContent.querySelector('.export-bg-btn');

  copyBtn.addEventListener('mouseenter', function(e) {
    const rect = this.getBoundingClientRect();
    const text = this.title || _('copySvg');
    const tooltipWidth = Math.min(text.length * 7 + 20, 200);
    const tooltipHeight = 28;
    
    let left = rect.left + rect.width / 2 - tooltipWidth / 2;
    let top = rect.bottom + 8;
    
    const padding = 8;
    const maxLeft = window.innerWidth - tooltipWidth - padding;
    const minLeft = padding;
    
    if (left < minLeft) {
      left = minLeft;
    } else if (left > maxLeft) {
      left = maxLeft;
    }
    
    tooltipEl.textContent = text;
    tooltipEl.style.left = left + 'px';
    tooltipEl.style.top = top + 'px';
    tooltipEl.style.maxWidth = '200px';
    tooltipEl.style.whiteSpace = 'nowrap';
    tooltipEl.classList.add('visible');
  });

  copyBtn.addEventListener('mouseleave', hideTooltip);

  downloadBtn.addEventListener('mouseenter', function(e) {
    const rect = this.getBoundingClientRect();
    const text = this.title || _('downloadSvg');
    const tooltipWidth = Math.min(text.length * 7 + 20, 200);
    const tooltipHeight = 28;
    
    let left = rect.left + rect.width / 2 - tooltipWidth / 2;
    let top = rect.bottom + 8;
    
    const padding = 8;
    const maxLeft = window.innerWidth - tooltipWidth - padding;
    const minLeft = padding;
    
    if (left < minLeft) {
      left = minLeft;
    } else if (left > maxLeft) {
      left = maxLeft;
    }
    
    tooltipEl.textContent = text;
    tooltipEl.style.left = left + 'px';
    tooltipEl.style.top = top + 'px';
    tooltipEl.style.maxWidth = '200px';
    tooltipEl.style.whiteSpace = 'nowrap';
    tooltipEl.classList.add('visible');
  });

  downloadBtn.addEventListener('mouseleave', hideTooltip);

  webfontBtn.addEventListener('mouseenter', function(e) {
    const rect = this.getBoundingClientRect();
    const text = this.title || _('useAsFont');
    const tooltipWidth = Math.min(text.length * 7 + 20, 200);
    const tooltipHeight = 28;
    
    let left = rect.left + rect.width / 2 - tooltipWidth / 2;
    let top = rect.bottom + 8;
    
    const padding = 8;
    const maxLeft = window.innerWidth - tooltipWidth - padding;
    const minLeft = padding;
    
    if (left < minLeft) {
      left = minLeft;
    } else if (left > maxLeft) {
      left = maxLeft;
    }
    
    tooltipEl.textContent = text;
    tooltipEl.style.left = left + 'px';
    tooltipEl.style.top = top + 'px';
    tooltipEl.style.maxWidth = '200px';
    tooltipEl.style.whiteSpace = 'nowrap';
    tooltipEl.classList.add('visible');
  });

  webfontBtn.addEventListener('mouseleave', hideTooltip);

  exportBgBtn.addEventListener('mouseenter', function(e) {
    const rect = this.getBoundingClientRect();
    const text = this.title || _('exportBg');
    const tooltipWidth = Math.min(text.length * 7 + 20, 200);
    const tooltipHeight = 28;
    
    let left = rect.left + rect.width / 2 - tooltipWidth / 2;
    let top = rect.bottom + 8;
    
    const padding = 8;
    const maxLeft = window.innerWidth - tooltipWidth - padding;
    const minLeft = padding;
    
    if (left < minLeft) {
      left = minLeft;
    } else if (left > maxLeft) {
      left = maxLeft;
    }
    
    tooltipEl.textContent = text;
    tooltipEl.style.left = left + 'px';
    tooltipEl.style.top = top + 'px';
    tooltipEl.style.maxWidth = '200px';
    tooltipEl.style.whiteSpace = 'nowrap';
    tooltipEl.classList.add('visible');
  });

  exportBgBtn.addEventListener('mouseleave', hideTooltip);

  copyBtn.addEventListener('click', function() {
    const filename = `${name}_${currentSelectedSize}_${style}.svg`;
    const url = CDN_BASE + filename;
    
    showToast(_('loading'), 'info');

    fetch(url)
      .then(r => {
        if (!r.ok) throw new Error('HTTP ' + r.status);
        return r.text();
      })
      .then(svgText => {
        return navigator.clipboard.writeText(svgText).then(() => svgText);
      })
      .then(() => {
        showToast(_('copied'), 'success');
      })
      .catch(err => {
        showToast(_('copyFailed') + err.message, 'error');
      });
  });

  downloadBtn.addEventListener('click', function() {
    const cdnFilename = `${name}_${currentSelectedSize}_${style}.svg`;
    const saveFilename = `ic_fluent_${name}_${currentSelectedSize}_${style}.svg`;
    const url = CDN_BASE + cdnFilename;
    
    showToast(_('downloading'), 'info');
  
    fetch(url)
      .then(r => {
        if (!r.ok) throw new Error('HTTP ' + r.status);
        return r.text();
      })
      .then(svgText => {
        const blob = new Blob([svgText], { type: 'image/svg+xml' });
        const blobUrl = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = blobUrl;
        a.download = saveFilename;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(blobUrl);
        showToast(_('downloaded'), 'success');
      })
      .catch(err => {
        showToast(_('downloadFailed') + err.message, 'error');
      });
  });

  webfontBtn.addEventListener('click', function() {
    const webfontClass = `icon-ic_fluent_${name}_${currentSelectedSize}_${style}`;
    const htmlString = `<i class="${webfontClass}"></i>`;
    
    navigator.clipboard.writeText(htmlString)
      .then(() => {
        showToast(_('copied'), 'success');
      })
      .catch(err => {
        showToast(_('copyFailed') + err.message, 'error');
      });
  });

  exportBgBtn.addEventListener('click', function() {
    const filename = `${name}_${currentSelectedSize}_${style}.svg`;
    const url = CDN_BASE + filename;
    
    showToast(_('loading'), 'info');

    fetch(url)
      .then(r => {
        if (!r.ok) throw new Error('HTTP ' + r.status);
        return r.text();
      })
      .then(svgText => {
        const base64 = btoa(unescape(encodeURIComponent(svgText)));
        const css = `background-image: url(data:image/svg+xml;base64,${base64});`;
        return navigator.clipboard.writeText(css).then(() => css);
      })
      .then(() => {
        showToast(_('copied'), 'success');
      })
      .catch(err => {
        showToast(_('copyFailed') + err.message, 'error');
      });
  });
}

function renderGrid() {
  const filtered = getFilteredIcons(groupedIcons);
  counterEl.textContent = `${filtered.length} ${_('iconsCount')}`;

  if (filtered.length === 0) {
    gridEl.innerHTML = `<div class="empty-state">${_('noResults')}</div>`;
    return;
  }

  let html = '';
  for (const icon of filtered) {
    const size = getPreferredSize(icon.sizes);
    const filename = `${icon.name}_${size}_${icon.style}.svg`;
    const url = CDN_BASE + filename;
    const displayName = normalizeName(icon.name);

    html += `
      <div class="icon-card" data-name="${icon.name}" data-style="${icon.style}" data-size="${size}" data-filename="${filename}" data-url="${url}" data-displayname="${displayName}">
        <div class="preview-wrap">
          <img src="${url}" alt="${displayName}" loading="lazy" onerror="this.style.display='none'; this.parentElement.innerHTML='<span class=\\'icon-error\\'>!</span><div class=\\'icon-error-text\\'>Failed</div>';" />
        </div>
      </div>
    `;
  }
  gridEl.innerHTML = html;

  document.querySelectorAll('.icon-card').forEach(card => {
    const displayName = card.dataset.displayname;
    
    card.addEventListener('mouseenter', function(e) {
      showTooltip(this, displayName);
    });
    
    card.addEventListener('mouseleave', function(e) {
      hideTooltip();
    });

    card.addEventListener('click', function() {
      const name = this.dataset.name;
      const style = this.dataset.style;
      const gridSize = parseInt(this.dataset.size, 10);
      const gridUrl = this.dataset.url;
      
      const sizes = rawIcons
        .filter(ic => ic.name === name && ic.style === style)
        .map(ic => ic.size)
        .sort((a, b) => a - b);
      
      let maxSize = Math.max(...sizes);
      let detailUrl;
      
      if (gridSize === 24 && sizes.includes(24)) {
        detailUrl = gridUrl;
      } else {
        const filename = `${name}_${maxSize}_${style}.svg`;
        detailUrl = CDN_BASE + filename;
      }
      
      openModal(name, style, sizes, detailUrl, maxSize);
    });
  });
}

modalOverlay.addEventListener('click', function(e) {
  if (e.target === this) {
    closeModal();
  }
});

modalCloseBtn.addEventListener('click', closeModal);

document.addEventListener('keydown', function(e) {
  if (e.key === 'Escape' && !modalOverlay.classList.contains('hidden')) {
    closeModal();
  }
});

searchInput.addEventListener('input', function() {
  searchQuery = this.value;
  if (searchQuery.trim()) {
    clearSearchBtn.classList.add('visible');
  } else {
    clearSearchBtn.classList.remove('visible');
  }
  if (detailData) {
    closeModal();
  }
  hideTooltip();
  renderGrid();
});

clearSearchBtn.addEventListener('click', function() {
  searchInput.value = '';
  searchQuery = '';
  this.classList.remove('visible');
  if (detailData) {
    closeModal();
  }
  hideTooltip();
  renderGrid();
  searchInput.focus();
});

filterBtns.forEach(btn => {
  btn.addEventListener('click', function() {
    filterBtns.forEach(b => b.classList.remove('active'));
    this.classList.add('active');
    currentFilter = this.dataset.filter;
    if (detailData) {
      closeModal();
    }
    hideTooltip();
    renderGrid();
  });
});

// Tooltip handlers for update button
if (updateBtn) {
  updateBtn.addEventListener('mouseenter', function(e) {
    const rect = this.getBoundingClientRect();
    const key = this.dataset.i18nTooltip;
    const text = key ? _(key) : 'Check for Update';
    const tooltipWidth = Math.min(text.length * 7 + 20, 200);
    const tooltipHeight = 28;
    
    let left = rect.left + rect.width / 2 - tooltipWidth / 2;
    let top = rect.top - tooltipHeight - 4;
    
    const padding = 8;
    const maxLeft = window.innerWidth - tooltipWidth - padding;
    const minLeft = padding;
    
    if (left < minLeft) {
      left = minLeft;
    } else if (left > maxLeft) {
      left = maxLeft;
    }
    
    if (top < padding) {
      top = rect.bottom + 8;
    }
    
    tooltipEl.textContent = text;
    tooltipEl.style.left = left + 'px';
    tooltipEl.style.top = top + 'px';
    tooltipEl.style.maxWidth = '200px';
    tooltipEl.style.whiteSpace = 'nowrap';
    tooltipEl.classList.add('visible');
  });

  updateBtn.addEventListener('mouseleave', hideTooltip);
}

function showToast(message, type = 'success') {
  const toast = document.getElementById('toast');
  toast.textContent = message;
  toast.className = 'toast ' + type + ' visible';
  clearTimeout(toast._timeout);
  toast._timeout = setTimeout(() => {
    toast.classList.remove('visible');
  }, 2000);
}

function updateIconsFromGitHub() {
  updateBtn.disabled = true;
  showToast(_('loading'), 'info');

  const url = 'https://raw.githubusercontent.com/2boom-ua/sidebarfluenticons/main/data/icons.json?t=' + Date.now();

  fetch(url)
    .then(r => {
      if (!r.ok) throw new Error('HTTP ' + r.status);
      return r.json();
    })
    .then(data => {
      let iconsArray;
      let version = '';

      if (data && data.icons && Array.isArray(data.icons)) {
        iconsArray = data.icons;
        version = data.version || '';
      } else {
        throw new Error('Invalid JSON structure');
      }

      if (iconsArray.length === 0) {
        throw new Error('Empty icons array');
      }

      if (!version || version.trim() === '') {
        throw new Error('Missing version');
      }

      return loadIconsFromStorage().then(storedData => {
        if (storedData && storedData.version === version) {
          throw new Error('No new version available');
        }
        return { iconsArray, version };
      });
    })
    .then(({ iconsArray, version }) => {
      const saveData = {
        version: version,
        icons: iconsArray
      };
      return saveIconsToStorage(saveData).then(() => {
        return saveData;
      });
    })
    .then(data => {
      FLUENT_ICONS_VERSION = data.version;
      CDN_BASE = `https://cdn.jsdelivr.net/npm/@fluentui/svg-icons@${FLUENT_ICONS_VERSION}/icons/`;
      
      const versionEl = document.querySelector('.footer .version');
      if (versionEl) {
        versionEl.textContent = 'Icons v' + FLUENT_ICONS_VERSION;
      }

      rawIcons = data.icons;
      groupedIcons = buildIconMap(rawIcons);
      renderGrid();

      showToast(_('iconsUpdated') + ' v' + FLUENT_ICONS_VERSION, 'success');
    })
    .catch(err => {
      if (err.message === 'No new version available') {
        showToast(_('noNewVersion'), 'info');
        return;
      }
      let msg = _('updateFailed') + ': ';
      if (err.message) {
        msg += err.message;
      } else {
        msg += _('unknownError');
      }
      showToast(msg, 'error');
    })
    .finally(() => {
      updateBtn.disabled = false;
    });
}

function init() {
  applyI18n();

  updateBtn.addEventListener('click', function() {
    updateIconsFromGitHub();
  });

  gridEl.innerHTML = `<div class="loading-state">${_('loadingIcons')}</div>`;

  loadIconsFromStorage()
    .then(storedData => {
      if (storedData && storedData.icons && storedData.icons.length > 0) {
        FLUENT_ICONS_VERSION = storedData.version || '1.1.339';
        CDN_BASE = `https://cdn.jsdelivr.net/npm/@fluentui/svg-icons@${FLUENT_ICONS_VERSION}/icons/`;
        
        const versionEl = document.querySelector('.footer .version');
        if (versionEl) {
          versionEl.textContent = 'Icons v' + FLUENT_ICONS_VERSION;
        }

        rawIcons = storedData.icons;
        groupedIcons = buildIconMap(rawIcons);
        renderGrid();
        return;
      }

      return loadBundledIcons()
        .then(iconsArray => {
          const data = {
            version: FLUENT_ICONS_VERSION,
            icons: iconsArray
          };
          return saveIconsToStorage(data).then(() => {
            rawIcons = iconsArray;
            groupedIcons = buildIconMap(rawIcons);
            renderGrid();
          });
        });
    })
    .catch(err => {
      console.error('Init error:', err);
      gridEl.innerHTML = `
        <div class="global-error">
          <div>${_('unableToLoad')}</div>
          <div class="sub">${_('checkConnection')}</div>
          <div class="sub" style="font-size:11px;margin-top:6px;color:var(--color-error);">${err.message}</div>
          <div class="sub" style="font-size:11px;margin-top:8px;">
            <button onclick="location.reload()" style="padding:4px 16px;border:1px solid var(--color-border);border-radius:4px;background:var(--color-surface);color:var(--color-text);cursor:pointer;">${_('retry')}</button>
          </div>
        </div>
      `;
      counterEl.textContent = `0 ${_('iconsCount')}`;
    });
}

init();