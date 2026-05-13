import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { createMedicalRecord, fetchUsers } from "../../services/api";
import AppShell from "../../components/layout/AppShell";
import Navbar from "../../components/layout/Navbar";
import { getCurrentUser } from "../../utils/auth";
import { toDateInputValue } from "../../utils/formatters";

function NewMedicalRecordPage() {
  const navigate = useNavigate();
  const currentUser = getCurrentUser();
  const currentUserId = currentUser?.id;
  const currentUserRole = currentUser?.role;

  const [users, setUsers] = useState([]);
  const [formData, setFormData] = useState({
    diagnosis: "",
    prescription: "",
    recordDate: toDateInputValue(),
    motherId: "",
    doctorId: currentUserRole === "DOCTOR" ? String(currentUserId) : "",
  });
  const [errorMessage, setErrorMessage] = useState("");
  const [successMessage, setSuccessMessage] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);

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
        setUsers(Array.isArray(userData) ? userData : []);
      } catch (error) {
        setErrorMessage(
          error?.response?.data ||
            "Failed to load users for medical records."
        );
      } finally {
        setIsLoading(false);
      }
    };

    loadUsers();
  }, [currentUserId, navigate]);

  const mothers = users.filter((user) => user.role === "MOTHER");
  const doctors = users.filter((user) => user.role === "DOCTOR");
  const selectedMother = mothers.find((mother) => String(mother.id) === formData.motherId);
  const selectedDoctor = doctors.find((doctor) => String(doctor.id) === formData.doctorId);

  const handleChange = (event) => {
    const { name, value } = event.target;
    setFormData((current) => ({
      ...current,
      [name]: value,
    }));
  };

  const resetForm = () => {
    setFormData({
      diagnosis: "",
      prescription: "",
      recordDate: toDateInputValue(),
      motherId: "",
      doctorId: currentUserRole === "DOCTOR" ? String(currentUserId) : "",
    });
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setIsSubmitting(true);
    setErrorMessage("");
    setSuccessMessage("");

    try {
      const message = await createMedicalRecord({
        diagnosis: formData.diagnosis,
        prescription: formData.prescription,
        recordDate: formData.recordDate,
        mother: { id: Number(formData.motherId) },
        doctor: { id: Number(formData.doctorId) },
      });

      setSuccessMessage(message);
      resetForm();
    } catch (error) {
      setErrorMessage(
        error?.response?.data || "Could not save medical record."
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
        eyebrow="Health Records"
        title="Create a medical record"
        subtitle="Capture diagnosis, prescription notes, and the linked mother and doctor in a single structured form."
        actions={
          <>
            <Link to="/medical-records" className="btn-secondary">
              View Medical Records
            </Link>
            {currentUserRole === "ADMIN" ? (
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
          <Link to="/medical-records" className="auth-link">
            Open records workspace
          </Link>
        </div>
      ) : null}

      <div className="panel-grid split-layout">
        <section className="card form-card wide-card">
          <h2 className="section-heading">Clinical record form</h2>
          {isLoading ? (
            <p className="loading-state">Loading users...</p>
          ) : (
            <form className="form-stack" onSubmit={handleSubmit}>
              <div className="form-field">
                <label>Diagnosis</label>
                <input
                  type="text"
                  className="form-control"
                  name="diagnosis"
                  placeholder="Enter the diagnosis or clinical finding"
                  value={formData.diagnosis}
                  onChange={handleChange}
                  required
                />
              </div>

              <div className="form-field">
                <label>Prescription</label>
                <textarea
                  className="form-control"
                  rows="5"
                  name="prescription"
                  placeholder="Enter medicine, instructions, or follow-up notes"
                  value={formData.prescription}
                  onChange={handleChange}
                  required
                />
              </div>

              <div className="form-grid two">
                <div className="form-field">
                  <label>Record Date</label>
                  <input
                    type="datetime-local"
                    className="form-control"
                    name="recordDate"
                    value={formData.recordDate}
                    onChange={handleChange}
                    required
                  />
                </div>

                <div className="form-field">
                  <label>Mother</label>
                  <select
                    className="form-control"
                    name="motherId"
                    value={formData.motherId}
                    onChange={handleChange}
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
              </div>

              <div className="form-field">
                <label>Doctor</label>
                <select
                  className="form-control"
                  name="doctorId"
                  value={formData.doctorId}
                  onChange={handleChange}
                  required
                  disabled={currentUserRole === "DOCTOR"}
                >
                  <option value="">Select doctor</option>
                  {doctors.map((doctor) => (
                    <option key={doctor.id} value={doctor.id}>
                      {doctor.fullName}
                    </option>
                  ))}
                </select>
              </div>

              <div className="action-row">
                <button type="submit" className="btn-primary" disabled={isSubmitting}>
                  {isSubmitting ? "Saving..." : "Save Medical Record"}
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
            <h2 className="card-title">Record summary</h2>
            <span className="status-badge warn">Clinical draft</span>
          </div>

          <div className="detail-grid single-column">
            <div className="detail-item">
              <p className="detail-label">Mother</p>
              <p className="detail-value">{selectedMother?.fullName || "Not selected"}</p>
            </div>
            <div className="detail-item">
              <p className="detail-label">Doctor</p>
              <p className="detail-value">{selectedDoctor?.fullName || "Not selected"}</p>
            </div>
            <div className="detail-item">
              <p className="detail-label">Record Date</p>
              <p className="detail-value">{formData.recordDate || "Not selected"}</p>
            </div>
            <div className="detail-item">
              <p className="detail-label">Diagnosis Preview</p>
              <p className="detail-value">
                {formData.diagnosis || "Start typing the diagnosis"}
              </p>
            </div>
          </div>

          <div className="auth-callout">
            Use clear diagnosis language and prescription notes so the record is easy to
            read later in the medical records workspace.
          </div>
        </aside>
      </div>
    </AppShell>
  );
}

export default NewMedicalRecordPage;
