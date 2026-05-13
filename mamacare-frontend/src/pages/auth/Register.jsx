import { useEffect, useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { fetchSpecializations, registerUser } from "../../services/api";
import {
  AUTH_ROLE_OPTIONS,
  buildAuthPath,
  getAuthRole,
} from "../../utils/authRoles";

function Register() {
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [phoneNumber, setPhoneNumber] = useState("");
  const [specializations, setSpecializations] = useState([]);
  const [selectedSpecializationId, setSelectedSpecializationId] = useState("");
  const [errorMessage, setErrorMessage] = useState("");
  const [successMessage, setSuccessMessage] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isLoadingSpecializations, setIsLoadingSpecializations] = useState(true);
  const [searchParams, setSearchParams] = useSearchParams();
  const navigate = useNavigate();
  const role = getAuthRole(searchParams.get("role"));

  const handleRoleSelect = (nextRole) => {
    setSearchParams({ role: getAuthRole(nextRole) }, { replace: true });
  };

  useEffect(() => {
    const loadRegistrationOptions = async () => {
      setIsLoadingSpecializations(true);

      try {
        const specializationData = await fetchSpecializations();
        setSpecializations(Array.isArray(specializationData) ? specializationData : []);
      } catch (error) {
        setErrorMessage(
          error?.response?.data ||
            "Failed to load registration options. Please refresh and try again."
        );
      } finally {
        setIsLoadingSpecializations(false);
      }
    };

    loadRegistrationOptions();
  }, []);

  useEffect(() => {
    if (role !== "DOCTOR" && selectedSpecializationId) {
      setSelectedSpecializationId("");
    }
  }, [role, selectedSpecializationId]);

  const handleSpecializationChange = (event) => {
    setSelectedSpecializationId(event.target.value);
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setErrorMessage("");
    setSuccessMessage("");

    if (password !== confirmPassword) {
      setErrorMessage("Passwords do not match. Please confirm your password.");
      return;
    }

    if (role === "DOCTOR" && !selectedSpecializationId) {
      setErrorMessage("Please select a specialization for the doctor account.");
      return;
    }

    setIsSubmitting(true);

    try {
      await registerUser({
        fullName,
        email,
        password,
        phoneNumber,
        role,
        specializationIds: role === "DOCTOR" ? [selectedSpecializationId] : [],
      });
      setSuccessMessage("Account created successfully. You can now log in.");
      setTimeout(() => navigate(buildAuthPath("/", role)), 1200);
    } catch (error) {
      const backendMessage =
        typeof error.response?.data === "string"
          ? error.response.data
          : "Registration failed. Please try again.";
      setErrorMessage(backendMessage);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="page-auth">
      <section className="auth-hero">
        <div className="hero-bloom">Join</div>
        <h1 className="hero-title">
          Build a safer
          <br />
          pregnancy care
          <br />
          journey
        </h1>
        <p className="hero-text">
          Register once to manage appointments, maternal records, team members, and
          follow-up care from one thoughtful platform.
        </p>
        <div className="hero-badges">
          <span className="hero-badge">Doctor support</span>
          <span className="hero-badge">Simple sign up</span>
          <span className="hero-badge">Maternal focus</span>
        </div>
      </section>

      <section className="auth-panel">
        <div className="auth-panel-header">
          <h2 className="auth-title">Create account</h2>
          <p className="auth-subtitle">
            Set up your MamaCare profile and choose the account role that fits you.
          </p>
        </div>

        <div className="role-tabs four-up">
          {AUTH_ROLE_OPTIONS.map((option) => (
            <button
              key={option.value}
              type="button"
              className={`role-tab ${role === option.value ? "active" : ""}`}
              onClick={() => handleRoleSelect(option.value)}
            >
              {option.label}
            </button>
          ))}
        </div>

        {errorMessage ? <div className="alert-box error">{errorMessage}</div> : null}
        {successMessage ? <div className="alert-box success">{successMessage}</div> : null}

        <form className="form-grid" onSubmit={handleSubmit}>
          <div className="form-grid two">
            <div className="form-field">
              <label>Full Name</label>
              <input
                type="text"
                className="form-control"
                placeholder="Enter full name"
                value={fullName}
                onChange={(event) => setFullName(event.target.value)}
                required
              />
            </div>

            <div className="form-field">
              <label>Email</label>
              <input
                type="email"
                className="form-control"
                placeholder="Enter email"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                required
              />
            </div>
          </div>

          <div className="form-field">
            <label>Phone Number</label>
            <input
              type="tel"
              className="form-control"
              placeholder="Enter phone number"
              value={phoneNumber}
              onChange={(event) => setPhoneNumber(event.target.value)}
            />
          </div>

          {role === "DOCTOR" ? (
            <div className="form-field">
              <label>Doctor Specialization</label>
              {isLoadingSpecializations ? (
                <p className="loading-state">Loading specializations...</p>
              ) : specializations.length === 0 ? (
                <p className="empty-state">No specializations are available yet.</p>
              ) : (
                <select
                  className="form-control"
                  value={selectedSpecializationId}
                  onChange={handleSpecializationChange}
                  required
                >
                  <option value="">Select specialization</option>
                  {specializations.map((specialization) => (
                    <option key={specialization.id} value={specialization.id}>
                      {specialization.name}
                    </option>
                  ))}
                </select>
              )}
              <p className="field-hint">
                Select your specialization for doctor accounts.
              </p>
            </div>
          ) : null}

          <div className="form-grid two">
            <div className="form-field">
              <label>Password</label>
              <input
                type="password"
                className="form-control"
                placeholder="Enter password"
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                required
              />
            </div>

            <div className="form-field">
              <label>Confirm Password</label>
              <input
                type="password"
                className="form-control"
                placeholder="Confirm password"
                value={confirmPassword}
                onChange={(event) => setConfirmPassword(event.target.value)}
                required
              />
            </div>
          </div>

          <button type="submit" className="btn-primary btn-block" disabled={isSubmitting}>
            {isSubmitting ? "Creating account..." : "Register"}
          </button>
        </form>

        <p className="auth-footer">
          Already have an account?{" "}
          <Link to={buildAuthPath("/", role)} className="auth-link">
            Login
          </Link>
        </p>
      </section>
    </div>
  );
}

export default Register;
