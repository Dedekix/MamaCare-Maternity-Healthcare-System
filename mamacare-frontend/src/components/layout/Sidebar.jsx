import { NavLink, useNavigate } from "react-router-dom";
import { getPrimaryActionLinks, getWorkspaceLinks } from "../../utils/navigation";

function Sidebar({ user, onLogout, roleLabel }) {
  const navigate = useNavigate();

  const handleLogout = () => {
    onLogout?.();
    navigate("/");
  };

  const links = getWorkspaceLinks(user?.role).filter(
    (link) => link.group === "workspace"
  );
  const actionLinks = getPrimaryActionLinks(user?.role);

  return (
    <aside className="app-sidebar">
      <div className="sidebar-brand rich">
        <div className="brand-name">MamaCare</div>
        <div className="brand-role">{roleLabel || user?.role || "Member"}</div>
        <div className="sidebar-profile-card">
          <p className="sidebar-profile-name">{user?.fullName || "Member"}</p>
          <p className="sidebar-profile-sub">{user?.email}</p>
        </div>
      </div>

      <nav className="sidebar-nav">
        <div className="sidebar-section-label">Workspace</div>
        {links.map((link) => (
          <NavLink
            key={link.to}
            to={link.to}
            className={({ isActive }) => `sidebar-link ${isActive ? "active" : ""}`}
          >
            <span>{link.label}</span>
          </NavLink>
        ))}

        <div className="sidebar-section-label">Quick Actions</div>
        <div className="sidebar-action-grid">
          {actionLinks.map((link) => (
            <NavLink key={link.to} to={link.to} className="sidebar-action-card">
              <span>{link.shortLabel}</span>
            </NavLink>
          ))}
        </div>

      </nav>

      <div className="sidebar-footer">
        <button type="button" className="sidebar-link" onClick={handleLogout}>
          <span>Logout</span>
        </button>
      </div>
    </aside>
  );
}

export default Sidebar;
