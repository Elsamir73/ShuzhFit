-- =============================================================
-- ShuzhFit Migration (2026-09-03)
-- Fixes: live DB missing core tracker tables.
-- Adds: real user accounts support, structured workout tracking,
--       nutrition logging, water tracking, goals.
-- Safe to re-run (IF NOT EXISTS / guarded ALTERs).
-- =============================================================

USE shuzhfit;

-- -------------------------------------------------------------
-- 1) Core tracker tables that were missing from the live DB
-- -------------------------------------------------------------
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

-- -------------------------------------------------------------
-- 2) Ownership: add user_id to tracker tables (legacy session
--    rows are claimed on first login/registration).
-- -------------------------------------------------------------
-- workout_logs
SET @exists := (SELECT COUNT(*) FROM information_schema.COLUMNS
  WHERE TABLE_SCHEMA='shuzhfit' AND TABLE_NAME='workout_logs' AND COLUMN_NAME='user_id');
SET @sql := IF(@exists = 0,
  'ALTER TABLE workout_logs ADD COLUMN user_id INT UNSIGNED NULL AFTER id, ADD INDEX idx_workout_logs_user_date (user_id, log_date)',
  'SELECT 1');
PREPARE st FROM @sql; EXECUTE st; DEALLOCATE PREPARE st;

-- progress_entries
SET @exists := (SELECT COUNT(*) FROM information_schema.COLUMNS
  WHERE TABLE_SCHEMA='shuzhfit' AND TABLE_NAME='progress_entries' AND COLUMN_NAME='user_id');
SET @sql := IF(@exists = 0,
  'ALTER TABLE progress_entries ADD COLUMN user_id INT UNSIGNED NULL AFTER id, ADD INDEX idx_progress_user_date (user_id, log_date)',
  'SELECT 1');
PREPARE st FROM @sql; EXECUTE st; DEALLOCATE PREPARE st;

-- user_favorites
SET @exists := (SELECT COUNT(*) FROM information_schema.COLUMNS
  WHERE TABLE_SCHEMA='shuzhfit' AND TABLE_NAME='user_favorites' AND COLUMN_NAME='user_id');
SET @sql := IF(@exists = 0,
  'ALTER TABLE user_favorites ADD COLUMN user_id INT UNSIGNED NULL AFTER id, ADD INDEX idx_favorites_user (user_id)',
  'SELECT 1');
PREPARE st FROM @sql; EXECUTE st; DEALLOCATE PREPARE st;

-- -------------------------------------------------------------
-- 3) Users: profile fields used for personalization + targets
-- -------------------------------------------------------------
SET @exists := (SELECT COUNT(*) FROM information_schema.COLUMNS
  WHERE TABLE_SCHEMA='shuzhfit' AND TABLE_NAME='users' AND COLUMN_NAME='height_cm');
SET @sql := IF(@exists = 0,
  'ALTER TABLE users
     ADD COLUMN height_cm DECIMAL(5,1) NULL,
     ADD COLUMN goal_type VARCHAR(30) NULL,
     ADD COLUMN activity_level DECIMAL(3,3) NULL,
     ADD COLUMN weekly_workout_target INT UNSIGNED NOT NULL DEFAULT 3,
     ADD COLUMN target_weight_kg DECIMAL(5,1) NULL',
  'SELECT 1');
PREPARE st FROM @sql; EXECUTE st; DEALLOCATE PREPARE st;


-- -------------------------------------------------------------
-- 4) Structured workout tracking (the core product)
-- -------------------------------------------------------------
CREATE TABLE IF NOT EXISTS workouts (
  id INT UNSIGNED NOT NULL AUTO_INCREMENT,
  user_id INT UNSIGNED NOT NULL,
  name VARCHAR(160) NOT NULL DEFAULT 'Workout',
  workout_date DATE NOT NULL,
  started_at DATETIME NOT NULL,
  finished_at DATETIME NULL,
  duration_seconds INT UNSIGNED NULL,
  notes TEXT NULL,
  status VARCHAR(20) NOT NULL DEFAULT 'in_progress',
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  KEY idx_workouts_user_date (user_id, workout_date),
  KEY idx_workouts_user_status (user_id, status)
);

