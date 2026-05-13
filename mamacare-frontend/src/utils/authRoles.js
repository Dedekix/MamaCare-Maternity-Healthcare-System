export const AUTH_ROLE_OPTIONS = [
  { value: "MOTHER", label: "Pregnant Woman" },
  { value: "DOCTOR", label: "Doctor" },
  { value: "NURSE", label: "Nurse" },
  { value: "ADMIN", label: "Administrator" },
];

export const DEFAULT_AUTH_ROLE = AUTH_ROLE_OPTIONS[0].value;

const VALID_AUTH_ROLES = new Set(AUTH_ROLE_OPTIONS.map((option) => option.value));

export const getAuthRole = (value) =>
  VALID_AUTH_ROLES.has(value) ? value : DEFAULT_AUTH_ROLE;

export const buildAuthPath = (pathname, role) => {
  const params = new URLSearchParams({ role: getAuthRole(role) });
  return `${pathname}?${params.toString()}`;
};
