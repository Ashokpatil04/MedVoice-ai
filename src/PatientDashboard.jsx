import { useEffect, useState } from "react";

const NAME_PATTERN = /^[A-Za-z. ]+$/;
const EMAIL_PATTERN = /^[A-Za-z0-9._%+-]+@gmail\.com$/i;
const PASSWORD_PATTERN = /^(?=.*[a-z])(?=.*[A-Z])(?=.*[^A-Za-z0-9]).{7,}$/;
const PHONE_PATTERN = /^[0-9]{10}$/;

function validateRegister(form) {
  if (!form.name.trim() || !NAME_PATTERN.test(form.name.trim())) {
    return "Name can contain only letters, spaces, and periods.";
  }
  if (!EMAIL_PATTERN.test(form.email.trim())) {
    return "Email must be in the format name@gmail.com.";
  }
  if (!PASSWORD_PATTERN.test(form.password)) {
    return "Password must be at least 7 characters and include uppercase, lowercase, and a special character.";
  }
  if (!form.age || Number(form.age) < 1 || Number(form.age) > 120) {
    return "Age must be between 1 and 120.";
  }
  if (!PHONE_PATTERN.test(form.phoneNumber.trim())) {
    return "Phone number must contain exactly 10 digits.";
  }
  if (!form.address.trim()) {
    return "Address is required.";
  }
  if (!form.gender) {
    return "Gender is required.";
  }
  if (!form.bloodGroup) {
    return "Blood group is required.";
  }
  if (!form.dob) {
    return "DOB is required.";
  }
  return "";
}

export default function AuthScreen({ onLogin, onRegister, loading, error, languages, initialMode = "login", onModeChange = () => {} }) {
  const [mode, setMode] = useState(initialMode);
  const [localError, setLocalError] = useState("");
  const [form, setForm] = useState({
    name: "",
    email: "",
    password: "",
    age: "",
    phoneNumber: "",
    address: "",
    gender: "",
    bloodGroup: "",
    dob: "",
    role: "PATIENT",
    preferredLanguage: "kn"
  });

  const updateField = (key, value) => {
    setForm((current) => ({ ...current, [key]: value }));
    setLocalError("");
  };

  useEffect(() => {
    setMode(initialMode);
  }, [initialMode]);

  const submit = async (event) => {
    event.preventDefault();
    setLocalError("");

    if (mode === "login") {
      if (!EMAIL_PATTERN.test(form.email.trim())) {
        setLocalError("Email must be in the format name@gmail.com.");
        return;
      }
      await onLogin({ email: form.email.trim().toLowerCase(), password: form.password });
      return;
    }

    const validationMessage = validateRegister(form);
    if (validationMessage) {
      setLocalError(validationMessage);
      return;
    }

    await onRegister({
      ...form,
      name: form.name.trim().replace(/\s+/g, " "),
      email: form.email.trim().toLowerCase(),
      phoneNumber: form.phoneNumber.trim(),
      address: form.address.trim(),
      age: Number(form.age)
    });
  };

  const title = mode === "login" ? "Login" : form.role === "DOCTOR" ? "Doctor Registration" : "Patient Registration";
  const subtitle = mode === "login"
    ? "Enter your account details to continue to the dashboard."
    : "Enter your details before starting the consultation workflow.";

  return (
    <div className="auth-page auth-page-echo">
      <section className={`auth-entry-shell glass-entry-shell ${mode === "register" ? "auth-entry-shell-register" : "auth-entry-shell-login"}`}>
        <div className="auth-brand-stack auth-brand-stack-echo">
          <p className="overline auth-brand-name">MedVoice-AI</p>
          <h1>{title}</h1>
          <p className="auth-entry-copy">{subtitle}</p>
        </div>

        <form className="form-stack auth-form auth-form-echo" onSubmit={submit}>
          {mode === "register" ? (
            <div className="register-grid-shell register-stack-shell">
              <label>Full name<input value={form.name} onChange={(e) => updateField("name", e.target.value)} required /></label>
              <label>DOB<input type="date" value={form.dob} onChange={(e) => updateField("dob", e.target.value)} required /></label>
              <label>Gender<select value={form.gender} onChange={(e) => updateField("gender", e.target.value)}><option value="">Select</option><option value="Male">Male</option><option value="Female">Female</option></select></label>
              <label>Age<input type="number" min="1" max="120" value={form.age} onChange={(e) => updateField("age", e.target.value)} required /></label>
              <label>Phone number<input value={form.phoneNumber} onChange={(e) => updateField("phoneNumber", e.target.value)} required /></label>
              <label>Blood group<select value={form.bloodGroup} onChange={(e) => updateField("bloodGroup", e.target.value)}><option value="">Select</option><option value="A+">A+</option><option value="A-">A-</option><option value="B+">B+</option><option value="B-">B-</option><option value="AB+">AB+</option><option value="AB-">AB-</option><option value="O+">O+</option><option value="O-">O-</option></select></label>
              <label>Email<input type="email" value={form.email} onChange={(e) => updateField("email", e.target.value)} required /></label>
              <label>Password<input type="password" value={form.password} onChange={(e) => updateField("password", e.target.value)} required /></label>
              <label>Address<textarea rows="3" value={form.address} onChange={(e) => updateField("address", e.target.value)} required /></label>
              <label>Role<select value={form.role} onChange={(e) => updateField("role", e.target.value)}><option value="PATIENT">Patient</option><option value="DOCTOR">Doctor</option></select></label>
              <label>Language<select value={form.preferredLanguage} onChange={(e) => updateField("preferredLanguage", e.target.value)}>{languages.map((language) => (<option key={language.code} value={language.code}>{language.label}</option>))}</select></label>
            </div>
          ) : (
            <div className="login-grid-shell">
              <label>Email<input type="email" value={form.email} onChange={(e) => updateField("email", e.target.value)} required /></label>
              <label>Password<input type="password" value={form.password} onChange={(e) => updateField("password", e.target.value)} required /></label>
            </div>
          )}

          {localError || error ? <p className="error-text">{localError || error}</p> : null}

          <div className="auth-actions auth-actions-echo">
            <button type="submit" className="primary-btn auth-submit-btn" disabled={loading}>{loading ? "Please wait..." : mode === "login" ? "Login" : "Create account"}</button>
            <button
              type="button"
              className="auth-switch-btn"
              onClick={() => {
                const nextMode = mode === "login" ? "register" : "login";
                setMode(nextMode);
                onModeChange(nextMode);
              }}
            >
              {mode === "login" ? "Register" : "Login"}
            </button>
          </div>
        </form>
      </section>
    </div>
  );
}
