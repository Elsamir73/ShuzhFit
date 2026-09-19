-- ShuzhFit Database Setup (MySQL)
--
-- How to use:
-- 1) Create database: shuzhfit
-- 2) Run this SQL.
-- 3) IMPORTANT: then run database/migrate_2026_09_03.sql — it creates the
--    accounts/tracking tables (workouts, workout_sets, food_logs, saved_foods,
--    water_logs, user_goals) and adds profile columns to `users`.
-- 4) Optionally run database/seed_exercises.sql for the 24-exercise starter library.
-- 5) Update DB credentials in shuzhfit/config/db.php if needed.
--
-- NOTE: the live DB also uses a `contacts` table (contact form) and a `users`
-- table (accounts). Both are created below.


CREATE DATABASE IF NOT EXISTS shuzhfit
  CHARACTER SET utf8mb4
  COLLATE utf8mb4_unicode_ci;

USE shuzhfit;

-- -------------------------
-- BLOGS
-- -------------------------
CREATE TABLE IF NOT EXISTS blogs (
  id INT UNSIGNED NOT NULL AUTO_INCREMENT,
  title VARCHAR(200) NOT NULL,
  slug VARCHAR(220) NOT NULL,
  category VARCHAR(80) NOT NULL,
  image VARCHAR(255) NULL,
  author VARCHAR(120) NOT NULL DEFAULT 'ShuzhFit',
  content MEDIUMTEXT NOT NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  UNIQUE KEY uniq_blogs_slug (slug),
  KEY idx_blogs_category_created (category, created_at)
);

-- -------------------------
-- EXERCISES
-- -------------------------
CREATE TABLE IF NOT EXISTS exercises (
  id INT UNSIGNED NOT NULL AUTO_INCREMENT,
  name VARCHAR(200) NOT NULL,
  slug VARCHAR(220) NOT NULL,
  muscles_worked VARCHAR(200) NOT NULL,
  benefits MEDIUMTEXT NOT NULL,
  form_guide MEDIUMTEXT NOT NULL,
  mistakes MEDIUMTEXT NOT NULL,
  reps VARCHAR(120) NOT NULL DEFAULT '3 sets x 10-12 reps',
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  UNIQUE KEY uniq_exercises_slug (slug),
  KEY idx_exercises_created (created_at)
);

-- -------------------------
-- VIDEOS
-- Admin pastes YouTube URL; we store normalized title + embed-ready data.
-- -------------------------
CREATE TABLE IF NOT EXISTS videos (
  id INT UNSIGNED NOT NULL AUTO_INCREMENT,
  title VARCHAR(200) NOT NULL,
  youtube_url VARCHAR(500) NOT NULL,
  exercise_id INT UNSIGNED NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  KEY idx_videos_exercise (exercise_id),
  CONSTRAINT fk_videos_exercise
    FOREIGN KEY (exercise_id) REFERENCES exercises(id)
    ON DELETE SET NULL
    ON UPDATE CASCADE
);

-- -------------------------
-- WORKOUT LOGS
-- -------------------------
CREATE TABLE IF NOT EXISTS workout_logs (
  id INT UNSIGNED NOT NULL AUTO_INCREMENT,
  user_session_id VARCHAR(255) NOT NULL,
  log_date DATE NOT NULL,
  workout_type VARCHAR(120) NOT NULL,
  duration_minutes INT UNSIGNED NOT NULL,
  exercise VARCHAR(200) NULL,
  notes TEXT NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  KEY idx_workout_logs_session_date (user_session_id, log_date),
  KEY idx_workout_logs_date (log_date)
);

CREATE TABLE IF NOT EXISTS progress_entries (
  id INT UNSIGNED NOT NULL AUTO_INCREMENT,
  user_session_id VARCHAR(255) NOT NULL,
  log_date DATE NOT NULL,
  weight_kg DECIMAL(5,1) NOT NULL,
  waist_cm DECIMAL(5,1) NULL,
  goal VARCHAR(255) NULL,
  notes TEXT NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  KEY idx_progress_session_date (user_session_id, log_date),
  KEY idx_progress_date (log_date)
);

CREATE TABLE IF NOT EXISTS user_favorites (
  id INT UNSIGNED NOT NULL AUTO_INCREMENT,
  user_session_id VARCHAR(255) NOT NULL,
  item_type VARCHAR(30) NOT NULL,
  item_id INT UNSIGNED NOT NULL,
  item_slug VARCHAR(220) NOT NULL,
  item_title VARCHAR(220) NOT NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  UNIQUE KEY uniq_favorite_session_item (user_session_id, item_type, item_id),
  KEY idx_favorite_session_created (user_session_id, created_at)
);

CREATE TABLE IF NOT EXISTS content_comments (
  id INT UNSIGNED NOT NULL AUTO_INCREMENT,
  item_type VARCHAR(30) NOT NULL,
  item_id INT UNSIGNED NOT NULL,
  item_slug VARCHAR(220) NOT NULL,
  author VARCHAR(120) NOT NULL DEFAULT 'ShuzhFit Reader',
  message TEXT NOT NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  KEY idx_comments_item (item_type, item_slug, created_at)
);

-- -------------------------
-- Minimal starter seed (optional):
-- Comment out if you don't want auto data.
-- -------------------------
/*
INSERT INTO exercises (name, slug, muscles_worked, benefits, form_guide, mistakes, reps)
VALUES
('Chest Press', 'chest-press', 'Chest, Triceps, Shoulders',
 'Build upper-body pushing strength and muscle.',
 '1) Set bench/seat height. 2) Grip handles. 3) Lower with control. 4) Press up without locking out aggressively.',
 'Common mistakes: bouncing the weight, flaring elbows too wide, rushing the lowering phase.',
 '3 sets x 8-12 reps');
*/