CREATE TABLE IF NOT EXISTS workout_sets (
  id INT UNSIGNED NOT NULL AUTO_INCREMENT,
  workout_id INT UNSIGNED NOT NULL,
  user_id INT UNSIGNED NOT NULL,
  exercise_id INT UNSIGNED NULL,
  exercise_name VARCHAR(200) NOT NULL,
  set_number INT UNSIGNED NOT NULL DEFAULT 1,
  weight_kg DECIMAL(6,2) NULL,
  reps INT UNSIGNED NULL,
  is_warmup TINYINT(1) NOT NULL DEFAULT 0,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  KEY idx_sets_workout (workout_id, set_number),
  KEY idx_sets_user_exercise (user_id, exercise_id),
  KEY idx_sets_user_name (user_id, exercise_name),
  CONSTRAINT fk_sets_workout FOREIGN KEY (workout_id) REFERENCES workouts(id) ON DELETE CASCADE
);

-- -------------------------------------------------------------
-- 5) Nutrition logging
-- -------------------------------------------------------------
CREATE TABLE IF NOT EXISTS food_logs (
  id INT UNSIGNED NOT NULL AUTO_INCREMENT,
  user_id INT UNSIGNED NOT NULL,
  log_date DATE NOT NULL,
  meal_type VARCHAR(20) NOT NULL DEFAULT 'snack',
  name VARCHAR(200) NOT NULL,
  calories INT UNSIGNED NOT NULL DEFAULT 0,
  protein_g DECIMAL(6,1) NOT NULL DEFAULT 0,
  carbs_g DECIMAL(6,1) NOT NULL DEFAULT 0,
  fat_g DECIMAL(6,1) NOT NULL DEFAULT 0,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  KEY idx_food_user_date (user_id, log_date)
);

CREATE TABLE IF NOT EXISTS saved_foods (
  id INT UNSIGNED NOT NULL AUTO_INCREMENT,
  user_id INT UNSIGNED NOT NULL,
  name VARCHAR(200) NOT NULL,
  calories INT UNSIGNED NOT NULL DEFAULT 0,
  protein_g DECIMAL(6,1) NOT NULL DEFAULT 0,
  carbs_g DECIMAL(6,1) NOT NULL DEFAULT 0,
  fat_g DECIMAL(6,1) NOT NULL DEFAULT 0,
  times_used INT UNSIGNED NOT NULL DEFAULT 0,
  last_used_at TIMESTAMP NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  UNIQUE KEY uniq_saved_food (user_id, name),
  KEY idx_saved_food_user (user_id, times_used)
);

CREATE TABLE IF NOT EXISTS water_logs (
  id INT UNSIGNED NOT NULL AUTO_INCREMENT,
  user_id INT UNSIGNED NOT NULL,
  log_date DATE NOT NULL,
  glasses INT UNSIGNED NOT NULL DEFAULT 0,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  UNIQUE KEY uniq_water_user_date (user_id, log_date)
);

-- -------------------------------------------------------------
-- 6) Goals
-- -------------------------------------------------------------
CREATE TABLE IF NOT EXISTS user_goals (
  id INT UNSIGNED NOT NULL AUTO_INCREMENT,
  user_id INT UNSIGNED NOT NULL,
  title VARCHAR(160) NOT NULL,
  metric VARCHAR(30) NOT NULL,            -- weight | exercise_weight | workouts_per_week
  target_value DECIMAL(8,2) NOT NULL,
  exercise_name VARCHAR(200) NULL,        -- for exercise_weight goals
  deadline DATE NULL,
  status VARCHAR(20) NOT NULL DEFAULT 'active',
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  achieved_at TIMESTAMP NULL,
  PRIMARY KEY (id),
  KEY idx_goals_user_status (user_id, status)
);
