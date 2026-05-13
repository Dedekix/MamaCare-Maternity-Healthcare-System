import { canAccessMedicalRecords } from "./auth";

export const getWorkspaceLinks = (role) => {
  const links = [
    {
      to: "/dashboard",
      label: "Overview",
      shortLabel: "Dashboard",
      group: "workspace",
    },
    {
      to: "/appointments",
      label: "Appointments",
      shortLabel: "Appointments",
      group: "workspace",
    },
    {
      to: "/appointments/new",
      label: "New Appointment",
      shortLabel: "Book",
      group: "actions",
    },
  ];

  if (role === "ADMIN") {
    links.push({
      to: "/care-network",
      label: "Care Network",
      shortLabel: "Network",
      group: "workspace",
    });
  }

  if (canAccessMedicalRecords(role)) {
    links.splice(2, 0, {
      to: "/medical-records",
      label: "Medical Records",
      shortLabel: "Records",
      group: "workspace",
    });

    links.push({
      to: "/medical-records/new",
      label: "New Record",
      shortLabel: "Add Record",
      group: "actions",
    });
  }

  return links;
};

export const getPrimaryActionLinks = (role) =>
  getWorkspaceLinks(role).filter((link) => link.group === "actions");
