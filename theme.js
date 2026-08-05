/**
 * theme.js â€” final behavior (component-safe)
 *
 * Fix: Accessibility/theme UI now lives inside injected nav component.
 * This version initializes safely even if the modal is not in the DOM yet,
 * and binds UI AFTER components:loaded.
 */
if ('scrollRestoration' in history) {
  history.scrollRestoration = 'manual';
}

/* -----------------------------
   Bootstrap validation helper
------------------------------ */
(() => {
  'use strict';
  const forms = document.querySelectorAll('.needs-validation');
  Array.from(forms).forEach(form => {
    form.addEventListener('submit', event => {
      if (!form.checkValidity()) {
        event.preventDefault();
        event.stopPropagation();
      }
      form.classList.add('was-validated');
    }, false);
  });
})();

/* -----------------------------
   Theme + accessibility module
------------------------------ */
(function () {
  // Storage keys
  const THEME_KEY = 'mysite_theme_v5';
  const REDUCE_KEY = 'mysite_reduce_v5';
  const UNDERLINE_KEY = 'mysite_underline_v5';
  const READABLE_KEY = 'mysite_readable_v5';
  const FONT_KEY = 'mysite_fontsize_v5';
  const SOUND_KEY = 'mysite_sound_v5';

  const THEMES = ['light','dark','dyspraxia','spring','summer','autumn','winter'];
  const DEFAULT = 'light';

  const HTML = document.documentElement;

  // Audio feedback (gentle chime)
  let chimeEnabled = false;
  const chime = document.getElementById('theme-chime');
  if (chime) chime.volume = 0.28;

  // Internal: current UI refs (re-queried after components load)
  let refs = {};

  function queryRefs() {
    refs = {
      themeDropdownList: document.getElementById('themeDropdownList'),
      themeDropdownLabel: document.getElementById('themeDropdownLabel'),
      saveBtn: document.getElementById('saveAccess'),
      resetBtn: document.getElementById('resetDefaults'),
      fontRange: document.getElementById('fontSizeRange'),
      fontLabel: document.getElementById('fontSizeLabel'),
      reduceCheckbox: document.getElementById('toggleReduceMotion'),
      underlineCheckbox: document.getElementById('toggleUnderline'),
      readableCheckbox: document.getElementById('toggleReadableFont'),
      soundCheckbox: document.getElementById('toggleSound'),
      overlayEl: document.querySelector('.theme-overlay'),
      live: document.getElementById('a11y-live'),
      yearSpan: document.getElementById('year')
    };
    return refs;
  }

  // Utility to read CSS variable
  function cssVar(name) {
    return getComputedStyle(document.documentElement).getPropertyValue(name).trim();
  }

  function playChime() {
    try {
      if (!chimeEnabled || !chime) return;
      const a = chime.cloneNode();
      a.volume = 0.28;
      a.play().catch(() => {});
    } catch (e) { /* ignore */ }
  }

  // Underline application helper (important: component-injected links appear later)
  function applyUnderline(isOn) {
    if (isOn) {
      document.querySelectorAll('a').forEach(a => a.classList.add('underline-links'));
    } else {
      document.querySelectorAll('a').forEach(a => a.classList.remove('underline-links'));
    }
  }

  // Apply theme
  function applyTheme(name, persist = true, announce = true) {
    if (!name || !THEMES.includes(name)) name = DEFAULT;

    HTML.setAttribute('data-theme', name);
    if (persist) localStorage.setItem(THEME_KEY, name);

    // Overlay fade (if overlay exists)
    const overlayColor = cssVar('--overlay-color') || 'transparent';
    const fadeSpeedStr = cssVar('--fade-speed') || '0.5s';
    const fadeSec = parseFloat(fadeSpeedStr) || 0.5;

    const systemReduce = window.matchMedia &&
      window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    const userReduce =
      (localStorage.getItem(REDUCE_KEY) === 'true') ||
      (HTML.getAttribute('data-reduce-motion') === 'true');

    const reduce = systemReduce || userReduce;

    // overlay element may not exist on some pages or before components load
    if (refs.overlayEl) {
      if (reduce) {
        refs.overlayEl.style.transition = 'none';
        refs.overlayEl.style.background = overlayColor;
      } else {
        refs.overlayEl.style.transition = `background-color ${fadeSec}s ease`;
        refs.overlayEl.style.background = overlayColor;
      }
    }

    // Update dropdown label if present
    if (refs.themeDropdownLabel) {
      const label = name.replace('-', ' ').replace(/\b\w/g, c => c.toUpperCase());
      refs.themeDropdownLabel.textContent = label;
    }

    // ARIA announce
    if (announce && refs.live) {
      refs.live.textContent = `Theme changed to ${name.replace('-', ' ')}.`;
    }

    playChime();
  }

  // Apply font-size as percentage (90-150)
  function applyFontSize(percent, persist = true) {
    const basePx = 16 * (percent / 100);
    document.documentElement.style.setProperty('--base-font-size', `${basePx}px`);

    if (refs.fontLabel) refs.fontLabel.textContent = `${percent}%`;
    if (persist) localStorage.setItem(FONT_KEY, String(percent));

    playChime();
  }

  // Load settings from localStorage and apply them
  function loadSettings() {
    const savedTheme = localStorage.getItem(THEME_KEY);
    const savedReduce = localStorage.getItem(REDUCE_KEY);
    const savedUnderline = localStorage.getItem(UNDERLINE_KEY);
    const savedReadable = localStorage.getItem(READABLE_KEY);
    const savedFont = localStorage.getItem(FONT_KEY);
    const savedSound = localStorage.getItem(SOUND_KEY);

    // Sound
    chimeEnabled = (savedSound === 'true');
    if (refs.soundCheckbox) refs.soundCheckbox.checked = chimeEnabled;

    // Theme
    if (!savedTheme) {
      applyTheme(DEFAULT, false, false);
      if (refs.themeDropdownLabel) refs.themeDropdownLabel.textContent = 'Light';
    } else {
      applyTheme(savedTheme, false, false);
      if (refs.themeDropdownLabel) {
        refs.themeDropdownLabel.textContent =
          savedTheme.replace('-', ' ').replace(/\b\w/g, c => c.toUpperCase());
      }
    }

    // Reduce motion
    if (savedReduce === 'true') {
      HTML.setAttribute('data-reduce-motion', 'true');
      if (refs.reduceCheckbox) refs.reduceCheckbox.checked = true;
    } else {
      HTML.removeAttribute('data-reduce-motion');
      if (refs.reduceCheckbox) refs.reduceCheckbox.checked = false;
    }

    // Underline links (re-apply after components load too)
    if (savedUnderline === 'true') {
      if (refs.underlineCheckbox) refs.underlineCheckbox.checked = true;
      applyUnderline(true);
    } else {
      if (refs.underlineCheckbox) refs.underlineCheckbox.checked = false;
      applyUnderline(false);
    }

    // Readable font
    if (savedReadable === 'true') {
      HTML.setAttribute('data-readable-font', 'true');
      if (refs.readableCheckbox) refs.readableCheckbox.checked = true;
    } else {
      HTML.removeAttribute('data-readable-font');
      if (refs.readableCheckbox) refs.readableCheckbox.checked = false;
    }

    // Font size
    if (savedFont) {
      const p = parseInt(savedFont, 10);
      if (!Number.isNaN(p)) {
        applyFontSize(p, false);
        if (refs.fontRange) refs.fontRange.value = p;
      }
    } else {
      applyFontSize(100, false);
      if (refs.fontRange) refs.fontRange.value = 100;
    }

    // System scheme changes only if user hasn't explicitly saved a theme
    if (!savedTheme) {
      const mq = window.matchMedia('(prefers-color-scheme: dark)');
      mq.addEventListener('change', (e) => {
        if (!localStorage.getItem(THEME_KEY)) {
          const mapped = e.matches ? 'dark' : 'light';
          applyTheme(mapped, false, true);
        }
      });
    }

    // Reduced-motion system changes only if user hasn't saved a preference
    if (!savedReduce) {
      const mq2 = window.matchMedia('(prefers-reduced-motion: reduce)');
      mq2.addEventListener('change', (e) => {
        if (e.matches) HTML.setAttribute('data-reduce-motion', 'true');
        else if (localStorage.getItem(REDUCE_KEY) !== 'true') HTML.removeAttribute('data-reduce-motion');
      });
    }
  }

  /* -----------------------------
     UI binding (runs after nav inject)
------------------------------ */
  let uiBound = false;

  function bindAccessibilityUI() {
    queryRefs();

    // Footer year might not exist until footer injected
    if (refs.yearSpan) refs.yearSpan.textContent = new Date().getFullYear();

    // Always safe to apply settings (will update controls if present)
    loadSettings();

    // If modal controls not present yet, do not bind listeners
    // (but loadSettings still applied theme/font etc)
    if (!refs.themeDropdownList || !refs.saveBtn || !refs.resetBtn || !refs.fontRange) return;

    if (uiBound) return;
    uiBound = true;

    // Theme dropdown -> preview on click (not persisted until Save)
    refs.themeDropdownList.addEventListener('click', (ev) => {
      const btn = ev.target.closest('.theme-item');
      if (!btn) return;
      const theme = btn.getAttribute('data-theme');
      if (!theme) return;

      applyTheme(theme, false, true);

      if (refs.themeDropdownLabel) {
        refs.themeDropdownLabel.textContent = btn.textContent.trim();
      }
    });

    // Font range live preview
    refs.fontRange.addEventListener('input', (e) => {
      const v = parseInt(e.target.value, 10) || 100;
      applyFontSize(v, false);
    });
    refs.fontRange.addEventListener('change', () => playChime());

    // Reduce motion toggle
    if (refs.reduceCheckbox) {
      refs.reduceCheckbox.addEventListener('change', (e) => {
        if (e.target.checked) {
          HTML.setAttribute('data-reduce-motion', 'true');
          localStorage.setItem(REDUCE_KEY, 'true');
        } else {
          HTML.removeAttribute('data-reduce-motion');
          localStorage.removeItem(REDUCE_KEY);
        }
      });
    }

    // Underline toggle
    if (refs.underlineCheckbox) {
      refs.underlineCheckbox.addEventListener('change', (e) => {
        const on = !!e.target.checked;
        if (on) localStorage.setItem(UNDERLINE_KEY, 'true');
        else localStorage.removeItem(UNDERLINE_KEY);

        applyUnderline(on);
        playChime();
      });
    }

    // Readable font toggle
    if (refs.readableCheckbox) {
      refs.readableCheckbox.addEventListener('change', (e) => {
        if (e.target.checked) {
          HTML.setAttribute('data-readable-font', 'true');
          localStorage.setItem(READABLE_KEY, 'true');
        } else {
          HTML.removeAttribute('data-readable-font');
          localStorage.removeItem(READABLE_KEY);
        }
        playChime();
      });
    }

    // Sound toggle
    if (refs.soundCheckbox) {
      refs.soundCheckbox.addEventListener('change', (e) => {
        chimeEnabled = e.target.checked;
        if (chimeEnabled) localStorage.setItem(SOUND_KEY, 'true');
        else localStorage.removeItem(SOUND_KEY);

        if (chimeEnabled) playChime();
      });
    }

    // Save button
    refs.saveBtn.addEventListener('click', () => {
      const currentTheme = HTML.getAttribute('data-theme') || DEFAULT;
      localStorage.setItem(THEME_KEY, currentTheme);

      const fontVal = refs.fontRange ? refs.fontRange.value : 100;
      localStorage.setItem(FONT_KEY, String(fontVal));

      if (refs.live) refs.live.textContent = 'Accessibility settings saved.';

      // Close modal if Bootstrap present
      const modalEl = document.getElementById('accessModal');
      if (modalEl && window.bootstrap && bootstrap.Modal) {
        const modal = bootstrap.Modal.getInstance(modalEl);
        if (modal) modal.hide();
      }

      playChime();
    });

    // Reset button
    refs.resetBtn.addEventListener('click', () => {
      localStorage.removeItem(THEME_KEY);
      localStorage.removeItem(REDUCE_KEY);
      localStorage.removeItem(UNDERLINE_KEY);
      localStorage.removeItem(READABLE_KEY);
      localStorage.removeItem(FONT_KEY);
      localStorage.removeItem(SOUND_KEY);

      chimeEnabled = false;

      HTML.removeAttribute('data-reduce-motion');
      HTML.removeAttribute('data-readable-font');
      applyUnderline(false);

      if (refs.reduceCheckbox) refs.reduceCheckbox.checked = false;
      if (refs.underlineCheckbox) refs.underlineCheckbox.checked = false;
      if (refs.readableCheckbox) refs.readableCheckbox.checked = false;
      if (refs.soundCheckbox) refs.soundCheckbox.checked = false;

      if (refs.fontRange) refs.fontRange.value = 100;
      applyFontSize(100, false);

      applyTheme(DEFAULT, false, true);
      if (refs.themeDropdownLabel) refs.themeDropdownLabel.textContent = 'Light';

      if (refs.live) refs.live.textContent = 'Preferences reset to defaults.';
      playChime();
    });
  }

  // Init early (applies stored theme/font even before components load)
  document.addEventListener('DOMContentLoaded', () => {
    queryRefs();
    loadSettings();
  });

  // Init fully once injected nav/footer exist
  document.addEventListener('components:loaded', () => {
    bindAccessibilityUI();

    // Important: new injected links might need underline state re-applied
    const savedUnderline = localStorage.getItem(UNDERLINE_KEY) === 'true';
    applyUnderline(savedUnderline);
  });

  // Expose small API for debugging
  window._mysite = { applyTheme, applyFontSize, loadSettings };

})();

// Static pages: nav/modal are in the page markup (not injected), so fire the
// binding event theme.js waits for once the DOM is ready.
document.addEventListener('DOMContentLoaded', () => {
  document.dispatchEvent(new Event('components:loaded'));
});

