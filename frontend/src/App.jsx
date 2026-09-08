import { Navigate, Route, Routes } from "react-router-dom";
import Auth from "./components/Auth";
import ProtectedRoute from "./components/ProtectedRoute";
import Attendance from "./pages/Attendance";
import Dashboard from "./pages/Dashboard";
import Notes from "./pages/Notes";
import Profile from "./pages/Profile";
import History from "./pages/History";
import Subjects from "./pages/Subjects";
import Tasks from "./pages/Tasks";

const protectedPage = (Page) => <ProtectedRoute><Page /></ProtectedRoute>;

export default function App() {
  return <Routes>
    <Route path="/login" element={<Auth mode="login" />} />
    <Route path="/register" element={<Auth mode="register" />} />
    <Route path="/" element={<Navigate to="/dashboard" replace />} />
    <Route path="/dashboard" element={protectedPage(Dashboard)} />
    <Route path="/subjects" element={protectedPage(Subjects)} />
    <Route path="/tasks" element={protectedPage(Tasks)} />
    <Route path="/attendance" element={protectedPage(Attendance)} />
    <Route path="/notes" element={protectedPage(Notes)} />
    <Route path="/profile" element={protectedPage(Profile)} />
    <Route path="/history" element={protectedPage(History)} />
    <Route path="*" element={<Navigate to="/dashboard" replace />} />
  </Routes>;
}
