import { Suspense, lazy } from "react";
import { Navigate, Route, Routes } from "react-router-dom";
import { Layout } from "./components/Layout";
import { ProtectedRoute } from "./components/ProtectedRoute";
import { AdminRoute } from "./components/AdminRoute";
import { ErrorBoundary } from "./components/ErrorBoundary";
const HomePage = lazy(() => import("./pages/HomePage").then((module) => ({ default: module.HomePage })));
const NotFoundPage = lazy(() => import("./pages/NotFoundPage").then((module) => ({ default: module.NotFoundPage })));
const ExercisesPage = lazy(() => import("./pages/ExercisesPage").then((module) => ({ default: module.ExercisesPage })));
const ExerciseDetailPage = lazy(() => import("./pages/ExerciseDetailPage").then((module) => ({ default: module.ExerciseDetailPage })));
const BlogPage = lazy(() => import("./pages/BlogPage").then((module) => ({ default: module.BlogPage })));
const BlogDetailPage = lazy(() => import("./pages/BlogDetailPage").then((module) => ({ default: module.BlogDetailPage })));
const VideosPage = lazy(() => import("./pages/VideosPage").then((module) => ({ default: module.VideosPage })));
const SearchPage = lazy(() => import("./pages/SearchPage").then((module) => ({ default: module.SearchPage })));
const ContactPage = lazy(() => import("./pages/ContactPage").then((module) => ({ default: module.ContactPage })));
const BmiPage = lazy(() => import("./pages/BmiPage").then((module) => ({ default: module.BmiPage })));
const StaticPage = lazy(() => import("./pages/StaticPage").then((module) => ({ default: module.StaticPage })));
const AboutPage = lazy(() => import("./pages/AboutPage").then((module) => ({ default: module.AboutPage })));
const LoginPage = lazy(() => import("./pages/LoginPage").then((module) => ({ default: module.LoginPage })));
const RegisterPage = lazy(() => import("./pages/RegisterPage").then((module) => ({ default: module.RegisterPage })));
const DashboardPage = lazy(() => import("./pages/DashboardPage").then((module) => ({ default: module.DashboardPage })));
const DevStyleGuidePage = lazy(() => import("./pages/DevStyleGuidePage").then((module) => ({ default: module.DevStyleGuidePage })));
const OnboardingPage = lazy(() => import("./pages/OnboardingPage").then((module) => ({ default: module.OnboardingPage })));
const PlanPage = lazy(() => import("./pages/PlanPage").then((module) => ({ default: module.PlanPage })));
const TodayPage = lazy(() => import("./pages/TodayPage").then((module) => ({ default: module.TodayPage })));
const WorkoutPage = lazy(() => import("./pages/WorkoutPage").then((module) => ({ default: module.WorkoutPage })));
const WorkoutHistoryPage = lazy(() => import("./pages/WorkoutHistoryPage").then((module) => ({ default: module.WorkoutHistoryPage })));
const WorkoutDetailPage = lazy(() => import("./pages/WorkoutDetailPage").then((module) => ({ default: module.WorkoutDetailPage })));
const ProgressPage = lazy(() => import("./pages/ProgressPage").then((module) => ({ default: module.ProgressPage })));
const NutritionLogPage = lazy(() => import("./pages/NutritionLogPage").then((module) => ({ default: module.NutritionLogPage })));
const ProfilePage = lazy(() => import("./pages/ProfilePage").then((module) => ({ default: module.ProfilePage })));
const MealPlannerPage = lazy(() => import("./pages/MealPlannerPage").then((module) => ({ default: module.MealPlannerPage })));
const LogoutPage = lazy(() => import("./pages/LogoutPage").then((module) => ({ default: module.LogoutPage })));
const AdminPage = lazy(() => import("./pages/AdminPage").then((module) => ({ default: module.AdminPage })));
const AdminMembersPage = lazy(() => import("./pages/AdminMembersPage").then((module) => ({ default: module.AdminMembersPage })));
const AdminMediaPage = lazy(() => import("./pages/AdminMediaPage").then((module) => ({ default: module.AdminMediaPage })));
const AdminExercisesPage = lazy(() => import("./pages/AdminExercisesPage").then((module) => ({ default: module.AdminExercisesPage })));
const AdminBlogsPage = lazy(() => import("./pages/AdminBlogsPage").then((module) => ({ default: module.AdminBlogsPage })));
const AdminVideosPage = lazy(() => import("./pages/AdminVideosPage").then((module) => ({ default: module.AdminVideosPage })));
const AdminMessagesPage = lazy(() => import("./pages/AdminMessagesPage").then((module) => ({ default: module.AdminMessagesPage })));
const AdminCommentsPage = lazy(() => import("./pages/AdminCommentsPage").then((module) => ({ default: module.AdminCommentsPage })));
import "./styles/tokens.css";
import "./styles/style.css";
import "./styles/home.css";

function App() {
  return (
    <ErrorBoundary><Suspense fallback={<main className="page container" aria-busy="true">Loading page…</main>}>
      <Routes>
      <Route
        path="/"
        element={
          <Layout>
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
        path="/about"
        element={
          <Layout>
            <AboutPage />
          </Layout>
        }
      />
      <Route path="/journey" element={<Navigate to="/about" replace />} />
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
      <Route path="/privacy" element={<Layout><StaticPage title="Privacy Policy" description="We store your account email and password securely, plus the workout, food, water and progress logs you choose to add. YouTube videos may load from YouTube when you play them. Contact ShuzhFit to request account and data deletion." items={[]} /></Layout>} />
      <Route path="/terms" element={<Layout><StaticPage title="Terms of Use" description="ShuzhFit provides fitness tracking and general educational content. Use the service responsibly and contact us if you need help with your account or data." items={[]} /></Layout>} />
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
      <Route path="/admin/members" element={<AdminRoute><Layout><AdminMembersPage /></Layout></AdminRoute>} />
      <Route path="/admin/media" element={<AdminRoute><Layout><AdminMediaPage /></Layout></AdminRoute>} />
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
    </Suspense></ErrorBoundary>
  );
}

export default App;
