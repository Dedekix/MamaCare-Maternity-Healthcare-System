import { useCallback, useEffect, useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { deleteMedicalRecord, fetchMedicalRecords, updateMedicalRecord } from "../../services/api";
import AppShell from "../../components/layout/AppShell";
import Navbar from "../../components/layout/Navbar";
import { getCurrentUser } from "../../utils/auth";
import { formatDateTime, normalizeText, toDateInputValue } from "../../utils/formatters";

const RECORD_FILTERS = [
  { id: "all", label: "All" },
  { id: "mine", label: "My Records" },
  { id: "recent", label: "Recent" },
];

function MedicalRecordsPage() {
  const navigate = useNavigate();
  const currentUser = getCurrentUser();
  const currentUserId = currentUser?.id;
  const currentUserRole = currentUser?.role;

  const [records, setRecords] = useState([]);
  const [errorMessage, setErrorMessage] = useState("");
  const [successMessage, setSuccessMessage] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [selectedRecord, setSelectedRecord] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [activeFilter, setActiveFilter] = useState("all");
  const [isEditMode, setIsEditMode] = useState(false);
  const [editFormData, setEditFormData] = useState({
    diagnosis: "",
    prescription: "",
    recordDate: "",
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  const loadMedicalRecords = useCallback(async (showLoading = true) => {
    if (showLoading) {
      setIsLoading(true);
      setErrorMessage("");
    }

    try {
      const recordData = await fetchMedicalRecords();
      let safeRecords = Array.isArray(recordData) ? recordData : [];
      // Filter based on role
      if (currentUserRole === "MOTHER") {
        safeRecords = safeRecords.filter((record) => record.mother?.id === currentUserId);
      } else if (currentUserRole === "DOCTOR") {
        safeRecords = safeRecords.filter((record) => record.doctor?.id === currentUserId);
      } // For NURSE and ADMIN, show all
      setRecords(safeRecords);
      setSelectedRecord((current) => {
        if (!safeRecords.length) {
          return null;
        }

        if (!current) {
          return safeRecords[0];
        }

        return safeRecords.find((record) => record.id === current.id) || safeRecords[0];
      });
    } catch (error) {
      setErrorMessage(
        error?.response?.data || "Failed to load medical records."
      );
    } finally {
      setIsLoading(false);
    }
  }, [currentUserId, currentUserRole]);

  useEffect(() => {
    if (!currentUserId) {
      navigate("/");
      return;
    }

    loadMedicalRecords();
  }, [currentUserId, navigate, loadMedicalRecords]);

  const handleEdit = () => {
    if (selectedRecord) {
      setEditFormData({
        diagnosis: selectedRecord.diagnosis || "",
        prescription: selectedRecord.prescription || "",
        recordDate: toDateInputValue(selectedRecord.recordDate),
      });
      setIsEditMode(true);
    }
  };

  const handleCancelEdit = () => {
    setIsEditMode(false);
    setEditFormData({
      diagnosis: "",
      prescription: "",
      recordDate: "",
    });
  };

  const handleSaveEdit = async () => {
    if (!selectedRecord) return;

    setIsSubmitting(true);
    setErrorMessage("");
    setSuccessMessage("");

    try {
      await updateMedicalRecord(selectedRecord.id, editFormData);
      setSuccessMessage("Medical record updated successfully.");
      setIsEditMode(false);
      // Reload records
      await loadMedicalRecords(false);
    } catch (error) {
      setErrorMessage(
        error?.response?.data || "Failed to update medical record."
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  const filteredRecords = useMemo(() => {
    const query = normalizeText(searchTerm);
    const now = new Date();
    const recentLimit = new Date(now);
    recentLimit.setDate(now.getDate() - 14);

    return records.filter((record) => {
      const matchesSearch =
        !query ||
        normalizeText(record.diagnosis).includes(query) ||
        normalizeText(record.prescription).includes(query) ||
        normalizeText(record.mother?.fullName).includes(query) ||
        normalizeText(record.doctor?.fullName).includes(query);

      const isMine =
        currentUserRole === "DOCTOR"
          ? record.doctor?.id === currentUserId
          : currentUserRole === "NURSE"
          ? record.doctor?.id === currentUserId
          : true;

      const isRecent = (() => {
        const recordDate = new Date(record.recordDate);
        return !Number.isNaN(recordDate.getTime()) && recordDate >= recentLimit;
      })();

      const matchesFilter =
        activeFilter === "all" ||
        (activeFilter === "mine" && isMine) ||
        (activeFilter === "recent" && isRecent);

      return matchesFilter && matchesSearch;
    });
  }, [activeFilter, currentUserId, currentUserRole, records, searchTerm]);

  const recordSummary = useMemo(
    () => ({
      total: records.length,
      recent: records.filter((record) => {
        const value = new Date(record.recordDate);
        const threshold = new Date();
        threshold.setDate(threshold.getDate() - 14);
        return !Number.isNaN(value.getTime()) && value >= threshold;
      }).length,
      mothers: new Set(records.map((record) => record.mother?.id)).size,
      doctors: new Set(records.map((record) => record.doctor?.id)).size,
    }),
    [records]
  );

  const handleDelete = async (recordId) => {
    setErrorMessage("");
    setSuccessMessage("");

    try {
      const message = await deleteMedicalRecord(recordId);
      setSuccessMessage(message);
      await loadMedicalRecords();
    } catch (error) {
      setErrorMessage(
        error?.response?.data || "Could not delete medical record."
      );
    }
  };

  if (!currentUserId) {
    return null;
  }

  return (
    <AppShell user={currentUser}>
      <Navbar
        eyebrow="Health Records"
        title="Medical records workspace"
        subtitle="Review maternal diagnoses and prescriptions with filters, a clinical detail panel, and quick links back to related areas."
        actions={
          <>
            <button
              type="button"
              className="btn-secondary"
              onClick={() => loadMedicalRecords()}
            >
              Refresh
            </button>
            <Link to="/medical-records/new" className="btn-primary">
              Add Record
            </Link>
            <Link to="/appointments" className="btn-secondary">
              Appointments
            </Link>
          </>
        }
      />

      {errorMessage ? <div className="alert-box error">{errorMessage}</div> : null}
      {successMessage ? <div className="alert-box success">{successMessage}</div> : null}

      <section className="stats-grid compact">
        <article className="stat-card rose">
          <p className="stat-label">Records</p>
          <h2 className="stat-value">{recordSummary.total}</h2>
          <p className="stat-sub">All records loaded from the records endpoint</p>
        </article>
        <article className="stat-card sage">
          <p className="stat-label">Recent Updates</p>
          <h2 className="stat-value">{recordSummary.recent}</h2>
          <p className="stat-sub">Records added or updated in the last two weeks</p>
        </article>
        <article className="stat-card warm">
          <p className="stat-label">Mothers Covered</p>
          <h2 className="stat-value">{recordSummary.mothers}</h2>
          <p className="stat-sub">{recordSummary.doctors} doctors linked to these records</p>
        </article>
      </section>

      <div className="panel-grid split-layout">
        <section className="card">
          <div className="tab-row">
            {RECORD_FILTERS.map((filter) => (
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
              <label htmlFor="record-search">Search medical records</label>
              <input
                id="record-search"
                type="search"
                className="form-control"
                placeholder="Search by diagnosis, prescription, mother, or doctor"
                value={searchTerm}
                onChange={(event) => setSearchTerm(event.target.value)}
              />
            </div>
            <span className="card-link">{filteredRecords.length} results</span>
          </div>

          {isLoading ? (
            <p className="loading-state">Loading medical records...</p>
          ) : filteredRecords.length === 0 ? (
            <p className="empty-state">
              No medical records match the current view. Try another filter or add a
              new clinical record.
            </p>
          ) : (
            <div className="table-shell">
              <table className="panel-table">
                <thead>
                  <tr>
                    <th>Date</th>
                    <th>Diagnosis</th>
                    <th>Prescription</th>
                    <th>Mother</th>
                    <th>Doctor</th>
                    <th>Action</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredRecords.map((record) => (
                    <tr
                      key={record.id}
                      className={selectedRecord?.id === record.id ? "active-row" : ""}
                      onClick={() => setSelectedRecord(record)}
                    >
                      <td data-label="Date">{formatDateTime(record.recordDate)}</td>
                      <td data-label="Diagnosis">{record.diagnosis}</td>
                      <td data-label="Prescription">
                        {record.prescription || "Not available"}
                      </td>
                      <td data-label="Mother">{record.mother?.fullName || "Unknown"}</td>
                      <td data-label="Doctor">{record.doctor?.fullName || "Unknown"}</td>
                      <td data-label="Action">
                        <button
                          type="button"
                          className="table-action primary"
                          onClick={(event) => {
                            event.stopPropagation();
                            setSelectedRecord(record);
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
            <h2 className="card-title">Clinical detail panel</h2>
            {selectedRecord ? <span className="status-badge warn">Clinical view</span> : null}
          </div>

          {!selectedRecord ? (
            <p className="empty-state">
              Select a medical record to review its diagnosis and linked care team.
            </p>
          ) : (
            <>
              <div className="detail-grid">
                <div className="detail-item">
                  <p className="detail-label">Record Date</p>
                  <p className="detail-value">
                    {formatDateTime(selectedRecord.recordDate)}
                  </p>
                </div>
                <div className="detail-item full">
                  <p className="detail-label">Diagnosis</p>
                  <p className="detail-value">{selectedRecord.diagnosis}</p>
                </div>
                <div className="detail-item full">
                  <p className="detail-label">Prescription</p>
                  <p className="detail-value">
                    {selectedRecord.prescription || "No prescription"}
                  </p>
                </div>
                <div className="detail-item">
                  <p className="detail-label">Mother</p>
                  <p className="detail-value">
                    {selectedRecord.mother?.fullName || "Unknown"}
                  </p>
                </div>
                <div className="detail-item">
                  <p className="detail-label">Doctor</p>
                  <p className="detail-value">
                    {selectedRecord.doctor?.fullName || "Unknown"}
                  </p>
                </div>
              </div>

              <div className="action-row">
                <Link to="/medical-records/new" className="btn-primary">
                  Add Another
                </Link>
                <button
                  type="button"
                  className="btn-secondary"
                  onClick={handleEdit}
                  disabled={isEditMode}
                >
                  Edit Record
                </button>
                <Link to="/appointments" className="btn-secondary">
                  Open Appointments
                </Link>
                <button
                  type="button"
                  className="btn-secondary danger-outline"
                  onClick={() => handleDelete(selectedRecord.id)}
                  disabled={isEditMode}
                >
                  Delete Record
                </button>
              </div>

              {isEditMode && (
                <div className="edit-form">
                  <h3>Edit Medical Record</h3>
                  {errorMessage && <div className="alert-box error">{errorMessage}</div>}
                  {successMessage && <div className="alert-box success">{successMessage}</div>}
                  <form onSubmit={(e) => { e.preventDefault(); handleSaveEdit(); }}>
                    <div className="form-field">
                      <label>Record Date</label>
                      <input
                        type="datetime-local"
                        className="form-control"
                        value={editFormData.recordDate}
                        onChange={(e) => setEditFormData({ ...editFormData, recordDate: e.target.value })}
                        required
                      />
                    </div>
                    <div className="form-field">
                      <label>Diagnosis</label>
                      <textarea
                        className="form-control"
                        value={editFormData.diagnosis}
                        onChange={(e) => setEditFormData({ ...editFormData, diagnosis: e.target.value })}
                        required
                      />
                    </div>
                    <div className="form-field">
                      <label>Prescription</label>
                      <textarea
                        className="form-control"
                        value={editFormData.prescription}
                        onChange={(e) => setEditFormData({ ...editFormData, prescription: e.target.value })}
                      />
                    </div>
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

export default MedicalRecordsPage;
