/*
  ShuzhFit - Public homepage (vanilla JS)
  - Daily motivation "New Quote" quick swap. Works without reload; the
    link itself (index.php#motivation) stays as a no-JS fallback, exactly
    like the old random-quote-on-reload behavior.
  - Lite YouTube embed: a thumbnail is shown first and the iframe only
    loads after the visitor presses play, keeping the homepage fast.
*/

document.addEventListener("DOMContentLoaded", () => {
  // --- Daily motivation: swap quote without reloading ---
  const quoteBtn = document.querySelector("[data-new-quote]");
  const quoteEl = document.querySelector("[data-quote-text]");

  if (quoteBtn && quoteEl) {
    let quotes = [];
    try {
      quotes = JSON.parse(quoteEl.getAttribute("data-quotes") || "[]");
    } catch (err) {
      quotes = [];
    }

    if (Array.isArray(quotes) && quotes.length > 1) {
      quoteBtn.addEventListener("click", (e) => {
        e.preventDefault();
        let guard = 0;
        let next = quoteEl.textContent;
        while (next === quoteEl.textContent && guard < 20) {
          next = quotes[Math.floor(Math.random() * quotes.length)];
          guard++;
        }
        quoteEl.textContent = next;
      });
    }
  }

  // --- Featured video: load the YouTube iframe only on play ---
  document.querySelectorAll("[data-video-embed]").forEach((btn) => {
    btn.addEventListener("click", () => {
      const cover = btn.closest("[data-video-cover]");
      if (!cover || cover.querySelector("iframe")) return;

      const embed = btn.getAttribute("data-video-embed") || "";
      if (!embed) return;

      const iframe = document.createElement("iframe");
      iframe.src = embed + "?autoplay=1&rel=0";
      iframe.title = btn.getAttribute("data-video-title") || "YouTube video";
      iframe.loading = "lazy";
      iframe.allow =
        "accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share";
      iframe.allowFullscreen = true;

      cover.innerHTML = "";
      cover.classList.add("is-playing");
      cover.appendChild(iframe);
    });
  });
});
