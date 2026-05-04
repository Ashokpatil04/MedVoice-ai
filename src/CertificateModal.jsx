import { useEffect, useState } from "react";
import { api } from "./api";
import AuthScreen from "./components/AuthScreen";
import DoctorDashboard from "./components/DoctorDashboard";
import PatientDashboard from "./components/PatientDashboard";

export const patientLanguages = [
  { code: "en", label: "English" },
  { code: "hi", label: "Hindi" },
  { code: "kn", label: "Kannada" }
];

const authPathMap = {
  login: "/login",
  register: "/register"
};

const patientPageByPath = {
  "/patient/home": "Home",
  "/patient/translation": "Translation",
  "/patient/reports": "Reports",
  "/patient/about": "About"
};

const doctorPageByPath = {
  "/doctor/home": "Home",
  "/doctor/patient-details": "Patient Details",
  "/doctor/live-report": "Live Report",
  "/doctor/about": "About"
};

function getPathname() {
  return window.location.pathname || "/";
}

function navigateTo(path, replace = false) {
  if (getPathname() === path) {
    return;
  }
  const method = replace ? "replaceState" : "pushState";
  window.history[method]({}, "", path);
  window.dispatchEvent(new PopStateEvent("popstate"));
}

export default function App() {
  const [user, setUser] = useState(null);
  const [reports, setReports] = useState([]);
  const [patientDashboard, setPatientDashboard] = useState({ summary: "", reminders: [] });
  const [doctorDashboard, setDoctorDashboard] = useState({ patientDetails: [], records: [] });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [pathname, setPathname] = useState(getPathname());

  useEffect(() => {
    const handlePopState = () => setPathname(getPathname());
    window.addEventListener("popstate", handlePopState);
    return () => window.removeEventListener("popstate", handlePopState);
  }, []);

  const hydrateUser = async (currentUser) => {
    setUser(currentUser);
    if (currentUser.role === "PATIENT") {
      const [dashboard, reportList] = await Promise.all([api.getPatientDashboard(), api.getReports()]);
      setPatientDashboard(dashboard);
      setReports(reportList);
      if (!pathname.startsWith("/patient/")) {
        navigateTo("/patient/home", true);
      }
      return;
    }

    const dashboard = await api.getDoctorDashboard();
    setDoctorDashboard(dashboard);
    if (!pathname.startsWith("/doctor/")) {
      navigateTo("/doctor/home", true);
    }
  };

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token) {
      if (pathname !== authPathMap.login && pathname !== authPathMap.register) {
        navigateTo(authPathMap.login, true);
      }
      return;
    }

    api.me().then(hydrateUser).catch(() => {
      localStorage.removeItem("token");
      setUser(null);
      navigateTo(authPathMap.login, true);
    });
  }, [pathname]);

  const handleLogin = async (credentials) => {
    setLoading(true);
    setError("");
    try {
      const response = await api.login(credentials);
      localStorage.setItem("token", response.token);
      await hydrateUser(response.user);
    } catch (loginError) {
      setError(loginError.message);
    } finally {
      setLoading(false);
    }
  };

  const handleRegister = async (payload) => {
    setLoading(true);
    setError("");
    try {
      const response = await api.register(payload);
      localStorage.setItem("token", response.token);
      await hydrateUser(response.user);
    } catch (registerError) {
      setError(registerError.message);
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem("token");
    setUser(null);
    setReports([]);
    setPatientDashboard({ summary: "", reminders: [] });
    setDoctorDashboard({ patientDetails: [], records: [] });
    navigateTo("/logout", false);
    navigateTo(authPathMap.login, true);
  };

  const handleVerifyCertificate = async (payload) => {
    setLoading(true);
    try {
      const updatedUser = await api.verifyDoctorCertificate(payload);
      setUser(updatedUser);
      setDoctorDashboard(await api.getDoctorDashboard());
    } finally {
      setLoading(false);
    }
  };

  if (!user) {
    return (
      <AuthScreen
        loading={loading}
        error={error}
        onLogin={handleLogin}
        onRegister={handleRegister}
        languages={patientLanguages}
        initialMode={pathname === authPathMap.register ? "register" : "login"}
        onModeChange={(mode) => navigateTo(mode === "register" ? authPathMap.register : authPathMap.login)}
      />
    );
  }

  const patientInitialPage = patientPageByPath[pathname] || "Home";
  const doctorInitialPage = doctorPageByPath[pathname] || "Home";

  return user.role === "PATIENT" ? (
    <PatientDashboard
      user={user}
      reports={reports}
      dashboard={patientDashboard}
      languages={patientLanguages}
      initialPage={patientInitialPage}
      onNavigate={(path) => navigateTo(path)}
      onRefresh={async () => setReports(await api.getReports())}
      onLogout={handleLogout}
    />
  ) : (
    <DoctorDashboard
      user={user}
      dashboard={doctorDashboard}
      initialPage={doctorInitialPage}
      onNavigate={(path) => navigateTo(path)}
      onLogout={handleLogout}
      onCertificateVerified={handleVerifyCertificate}
      onRefreshDashboard={async () => setDoctorDashboard(await api.getDoctorDashboard())}
    />
  );
}
