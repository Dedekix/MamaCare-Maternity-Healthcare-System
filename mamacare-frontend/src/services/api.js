import axios from "axios";

const api = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL || "http://localhost:8080",
  headers: {
    "Content-Type": "application/json",
  },
});

const USERS_ENDPOINT = "/api/users";
const SPECIALIZATIONS_ENDPOINT = "/api/specializations";
const APPOINTMENTS_ENDPOINT = "/api/appointments";
const MEDICAL_RECORDS_ENDPOINT = "/api/medical-records";

const getData = async (request) => {
  const response = await request;
  return response.data;
};

export const registerUser = (userData) =>
  getData(api.post(USERS_ENDPOINT, userData));

export const loginUser = (credentials) =>
  getData(api.post(`${USERS_ENDPOINT}/login`, credentials));

export const fetchUsers = () => getData(api.get(USERS_ENDPOINT));

export const fetchSpecializations = () =>
  getData(api.get(`${SPECIALIZATIONS_ENDPOINT}/all`));

export const fetchAppointments = () => getData(api.get(APPOINTMENTS_ENDPOINT));

export const createAppointment = (appointmentData) =>
  getData(api.post(APPOINTMENTS_ENDPOINT, appointmentData));

export const updateAppointment = (appointmentId, appointmentData) =>
  getData(api.put(`${APPOINTMENTS_ENDPOINT}/${appointmentId}`, appointmentData));

export const deleteAppointment = (appointmentId) =>
  getData(api.delete(`${APPOINTMENTS_ENDPOINT}/${appointmentId}`));

export const fetchMedicalRecords = () =>
  getData(api.get(MEDICAL_RECORDS_ENDPOINT));

export const createMedicalRecord = (recordData) =>
  getData(api.post(MEDICAL_RECORDS_ENDPOINT, recordData));

export const updateMedicalRecord = (recordId, recordData) =>
  getData(api.put(`${MEDICAL_RECORDS_ENDPOINT}/${recordId}`, recordData));

export const deleteMedicalRecord = (recordId) =>
  getData(api.delete(`${MEDICAL_RECORDS_ENDPOINT}/${recordId}`));

export default api;
