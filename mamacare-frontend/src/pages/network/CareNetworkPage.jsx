import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import AppShell from "../../components/layout/AppShell";
import Navbar from "../../components/layout/Navbar";
import { fetchUsers } from "../../services/api";
import { canAccessMedicalRecords, getCurrentUser } from "../../utils/auth";
import { getFullRoleLabel, normalizeText } from "../../utils/formatters";

const ROLE_FILTERS = ["ALL", "MOTHER", "DOCTOR", "NURSE", "ADMIN"];

function CareNetworkPage() {
  const navigate = useNavigate();
  const currentUser = getCurrentUser();
  const currentUserId = currentUser?.id;
  const [users, setUsers] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [roleFilter, setRoleFilter] = useState("ALL");
  const [isLoading, setIsLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState("");

  useEffect(() => {
    if (!currentUserId) {
      navigate("/");
      return;
    }

    if (currentUser?.role !== "ADMIN") {
      navigate("/dashboard");
      return;
    }

    const loadDirectory = async () => {
      setIsLoading(true);
      setErrorMessage("");

      try {
        const userData = await fetchUsers();
        setUsers(Array.isArray(userData) ? userData : []);
      } catch (error) {
        setErrorMessage(
          error?.response?.data ||
            "Unable to load the care network right now. Please try again."
        );
      } finally {
        setIsLoading(false);
      }
    };

    loadDirectory();
  }, [currentUserId, currentUser?.role, navigate]);

  const filteredUsers = useMemo(() => {
    const query = normalizeText(searchTerm);

    return users.filter((user) => {
      const matchesRole = roleFilter === "ALL" || user.role === roleFilter;
      const matchesSearch =
        !query ||
        normalizeText(user.fullName).includes(query) ||
        normalizeText(user.email).includes(query);

      return matchesRole && matchesSearch;
    });
  }, [roleFilter, searchTerm, users]);

  const clinicianCount = users.filter((user) =>
    ["DOCTOR", "NURSE"].includes(user.role)
  ).length;
  const motherCount = users.filter((user) => user.role === "MOTHER").length;
  const accessibleMedical = canAccessMedicalRecords(currentUser?.role);

  if (!currentUserId) {
    return null;
  }

  return (
    <AppShell user={currentUser}>
      <Navbar
        eyebrow="Care Network"
        title="People and contact details"
        subtitle="Browse the users connected to MamaCare and move directly into appointments or records."
        actions={
          <>
            <Link to="/appointments/new" className="btn-primary">
              Book Appointment
            </Link>
            {accessibleMedical ? (
              <Link to="/medical-records/new" className="btn-secondary">
                Add Record
              </Link>
            ) : (
              <Link to="/appointments" className="btn-secondary">
                View Schedule
              </Link>
            )}
          </>
        }
      />

      {errorMessage ? <div className="alert-box error">{errorMessage}</div> : null}

      <section className="stats-grid compact">
        <article className="stat-card rose">
          <p className="stat-label">All Users</p>
          <h2 className="stat-value">{users.length}</h2>
          <p className="stat-sub">Registered accounts across the platform</p>
        </article>
        <article className="stat-card sage">
          <p className="stat-label">Clinicians</p>
          <h2 className="stat-value">{clinicianCount}</h2>
          <p className="stat-sub">Doctors and nurses available in the directory</p>
        </article>
        <article className="stat-card warm">
          <p className="stat-label">Mothers</p>
          <h2 className="stat-value">{motherCount}</h2>
          <p className="stat-sub">Mothers currently registered for care</p>
        </article>
      </section>

      <section className="card">
        <div className="toolbar filters-toolbar">
          <div className="toolbar-group">
            <div className="form-field inline-field">
              <label htmlFor="directory-search">Search</label>
              <input
                id="directory-search"
                type="search"
                className="form-control"
                placeholder="Search by name or email"
                value={searchTerm}
                onChange={(event) => setSearchTerm(event.target.value)}
              />
            </div>
          </div>

          <div className="toolbar-group grow">
            <div className="form-field inline-field">
              <label htmlFor="role-filter">Role</label>
              <select
                id="role-filter"
                className="form-control"
                value={roleFilter}
                onChange={(event) => setRoleFilter(event.target.value)}
              >
                {ROLE_FILTERS.map((role) => (
                  <option key={role} value={role}>
                    {role === "ALL" ? "All roles" : getFullRoleLabel(role)}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {isLoading ? (
          <p className="loading-state">Loading care network...</p>
        ) : filteredUsers.length === 0 ? (
          <p className="empty-state">
            No users match the current search and filter combination.
          </p>
        ) : (
          <div className="table-shell">
            <table className="panel-table">
              <thead>
                <tr>
                  <th>Name</th>
                  <th>Role</th>
                  <th>Email</th>
                  <th>Phone</th>
                  <th>Action</th>
                </tr>
              </thead>
              <tbody>
                {filteredUsers.map((user) => (
                  <tr key={user.id}>
                    <td data-label="Name">{user.fullName}</td>
                    <td data-label="Role">
                      <span className="status-badge sage">
                        {getFullRoleLabel(user.role)}
                      </span>
                    </td>
                    <td data-label="Email">{user.email}</td>
                    <td data-label="Phone">{user.phoneNumber || "Not provided"}</td>
                    <td data-label="Action">
                      <div className="table-actions">
                        <Link to="/appointments/new" className="table-action primary">
                          Book
                        </Link>
                        {accessibleMedical ? (
                          <Link
                            to="/medical-records/new"
                            className="table-action primary"
                          >
                            Record
                          </Link>
                        ) : null}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

      <section className="content-grid single-gap">
        <article className="card">
          <div className="card-header">
            <h2 className="card-title">Directory Highlights</h2>
            <span className="card-link">{motherCount} mothers in care</span>
          </div>
          <div className="notification-list">
            <div className="detail-item">
              <p className="detail-label">How to use this page</p>
              <p className="detail-value">
                Search the team directory to find mothers, doctors, nurses, and admins.
              </p>
            </div>
            <div className="detail-item">
              <p className="detail-label">Good next step</p>
              <p className="detail-value">
                Use the Book button to move directly into appointment creation after
                finding the right person.
              </p>
            </div>
          </div>
        </article>
      </section>
    </AppShell>
  );
}

export default CareNetworkPage;
