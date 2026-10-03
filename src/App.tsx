import { Navigate, Route, Routes } from "react-router-dom";
import { Layout } from "./components/Layout";
import { ProtectedRoute } from "./components/ProtectedRoute";
import { AdminRoute } from "./components/AdminRoute";
import { HomePage } from "./pages/HomePage";
import { NotFoundPage } from "./pages/NotFoundPage";
import { ExercisesPage } from "./pages/ExercisesPage";
import { ExerciseDetailPage } from "./pages/ExerciseDetailPage";
import { BlogPage } from "./pages/BlogPage";
import { BlogDetailPage } from "./pages/BlogDetailPage";
import { VideosPage } from "./pages/VideosPage";
import { SearchPage } from "./pages/SearchPage";
import { ContactPage } from "./pages/ContactPage";
import { BmiPage } from "./pages/BmiPage";
import { StaticPage } from "./pages/StaticPage";
import { LoginPage } from "./pages/LoginPage";
import { RegisterPage } from "./pages/RegisterPage";
import { DashboardPage } from "./pages/DashboardPage";
import { DevStyleGuidePage } from "./pages/DevStyleGuidePage";
import { OnboardingPage } from "./pages/OnboardingPage";
import { PlanPage } from "./pages/PlanPage";
import { TodayPage } from "./pages/TodayPage";
import { WorkoutPage } from "./pages/WorkoutPage";
import { WorkoutHistoryPage } from "./pages/WorkoutHistoryPage";
import { WorkoutDetailPage } from "./pages/WorkoutDetailPage";
import { ProgressPage } from "./pages/ProgressPage";
import { JourneyPage } from "./pages/JourneyPage";
import { NutritionLogPage } from "./pages/NutritionLogPage";
import { ProfilePage } from "./pages/ProfilePage";
import { MealPlannerPage } from "./pages/MealPlannerPage";
import { LogoutPage } from "./pages/LogoutPage";
import { AdminPage } from "./pages/AdminPage";
import { AdminExercisesPage } from "./pages/AdminExercisesPage";
import { AdminBlogsPage } from "./pages/AdminBlogsPage";
import { AdminVideosPage } from "./pages/AdminVideosPage";
import { AdminMessagesPage } from "./pages/AdminMessagesPage";
import { AdminCommentsPage } from "./pages/AdminCommentsPage";
import "./styles/tokens.css";
import "./styles/style.css";
import "./styles/home.css";

