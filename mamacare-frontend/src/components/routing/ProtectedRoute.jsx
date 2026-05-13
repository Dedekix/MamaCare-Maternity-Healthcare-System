import { Navigate, Outlet } from "react-router-dom";
import { canAccessMedicalRecords, getCurrentUser } from "../../utils/auth";

function ProtectedRoute({ medicalOnly = false }) {
  const user = getCurrentUser();

  if (!user) {
    return <Navigate to="/" replace />;
  }

  if (medicalOnly && !canAccessMedicalRecords(user.role)) {
    return <Navigate to="/dashboard" replace />;
  }

  return <Outlet />;
}

export default ProtectedRoute;
