import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import AppShell from "../../components/layout/AppShell";
import Navbar from "../../components/layout/Navbar";
import {
  fetchAppointments,
  fetchMedicalRecords,
  fetchUsers,
} from "../../services/api";
import { canAccessMedicalRecords, getCurrentUser, getRoleMeta } from "../../utils/auth";
import { formatDateTime, getFullRoleLabel } from "../../utils/formatters";

const createRoleView = ({
  user,
  appointments,
  records,
  users,
  roleMeta,
  canUseMedical,
}) => {
  const now = new Date();
  const mothers = users.filter((item) => item.role === "MOTHER");
  const clinicians = users.filter((item) => ["DOCTOR", "NURSE"].includes(item.role));
  const myAppointments = appointments.filter((appointment) => {
    if (user?.role === "MOTHER") {
      return appointment.mother?.id === user.id;
    }

    if (user?.role === "DOCTOR") {
      return appointment.doctor?.id === user.id;
    }

    return true;
  });
  const myRecords = records.filter((record) => {
    if (user?.role === "DOCTOR") {
      return record.doctor?.id === user.id;
    }

    if (user?.role === "MOTHER") {
      return record.mother?.id === user.id;
    }

    return true;
  });
  const upcomingAppointments = myAppointments
    .filter((appointment) => {
      const value = new Date(appointment.appointmentDateTime);
      return !Number.isNaN(value.getTime()) && value >= now;
    })
    .sort(
      (left, right) =>
        new Date(left.appointmentDateTime) - new Date(right.appointmentDateTime)
    );
  const recentRecords = [...myRecords]
    .sort((left, right) => new Date(right.recordDate) - new Date(left.recordDate))
    .slice(0, 4);
  const nextAppointment = upcomingAppointments[0];
  const quickActions = [
    {
      title: "Schedule a visit",
      subtitle: "Use the booking flow to connect a mother and care provider quickly.",
      to: "/appointments/new",
      action: "Book now",
    },
    {
      title: "Review appointments",
      subtitle: "Open the appointment workspace with filters and detail panels.",
      to: "/appointments",
      action: "Open schedule",
    },
  ];

  if (canUseMedical) {
    quickActions.push({
      title: "Open records",
      subtitle: "Review clinical notes, diagnosis details, and recent prescriptions.",
      to: "/medical-records",
      action: "See records",
    });
  }

  if (user?.role === "ADMIN") {
    quickActions.push({
      title: "Browse care network",
      subtitle: "Search users before booking the next visit.",
      to: "/care-network",
      action: "View network",
    });
  }

  const byRole = {
    MOTHER: {
      stats: [
        {
          tone: "rose",
          label: "Upcoming Visits",
          value: upcomingAppointments.length,
          sub: nextAppointment
            ? `Next visit ${formatDateTime(nextAppointment.appointmentDateTime)}`
            : "No future appointment booked yet",
        },
        {
          tone: "sage",
          label: "Care Team",
          value: clinicians.length,
          sub: "Doctors and nurses registered in the platform",
        },
        {
          tone: "warm",
          label: "Medical Records",
          value: myRecords.length,
          sub: "Records linked to your care journey",
        },
      ],
      activity: upcomingAppointments.slice(0, 4).map((appointment) => ({
        title: appointment.doctor?.fullName || "Assigned doctor",
        subtitle: `${appointment.status} visit on ${formatDateTime(
          appointment.appointmentDateTime
        )}`,
      })),
      sideTitle: "Personal Care Snapshot",
      sideBody: [
        ["Role", roleMeta.label],
        ["Status", user?.status || "Unknown"],
        ["Email", user?.email],
        ["Phone", user?.phoneNumber || "Not provided"],
      ],
    },
    DOCTOR: {
      stats: [
        {
          tone: "rose",
          label: "Assigned Visits",
          value: myAppointments.length,
          sub: `${upcomingAppointments.length} upcoming appointments need review`,
        },
        {
          tone: "sage",
          label: "Clinical Records",
          value: myRecords.length,
          sub: "Medical records currently linked to your care work",
        },
        {
          tone: "warm",
          label: "Mothers In Follow-up",
          value: new Set(myAppointments.map((appointment) => appointment.mother?.id)).size,
          sub: "Unique mothers connected to your appointment list",
        },
      ],
      activity: recentRecords.map((record) => ({
        title: record.mother?.fullName || "Mother record",
        subtitle: `${record.diagnosis} on ${formatDateTime(record.recordDate)}`,
      })),
      sideTitle: "Clinical Desk Summary",
      sideBody: [
        ["Role", roleMeta.label],
        ["Email", user?.email],
        ["Next Visit", nextAppointment ? formatDateTime(nextAppointment.appointmentDateTime) : "No upcoming visit"],
      ],
    },
    NURSE: {
      stats: [
        {
          tone: "rose",
          label: "Appointments",
          value: appointments.length,
          sub: `${appointments.filter((item) => item.status === "PENDING").length} are still pending`,
        },
        {
          tone: "sage",
          label: "Records Today",
          value: records.filter((record) => {
            const value = new Date(record.recordDate);
            return (
              !Number.isNaN(value.getTime()) &&
              value.toDateString() === now.toDateString()
            );
          }).length,
          sub: "Records updated during the current day",
        },
        {
          tone: "warm",
          label: "Care Team",
          value: clinicians.length,
          sub: "Doctors and nurses registered in the platform",
        },
      ],
      activity: appointments.slice(0, 4).map((appointment) => ({
        title: appointment.mother?.fullName || "Mother visit",
        subtitle: `${appointment.status} at ${formatDateTime(
          appointment.appointmentDateTime
        )}`,
      })),
      sideTitle: "Nursing Shift Snapshot",
      sideBody: [
        ["Role", roleMeta.label],
        ["Email", user?.email],
        ["Phone", user?.phoneNumber || "Not provided"],
      ],
    },
    ADMIN: {
      stats: [
        {
          tone: "rose",
          label: "Registered Users",
          value: users.length,
          sub: `${mothers.length} mothers currently registered`,
        },
        {
          tone: "sage",
          label: "Appointments",
          value: appointments.length,
          sub: `${appointments.filter((item) => item.status === "PENDING").length} pending approvals`,
        },
        {
          tone: "warm",
          label: "Clinicians",
          value: clinicians.length,
          sub: "Doctors and nurses registered in the platform",
        },
      ],
      activity: users.slice(0, 4).map((account) => ({
        title: account.fullName || "Member",
        subtitle: `${getFullRoleLabel(account.role)} - ${account.status || "Status unknown"}`,
      })),
      sideTitle: "Operations Snapshot",
      sideBody: [
        ["Role", roleMeta.label],
        ["Email", user?.email],
        ["Clinicians", clinicians.length],
      ],
    },
  };

  return {
    ...byRole[user?.role || "MOTHER"],
    quickActions,
  };
};

