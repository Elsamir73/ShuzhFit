/*
  ShuzhFit - Vanilla JS enhancements
  - Mobile navigation toggle
  - BMI category coloring (on bmi page)
*/

document.addEventListener("DOMContentLoaded", () => {
  // Mobile navigation toggle
  const toggleBtn = document.querySelector("[data-nav-toggle]");
  const panel = document.querySelector("[data-mobile-panel]");

  if (toggleBtn && panel) {
    toggleBtn.addEventListener("click", () => {
      const isOpen = panel.classList.contains("is-open");
      panel.classList.toggle("is-open", !isOpen);

      // Update aria-expanded when possible
      const expanded = !isOpen;
      toggleBtn.setAttribute("aria-expanded", expanded ? "true" : "false");
    });

    // Close mobile panel when a link is clicked
    panel.querySelectorAll("a").forEach((a) => {
      a.addEventListener("click", () => {
        panel.classList.remove("is-open");
        toggleBtn.setAttribute("aria-expanded", "false");
      });
    });
  }

  // Workout name suggestion chips
  document.querySelectorAll("[data-name-fill]").forEach((chip) => {
    chip.addEventListener("click", () => {
      const input = document.getElementById("wname");
      if (input) {
        input.value = chip.getAttribute("data-name-fill");
        input.focus();
      }
    });
  });

  // Saved-food quick fill (nutrition log)
  document.querySelectorAll("[data-food-name]").forEach((chip) => {
    chip.addEventListener("click", () => {
      const set = (id, v) => {
        const el = document.getElementById(id);
        if (el) el.value = v;
      };
      set("fname", chip.getAttribute("data-food-name") || "");
      set("fcal", chip.getAttribute("data-food-cal") || "");
      set("fp", chip.getAttribute("data-food-p") || "");
      set("fc", chip.getAttribute("data-food-c") || "");
      set("ff", chip.getAttribute("data-food-f") || "");
      const meal = document.getElementById("fmeal");
      if (meal) meal.focus();
    });
  });

  // Live workout timer
  const timerEl = document.querySelector("[data-live-timer]");
  if (timerEl) {
    const started = parseInt(timerEl.getAttribute("data-started"), 10) || 0;
    if (started > 0) {
      const tick = () => {
        const secs = Math.max(0, Math.floor(Date.now() / 1000) - started);
        const h = Math.floor(secs / 3600);
        const m = Math.floor((secs % 3600) / 60);
        const s = secs % 60;
        timerEl.textContent =
          (h > 0 ? h + ":" : "") +
          String(m).padStart(2, "0") +
          ":" +
          String(s).padStart(2, "0");
      };
      tick();
      setInterval(tick, 1000);
    }
  }

  // Close any open nav dropdowns when clicking elsewhere
  document.addEventListener("click", (e) => {
    document.querySelectorAll("details.nav-drop[open]").forEach((d) => {
      if (!d.contains(e.target)) {
        d.removeAttribute("open");
      }
    });
  });

  // BMI calculator coloring
  const bmiValueEl = document.getElementById("bmiValue");
  const bmiCategoryEl = document.getElementById("bmiCategory");

  if (bmiValueEl && bmiCategoryEl) {
    // The bmi.php page will call calculateBMI() on input.
  }
});

// BMI calculation function (used by bmi.php)
function calculateBMI() {
  const heightCm = Number(document.getElementById("heightCm").value);
  const weightKg = Number(document.getElementById("weightKg").value);

  const resultWrap = document.getElementById("bmiResult");
  const bmiValueEl = document.getElementById("bmiValue");
  const bmiCategoryEl = document.getElementById("bmiCategory");

  // Simple validation
  if (!heightCm || !weightKg || heightCm <= 0 || weightKg <= 0) {
    resultWrap.className = "notice err";
    bmiValueEl.textContent = "--";
    bmiCategoryEl.textContent = "Enter valid height and weight.";
    return;
  }

  const heightM = heightCm / 100;
  const bmi = weightKg / (heightM * heightM);
  const bmiRounded = Math.round(bmi * 10) / 10;

  let category = "";
  let styleClass = "notice ok";

  // Categories (common WHO-adjacent simple ranges)
  // Underweight: < 18.5
  // Normal: 18.5 - 24.9
  // Overweight: 25 - 29.9
  // Obese: >= 30
  if (bmi < 18.5) {
    category = "Underweight";
    styleClass = "notice err";
  } else if (bmi < 25) {
    category = "Normal";
    styleClass = "notice ok";
  } else if (bmi < 30) {
    category = "Overweight";
    styleClass = "notice err";
  } else {
    category = "Obese";
    styleClass = "notice err";
  }

  resultWrap.className = styleClass;
  bmiValueEl.textContent = bmiRounded;
  bmiCategoryEl.textContent = category;
}
