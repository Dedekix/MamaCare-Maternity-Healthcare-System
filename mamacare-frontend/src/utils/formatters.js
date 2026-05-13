const DATE_TIME_FORMATTER = new Intl.DateTimeFormat("en-US", {
  dateStyle: "medium",
  timeStyle: "short",
});

const DATE_FORMATTER = new Intl.DateTimeFormat("en-US", {
  dateStyle: "medium",
});

export const formatDateTime = (value) => {
  if (!value) {
    return "Not available";
  }

  const parsedValue = new Date(value);

  if (Number.isNaN(parsedValue.getTime())) {
    return "Not available";
  }

  return DATE_TIME_FORMATTER.format(parsedValue);
};

export const formatDate = (value) => {
  if (!value) {
    return "Not available";
  }

  const parsedValue = new Date(value);

  if (Number.isNaN(parsedValue.getTime())) {
    return "Not available";
  }

  return DATE_FORMATTER.format(parsedValue);
};

export const normalizeText = (value) => String(value || "").trim().toLowerCase();

export const toDateInputValue = (value = new Date()) => {
  const parsedValue = new Date(value);

  if (Number.isNaN(parsedValue.getTime())) {
    return "";
  }

  const localValue = new Date(parsedValue.getTime() - parsedValue.getTimezoneOffset() * 60000);
  return localValue.toISOString().slice(0, 16);
};

export const getFullRoleLabel = (role) => {
  const roleLabels = {
    ADMIN: "Administrator",
    DOCTOR: "Doctor",
    NURSE: "Nurse",
    MOTHER: "Pregnant Woman",
  };

  return roleLabels[role] || "Member";
};