function DashboardHome() {
  const navigate = useNavigate();
  const user = getCurrentUser();
  const currentUserId = user?.id;
  const roleMeta = getRoleMeta(user?.role);
  const canUseMedical = canAccessMedicalRecords(user?.role);
  const [dashboardData, setDashboardData] = useState({
    appointments: [],
    records: [],
    users: [],
  });
  const [isLoading, setIsLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState("");

  useEffect(() => {
    if (!currentUserId) {
      navigate("/");
      return;
    }

    const loadDashboard = async () => {
      setIsLoading(true);
      setErrorMessage("");

      try {
        const [appointments, records, users] = await Promise.all([
          fetchAppointments(),
          canUseMedical ? fetchMedicalRecords() : Promise.resolve([]),
          fetchUsers(),
        ]);

        setDashboardData({
          appointments: Array.isArray(appointments) ? appointments : [],
          records: Array.isArray(records) ? records : [],
          users: Array.isArray(users) ? users : [],
        });
      } catch (error) {
        setErrorMessage(
          error?.response?.data ||
            "Unable to load dashboard data right now. Please try again."
        );
      } finally {
        setIsLoading(false);
      }
    };

    loadDashboard();
  }, [canUseMedical, currentUserId, navigate]);

  const view = useMemo(
    () =>
      createRoleView({
        user,
        appointments: dashboardData.appointments,
        records: dashboardData.records,
        users: dashboardData.users,
        roleMeta,
        canUseMedical,
      }),
    [canUseMedical, dashboardData, roleMeta, user]
  );

  if (!currentUserId) {
    return (
      <div className="page-auth">
        <section className="auth-panel">
          <div className="auth-panel-header">
            <h2 className="auth-title">Redirecting to login</h2>
            <p className="auth-subtitle">
              You must sign in first to access the dashboard. Redirecting you now...
            </p>
          </div>
        </section>
      </div>
    );
  }

  return (
    <AppShell user={user}>
      <Navbar
        eyebrow="MamaCare Dashboard"
        title={`Welcome back, ${user?.fullName || "Member"}`}
        subtitle={`This dashboard pulls its summaries from appointments, medical records, and users so you can move around the system faster.`}
        actions={
          <>
            <span className="status-badge rose">{roleMeta.label}</span>
            <Link to="/appointments/new" className="btn-primary">
              New Appointment
            </Link>
          </>
        }
      />

      {errorMessage ? <div className="alert-box error">{errorMessage}</div> : null}

      <section className="stats-grid">
        {view.stats.map((item) => (
          <article key={item.label} className={`stat-card ${item.tone}`}>
            <p className="stat-label">{item.label}</p>
            <h2 className="stat-value">{item.value}</h2>
            <p className="stat-sub">{isLoading ? "Refreshing dashboard..." : item.sub}</p>
          </article>
        ))}
      </section>

      <section className="content-grid">
        <article className="card">
          <div className="card-header">
            <h2 className="card-title">Next Actions</h2>
            <span className="card-link">Suggested actions</span>
          </div>

          <div className="schedule-list">
            {view.quickActions.map((item, index) => (
              <div key={item.title} className="list-row">
                <div className="date-chip">
                  <span className="date-chip-strong">{String(index + 1).padStart(2, "0")}</span>
                  <span className="date-chip-sub">Step</span>
                </div>
                <div className="list-main">
                  <p className="list-title">{item.title}</p>
                  <p className="list-subtitle">{item.subtitle}</p>
                </div>
                <Link to={item.to} className="btn-secondary">
                  {item.action}
                </Link>
              </div>
            ))}
          </div>
        </article>

        <article className="card">
          <div className="card-header">
            <h2 className="card-title">{view.sideTitle}</h2>
            <span className="card-link">
              {isLoading ? "Loading data" : "Live summary"}
            </span>
          </div>

          <div className="notification-list">
            {view.sideBody.map(([label, value]) => (
              <div key={label} className="detail-item">
                <p className="detail-label">{label}</p>
                <p className="detail-value">{value}</p>
              </div>
            ))}
            <div className="auth-callout">
              {canUseMedical
                ? "This role can move between appointments, records, and users from one shared workspace."
                : "This role focuses on appointments, booking, and a simpler care journey."}
            </div>
          </div>
        </article>
      </section>

      <section className="content-grid single-gap">
        <article className="card">
          <div className="card-header">
            <h2 className="card-title">Recent Activity</h2>
            <span className="card-link">
              {isLoading ? "Loading..." : `${view.activity.length} items`}
            </span>
          </div>
          {isLoading ? (
            <p className="loading-state">Loading activity...</p>
          ) : view.activity.length === 0 ? (
            <p className="empty-state">No recent activity is available yet.</p>
          ) : (
            <div className="notification-list">
              {view.activity.map((item) => (
                <div key={`${item.title}-${item.subtitle}`} className="panel-item">
                  <div>
                    <div className="panel-item-title">{item.title}</div>
                    <div className="panel-item-sub">{item.subtitle}</div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </article>
      </section>
    </AppShell>
  );
}

export default DashboardHome;
