import { BrowserRouter, Navigate, Route, Routes } from "react-router-dom";
import ProtectedRoute from "../components/routing/ProtectedRoute";
import Login from "../pages/auth/Login";
import Register from "../pages/auth/Register";
import DashboardHome from "../pages/dashboard/DashboardHome";
import AppointmentsPage from "../pages/appointments/AppointmentsPage";
import NewAppointmentPage from "../pages/appointments/NewAppointmentPage";
import MedicalRecordsPage from "../pages/medical/MedicalRecordsPage";
import NewMedicalRecordPage from "../pages/medical/NewMedicalRecordPage";
import CareNetworkPage from "../pages/network/CareNetworkPage";
import { getCurrentUser } from "../utils/auth";

function AppRoutes() {
  const user = getCurrentUser();

  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={user ? <Navigate to="/dashboard" replace /> : <Login />} />
        <Route
          path="/register"
          element={user ? <Navigate to="/dashboard" replace /> : <Register />}
        />

        <Route element={<ProtectedRoute />}>
          <Route path="/dashboard" element={<DashboardHome />} />
          <Route path="/appointments" element={<AppointmentsPage />} />
          <Route path="/appointments/new" element={<NewAppointmentPage />} />
          <Route path="/care-network" element={<CareNetworkPage />} />
        </Route>

        <Route element={<ProtectedRoute medicalOnly />}>
          <Route path="/medical-records" element={<MedicalRecordsPage />} />
          <Route path="/medical-records/new" element={<NewMedicalRecordPage />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}

export default AppRoutes;