function App() {
  return (
    <Routes>
      <Route
        path="/"
        element={
          <Layout variant="home">
            <HomePage />
          </Layout>
        }
      />
      <Route
        path="/exercises"
        element={
          <Layout>
            <ExercisesPage />
          </Layout>
        }
      />
      <Route
        path="/exercises/:slug"
        element={
          <Layout>
            <ExerciseDetailPage />
          </Layout>
        }
      />
      <Route
        path="/blog"
        element={
          <Layout>
            <BlogPage />
          </Layout>
        }
      />
      <Route
        path="/blog/:slug"
        element={
          <Layout>
            <BlogDetailPage />
          </Layout>
        }
      />
      <Route
        path="/knowledge"
        element={
          <Layout>
            <StaticPage
              title="Knowledge"
              description="Training, recovery and habit guidance for consistent progress."
              items={[
                {
                  meta: "Training",
                  title: "Keep sessions simple",
                  body: "Choose a repeatable plan, hit the main lifts, and improve with small weekly increases instead of chasing every new idea.",
                },
                {
                  meta: "Recovery",
                  title: "Sleep and fatigue matter",
                  body: "Progress often comes from recovery, not just effort. Give your body enough rest, hydration, and time between hard sessions.",
                },
                {
                  meta: "Habits",
                  title: "Consistency beats intensity",
                  body: "The most effective routine is the one you can repeat. Show up often, and the results compound over time.",
                },
              ]}
            />
          </Layout>
        }
      />
      <Route
        path="/nutrition"
        element={
          <Layout>
            <StaticPage
              title="Nutrition"
              description="Nutrition guidance and habits for the ShuzhFit community."
              items={[
                {
                  meta: "Protein",
                  title: "Build the base",
                  body: "Aim for protein at each meal to support recovery, lean tissue retention, and satiety across the week.",
                },
                {
                  meta: "Calories",
                  title: "Keep energy in balance",
                  body: "Use your training load, activity, and body weight to find a sustainable calorie intake that supports performance and progress.",
                },
                {
                  meta: "Structure",
                  title: "Eat for repeatability",
                  body: "Choose a few foods you can rely on, build meals around them, and keep your routine consistent instead of perfect.",
                },
              ]}
            />
          </Layout>
        }
      />
      <Route
        path="/meal-planner"
        element={
          <ProtectedRoute>
            <Layout>
              <MealPlannerPage />
            </Layout>
          </ProtectedRoute>
        }
      />
      <Route path="/motivation" element={<Navigate to="/" replace />} />
      <Route
        path="/journey"
        element={
          <Layout>
            <JourneyPage />
          </Layout>
        }
      />
      <Route
        path="/bmi"
        element={
          <Layout>
            <BmiPage />
          </Layout>
        }
      />
      <Route
        path="/contact"
        element={
          <Layout>
            <ContactPage />
          </Layout>
        }
      />
      <Route
        path="/search"
        element={
          <Layout>
            <SearchPage />
          </Layout>
        }
      />
      <Route
        path="/login"
        element={
          <Layout>
            <LoginPage />
          </Layout>
        }
      />
      <Route
        path="/register"
        element={
          <Layout>
            <RegisterPage />
          </Layout>
        }
      />
      <Route path="/logout" element={<LogoutPage />} />
      <Route
        path="/onboarding"
        element={
          <ProtectedRoute>
            <Layout>
              <OnboardingPage />
            </Layout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/dashboard"
        element={
          <ProtectedRoute>
            <Layout>
              <DashboardPage />
            </Layout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/plan"
        element={
          <ProtectedRoute>
            <Layout>
              <PlanPage />
            </Layout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/today"
        element={
          <ProtectedRoute>
            <Layout>
              <TodayPage />
            </Layout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/workout"
        element={
          <ProtectedRoute>
            <Layout>
              <WorkoutPage />
            </Layout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/workout-history"
        element={
          <ProtectedRoute>
            <Layout>
              <WorkoutHistoryPage />
            </Layout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/workout/:id"
        element={
          <ProtectedRoute>
            <Layout>
              <WorkoutDetailPage />
            </Layout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/progress"
        element={
          <ProtectedRoute>
            <Layout>
              <ProgressPage />
            </Layout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/nutrition-log"
        element={
          <ProtectedRoute>
            <Layout>
              <NutritionLogPage />
            </Layout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/profile"
        element={
          <ProtectedRoute>
            <Layout>
              <ProfilePage />
            </Layout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/admin"
        element={
          <AdminRoute>
            <Layout>
              <AdminPage />
            </Layout>
          </AdminRoute>
        }
      />
      <Route
        path="/admin/blogs"
        element={
          <AdminRoute>
            <Layout>
              <AdminBlogsPage />
            </Layout>
          </AdminRoute>
        }
      />
      <Route
        path="/admin/exercises"
        element={
          <AdminRoute>
            <Layout>
              <AdminExercisesPage />
            </Layout>
          </AdminRoute>
        }
      />
      <Route
        path="/admin/videos"
        element={
          <AdminRoute>
            <Layout>
              <AdminVideosPage />
            </Layout>
          </AdminRoute>
        }
      />
      <Route
        path="/admin/comments"
        element={
          <AdminRoute>
            <Layout>
              <AdminCommentsPage />
            </Layout>
          </AdminRoute>
        }
      />
      <Route
        path="/admin/messages"
        element={
          <AdminRoute>
            <Layout>
              <AdminMessagesPage />
            </Layout>
          </AdminRoute>
        }
      />
      <Route
        path="/videos"
        element={
          <Layout>
            <VideosPage />
          </Layout>
        }
      />
      <Route
        path="/dev/styleguide"
        element={
          <Layout>
            <DevStyleGuidePage />
          </Layout>
        }
      />
      <Route
        path="/not-found"
        element={
          <Layout>
            <NotFoundPage />
          </Layout>
        }
      />
      <Route path="*" element={<Navigate to="/not-found" replace />} />
    </Routes>
  );
}

export default App;
