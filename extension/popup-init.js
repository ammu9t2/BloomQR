// BloomQR Extension Popup Bootstrap
(function() {
  // Attribution overrides
  const originalCreateTextNode = document.createTextNode;
  document.createTextNode = function(text) {
    if (typeof text === 'string') {
      if (text === ' and ') text = '';
      text = text.replace(/Logotyper/g, 'ammu9t2')
                 .replace(/Enzo Manuel Mangano/g, 'ammu9t2')
                 .replace(/Mohamed Siddique/g, '');
    }
    return originalCreateTextNode.call(this, text);
  };

  const origSetTextContent = Object.getOwnPropertyDescriptor(Node.prototype, 'textContent');
  if (origSetTextContent) {
    Object.defineProperty(Node.prototype, 'textContent', {
      set: function(text) {
        if (typeof text === 'string') {
          if (text === ' and ') text = '';
          text = text.replace(/Logotyper/g, 'ammu9t2')
                     .replace(/Enzo Manuel Mangano/g, 'ammu9t2')
                     .replace(/Mohamed Siddique/g, '');
        }
        return origSetTextContent.set.call(this, text);
      },
      get: origSetTextContent.get
    });
  }

  const origSetNodeValue = Object.getOwnPropertyDescriptor(Node.prototype, 'nodeValue');
  if (origSetNodeValue) {
    Object.defineProperty(Node.prototype, 'nodeValue', {
      set: function(text) {
        if (typeof text === 'string') {
          if (text === ' and ') text = '';
          text = text.replace(/Logotyper/g, 'ammu9t2')
                     .replace(/Enzo Manuel Mangano/g, 'ammu9t2')
                     .replace(/Mohamed Siddique/g, '');
        }
        return origSetNodeValue.set.call(this, text);
      },
      get: origSetNodeValue.get
    });
  }

  const origSetAttribute = Element.prototype.setAttribute;
  Element.prototype.setAttribute = function(name, value) {
    if (name === 'href' && typeof value === 'string' && (value.includes('logotypercom') || value.includes('reactiive_'))) {
      value = 'https://txerv.com';
    } else if (name === 'href' && typeof value === 'string' && value.includes('msiddique26')) {
      value = 'javascript:void(0)';
      this.style.display = 'none';
    }
    return origSetAttribute.call(this, name, value);
  };

  // Audio helper
  window.__bgAudio = null;
  const _OrigAudio = window.Audio;
  window.Audio = function(...args) {
    const a = new _OrigAudio(...args);
    window.__bgAudio = a;
    return a;
  };
  window.Audio.prototype = _OrigAudio.prototype;

  // Theme initialization
  try {
    const theme = localStorage.getItem('app-theme') || (window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light');
    window.__isDarkTheme = (theme === 'dark');
    if (window.__isDarkTheme) {
      document.documentElement.classList.add('dark-theme');
      document.addEventListener('DOMContentLoaded', () => {
        if (document.body) document.body.classList.add('dark-theme');
      });
    }
  } catch(e) {}

  // Auto-detect active browser tab URL if available
  if (typeof chrome !== 'undefined' && chrome.tabs && chrome.tabs.query) {
    chrome.tabs.query({ active: true, currentWindow: true }, function(tabs) {
      if (tabs && tabs[0] && tabs[0].url) {
        const tabUrl = tabs[0].url;
        if (/^https?:\/\//i.test(tabUrl)) {
          window.__extensionInitialUrl = tabUrl;
        }
      }
    });
  }
})();

// UI Bindings after DOM loaded
document.addEventListener('DOMContentLoaded', () => {
  // 1. Day / Night theme toggle
  const themeBtn = document.getElementById('theme-toggle-btn');
  let _lastThemeClick = 0;
  if (themeBtn) {
    themeBtn.addEventListener('click', (e) => {
      e.preventDefault();
      const now = Date.now();
      if (now - _lastThemeClick < 200) return;
      _lastThemeClick = now;

      const isDark = document.documentElement.classList.toggle('dark-theme');
      if (document.body) {
        document.body.classList.toggle('dark-theme', isDark);
      }
      window.__isDarkTheme = isDark;
      try {
        localStorage.setItem('app-theme', isDark ? 'dark' : 'light');
      } catch(e) {}

      window.dispatchEvent(new CustomEvent('app-theme-change', { detail: { theme: isDark ? 'dark' : 'light' } }));
      window.dispatchEvent(new Event('resize'));
    });
  }

  // 2. Volume hover bar
  let hoverBar = null;
  let hideTimer = null;

  function createHoverBar() {
    if (document.getElementById('volume-hover-bar')) return document.getElementById('volume-hover-bar');
    const bar = document.createElement('div');
    bar.id = 'volume-hover-bar';
    bar.innerHTML = `
      <div class="vol-track" id="vol-track">
        <div class="vol-fill" id="vol-fill"></div>
        <div class="vol-thumb" id="vol-thumb"></div>
      </div>
    `;
    document.body.appendChild(bar);

    const track = bar.querySelector('#vol-track');
    let isDragging = false;

    function updateVolumeFromPointer(clientY) {
      const rect = track.getBoundingClientRect();
      const trackHeight = rect.height;
      const bottomY = rect.bottom;
      let fraction = (bottomY - clientY) / trackHeight;
      fraction = Math.max(0, Math.min(1, fraction));

      const fill = bar.querySelector('#vol-fill');
      const thumb = bar.querySelector('#vol-thumb');
      if (fill) fill.style.height = (fraction * 100) + '%';
      if (thumb) thumb.style.bottom = (fraction * 100) + '%';

      if (window.__bgAudio) {
        window.__bgAudio.volume = fraction;
        window.__bgAudio.muted = (fraction === 0);
      }
    }

    track.addEventListener('pointerdown', (e) => {
      isDragging = true;
      track.setPointerCapture(e.pointerId);
      updateVolumeFromPointer(e.clientY);
    });

    track.addEventListener('pointermove', (e) => {
      if (isDragging) updateVolumeFromPointer(e.clientY);
    });

    track.addEventListener('pointerup', (e) => {
      isDragging = false;
      try { track.releasePointerCapture(e.pointerId); } catch(err) {}
    });

    bar.addEventListener('mouseenter', () => {
      if (hideTimer) clearTimeout(hideTimer);
    });

    bar.addEventListener('mouseleave', () => {
      hideTimer = setTimeout(() => {
        bar.classList.remove('visible');
      }, 300);
    });

    return bar;
  }

  function positionHoverBar(btn) {
    const bar = hoverBar || createHoverBar();
    hoverBar = bar;
    const rect = btn.getBoundingClientRect();
    const centerX = rect.left + rect.width / 2;
    const topY = rect.top - 8;
    bar.style.left = centerX + 'px';
    bar.style.top = topY + 'px';
    bar.classList.add('visible');

    const fill = bar.querySelector('#vol-fill');
    const thumb = bar.querySelector('#vol-thumb');
    const vol = (window.__bgAudio && !window.__bgAudio.muted) ? window.__bgAudio.volume : (window.__bgAudio && window.__bgAudio.muted ? 0 : 0.7);
    if (fill) fill.style.height = (vol * 100) + '%';
    if (thumb) thumb.style.bottom = (vol * 100) + '%';
  }

  document.addEventListener('mouseover', (e) => {
    const volBtn = e.target.closest('#volume-control-btn');
    if (volBtn) {
      if (hideTimer) clearTimeout(hideTimer);
      positionHoverBar(volBtn);
    }
  });

  document.addEventListener('mouseout', (e) => {
    const volBtn = e.target.closest('#volume-control-btn');
    if (volBtn) {
      hideTimer = setTimeout(() => {
        if (hoverBar) hoverBar.classList.remove('visible');
      }, 350);
    }
  });

  // 3. Open on Vercel Web button
  const webBtn = document.getElementById('open-web-btn');
  if (webBtn) {
    webBtn.addEventListener('click', (e) => {
      e.preventDefault();
      // Get current URL or input value
      const inputEl = document.querySelector('input[placeholder]');
      let targetUrl = 'https://bloomqr.vercel.app';
      
      // If we have an active hash or query in history or input
      if (window.location.search && window.location.search.includes('q=')) {
        targetUrl += window.location.search;
      } else if (inputEl && inputEl.value && inputEl.value.trim()) {
        try {
          // If app has current encoded state in copy link
          const copyBtn = document.querySelector('button[title*="Copy" i], button[aria-label*="Copy" i]');
        } catch(e) {}
      }

      if (typeof chrome !== 'undefined' && chrome.tabs && chrome.tabs.create) {
        chrome.tabs.create({ url: targetUrl });
      } else {
        window.open(targetUrl, '_blank');
      }
    });
  }
});
