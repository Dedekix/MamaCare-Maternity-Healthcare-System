import { useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { loginUser } from "../../services/api";
import { saveCurrentUser } from "../../utils/auth";
import {
  AUTH_ROLE_OPTIONS,
  buildAuthPath,
  getAuthRole,
} from "../../utils/authRoles";
import { getFullRoleLabel } from "../../utils/formatters";

function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [errorMessage, setErrorMessage] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [searchParams, setSearchParams] = useSearchParams();
  const navigate = useNavigate();
  const role = getAuthRole(searchParams.get("role"));

  const handleRoleSelect = (nextRole) => {
    setSearchParams({ role: getAuthRole(nextRole) }, { replace: true });
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setErrorMessage("");
    setIsSubmitting(true);

    try {
      const user = await loginUser({ email, password, role });

      saveCurrentUser(user);
      navigate("/dashboard", { state: { user } });
    } catch (error) {
      setErrorMessage(
        error.response?.data || "Login failed. Please check your credentials."
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="page-auth">
      <section className="auth-hero">
        <div className="hero-bloom">MamaCare</div>
        <h1 className="hero-title">
          Caring for
          <br />
          mothers and
          <br />
          children
        </h1>
        <p className="hero-text">
          MamaCare connects pregnant women, doctors, nurses, and administrators in
          one calm care workspace for appointments, maternal records, and follow-up.
        </p>
        <div className="hero-badges">
          <span className="hero-badge">Easy scheduling</span>
          <span className="hero-badge">Health records</span>
          <span className="hero-badge">Care network</span>
        </div>
      </section>

      <section className="auth-panel">
        <div className="auth-panel-header">
          <h2 className="auth-title">Welcome back</h2>
          <p className="auth-subtitle">
            Sign in to open your dashboard, appointments, records, and care network.
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

        <form className="form-grid" onSubmit={handleSubmit}>
          <div className="form-field">
            <label>Email Address</label>
            <input
              type="email"
              className="form-control"
              placeholder="you@example.com"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              required
            />
          </div>

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

          <button type="submit" className="btn-primary btn-block" disabled={isSubmitting}>
            {isSubmitting ? "Signing in..." : `Sign in as ${getFullRoleLabel(role)}`}
          </button>
        </form>

        <p className="auth-footer">
          Don&apos;t have an account?{" "}
          <Link to={buildAuthPath("/register", role)} className="auth-link">
            Create Account
          </Link>
        </p>
      </section>
    </div>
  );
}

export default Login;
