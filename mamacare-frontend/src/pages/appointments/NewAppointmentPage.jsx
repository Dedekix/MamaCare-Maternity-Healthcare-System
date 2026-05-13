import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { createAppointment, fetchUsers } from "../../services/api";
import AppShell from "../../components/layout/AppShell";
import Navbar from "../../components/layout/Navbar";
import { getCurrentUser } from "../../utils/auth";

const APPOINTMENT_STATUSES = [
  "PENDING",
  "APPROVED",
  "REJECTED",
  "COMPLETED",
  "CANCELLED",
];

const AVAILABLE_SLOTS = ["08:00", "09:30", "10:00", "11:30", "13:00", "15:00"];
const WEEKDAY_LABELS = [
  "Sunday",
  "Monday",
  "Tuesday",
  "Wednesday",
  "Thursday",
  "Friday",
  "Saturday",
];

function NewAppointmentPage() {
  const navigate = useNavigate();
  const currentUser = getCurrentUser();
  const currentUserId = currentUser?.id;
  const currentUserRole = currentUser?.role;
  const isMother = currentUserRole === "MOTHER";

  const [users, setUsers] = useState([]);
  const [formData, setFormData] = useState({
    status: "PENDING",
    motherId: "",
    doctorId: "",
  });
  const [selectedDate, setSelectedDate] = useState("");
  const [selectedSlot, setSelectedSlot] = useState("");
  const [errorMessage, setErrorMessage] = useState("");
  const [successMessage, setSuccessMessage] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const today = new Date();
  const year = today.getFullYear();
  const monthIndex = today.getMonth();
  const monthStart = new Date(year, monthIndex, 1);
  const firstDay = monthStart.getDay();
  const daysInMonth = new Date(year, monthIndex + 1, 0).getDate();
  const monthLabel = monthStart.toLocaleString("en-US", {
    month: "long",
    year: "numeric",
  });
  const calendarCells = [
    ...Array.from({ length: firstDay }, (_, index) => ({
      key: `blank-${index}`,
      empty: true,
    })),
    ...Array.from({ length: daysInMonth }, (_, index) => {
      const day = index + 1;
      const date = new Date(year, monthIndex, day);
      const iso = date.toISOString().slice(0, 10);
      return {
        key: iso,
        day,
        iso,
        disabled:
          date < new Date(today.getFullYear(), today.getMonth(), today.getDate()),
      };
    }),
  ];

  useEffect(() => {
    if (!currentUserId) {
      navigate("/");
      return;
    }

    const loadUsers = async () => {
      setIsLoading(true);
      setErrorMessage("");

      try {
        const userData = await fetchUsers();
        const safeUsers = Array.isArray(userData) ? userData : [];
        setUsers(safeUsers);

        setFormData((current) => ({
          ...current,
          status: isMother ? "PENDING" : current.status,
          motherId: isMother ? String(currentUserId) : current.motherId,
          doctorId: currentUserRole === "DOCTOR" ? String(currentUserId) : current.doctorId,
        }));
      } catch (error) {
        setErrorMessage(
          error?.response?.data ||
            "Failed to load users for appointment creation."
        );
      } finally {
        setIsLoading(false);
      }
    };

    loadUsers();
  }, [currentUserId, currentUserRole, isMother, navigate]);

  const mothers = users.filter((user) => user.role === "MOTHER");
  const doctors = users.filter((user) => user.role === "DOCTOR");
  const selectedMother = mothers.find((mother) => String(mother.id) === formData.motherId);
  const selectedDoctor = doctors.find((doctor) => String(doctor.id) === formData.doctorId);

  const bookingReady = selectedDate && selectedSlot && formData.motherId && formData.doctorId;

  const bookingChecklist = useMemo(
    () => [
      {
        label: "Select a date",
        done: Boolean(selectedDate),
      },
      {
        label: "Select a time slot",
        done: Boolean(selectedSlot),
      },
      {
        label: "Choose the mother",
        done: Boolean(formData.motherId),
      },
      {
        label: "Assign a doctor",
        done: Boolean(formData.doctorId),
      },
    ],
    [formData.doctorId, formData.motherId, selectedDate, selectedSlot]
  );

  const handleChange = (event) => {
    const { name, value } = event.target;
    setFormData((current) => ({
      ...current,
      [name]: value,
    }));
  };

  const resetForm = () => {
    setFormData({
      status: "PENDING",
      motherId: currentUserRole === "MOTHER" ? String(currentUserId) : "",
      doctorId: currentUserRole === "DOCTOR" ? String(currentUserId) : "",
    });
    setSelectedDate("");
    setSelectedSlot("");
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setIsSubmitting(true);
    setErrorMessage("");
    setSuccessMessage("");

    try {
      await createAppointment({
        appointmentDateTime: `${selectedDate}T${selectedSlot}:00`,
        status: isMother ? "PENDING" : formData.status,
        mother: { id: Number(formData.motherId) },
        doctor: { id: Number(formData.doctorId) },
      });

      setSuccessMessage("Appointment saved successfully.");
      resetForm();
    } catch (error) {
      setErrorMessage(
        error?.response?.data ||
          "Could not save appointment. Check the selected users."
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!currentUserId) {
    return null;
  }

  return (
    <AppShell user={currentUser}>
      <Navbar
        eyebrow="Appointments"
        title="Create a new appointment"
        subtitle="Follow the booking flow below to pick a day, time, mother, and doctor in one guided screen."
        actions={
          <>
            <Link to="/appointments" className="btn-secondary">
              View Appointments
            </Link>
            {currentUser?.role === "ADMIN" ? (
              <Link to="/care-network" className="btn-secondary">
                Care Network
              </Link>
            ) : null}
          </>
        }
      />

      {errorMessage ? <div className="alert-box error">{errorMessage}</div> : null}
      {successMessage ? (
        <div className="alert-box success">
          {successMessage}{" "}
          <Link to="/appointments" className="auth-link">
            Open appointment list
          </Link>
        </div>
      ) : null}

      <div className="panel-grid split-layout">
        <section className="card form-card wide-card">
          <h2 className="section-heading">Calendar booking</h2>
          {isLoading ? (
            <p className="loading-state">Loading users...</p>
          ) : (
            <form className="form-stack" onSubmit={handleSubmit}>
              <div className="booking-grid">
                <div className="calendar-wrap">
                  <div className="calendar-header">
                    <h3 className="calendar-title">{monthLabel}</h3>
                    <span className="calendar-subtitle">Choose a care date</span>
                  </div>
                  <div className="calendar-weekdays">
                    {WEEKDAY_LABELS.map((day) => (
                      <span key={day}>{day}</span>
                    ))}
                  </div>
                  <div className="calendar-grid">
                    {calendarCells.map((cell) =>
                      cell.empty ? (
                        <span key={cell.key} className="calendar-day empty" />
                      ) : (
                        <button
                          key={cell.key}
                          type="button"
                          className={`calendar-day ${
                            selectedDate === cell.iso ? "selected" : ""
                          } ${cell.disabled ? "disabled" : ""}`}
                          onClick={() => {
                            if (!cell.disabled) {
                              setSelectedDate(cell.iso);
                              setSelectedSlot("");
                            }
                          }}
                          disabled={cell.disabled}
                        >
                          {cell.day}
                        </button>
                      )
                    )}
                  </div>
                </div>

                <div className="slots-panel">
                  <div className="calendar-header">
                    <h3 className="calendar-title">Available slots</h3>
                    <span className="calendar-subtitle">
                      {selectedDate || "Select a date first"}
                    </span>
                  </div>
                  <div className="slot-grid">
                    {AVAILABLE_SLOTS.map((slot) => (
                      <button
                        key={slot}
                        type="button"
                        className={`time-slot ${selectedSlot === slot ? "selected" : ""}`}
                        disabled={!selectedDate}
                        onClick={() => setSelectedSlot(slot)}
                      >
                        {slot}
                      </button>
                    ))}
                  </div>

                  <div className={`confirm-box ${selectedDate && selectedSlot ? "show" : ""}`}>
                    <h4>Booking summary</h4>
                    <div className="confirm-row">
                      <span>Date</span>
                      <span>{selectedDate || "-"}</span>
                    </div>
                    <div className="confirm-row">
                      <span>Time</span>
                      <span>{selectedSlot || "-"}</span>
                    </div>
                    <div className="confirm-row">
                      <span>Status</span>
                      <span>{formData.status}</span>
                    </div>
                  </div>
                </div>
              </div>

              <div className="form-grid two">
                <div className="form-field">
                  <label>Mother</label>
                  <select
                    className="form-control"
                    name="motherId"
                    value={formData.motherId}
                    onChange={handleChange}
                    disabled={isMother}
                    required
                  >
                    <option value="">Select mother</option>
                    {mothers.map((mother) => (
                      <option key={mother.id} value={mother.id}>
                        {mother.fullName}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="form-field">
                  <label>Doctor</label>
                  <select
                    className="form-control"
                    name="doctorId"
                    value={formData.doctorId}
                    onChange={handleChange}
                    disabled={currentUserRole === "DOCTOR"}
                    required
                  >
                    <option value="">Select doctor</option>
                    {doctors.map((doctor) => (
                      <option key={doctor.id} value={doctor.id}>
                        {doctor.fullName}
                      </option>
                    ))}
                  </select>
                </div>
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
                    name="status"
                    value={formData.status}
                    onChange={handleChange}
                    required
                  >
                    {APPOINTMENT_STATUSES.map((status) => (
                      <option key={status} value={status}>
                        {status}
                      </option>
                    ))}
                  </select>
                </div>
              )}

              <div className="action-row">
                <button
                  type="submit"
                  className="btn-primary"
                  disabled={isSubmitting || !bookingReady}
                >
                  {isSubmitting ? "Saving..." : "Save Appointment"}
                </button>
                <button type="button" className="btn-secondary" onClick={resetForm}>
                  Reset Form
                </button>
              </div>
            </form>
          )}
        </section>

        <aside className="detail-card">
          <div className="card-header">
            <h2 className="card-title">Booking checklist</h2>
            <span className="status-badge sage">
              {bookingChecklist.filter((item) => item.done).length}/{bookingChecklist.length}
            </span>
          </div>

          <div className="notification-list">
            {bookingChecklist.map((item) => (
              <div key={item.label} className="panel-item">
                <div>
                  <div className="panel-item-title">{item.label}</div>
                  <div className="panel-item-sub">
                    {item.done ? "Completed" : "Still needed before save"}
                  </div>
                </div>
                <span className={`status-badge ${item.done ? "sage" : "warn"}`}>
                  {item.done ? "Completed" : "Pending"}
                </span>
              </div>
            ))}
          </div>

          <div className="detail-grid single-column">
            <div className="detail-item">
              <p className="detail-label">Selected Mother</p>
              <p className="detail-value">{selectedMother?.fullName || "Not selected"}</p>
            </div>
            <div className="detail-item">
              <p className="detail-label">Assigned Doctor</p>
              <p className="detail-value">{selectedDoctor?.fullName || "Not selected"}</p>
            </div>
            <div className="detail-item">
              <p className="detail-label">Chosen Slot</p>
              <p className="detail-value">
                {selectedDate && selectedSlot
                  ? `${selectedDate} at ${selectedSlot}`
                  : "Pick a date and slot"}
              </p>
            </div>
          </div>

          <div className="auth-callout">
            Use the care network page if you need to confirm the doctor or mother before
            creating the booking.
          </div>
        </aside>
      </div>
    </AppShell>
  );
}

export default NewAppointmentPage;
