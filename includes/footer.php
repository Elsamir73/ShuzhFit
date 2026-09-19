<?php
// ShuzhFit - reusable page footer
// Intentionally outputs ONLY footer markup + JS.
// Do NOT close </main>, </body>, </html> here.
?>

<footer class="site-footer">
    <div class="container footer-inner">
        <div>
            <div class="footer-brand">ShuzhFit</div>
            <div class="footer-muted">Transform yourself one day at a time.</div>
        </div>

        <div class="footer-links" aria-label="Social links">
            <a class="footer-link" href="https://youtube.com/@shuzhfit?si=BCCs-y45wU_VSNKs" target="_blank" rel="noopener noreferrer" aria-label="YouTube channel">YouTube</a>
            <a class="footer-link" href="blog.php">Blog</a>
            <a class="footer-link" href="contact.php">Contact</a>
        </div>
    </div>
</footer>

<!-- Vanilla JS for UI enhancements -->
<script src="js/script.js"></script>
<script>
    // Close the mobile panel after clicking a link
    (function() {
        const panel = document.querySelector('[data-mobile-panel]');
        if (!panel) return;
        panel.addEventListener('click', function(e) {
            const target = e.target;
            if (target && target.closest && target.closest('a')) {
                panel.classList.remove('is-open');
            }
        });
    })();
</script>