CREATE TYPE user_role AS ENUM ('user', 'admin');

CREATE TABLE users (
  id SERIAL PRIMARY KEY,
  email VARCHAR(255) NOT NULL UNIQUE,
  password_hash VARCHAR(255) NOT NULL,
  name VARCHAR(120) NOT NULL,
  bio TEXT,
  role user_role NOT NULL DEFAULT 'user',
  sex VARCHAR(20),
  height_cm INTEGER,
  goal_type VARCHAR(80),
  activity_level NUMERIC(4, 3),
  weekly_workout_target INTEGER NOT NULL DEFAULT 3,
  target_weight_kg NUMERIC(6, 2),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX users_email_idx ON users (email);

CREATE TABLE blogs (
  id SERIAL PRIMARY KEY,
  slug VARCHAR(180) NOT NULL UNIQUE,
  title VARCHAR(200) NOT NULL,
  excerpt TEXT,
  content TEXT NOT NULL,
  author_name VARCHAR(120) DEFAULT 'ShuzhFit',
  category VARCHAR(80),
  image_url VARCHAR(255),
  is_published BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX blogs_published_idx ON blogs (is_published);

CREATE TABLE exercises (
  id SERIAL PRIMARY KEY,
  slug VARCHAR(180) NOT NULL UNIQUE,
  name VARCHAR(200) NOT NULL,
  category VARCHAR(120),
  muscles TEXT,
  equipment VARCHAR(120),
  difficulty VARCHAR(60),
  description TEXT,
  benefits TEXT,
  form_guide TEXT,
  mistakes TEXT,
  youtube_url VARCHAR(255),
  is_published BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX exercises_published_idx ON exercises (is_published);

CREATE TABLE videos (
  id SERIAL PRIMARY KEY,
  title VARCHAR(220) NOT NULL,
  slug VARCHAR(180) NOT NULL UNIQUE,
  youtube_url VARCHAR(255) NOT NULL,
  exercise_id INTEGER REFERENCES exercises (id) ON DELETE SET NULL,
  description TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX videos_exercise_idx ON videos (exercise_id);

CREATE TABLE content_comments (
  id SERIAL PRIMARY KEY,
  user_id INTEGER REFERENCES users (id) ON DELETE CASCADE,
  author_name VARCHAR(120) NOT NULL,
  message TEXT NOT NULL,
  item_type VARCHAR(40) NOT NULL,
  item_id INTEGER NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX comments_item_idx ON content_comments (item_type, item_id);
CREATE INDEX comments_user_idx ON content_comments (user_id);

CREATE TABLE contacts (
  id SERIAL PRIMARY KEY,
  name VARCHAR(120) NOT NULL,
  email VARCHAR(255) NOT NULL,
  message TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE user_favorites (
  user_id INTEGER NOT NULL REFERENCES users (id) ON DELETE CASCADE,
  item_type VARCHAR(40) NOT NULL,
  item_id INTEGER NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  PRIMARY KEY (user_id, item_type, item_id)
);

CREATE INDEX favorites_user_idx ON user_favorites (user_id);

CREATE TABLE workouts (
  id SERIAL PRIMARY KEY,
  user_id INTEGER NOT NULL REFERENCES users (id) ON DELETE CASCADE,
  name VARCHAR(200) NOT NULL,
  status VARCHAR(40) NOT NULL DEFAULT 'in_progress',
  duration_seconds INTEGER DEFAULT 0,
  notes TEXT,
  started_at TIMESTAMPTZ,
  finished_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX workouts_user_status_idx ON workouts (user_id, status);

CREATE TABLE workout_logs (
  id SERIAL PRIMARY KEY,
  user_id INTEGER NOT NULL REFERENCES users (id) ON DELETE CASCADE,
  workout_id INTEGER REFERENCES workouts (id) ON DELETE SET NULL,
  exercise_name VARCHAR(200) NOT NULL,
  sets INTEGER NOT NULL DEFAULT 0,
  reps INTEGER NOT NULL DEFAULT 0,
  weight_kg NUMERIC(6, 2),
  note TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX workout_logs_user_date_idx ON workout_logs (user_id, created_at);

CREATE TABLE progress_entries (
  id SERIAL PRIMARY KEY,
  user_id INTEGER NOT NULL REFERENCES users (id) ON DELETE CASCADE,
  date DATE NOT NULL,
  weight_kg NUMERIC(6, 2),
  body_fat_pct NUMERIC(4, 1),
  waist_cm NUMERIC(5, 1),
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX progress_entries_user_date_idx ON progress_entries (user_id, date);

CREATE TABLE workout_sets (
  id SERIAL PRIMARY KEY,
  workout_id INTEGER NOT NULL REFERENCES workouts (id) ON DELETE CASCADE,
  exercise_id INTEGER REFERENCES exercises (id) ON DELETE SET NULL,
  exercise_name VARCHAR(200) NOT NULL,
  set_number INTEGER NOT NULL DEFAULT 0,
  reps INTEGER NOT NULL DEFAULT 0,
  weight_kg NUMERIC(6, 2),
  rpe NUMERIC(3, 1),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX workout_sets_workout_idx ON workout_sets (workout_id);

CREATE TABLE food_logs (
  id SERIAL PRIMARY KEY,
  user_id INTEGER NOT NULL REFERENCES users (id) ON DELETE CASCADE,
  name VARCHAR(200) NOT NULL,
  calories INTEGER NOT NULL DEFAULT 0,
  protein_g NUMERIC(5, 1),
  carbs_g NUMERIC(5, 1),
  fat_g NUMERIC(5, 1),
  meal_type VARCHAR(40),
  log_date DATE NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX food_logs_user_date_idx ON food_logs (user_id, log_date);

CREATE TABLE saved_foods (
  id SERIAL PRIMARY KEY,
  user_id INTEGER NOT NULL REFERENCES users (id) ON DELETE CASCADE,
  name VARCHAR(200) NOT NULL,
  calories INTEGER NOT NULL DEFAULT 0,
  protein_g NUMERIC(5, 1),
  carbs_g NUMERIC(5, 1),
  fat_g NUMERIC(5, 1),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (user_id, name)
);

CREATE TABLE water_logs (
  id SERIAL PRIMARY KEY,
  user_id INTEGER NOT NULL REFERENCES users (id) ON DELETE CASCADE,
  ounces INTEGER NOT NULL DEFAULT 0,
  log_date DATE NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (user_id, log_date)
);

CREATE TABLE user_goals (
  id SERIAL PRIMARY KEY,
  user_id INTEGER NOT NULL REFERENCES users (id) ON DELETE CASCADE,
  title VARCHAR(200) NOT NULL,
  metric VARCHAR(40) NOT NULL,
  target_value NUMERIC(8, 2),
  current_value NUMERIC(8, 2),
  unit VARCHAR(40),
  due_date DATE,
  is_achieved BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX user_goals_user_idx ON user_goals (user_id);
