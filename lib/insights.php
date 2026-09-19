<?php

/**
 * ShuzhFit - Training intelligence helpers (part 1)
 *
 * Streaks, weekly consistency, and workout memory.
 * Part 2 (appended below): records, volume, insights, achievements.
 *
 * Data sources: workouts + workout_sets (structured sessions),
 * workout_logs (quick duration logs). Both count toward consistency.
 */

declare(strict_types=1);

if (!defined('SHUZHFIT_INSIGHTS_LOADED')) {
    define('SHUZHFIT_INSIGHTS_LOADED', true);

    /** Real consecutive-day streak ending today or yesterday. */
    function training_streak(int $userId): int
    {
        $rows = db_fetch_all(
            "SELECT d FROM (
                SELECT workout_date AS d FROM workouts WHERE user_id = :uid1 AND status = 'finished'
                UNION
                SELECT log_date AS d FROM workout_logs WHERE user_id = :uid2
            ) days WHERE d <= CURDATE()
              AND d >= DATE_SUB(CURDATE(), INTERVAL 400 DAY)
              GROUP BY d ORDER BY d DESC",
            [':uid1' => $userId, ':uid2' => $userId]
        );

        if (!$rows) {
            return 0;
        }

        $dates = array_map(static fn($r) => (string)$r['d'], $rows);
        $today = new DateTimeImmutable('today');
        $yesterday = $today->modify('-1 day');

        $first = new DateTimeImmutable($dates[0]);
        if ($first != $today && $first != $yesterday) {
            return 0;
        }

        $streak = 1;
        $cursor = $first;
        $count = count($dates);
        for ($i = 1; $i < $count; $i++) {
            $prev = new DateTimeImmutable($dates[$i]);
            if ((int)$cursor->diff($prev)->format('%a') === 1) {
                $streak++;
                $cursor = $prev;
            } else {
                break;
            }
        }

        return $streak;
    }

    /** Structured workouts completed this week (Mon-Sun). */
    function workouts_this_week(int $userId): array
    {
        $count = (int)db_fetch_one(
            "SELECT COUNT(*) AS c FROM workouts
             WHERE user_id = :uid AND status = 'finished'
               AND YEARWEEK(workout_date, 1) = YEARWEEK(CURDATE(), 1)",
            [':uid' => $userId]
        )['c'];

        $minutes = (int)db_fetch_one(
            "SELECT COALESCE(ROUND(SUM(duration_seconds) / 60), 0) AS m FROM workouts
             WHERE user_id = :uid AND status = 'finished'
               AND YEARWEEK(workout_date, 1) = YEARWEEK(CURDATE(), 1)",
            [':uid' => $userId]
        )['m'];

        return ['count' => $count, 'minutes' => $minutes];
    }

    /** Per-week workout counts, oldest first, for consistency charts. */
    function weekly_workout_counts(int $userId, int $weeks = 12): array
    {
        $rows = db_fetch_all(
            "SELECT d, COUNT(*) AS c FROM (
                SELECT workout_date AS d FROM workouts WHERE user_id = :uid1 AND status = 'finished'
                UNION ALL
                SELECT log_date AS d FROM workout_logs WHERE user_id = :uid2
            ) days
            WHERE d > DATE_SUB(CURDATE(), INTERVAL :w WEEK)
            GROUP BY d",
            [':uid1' => $userId, ':uid2' => $userId, ':w' => max(1, $weeks)]
        );

        $buckets = [];
        $monday = new DateTimeImmutable('monday this week');
        for ($i = $weeks - 1; $i >= 0; $i--) {
            $start = $monday->modify("-{$i} weeks");
            $buckets[$start->format('Y-m-d')] = 0;
        }

        foreach ($rows as $r) {
            $day = new DateTimeImmutable((string)$r['d']);
            $weekStart = $day->modify('monday this week')->format('Y-m-d');
            if (isset($buckets[$weekStart])) {
                $buckets[$weekStart] += (int)$r['c'];
            }
        }

        $out = [];
        foreach ($buckets as $weekStart => $count) {
            $out[] = ['week_start' => $weekStart, 'count' => $count];
        }
        return $out;
    }
}

    /**
     * WORKOUT MEMORY: the last finished session that included this exercise.
     * Matches by exercise_id when known, otherwise by lowercase name.
     * Returns ['date' => Y-m-d, 'sets' => [['weight_kg','reps'], ...]] or null.
     */
    function last_performance(int $userId, ?int $exerciseId, string $exerciseName): ?array
    {
        if ($exerciseId !== null && $exerciseId > 0) {
            $row = db_fetch_one(
                "SELECT ws.workout_id, w.workout_date
                 FROM workout_sets ws
                 JOIN workouts w ON w.id = ws.workout_id
                 WHERE ws.user_id = :uid AND ws.exercise_id = :eid AND w.status = 'finished'
                 ORDER BY w.workout_date DESC, ws.id DESC
                 LIMIT 1",
                [':uid' => $userId, ':eid' => $exerciseId]
            );
        } else {
            $row = db_fetch_one(
                "SELECT ws.workout_id, w.workout_date
                 FROM workout_sets ws
                 JOIN workouts w ON w.id = ws.workout_id
                 WHERE ws.user_id = :uid AND LOWER(ws.exercise_name) = LOWER(:name) AND w.status = 'finished'
                 ORDER BY w.workout_date DESC, ws.id DESC
                 LIMIT 1",
                [':uid' => $userId, ':name' => $exerciseName]
            );
        }

        if (!$row) {
            return null;
        }

        $sets = db_fetch_all(
            'SELECT weight_kg, reps FROM workout_sets
             WHERE workout_id = :wid
             ' . ($exerciseId !== null && $exerciseId > 0 ? 'AND exercise_id = :eid' : 'AND LOWER(exercise_name) = LOWER(:name)') . '
             ORDER BY id ASC
             LIMIT 20',
            $exerciseId !== null && $exerciseId > 0
                ? [':wid' => (int)$row['workout_id'], ':eid' => $exerciseId]
                : [':wid' => (int)$row['workout_id'], ':name' => $exerciseName]
        );

        if (!$sets) {
            return null;
        }

        return ['date' => (string)$row['workout_date'], 'sets' => $sets];
    }

    /** Suggested target: repeat last weight, try one more rep. */
    function suggested_target(array $lastSets): array
    {
        $last = end($lastSets) ?: null;
        if (!$last) {
            return ['weight' => null, 'reps' => null, 'note' => ''];
        }

        $weight = $last['weight_kg'] !== null ? (float)$last['weight_kg'] : null;
        $reps = $last['reps'] !== null ? (int)$last['reps'] : null;

        return ['weight' => $weight, 'reps' => $reps, 'note' => 'Match last time, then try one more rep'];
    }

    /** Estimated 1RM using the Epley formula for a single set. */
    function estimate_1rm(?float $weight, ?int $reps): ?float
    {
        if (!$weight || !$reps || $reps <= 0) {
            return null;
        }
        if ($reps === 1) {
            return round($weight, 1);
        }
        return round($weight * (1 + $reps / 30), 1);
    }

    /** Personal records per exercise (best weight, best e1RM). */
    function personal_records(int $userId, int $limit = 12): array
    {
        return db_fetch_all(
            "SELECT ws.exercise_name,
                    MAX(ws.weight_kg) AS best_weight,
                    CAST(SUBSTRING_INDEX(GROUP_CONCAT(ws.reps ORDER BY ws.weight_kg DESC, ws.reps DESC SEPARATOR ','), ',', 1) AS UNSIGNED) AS best_reps,
                    MAX(CASE WHEN ws.reps IS NULL OR ws.reps = 0 THEN ws.weight_kg
                             ELSE ROUND(ws.weight_kg * (1 + ws.reps / 30), 1) END) AS e1rm,
                    MAX(w.workout_date) AS last_date
             FROM workout_sets ws
             JOIN workouts w ON w.id = ws.workout_id
             WHERE ws.user_id = :uid AND w.status = 'finished' AND ws.weight_kg IS NOT NULL AND ws.weight_kg > 0
             GROUP BY ws.exercise_name
             ORDER BY e1rm DESC
             LIMIT :lim",
            [':uid' => $userId, ':lim' => $limit]
        );
    }

    /** Best e1RM for one exercise (by id or name) - used for goal progress. */
    function best_e1rm(int $userId, ?int $exerciseId, string $exerciseName): ?float
    {
        $where = $exerciseId !== null && $exerciseId > 0
            ? 'ws.exercise_id = :eid'
            : 'LOWER(ws.exercise_name) = LOWER(:name)';
        $params = $exerciseId !== null && $exerciseId > 0
            ? [':uid' => $userId, ':eid' => $exerciseId]
            : [':uid' => $userId, ':name' => $exerciseName];

        $row = db_fetch_one(
            "SELECT MAX(CASE WHEN ws.reps IS NULL OR ws.reps = 0 THEN ws.weight_kg
                             ELSE ROUND(ws.weight_kg * (1 + ws.reps / 30), 1) END) AS e1rm
             FROM workout_sets ws
             JOIN workouts w ON w.id = ws.workout_id
             WHERE ws.user_id = :uid AND w.status = 'finished'
               AND ws.weight_kg IS NOT NULL AND ws.weight_kg > 0 AND {$where}",
            $params
        );

        return $row && $row['e1rm'] !== null ? (float)$row['e1rm'] : null;
    }

    /** Total volume (kg lifted) across a date window. */
    function volume_last_days(int $userId, int $days): float
    {
        $row = db_fetch_one(
            "SELECT COALESCE(SUM(ws.weight_kg * ws.reps), 0) AS v
             FROM workout_sets ws
             JOIN workouts w ON w.id = ws.workout_id
             WHERE ws.user_id = :uid AND w.status = 'finished'
               AND w.workout_date >= DATE_SUB(CURDATE(), INTERVAL :d DAY)",
            [':uid' => $userId, ':d' => $days]
        );
        return (float)($row['v'] ?? 0);
    }

    /** Plain-language insights from the user's real data (max 3). */
    function training_insights(int $userId): array
    {
        $insights = [];

        $volThis = volume_last_days($userId, 7);
        $volPrevRow = db_fetch_one(
            "SELECT COALESCE(SUM(ws.weight_kg * ws.reps), 0) AS v
             FROM workout_sets ws
             JOIN workouts w ON w.id = ws.workout_id
             WHERE ws.user_id = :uid AND w.status = 'finished'
               AND w.workout_date >= DATE_SUB(CURDATE(), INTERVAL 14 DAY)
               AND w.workout_date < DATE_SUB(CURDATE(), INTERVAL 7 DAY)",
            [':uid' => $userId]
        );
        $volPrev = (float)($volPrevRow['v'] ?? 0);

        if ($volPrev > 0) {
            $change = (int)round((($volThis - $volPrev) / $volPrev) * 100);
            if ($change >= 5) {
                $insights[] = "Your weekly training volume is up {$change}% vs last week. Keep the increase gradual.";
            } elseif ($change <= -20) {
                $insights[] = "Volume dropped {$change}% vs last week. A lighter week is fine - plan your next session.";
            }
        }

        $user = current_user();
        $target = $user ? max(1, (int)($user['weekly_workout_target'] ?? 3)) : 3;
        $week = workouts_this_week($userId);
        if ($week['count'] >= $target) {
            $insights[] = "Weekly target hit: {$week['count']} of {$target} workouts done. Extra sessions should stay easy.";
        } elseif ($week['count'] > 0) {
            $left = $target - $week['count'];
            $insights[] = "You are {$left} workout" . ($left === 1 ? '' : 's') . " away from your weekly target ({$week['count']}/{$target}).";
        }

        $last = db_fetch_one(
            "SELECT MAX(d) AS last_day FROM (
                SELECT workout_date AS d FROM workouts WHERE user_id = :uid1 AND status = 'finished'
                UNION
                SELECT log_date AS d FROM workout_logs WHERE user_id = :uid2
            ) x",
            [':uid1' => $userId, ':uid2' => $userId]
        )['last_day'] ?? null;

        if ($last) {
            $days = (int)(new DateTimeImmutable('today'))->diff(new DateTimeImmutable((string)$last))->format('%a');
            if ($days >= 4) {
                $insights[] = "It has been {$days} days since your last session. A short workout today restarts momentum.";
            } elseif ($days >= 1) {
                $insights[] = "Last session was {$days} day" . ($days === 1 ? '' : 's') . " ago. Good time to train while you are fresh.";
            }
        }

        return array_slice($insights, 0, 3);
    }

    /** Computed achievements. Each: [icon, title, desc, unlocked, progress%]. */
    function achievements(int $userId): array
    {
        $total = (int)db_fetch_one(
            "SELECT COUNT(*) AS c FROM workouts WHERE user_id = :uid AND status = 'finished'",
            [':uid' => $userId]
        )['c'];
        $quick = (int)db_fetch_one(
            'SELECT COUNT(*) AS c FROM workout_logs WHERE user_id = :uid',
            [':uid' => $userId]
        )['c'];
        $sessions = $total + $quick;
        $streak = training_streak($userId);
        $exercisesTried = (int)db_fetch_one(
            "SELECT COUNT(DISTINCT exercise_name) AS c FROM workout_sets ws
             JOIN workouts w ON w.id = ws.workout_id
             WHERE ws.user_id = :uid AND w.status = 'finished' AND ws.weight_kg > 0",
            [':uid' => $userId]
        )['c'];
        $volume = volume_last_days($userId, 365);
        $foodDays = (int)db_fetch_one(
            'SELECT COUNT(DISTINCT log_date) AS c FROM food_logs WHERE user_id = :uid',
            [':uid' => $userId]
        )['c'];

        $pct = static function (int $value, int $goal): int {
            return $goal > 0 ? (int)max(0, min(100, round($value / $goal * 100))) : 0;
        };

        $mk = static function (string $icon, string $title, string $desc, bool $done, int $progress) {
            return ['icon' => $icon, 'title' => $title, 'desc' => $desc, 'unlocked' => $done, 'pct' => $progress];
        };

        return [
            $mk('🎬', 'First Session', 'Complete your first workout', $sessions >= 1, $pct($sessions, 1)),
            $mk('🔥', '3-Day Streak', 'Train 3 days in a row', $streak >= 3, $pct($streak, 3)),
            $mk('📅', 'Week Warrior', 'Train 7 days in a row', $streak >= 7, $pct($streak, 7)),
            $mk('💪', 'Ten Sessions', 'Finish 10 workouts', $sessions >= 10, $pct($sessions, 10)),
            $mk('🏋️', '25 Sessions', 'Finish 25 workouts', $sessions >= 25, $pct($sessions, 25)),
            $mk('📈', 'First Lift Logged', 'Log a weighted exercise', $exercisesTried >= 1, $pct($exercisesTried, 1)),
            $mk('🧭', 'Explorer', 'Train 5 different exercises', $exercisesTried >= 5, $pct($exercisesTried, 5)),
            $mk('📊', '10 Tonnes', 'Lift 10,000 kg total volume', $volume >= 10000, $pct((int)$volume, 10000)),
            $mk('🍽️', 'Food Logger', 'Log food on 3 different days', $foodDays >= 3, $pct($foodDays, 3)),
        ];
    }

    /**
     * Active goals with computed current values and progress percentages.
     * metric: weight | exercise_weight | workouts_per_week
     */
    function goals_with_progress(int $userId): array
    {
        $goals = db_fetch_all(
            "SELECT * FROM user_goals WHERE user_id = :uid AND status = 'active' ORDER BY created_at ASC",
            [':uid' => $userId]
        );

        $latestWeight = db_fetch_one(
            'SELECT weight_kg FROM progress_entries WHERE user_id = :uid ORDER BY log_date DESC, id DESC LIMIT 1',
            [':uid' => $userId]
        );
        $currentWeight = $latestWeight ? (float)$latestWeight['weight_kg'] : null;

        $out = [];
        foreach ($goals as $g) {
            $target = (float)$g['target_value'];
            $current = null;
            $unit = '';
            $note = '';

            switch ($g['metric']) {
                case 'weight':
                    $current = $currentWeight;
                    $unit = ' kg';
                    if ($current !== null) {
                        $diff = round($current - $target, 1);
                        $note = $diff === 0.0
                            ? 'Target reached!'
                            : ($diff > 0 ? number_format($diff, 1) . ' kg to lose' : number_format(abs($diff), 1) . ' kg to gain');
                    }
                    break;

                case 'exercise_weight':
                    $current = best_e1rm($userId, null, (string)($g['exercise_name'] ?? ''));
                    $unit = ' kg';
                    if ($current !== null) {
                        $note = 'Current best e1RM: ' . number_format($current, 1) . ' kg';
                    }
                    break;

                case 'workouts_per_week':
                    $current = workouts_this_week($userId)['count'];
                    $unit = ' / week';
                    $note = $current >= $target ? 'Weekly target hit' : 'This week so far';
                    break;
            }

            $pct = 0;
            if ($current !== null && $target > 0) {
                if ($g['metric'] === 'weight') {
                    // Progress measured from the first logged weight toward the target
                    $firstWeight = db_fetch_one(
                        'SELECT weight_kg FROM progress_entries WHERE user_id = :uid ORDER BY log_date ASC, id ASC LIMIT 1',
                        [':uid' => $userId]
                    );
                    $start = $firstWeight ? (float)$firstWeight['weight_kg'] : $current;
                    if (abs($start - $target) > 0.01) {
                        $done = abs($start - $current) ;
                        $total = abs($start - $target);
                        $pct = (int)max(0, min(100, round($done / $total * 100)));
                    } else {
                        $pct = 100;
                    }
                } else {
                    $pct = (int)max(0, min(100, round($current / $target * 100)));
                }
            }

            $out[] = [
                'id' => (int)$g['id'],
                'title' => (string)$g['title'],
                'metric' => (string)$g['metric'],
                'target' => $target,
                'current' => $current,
                'unit' => $unit,
                'note' => $note,
                'pct' => $pct,
                'deadline' => $g['deadline'] !== null ? (string)$g['deadline'] : null,
            ];
        }

        return $out;
    }

