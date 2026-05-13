import { NavLink } from "react-router-dom";
import { getWorkspaceLinks } from "../../utils/navigation";

function WorkspaceTabs({ role }) {
  const workspaceLinks = getWorkspaceLinks(role).filter(
    (link) => link.group === "workspace"
  );

  return (
    <nav className="workspace-tabs" aria-label="Workspace sections">
      {workspaceLinks.map((link) => (
        <NavLink
          key={link.to}
          to={link.to}
          className={({ isActive }) =>
            `workspace-tab ${isActive ? "active" : ""}`
          }
        >
          <span>{link.shortLabel}</span>
        </NavLink>
      ))}
    </nav>
  );
}

export default WorkspaceTabs;
