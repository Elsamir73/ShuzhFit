<?php
// ShuzhFit - Personal Fitness Calculator
require __DIR__ . '/includes/header.php';
?>

<section class="page">
    <div class="section-title">
        <h2>Personal Fitness Calculator</h2>
        <span>BMI + calorie guidance</span>
    </div>

    <div class="form-wrap">
        <div class="form-card">
            <p style="margin:0 0 14px; color:var(--muted);">
                Enter your basic stats to get a quick BMI category and an estimated calorie target for your goal.
            </p>

            <div class="grid" style="grid-template-columns: repeat(2, 1fr); margin-top:0;">
                <div>
                    <label for="age">Age</label>
                    <input id="age" type="number" placeholder="e.g., 26" min="10" max="100" inputmode="numeric" />
                </div>
                <div>
                    <label for="heightCm">Height (cm)</label>
                    <input id="heightCm" type="number" placeholder="e.g., 170" min="50" max="300" inputmode="numeric" />
                </div>
            </div>

            <div class="grid" style="grid-template-columns: repeat(2, 1fr); margin-top:0;">
                <div>
                    <label for="weightKg">Weight (kg)</label>
                    <input id="weightKg" type="number" placeholder="e.g., 65" min="10" max="500" inputmode="decimal" step="0.1" />
                </div>
                <div>
                    <label for="activity">Activity Level</label>
                    <select id="activity" style="width:100%; margin-top:6px; padding:12px; border-radius:12px; border:1px solid rgba(255,255,255,0.1); background:rgba(0,0,0,0.25); color:var(--text);">
                        <option value="1.2">Sedentary</option>
                        <option value="1.375">Lightly Active</option>
                        <option value="1.55" selected>Moderately Active</option>
                        <option value="1.725">Very Active</option>
                        <option value="1.9">Athlete / High Training</option>
                    </select>
                </div>
            </div>

            <div class="grid" style="grid-template-columns: repeat(2, 1fr); margin-top:0;">
                <div>
                    <label for="goal">Goal</label>
                    <select id="goal" style="width:100%; margin-top:6px; padding:12px; border-radius:12px; border:1px solid rgba(255,255,255,0.1); background:rgba(0,0,0,0.25); color:var(--text);">
                        <option value="fat_loss">Fat Loss</option>
                        <option value="maintain" selected>Maintain</option>
                        <option value="muscle_gain">Muscle Gain</option>
                    </select>
                </div>
                <div>
                    <label>&nbsp;</label>
                    <div class="form-actions" style="margin-top:0;">
                        <button class="btn btn-primary" type="button" onclick="calculateBMI()">Calculate</button>
                        <button class="btn" type="button" onclick="clearBMI()">Clear</button>
                    </div>
                </div>
            </div>

            <div id="bmiResult" class="notice" style="display:block; margin-top:16px;">
                <strong>Your BMI:</strong> <span id="bmiValue">--</span>
                <div style="margin-top:6px;"><strong>Category:</strong> <span id="bmiCategory">--</span></div>
            </div>
        </div>
    </div>

    <div class="grid" id="fitnessSummary" style="display:none; margin-top:20px;">
        <div class="card">
            <h2>Estimated Maintenance</h2>
            <p id="maintenanceCalories">-- kcal</p>
        </div>
        <div class="card">
            <h2>Target Calories</h2>
            <p id="targetCalories">-- kcal</p>
        </div>
        <div class="card">
            <h2>Protein Target</h2>
            <p id="proteinTarget">-- g</p>
        </div>
    </div>

    <script>
        function clearBMI() {
            const resultWrap = document.getElementById('bmiResult');
            const bmiValueEl = document.getElementById('bmiValue');
            const bmiCategoryEl = document.getElementById('bmiCategory');
            const summary = document.getElementById('fitnessSummary');
            const maintenanceCalories = document.getElementById('maintenanceCalories');
            const targetCalories = document.getElementById('targetCalories');
            const proteinTarget = document.getElementById('proteinTarget');

            resultWrap.className = 'notice';
            bmiValueEl.textContent = '--';
            bmiCategoryEl.textContent = '--';
            summary.style.display = 'none';
            maintenanceCalories.textContent = '-- kcal';
            targetCalories.textContent = '-- kcal';
            proteinTarget.textContent = '-- g';
        }

        function calculateBMI() {
            const age = Number(document.getElementById('age').value);
            const heightCm = Number(document.getElementById('heightCm').value);
            const weightKg = Number(document.getElementById('weightKg').value);
            const activity = Number(document.getElementById('activity').value);
            const goal = document.getElementById('goal').value;

            const resultWrap = document.getElementById('bmiResult');
            const bmiValueEl = document.getElementById('bmiValue');
            const bmiCategoryEl = document.getElementById('bmiCategory');
            const maintenanceCalories = document.getElementById('maintenanceCalories');
            const targetCalories = document.getElementById('targetCalories');
            const proteinTarget = document.getElementById('proteinTarget');
            const summary = document.getElementById('fitnessSummary');

            if (!heightCm || !weightKg || heightCm <= 0 || weightKg <= 0 || !age || age <= 0) {
                resultWrap.className = 'notice err';
                bmiValueEl.textContent = '--';
                bmiCategoryEl.textContent = 'Enter valid age, height, and weight.';
                summary.style.display = 'none';
                return;
            }

            const heightM = heightCm / 100;
            const bmi = weightKg / (heightM * heightM);
            const bmiRounded = Math.round(bmi * 10) / 10;

            let category = 'Normal';
            let styleClass = 'notice ok';

            if (bmi < 18.5) {
                category = 'Underweight';
                styleClass = 'notice err';
            } else if (bmi < 25) {
                category = 'Normal';
                styleClass = 'notice ok';
            } else if (bmi < 30) {
                category = 'Overweight';
                styleClass = 'notice err';
            } else {
                category = 'Obese';
                styleClass = 'notice err';
            }

            const maintenance = Math.round(weightKg * 22 * activity);
            let target = maintenance;

            if (goal === 'fat_loss') {
                target = maintenance - 350;
            } else if (goal === 'muscle_gain') {
                target = maintenance + 250;
            }

            const protein = Math.round(weightKg * 1.8);

            resultWrap.className = styleClass;
            bmiValueEl.textContent = bmiRounded;
            bmiCategoryEl.textContent = category;
            maintenanceCalories.textContent = maintenance + ' kcal';
            targetCalories.textContent = target + ' kcal';
            proteinTarget.textContent = protein + ' g';
            summary.style.display = 'grid';
        }
    </script>
</section>

<?php require __DIR__ . '/includes/footer.php'; ?>