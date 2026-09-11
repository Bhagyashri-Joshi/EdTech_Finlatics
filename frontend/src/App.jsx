import {
  Navigate,
  Route,
  Routes
} from 'react-router-dom';

import ProtectedRoute
  from './components/ProtectedRoute';

import AppShell
  from './components/AppShell';

import Login
  from './pages/Login';

import Students
  from './pages/Students';

import Dashboard
  from './pages/Dashboard';

import StudentDetails
  from './pages/StudentDetails';

import Analytics
  from './pages/Analytics';

import AIInsights
  from './pages/AIInsights';

import Settings
  from './pages/Settings';

export default function App() {

  return (

    <Routes>

      <Route
        path="/login"
        element={<Login />}
      />

      <Route
        element={<ProtectedRoute />}
      >

        <Route
          element={<AppShell />}
        >

          <Route
            path="/dashboard"
            element={<Dashboard />}
          />

          <Route
            path="/students"
            element={<Students />}
          />

          <Route
            path="/students/:id"
            element={<StudentDetails />}
          />

          <Route
            path="/analytics"
            element={<Analytics />}
          />

          <Route
            path="/ai-insights"
            element={<AIInsights />}
          />

          <Route
            path="/settings"
            element={<Settings />}
          />

        </Route>

      </Route>

      <Route
        path="*"
        element={
          <Navigate
            to="/dashboard"
            replace
          />
        }
      />

    </Routes>
  );
}