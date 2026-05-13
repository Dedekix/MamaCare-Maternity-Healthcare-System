import Sidebar from "./Sidebar";
import WorkspaceTabs from "./WorkspaceTabs";
import { clearCurrentUser, getRoleMeta } from "../../utils/auth";

function AppShell({ user, children }) {
  const roleMeta = getRoleMeta(user?.role);

  if (!user) {
    return null;
  }

  const handleLogout = () => {
    clearCurrentUser();
  };

  return (
    <div className="app-shell">
      <Sidebar user={user} onLogout={handleLogout} roleLabel={roleMeta.label} />
      <main className="main-panel">
        <WorkspaceTabs role={user?.role} />
        {children}
      </main>
    </div>
  );
}

export default AppShell;
