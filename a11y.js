// Shared helpers copied from the main website (components/components.js).

// Google Translate needs the modal mount to exist (nav is injected async).
function initGoogleTranslateInModal() {
  const mountId = "google_translate_element_modal";

  function renderTranslate() {
    const el = document.getElementById(mountId);
    if (!el) return false;

    const g = window.google;
    if (!g || !g.translate || !g.translate.TranslateElement) return false;

    if (el.dataset.gtReady === "1") return true;

    el.innerHTML = "";
    new g.translate.TranslateElement(
      { pageLanguage: "en" },
      mountId
    );
    el.dataset.gtReady = "1";
    return true;
  }

  if (typeof window.googleTranslateElementInit !== "function") {
    window.googleTranslateElementInit = function () {
      renderTranslate();
    };
  }

  if (renderTranslate()) return;

  if (!document.querySelector('script[data-gt="bbnw"]')) {
    const s = document.createElement("script");
    s.src = "https://translate.google.com/translate_a/element.js?cb=googleTranslateElementInit";
    s.async = true;
    s.setAttribute("data-gt", "bbnw");

    s.onerror = function () {
      const el = document.getElementById(mountId);
      if (el) {
        el.innerHTML = '<small class="text-muted">Translate unavailable (blocked or offline).</small>';
        el.dataset.gtReady = "";
      }
      s.removeAttribute("data-gt");
    };

    document.head.appendChild(s);
  }

  const accessModal = document.getElementById("accessModal");
  if (accessModal && !accessModal.dataset.gtBound) {
    accessModal.addEventListener("shown.bs.modal", () => {
      renderTranslate();
    });
    accessModal.dataset.gtBound = "1";
  }

  if (!document.documentElement.dataset.gtObserverBound) {
    const obs = new MutationObserver(() => {
      if (renderTranslate()) obs.disconnect();
    });
    obs.observe(document.body, { childList: true, subtree: true });
    document.documentElement.dataset.gtObserverBound = "1";
  }
}

document.addEventListener("DOMContentLoaded", () => {
  initGoogleTranslateInModal();

  // Close the mobile nav when an in-page link is chosen.
  const collapse = document.getElementById("navbarMain");
  if (collapse && window.bootstrap) {
    collapse.querySelectorAll("a.nav-link").forEach(a => {
      a.addEventListener("click", () => {
        const inst = bootstrap.Collapse.getInstance(collapse);
        if (inst && collapse.classList.contains("show")) inst.hide();
      });
    });
  }
});
