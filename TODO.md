# TODO

- [x] Fix SQL syntax error on blog post related exercises query (LIMIT parameter binding).
  - [x] Inspect current DB helper + failing query usage.
  - [x] Root cause: PDO emulated prepares quote ints as strings for LIMIT placeholders.
  - [x] Fixed centrally in `lib/db.php` via `db_bind_all()` (ints bind as PDO::PARAM_INT).
  - [x] Re-tested blog_post.php route — no more fatal error.
- [x] Recreate missing DB tables on live database (`database/migrate_2026_09_03.sql`).
- [x] Add user accounts + real workout/nutrition/goals tracking (see `/workout`, `/nutrition_log`, `/progress`, `/profile`).
- [x] Redesign public homepage as a minimal gateway: compact hero, ONE daily motivation card, exactly 3 destination cards (Workouts / Knowledge / Nutrition), ONE featured video from the DB (clean placeholder when empty), small footer. New homepage-only files: `includes/home_header.php`, `includes/home_footer.php`, `css/home.css`, `js/home.js`. Blog list, exercise cards and multi-video list remain on their own pages (`/blog`, `/exercises`, `/search`).

## Remaining ideas (not started)
- [ ] Password reset via email.
- [ ] Exercise images / animations in the library.
- [ ] Weekly email recap.
- [ ] PWA manifest for installable mobile app.

