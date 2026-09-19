<?php

declare(strict_types=1);

require_once __DIR__ . '/lib/db.php';
require_once __DIR__ . '/lib/seo.php';

$pageTitle = 'Meal Planner | ShuzhFit';
$desc = 'Simple meal planning for muscle gain, fat loss, and beginner-friendly nutrition.';

$goals = [
    'muscle_gain' => [
        'label' => 'Muscle Gain',
        'focus' => 'Higher calories with protein-rich meals',
        'meals' => [
            'Breakfast' => 'Oats, milk, banana, eggs, peanut butter',
            'Lunch' => 'Rice, chicken or dal, vegetables, yogurt',
            'Snack' => 'Fruit, whey or yogurt, nuts',
            'Dinner' => 'Rice or potatoes, chicken, lentils, salad',
            'Pre/Post Workout' => 'Banana + yogurt, or rice + chicken',
        ],
    ],
    'fat_loss' => [
        'label' => 'Fat Loss',
        'focus' => 'High protein, controlled carbs, vegetables',
        'meals' => [
            'Breakfast' => 'Eggs, Greek yogurt, fruit, oats in moderation',
            'Lunch' => 'Chicken salad, beans, rice small serving',
            'Snack' => 'Protein shake, fruit, boiled eggs',
            'Dinner' => 'Grilled fish or chicken, vegetables, small potato',
            'Hydration' => 'Water, tea, no sugary drinks',
        ],
    ],
    'maintain' => [
        'label' => 'Maintenance',
        'focus' => 'Balanced meals and consistent portions',
        'meals' => [
            'Breakfast' => 'Eggs, fruit, whole grain toast, yogurt',
            'Lunch' => 'Rice, dal, chicken or tofu, vegetables',
            'Snack' => 'Fruit + yogurt or nuts',
            'Dinner' => 'Balanced plate with protein, carbs, and greens',
            'Extra' => 'Optional smoothie or protein snack',
        ],
    ],
];

$goalKey = $_GET['goal'] ?? 'muscle_gain';
if (!isset($goals[$goalKey])) {
    $goalKey = 'muscle_gain';
}

$goalPlan = $goals[$goalKey];
?>
<!doctype html>
<html lang="en">

<head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <?php render_seo_tags($pageTitle, $desc, '/meal-planner'); ?>
    <link rel="stylesheet" href="css/style.css" />
</head>

<body>
    <?php require __DIR__ . '/includes/header.php'; ?>

    <main class="container page">
        <section class="section-title" style="margin-top:0;">
            <h2>Meal Planner</h2>
            <span>Simple nutrition building blocks</span>
        </section>

        <div class="form-wrap">
            <div class="form-card">
                <label for="goalSelect">Choose your goal</label>
                <select id="goalSelect" onchange="location.href='meal_planner.php?goal=' + this.value" style="width:100%; margin-top:6px; padding:12px; border-radius:12px; border:1px solid rgba(255,255,255,0.1); background:rgba(0,0,0,0.25); color:var(--text);">
                    <?php foreach ($goals as $key => $goalInfo): ?>
                        <option value="<?php echo e($key); ?>" <?php echo $key === $goalKey ? 'selected' : ''; ?>>
                            <?php echo e($goalInfo['label']); ?>
                        </option>
                    <?php endforeach; ?>
                </select>
            </div>
        </div>

        <div class="card" style="margin-top:18px; padding:18px;">
            <h2><?php echo e($goalPlan['label']); ?></h2>
            <p class="muted" style="margin-top:8px; margin-bottom:0;">
                <?php echo e($goalPlan['focus']); ?>
            </p>
        </div>

        <div class="grid" style="grid-template-columns:repeat(2, 1fr); margin-top:18px;">
            <?php foreach ($goalPlan['meals'] as $mealName => $mealPlan): ?>
                <div class="card">
                    <h2><?php echo e($mealName); ?></h2>
                    <p><?php echo e($mealPlan); ?></p>
                </div>
            <?php endforeach; ?>
        </div>

        <div class="card" style="margin-top:20px; padding:18px;">
            <h2>Beginner nutrition rules</h2>
            <ul class="list">
                <li>Eat protein in each meal.</li>
                <li>Keep carbs around training time.</li>
                <li>Drink water throughout the day.</li>
                <li>Use simple local foods like rice, dal, eggs, chicken, milk, and yogurt.</li>
                <li>Stay consistent instead of chasing perfection.</li>
            </ul>
        </div>
    </main>

    <?php require __DIR__ . '/includes/footer.php'; ?>
</body>

</html>