const API_HOST = window.location.hostname === "localhost" ? "localhost" : "127.0.0.1";
const API_BASE_URL = `http://${API_HOST}:8080/api`;

async function request(path, options = {}) {
  const token = localStorage.getItem("token");
  const response = await fetch(`${API_BASE_URL}${path}`, {
    ...options,
    headers: {
      ...(options.body instanceof FormData ? {} : { "Content-Type": "application/json" }),
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...(options.headers || {})
    }
  });

  const contentType = response.headers.get("content-type") || "";
  const payload = contentType.includes("application/json") ? await response.json() : await response.text();

  if (!response.ok) {
    throw new Error(typeof payload === "string" ? payload : payload.message || "Request failed");
  }

  return payload;
}

export const api = {
  login: (body) => request("/auth/login", { method: "POST", body: JSON.stringify(body) }),
  register: (body) => request("/auth/register", { method: "POST", body: JSON.stringify(body) }),
  me: () => request("/auth/me"),
  verifyDoctorCertificate: (body) =>
    request("/doctor/certificate", { method: "POST", body: JSON.stringify(body) }),
  getPatientDashboard: () => request("/patient/dashboard"),
  getDoctorDashboard: () => request("/doctor/dashboard"),
  getDoctorPatientReports: (patientId) => request(`/doctor/patient-reports?patientId=${encodeURIComponent(patientId)}`),
  translatePatientInput: (body) =>
    request("/patient/translate", { method: "POST", body: JSON.stringify(body) }),
  translatePatientAudio: ({ audio, sourceLanguage, targetLanguage }) => {
    const formData = new FormData();
    formData.append("audio", audio);
    formData.append("sourceLanguage", sourceLanguage);
    formData.append("targetLanguage", targetLanguage);
    return request("/patient/translate-audio", { method: "POST", body: formData });
  },
  savePatientReportDraft: (body) =>
    request("/patient/report-draft", { method: "POST", body: JSON.stringify(body) }),
  getReports: () => request("/patient/reports"),
  deleteReport: (reportId) =>
    request("/patient/report-delete", { method: "POST", body: JSON.stringify({ reportId }) }),
  translateDoctorLiveText: (body) =>
    request("/doctor/live-report-text", { method: "POST", body: JSON.stringify(body) }),
  finalizeDoctorReport: (body) =>
    request("/doctor/finalize-report", { method: "POST", body: JSON.stringify(body) }),
  deleteDoctorReport: (reportId) =>
    request("/doctor/report-delete", { method: "POST", body: JSON.stringify({ reportId }) })
};
