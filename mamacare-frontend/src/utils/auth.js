export const getCurrentUser = () => {
  try {
    return JSON.parse(window.localStorage.getItem("mamacareUser") || "null");
  } catch {
    return null;
  }
};

export const saveCurrentUser = (user) => {
  window.localStorage.setItem("mamacareUser", JSON.stringify(user));
};

export const clearCurrentUser = () => {
  window.localStorage.removeItem("mamacareUser");
};

export const canAccessMedicalRecords = (role) =>
  ["DOCTOR", "NURSE", "ADMIN"].includes(role);

export const getRoleMeta = (role) => {
  const map = {
    MOTHER: {
      label: "Pregnant Woman",
    },
    DOCTOR: {
      label: "Doctor",
    },
    NURSE: {
      label: "Nurse",
    },
    ADMIN: {
      label: "Administrator",
    },
  };

  return (
    map[role] || {
      label: "Member",
    }
  );
};
