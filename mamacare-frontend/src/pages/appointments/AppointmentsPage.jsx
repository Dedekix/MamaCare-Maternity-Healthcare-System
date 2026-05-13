import { useCallback, useEffect, useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { deleteAppointment, fetchAppointments, updateAppointment } from "../../services/api";
import AppShell from "../../components/layout/AppShell";
import Navbar from "../../components/layout/Navbar";
import { canAccessMedicalRecords, getCurrentUser } from "../../utils/auth";
import { formatDateTime, normalizeText, toDateInputValue } from "../../utils/formatters";

const APPOINTMENT_FILTERS = [
  { id: "all", label: "All" },
  { id: "mine", label: "My Schedule" },
  { id: "pending", label: "Pending" },
  { id: "upcoming", label: "Upcoming" },
];

const APPOINTMENT_STATUSES = [
  "PENDING",
  "APPROVED",
  "REJECTED",
  "COMPLETED",
  "CANCELLED",
];

function AppointmentsPage() {
  const navigate = useNavigate();
  const currentUser = getCurrentUser();
  const currentUserId = currentUser?.id;
  const currentUserRole = currentUser?.role;
  const isMother = currentUserRole === "MOTHER";
  const canUseMedical = canAccessMedicalRecords(currentUserRole);

  const [appointments, setAppointments] = useState([]);
  const [errorMessage, setErrorMessage] = useState("");
  const [successMessage, setSuccessMessage] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [selectedAppointment, setSelectedAppointment] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [activeFilter, setActiveFilter] = useState("all");
  const [isEditMode, setIsEditMode] = useState(false);
  const [editFormData, setEditFormData] = useState({
    appointmentDateTime: "",
    status: "",
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const canApproveSelectedAppointment =
    currentUserRole === "DOCTOR" &&
    selectedAppointment?.status === "PENDING" &&
    selectedAppointment?.doctor?.id === currentUserId;

  const loadAppointments = useCallback(async (showLoading = true) => {
    if (showLoading) {
      setIsLoading(true);
      setErrorMessage("");
    }

    try {
      const appointmentData = await fetchAppointments();
      let safeAppointments = Array.isArray(appointmentData) ? appointmentData : [];
      // Filter based on role
      if (currentUserRole === "MOTHER") {
        safeAppointments = safeAppointments.filter((appointment) => appointment.mother?.id === currentUserId);
      } else if (currentUserRole === "DOCTOR") {
        safeAppointments = safeAppointments.filter((appointment) => appointment.doctor?.id === currentUserId);
      } // For NURSE and ADMIN, show all
      setAppointments(safeAppointments);
      setSelectedAppointment((current) => {
        if (!safeAppointments.length) {
          return null;
        }

        if (!current) {
          return safeAppointments[0];
        }

        return (
          safeAppointments.find((appointment) => appointment.id === current.id) ||
          safeAppointments[0]
        );
      });
    } catch (error) {
      setErrorMessage(
        error?.response?.data ||
          "Failed to load appointments. Please try again."
      );
    } finally {
      setIsLoading(false);
    }
  }, [currentUserId, currentUserRole]);

  const handleEdit = () => {
    if (selectedAppointment) {
      setEditFormData({
        appointmentDateTime: toDateInputValue(selectedAppointment.appointmentDateTime),
        status: selectedAppointment.status || "",
      });
      setIsEditMode(true);
    }
  };

  const handleCancelEdit = () => {
    setIsEditMode(false);
    setEditFormData({
      appointmentDateTime: "",
      status: "",
    });
  };

  const handleSaveEdit = async () => {
    if (!selectedAppointment) return;

    setIsSubmitting(true);
    setErrorMessage("");
    setSuccessMessage("");

    try {
      await updateAppointment(selectedAppointment.id, {
        ...editFormData,
        status: isMother ? "PENDING" : editFormData.status,
      });
      setSuccessMessage("Appointment updated successfully.");
      setIsEditMode(false);
      // Reload appointments
      await loadAppointments(false);
    } catch (error) {
      setErrorMessage(
        error?.response?.data || "Failed to update appointment."
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleApproveAppointment = async () => {
    if (!selectedAppointment || !canApproveSelectedAppointment) return;

    setIsSubmitting(true);
    setErrorMessage("");
    setSuccessMessage("");

    try {
      await updateAppointment(selectedAppointment.id, {
        appointmentDateTime: selectedAppointment.appointmentDateTime,
        status: "APPROVED",
      });
      setSuccessMessage("Appointment approved successfully.");
      await loadAppointments(false);
    } catch (error) {
      setErrorMessage(
        error?.response?.data || "Failed to approve appointment."
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  useEffect(() => {
    if (!currentUserId) {
      navigate("/");
      return;
    }

    loadAppointments();
  }, [currentUserId, navigate, loadAppointments]);

  const filteredAppointments = useMemo(() => {
    const query = normalizeText(searchTerm);
    const now = new Date();

    return appointments.filter((appointment) => {
      const appointmentDate = new Date(appointment.appointmentDateTime);
      const isUpcoming =
        !Number.isNaN(appointmentDate.getTime()) && appointmentDate >= now;
      const matchesSearch =
        !query ||
        normalizeText(appointment.mother?.fullName).includes(query) ||
        normalizeText(appointment.doctor?.fullName).includes(query) ||
        normalizeText(appointment.status).includes(query);

      const matchesMySchedule =
        currentUserRole === "MOTHER"
          ? appointment.mother?.id === currentUserId
          : currentUserRole === "DOCTOR"
          ? appointment.doctor?.id === currentUserId
          : true;

      const matchesFilter =
        activeFilter === "all" ||
        (activeFilter === "mine" && matchesMySchedule) ||
        (activeFilter === "pending" && appointment.status === "PENDING") ||
        (activeFilter === "upcoming" && isUpcoming);

      return matchesFilter && matchesSearch;
    });
  }, [activeFilter, appointments, currentUserId, currentUserRole, searchTerm]);

  const appointmentSummary = useMemo(() => {
    const now = new Date();
    const mine = appointments.filter((appointment) =>
      currentUserRole === "MOTHER"
        ? appointment.mother?.id === currentUserId
        : currentUserRole === "DOCTOR"
        ? appointment.doctor?.id === currentUserId
        : true
    );

    return {
      total: appointments.length,
      pending: appointments.filter((appointment) => appointment.status === "PENDING")
        .length,
      upcoming: appointments.filter((appointment) => {
        const value = new Date(appointment.appointmentDateTime);
        return !Number.isNaN(value.getTime()) && value >= now;
      }).length,
      mine: mine.length,
    };
  }, [appointments, currentUserId, currentUserRole]);

  const handleDelete = async (appointmentId) => {
    setErrorMessage("");
    setSuccessMessage("");

    try {
      const message = await deleteAppointment(appointmentId);
      setSuccessMessage(message);
      await loadAppointments();
    } catch (error) {
      setErrorMessage(
        error?.response?.data || "Could not delete the appointment."
      );
    }
  };

  if (!currentUserId) {
    return null;
  }

  return (
    <AppShell user={currentUser}>
      <Navbar
        eyebrow="Appointments"
        title="Appointments workspace"
        subtitle="Track scheduled maternal visits, filter the schedule quickly, and move into booking or records without leaving the workspace."
        actions={
          <>
            <button
              type="button"
              className="btn-secondary"
              onClick={() => loadAppointments()}
            >
              Refresh
            </button>
            <Link to="/appointments/new" className="btn-primary">
              New Appointment
            </Link>
            {canUseMedical ? (
              <Link to="/medical-records" className="btn-secondary">
                Medical Records
              </Link>
            ) : null}
          </>
        }
      />

      {errorMessage ? <div className="alert-box error">{errorMessage}</div> : null}
      {successMessage ? <div className="alert-box success">{successMessage}</div> : null}

      <section className="stats-grid compact">
        <article className="stat-card rose">
          <p className="stat-label">Appointments</p>
          <h2 className="stat-value">{appointmentSummary.total}</h2>
          <p className="stat-sub">All visits loaded from the appointment endpoint</p>
        </article>
        <article className="stat-card sage">
          <p className="stat-label">My Schedule</p>
          <h2 className="stat-value">{appointmentSummary.mine}</h2>
          <p className="stat-sub">Appointments linked to the current role</p>
        </article>
        <article className="stat-card warm">
          <p className="stat-label">Upcoming</p>
          <h2 className="stat-value">{appointmentSummary.upcoming}</h2>
          <p className="stat-sub">{appointmentSummary.pending} still pending review</p>
        </article>
      </section>

      <div className="panel-grid split-layout">
        <section className="card">
          <div className="tab-row">
            {APPOINTMENT_FILTERS.map((filter) => (
              <button
                key={filter.id}
                type="button"
                className={`filter-tab ${activeFilter === filter.id ? "active" : ""}`}
                onClick={() => setActiveFilter(filter.id)}
              >
                {filter.label}
              </button>
            ))}
          </div>

          <div className="toolbar">
            <div className="form-field inline-field grow">
              <label htmlFor="appointment-search">Search appointments</label>
              <input
                id="appointment-search"
                type="search"
                className="form-control"
                placeholder="Search by mother, doctor, or status"
                value={searchTerm}
                onChange={(event) => setSearchTerm(event.target.value)}
              />
            </div>
            <span className="card-link">{filteredAppointments.length} results</span>
          </div>

          {isLoading ? (
            <p className="loading-state">Loading appointments...</p>
          ) : filteredAppointments.length === 0 ? (
            <p className="empty-state">
              No appointments match the current filters. Try another tab or create a
              new booking.
            </p>
          ) : (
            <div className="table-shell">
              <table className="panel-table">
                <thead>
                  <tr>
                    <th>Date</th>
                    <th>Status</th>
                    <th>Mother</th>
                    <th>Doctor</th>
                    <th>Action</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredAppointments.map((appointment) => (
                    <tr
                      key={appointment.id}
                      className={
                        selectedAppointment?.id === appointment.id ? "active-row" : ""
                      }
                      onClick={() => setSelectedAppointment(appointment)}
                    >
                      <td data-label="Date">{formatDateTime(appointment.appointmentDateTime)}</td>
                      <td data-label="Status">
                        <span className="status-badge rose">{appointment.status}</span>
                      </td>
                      <td data-label="Mother">{appointment.mother?.fullName || "Unknown"}</td>
                      <td data-label="Doctor">{appointment.doctor?.fullName || "Unknown"}</td>
                      <td data-label="Action">
                        <button
                          type="button"
                          className="table-action primary"
                          onClick={(event) => {
                            event.stopPropagation();
                            setSelectedAppointment(appointment);
                          }}
                        >
                          View
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>

        <section className="detail-card">
          <div className="card-header">
            <h2 className="card-title">Appointment details</h2>
            {selectedAppointment ? (
              <span className="status-badge sage">{selectedAppointment.status}</span>
            ) : null}
          </div>

          {!selectedAppointment ? (
            <p className="empty-state">
              Select an appointment to view the full visit details.
            </p>
          ) : (
            <>
              <div className="detail-grid">
                <div className="detail-item">
                  <p className="detail-label">Scheduled Time</p>
                  <p className="detail-value">
                    {formatDateTime(selectedAppointment.appointmentDateTime)}
                  </p>
                </div>
                <div className="detail-item">
                  <p className="detail-label">Mother</p>
                  <p className="detail-value">
                    {selectedAppointment.mother?.fullName || "Unknown"}
                  </p>
                </div>
                <div className="detail-item">
                  <p className="detail-label">Doctor</p>
                  <p className="detail-value">
                    {selectedAppointment.doctor?.fullName || "Unknown"}
                  </p>
                </div>
                <div className="detail-item full">
                  <p className="detail-label">Mother Email</p>
                  <p className="detail-value">
                    {selectedAppointment.mother?.email || "No email"}
                  </p>
                </div>
                <div className="detail-item full">
                  <p className="detail-label">Doctor Email</p>
                  <p className="detail-value">
                    {selectedAppointment.doctor?.email || "No email"}
                  </p>
                </div>
              </div>

              <div className="action-row">
                <Link to="/appointments/new" className="btn-primary">
                  Book Another
                </Link>
                <button
                  type="button"
                  className="btn-secondary"
                  onClick={handleEdit}
                  disabled={isEditMode}
                >
                  Edit Appointment
                </button>
                {canApproveSelectedAppointment ? (
                  <button
                    type="button"
                    className="btn-primary"
                    onClick={handleApproveAppointment}
                    disabled={isSubmitting || isEditMode}
                  >
                    {isSubmitting ? "Approving..." : "Approve Appointment"}
                  </button>
                ) : null}
                {canUseMedical ? (
                  <Link to="/medical-records" className="btn-secondary">
                    Open Records
                  </Link>
                ) : null}
                {currentUserRole !== "MOTHER" ? (
                  <button
                    type="button"
                    className="btn-secondary danger-outline"
                    onClick={() => handleDelete(selectedAppointment.id)}
                    disabled={isEditMode}
                  >
                    Delete Appointment
                  </button>
                ) : null}
              </div>

              {isEditMode && (
                <div className="edit-form">
                  <h3>Edit Appointment</h3>
                  {errorMessage && <div className="alert-box error">{errorMessage}</div>}
                  {successMessage && <div className="alert-box success">{successMessage}</div>}
                  <form onSubmit={(e) => { e.preventDefault(); handleSaveEdit(); }}>
                    <div className="form-field">
                      <label>Appointment Date & Time</label>
                      <input
                        type="datetime-local"
                        className="form-control"
                        value={editFormData.appointmentDateTime}
                        onChange={(e) => setEditFormData({ ...editFormData, appointmentDateTime: e.target.value })}
                        required
                      />
                    </div>
                    {isMother ? (
                      <div className="detail-item">
                        <p className="detail-label">Status</p>
                        <p className="detail-value">PENDING</p>
                      </div>
                    ) : (
                      <div className="form-field">
                        <label>Status</label>
                        <select
                          className="form-control"
                          value={editFormData.status}
                          onChange={(e) => setEditFormData({ ...editFormData, status: e.target.value })}
                          required
                        >
                          <option value="">Select status</option>
                          {APPOINTMENT_STATUSES.map((status) => (
                            <option key={status} value={status}>
                              {status}
                            </option>
                          ))}
                        </select>
                      </div>
                    )}
                    <div className="action-row">
                      <button type="submit" className="btn-primary" disabled={isSubmitting}>
                        {isSubmitting ? "Saving..." : "Save Changes"}
                      </button>
                      <button type="button" className="btn-secondary" onClick={handleCancelEdit}>
                        Cancel
                      </button>
                    </div>
                  </form>
                </div>
              )}
            </>
          )}
        </section>
      </div>
    </AppShell>
  );
}

export default AppointmentsPage;
