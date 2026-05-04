import { useEffect, useMemo, useState } from "react";
import { api } from "../api";
import useRealtimeSpeech from "../hooks/useRealtimeSpeech";
import CertificateModal from "./CertificateModal";
import Navbar from "./Navbar";

const doctorPathMap = {
  Home: "/doctor/home",
  "Patient Details": "/doctor/patient-details",
  "Live Report": "/doctor/live-report",
  About: "/doctor/about"
};

function formatDisplayDate(value) {
  if (!value) return "Not added";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return new Intl.DateTimeFormat("en-GB", { day: "2-digit", month: "short", year: "numeric" }).format(date);
}

function splitManualLines(value) {
  if (!value || !value.trim()) return [];
  return value
    .split(/\r?\n/)
    .map((item) => item.trim())
    .filter(Boolean);
}

function createDefaultDoctorReport(patient) {
  if (!patient) return null;
  return {
    id: "default-report",
    patientId: patient.id,
    patientName: patient.name,
    patientAge: patient.age || "Not added",
    patientLanguage: patient.language || "en",
    symptoms: ["No consultation report yet"],
    duration: "Waiting for first conversation-based report",
    diagnosis: ["No diagnosis added yet"],
    prescription: ["No prescription added yet"],
    createdAt: patient.dob || new Date().toISOString(),
    status: "Default report"
  };
}

function downloadDoctorReport(report, patientNameOverride) {
  const patientName = patientNameOverride || report.patientName || "patient";
  const safePatientName = patientName.replace(/[^a-z0-9]+/gi, "-").replace(/^-+|-+$/g, "").toLowerCase() || "patient";
  const reportDate = formatDisplayDate(report.createdAt);
  const sections = [
    ["Patient Name", patientName || "Not added"],
    ["Age", report.patientAge || "Not added"],
    ["Language", report.patientLanguage?.toUpperCase() || "Not added"],
    ["Report Date", reportDate],
    ["Status", report.status || "Pending"],
    ["Symptoms", (report.symptoms || []).join(", ") || "No symptoms captured yet"],
    ["Duration", report.duration || "Not clearly mentioned"],
    ["Diagnosis", (report.diagnosis || []).join(", ") || "No diagnosis added yet"],
    ["Prescription", (report.prescription || []).join(", ") || "No prescription added yet"]
  ];

  const html = `<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <title>Patient Report</title>
  <style>
    body { font-family: Arial, sans-serif; padding: 32px; color: #1b1b1b; }
    h1 { text-align: center; margin-bottom: 24px; }
    .row { display: grid; grid-template-columns: 180px 1fr; gap: 16px; padding: 10px 0; border-bottom: 1px solid #ddd; }
    .label { font-weight: 700; }
  </style>
</head>
<body>
  <h1>PATIENT REPORT</h1>
  ${sections.map(([label, value]) => `<div class="row"><div class="label">${label}</div><div>${value}</div></div>`).join("")}
</body>
</html>`;

  const blob = new Blob([html], { type: "text/html;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = `${safePatientName}-report.html`;
  document.body.appendChild(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(url);
}

function RecorderOverlay({ visible, transcript, requestingPermission, error, onStop, sourceLanguage }) {
  if (!visible && !requestingPermission && !error) return null;

  return (
    <div className="recorder-overlay recorder-overlay-advanced">
      <div className="recorder-shell recorder-shell-doctor">
        <div className="recorder-visual-stage">
          <div className="recorder-rings doctor-rings"><span /><span /><span /></div>
          <div className={`recorder-core ${error ? "recorder-core-error" : "doctor-core"}`}>{error ? "!" : "DR"}</div>
        </div>
        <div className="recorder-body">
          <p className="overline">Doctor Live Capture</p>
          <h3>{requestingPermission ? "Allow microphone access" : error ? "Microphone issue" : "Realtime consultation capture"}</h3>
          <p>{error || transcript || `Recording live clinical speech from ${sourceLanguage.toUpperCase()} into English-ready documentation context.`}</p>
          <div className="recorder-status-grid">
            <div className="recorder-status-card"><span>Status</span><strong>{requestingPermission ? "Permission" : error ? "Attention" : "Active"}</strong></div>
            <div className="recorder-status-card"><span>Source</span><strong>{sourceLanguage.toUpperCase()}</strong></div>
            <div className="recorder-status-card"><span>Output</span><strong>English</strong></div>
          </div>
          <div className="recorder-transcript-box"><p className="feature-eyebrow">Live consultation transcript</p><div>{transcript || "Waiting for consultation audio..."}</div></div>
          <button className="primary-btn" onClick={onStop}>{error ? "Close" : "Stop recording"}</button>
        </div>
      </div>
    </div>
  );
}

function DoctorReportDocument({ report, patientNameOverride, onDownload, onDelete }) {
  return (
    <article className="patient-report-document">
      <div className="report-doc-header">
        <h2>PATIENT REPORT</h2>
        <div className="report-doc-actions">
          {onDownload ? <button className="secondary-btn" onClick={onDownload}>Download report</button> : null}
          {onDelete && report.id !== "default-report" ? (
            <button className="secondary-btn patient-report-delete-btn" onClick={() => onDelete(report.id)}>Delete report</button>
          ) : null}
        </div>
      </div>

      <section>
        <h3>1. Patient Information</h3>
        <div className="report-info-grid">
          <p><span>Patient Name</span><strong>{patientNameOverride || report.patientName}</strong></p>
          <p><span>Age</span><strong>{report.patientAge || "Not added"}</strong></p>
          <p><span>Language</span><strong>{report.patientLanguage?.toUpperCase() || "Not added"}</strong></p>
          <p><span>Report Date</span><strong>{formatDisplayDate(report.createdAt)}</strong></p>
        </div>
      </section>

      <section>
        <h3>2. Symptoms</h3>
        <ul>{(report.symptoms || []).map((item) => <li key={item}>{item}</li>)}</ul>
      </section>

      <section>
        <h3>3. Duration</h3>
        <p>{report.duration || "Not clearly mentioned"}</p>
      </section>

      <section>
        <h3>4. Diagnosis</h3>
        <ul>{(report.diagnosis || []).map((item) => <li key={item}>{item}</li>)}</ul>
      </section>

      <section>
        <h3>5. Prescription</h3>
        <ul>{(report.prescription || []).map((item) => <li key={item}>{item}</li>)}</ul>
      </section>
    </article>
  );
}

export default function DoctorDashboard({ user, dashboard, onLogout, onCertificateVerified, onRefreshDashboard, initialPage = "Home", onNavigate = () => {} }) {
  const [active, setActiveState] = useState(initialPage);
  const [sourceLanguage, setSourceLanguage] = useState("hi");
  const [doctorReport, setDoctorReport] = useState(null);
  const [selectedPatientId, setSelectedPatientId] = useState("");
  const [selectedPatientReportId, setSelectedPatientReportId] = useState("");
  const [selectedPatientReports, setSelectedPatientReports] = useState([]);
  const [diagnosis, setDiagnosis] = useState("");
  const [prescription, setPrescription] = useState("");
  const [doctorNotes, setDoctorNotes] = useState("");
  const [saveMessage, setSaveMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const speech = useRealtimeSpeech();

  const selectedPatient = useMemo(
    () => dashboard.patientDetails.find((patient) => patient.id === selectedPatientId) || null,
    [dashboard.patientDetails, selectedPatientId]
  );
  const reportCards = useMemo(
    () => (selectedPatientReports.length ? selectedPatientReports : (selectedPatient ? [createDefaultDoctorReport(selectedPatient)] : [])),
    [selectedPatientReports, selectedPatient]
  );
  const latestDoctorRecord = dashboard.records[0] || null;
  const latestDoctorRecordDate = formatDisplayDate(latestDoctorRecord?.createdAt);
  const latestDoctorPatientName = latestDoctorRecord?.patientName || "No patient selected yet";
  const latestSelectedPatientReport = reportCards[0] || null;
  const selectedPatientReport = useMemo(
    () => reportCards.find((record) => record.id === selectedPatientReportId) || null,
    [reportCards, selectedPatientReportId]
  );
  const livePreviewReport = useMemo(() => {
    if (!selectedPatient) return null;

    const baseReport = latestSelectedPatientReport || createDefaultDoctorReport(selectedPatient);
    const manualDiagnosis = splitManualLines(diagnosis);
    const manualPrescription = splitManualLines(prescription);

    return {
      ...baseReport,
      patientId: selectedPatient.id,
      patientName: selectedPatient.name,
      patientAge: selectedPatient.age || baseReport?.patientAge || "Not added",
      patientLanguage: selectedPatient.language || baseReport?.patientLanguage || "en",
      symptoms: doctorReport?.symptoms?.length ? doctorReport.symptoms : (baseReport?.symptoms || []),
      duration: doctorReport?.duration || baseReport?.duration || "Not clearly mentioned",
      diagnosis: manualDiagnosis.length ? manualDiagnosis : (baseReport?.diagnosis || []),
      prescription: manualPrescription.length ? manualPrescription : (baseReport?.prescription || []),
      status: doctorReport || manualDiagnosis.length || manualPrescription.length ? "Live preview" : (baseReport?.status || "Default report"),
      createdAt: baseReport?.createdAt || new Date().toISOString()
    };
  }, [selectedPatient, latestSelectedPatientReport, doctorReport, diagnosis, prescription]);

  useEffect(() => {
    setActiveState(initialPage);
  }, [initialPage]);

  const setActive = (page, path = doctorPathMap[page]) => {
    setActiveState(page);
    if (path) {
      onNavigate(path);
    }
  };

  useEffect(() => {
    if (!selectedPatientId && dashboard.patientDetails.length) {
      setSelectedPatientId(dashboard.patientDetails[0].id);
    }
  }, [dashboard.patientDetails, selectedPatientId]);

  useEffect(() => {
    setSelectedPatientReportId("");
  }, [selectedPatientId]);

  useEffect(() => {
    const latestReport = selectedPatientReports[0];
    setDiagnosis(latestReport?.diagnosis?.join("\n") || "");
    setPrescription(latestReport?.prescription?.join("\n") || "");
    setDoctorNotes(latestReport?.doctorNotes || "");
  }, [selectedPatientId, selectedPatientReports]);

  useEffect(() => {
    if (!selectedPatientId) {
      setSelectedPatientReports([]);
      return;
    }

    let ignore = false;
    setSelectedPatientReports([]);

    api.getDoctorPatientReports(selectedPatientId)
      .then((records) => {
        if (!ignore) {
          setSelectedPatientReports(records);
        }
      })
      .catch(() => {
        if (!ignore) {
          setSelectedPatientReports([]);
        }
      });

    return () => {
      ignore = true;
    };
  }, [selectedPatientId]);

  useEffect(() => {
    const localeMap = { en: "en-US", hi: "hi-IN", kn: "kn-IN" };
    speech.setLanguage(localeMap[sourceLanguage] || "en-US");
  }, [sourceLanguage]);

  useEffect(() => {
    if (!speech.transcript || !speech.listening || !user.certificateVerified) return;
    const timeoutId = setTimeout(async () => {
      setLoading(true);
      try {
        setDoctorReport(await api.translateDoctorLiveText({ text: speech.transcript, sourceLanguage }));
      } finally {
        setLoading(false);
      }
    }, 900);
    return () => clearTimeout(timeoutId);
  }, [speech.transcript, speech.listening, sourceLanguage, user.certificateVerified]);

  const finalizeReport = async () => {
    if (!selectedPatient) {
      setSaveMessage("Select a patient first.");
      return;
    }
    if (!livePreviewReport) {
      setSaveMessage("No report is ready for this patient yet.");
      return;
    }
    const transcriptSource = doctorReport?.englishTranscript || latestSelectedPatientReport?.doctorNotes || speech.transcript || "";
    const symptomSource = doctorReport?.symptoms?.length ? doctorReport.symptoms : (latestSelectedPatientReport?.symptoms || []);
    const durationSource = doctorReport?.duration || latestSelectedPatientReport?.duration || "Not clearly mentioned";
    const severitySource = doctorReport?.severity || latestSelectedPatientReport?.severity || "Not clearly mentioned";
    const termSource = doctorReport?.medicalTerms?.length ? doctorReport.medicalTerms : (latestSelectedPatientReport?.medicalTerms || []);

    setLoading(true);
    setSaveMessage("");
    try {
      await api.finalizeDoctorReport({
        patientId: selectedPatient.id,
        englishTranscript: transcriptSource,
        symptoms: symptomSource,
        duration: durationSource,
        severity: severitySource,
        medicalTerms: termSource,
        diagnosis,
        prescription,
        doctorNotes
      });
      setDiagnosis("");
      setPrescription("");
      setDoctorNotes("");
      setDoctorReport(null);
      speech.setTranscript("");
      setSaveMessage("Doctor report saved. The patient can now see it in the reports dashboard.");
      setSelectedPatientReports(await api.getDoctorPatientReports(selectedPatient.id));
      await onRefreshDashboard();
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="page-shell cinematic-shell">
      {!user.certificateVerified ? <CertificateModal onSubmit={onCertificateVerified} loading={loading} /> : null}
      <RecorderOverlay visible={speech.listening} transcript={speech.transcript} requestingPermission={speech.requestingPermission} error={speech.error} sourceLanguage={sourceLanguage} onStop={() => { speech.stop(); speech.setError(""); }} />
      <Navbar items={["Home", "Patient Details", "Live Report", "About"]} active={active} setActive={setActive} pathMap={doctorPathMap} onLogout={onLogout} role="DOCTOR" userName={user.name} />

      {active === "Home" ? (
        <>
          <section className="patient-home-grid">
            <article className="panel patient-home-welcome">
              <p className="overline">Welcome</p>
              <h1>Welcome, Dr. {user.name}</h1>
              <p>Your clinical workspace summary at a glance.</p>
              <div className="patient-home-meta">
                <div><span>Last Report</span><strong>{latestDoctorRecordDate}</strong></div>
                <div><span>Clinic</span><strong>{user.hospitalName || "Not added"}</strong></div>
              </div>
            </article>

            <article className="panel patient-home-language">
              <p className="feature-eyebrow">Doctor Status</p>
              <h3>Verification: {user.certificateVerified ? "Verified" : "Pending"}</h3>
              <p>Track your active review language and certificate status from one place.</p>
              <label>
                <span>Current spoken language</span>
                <select value={sourceLanguage} onChange={(e) => setSourceLanguage(e.target.value)}>
                  <option value="en">English</option>
                  <option value="hi">Hindi</option>
                  <option value="kn">Kannada</option>
                </select>
              </label>
            </article>
          </section>

          <section className="patient-home-lower">
            <article className="panel patient-home-history">
              <div className="panel-topline">
                <p className="feature-eyebrow">Recent Activity</p>
                <span>{dashboard.records.length ? "Updated" : "Waiting"}</span>
              </div>
              <div className="meaning-stack">
                <div className="meaning-card">
                  <span>Recent patient</span>
                  <strong>{latestDoctorPatientName}</strong>
                </div>
                <div className="meaning-card">
                  <span>Latest saved report</span>
                  <strong>{latestDoctorRecordDate}</strong>
                </div>
                <div className="meaning-card">
                  <span>Total reports generated</span>
                  <strong>{dashboard.records.length}</strong>
                </div>
              </div>
            </article>

            <article className="panel patient-home-summary">
              <div className="panel-topline">
                <p className="feature-eyebrow">Latest Medical Summary</p>
                <span>{latestDoctorRecord?.status || "Pending"}</span>
              </div>
              <div className="meaning-stack">
                <div className="meaning-card">
                  <span>Symptoms</span>
                  <strong>{latestDoctorRecord?.symptoms?.join(", ") || "No symptoms captured yet"}</strong>
                </div>
                <div className="meaning-card">
                  <span>Prescription</span>
                  <strong>{latestDoctorRecord?.prescription?.join(", ") || "No prescription added yet"}</strong>
                </div>
              </div>
            </article>
          </section>

          <section className="patient-home-about">
            <article className="panel patient-home-about-card">
              <p className="feature-eyebrow">About MedVoice AI</p>
              <h3>Multilingual review for everyday care</h3>
              <p>
                MedVoice AI helps doctors review multilingual conversations, update patient reports, and save
                diagnosis and prescription details in one place. It keeps the care summary connected between
                doctor and patient dashboards for smoother follow-up.
              </p>
            </article>
          </section>
        </>
      ) : null}

      {active === "Patient Details" ? (
        <section className="panel">
          <div className="section-headline"><p className="overline">Patient Details</p><h3>Choose a registered patient and review only that patient&apos;s reports</h3></div>
          <label>
            Select patient
            <select value={selectedPatientId} onChange={(e) => setSelectedPatientId(e.target.value)}>
              {dashboard.patientDetails.map((patient) => (
                <option key={patient.id} value={patient.id}>
                  {patient.name}
                </option>
              ))}
            </select>
          </label>
          {selectedPatient ? (
            <div className="patient-report-detail-actions doctor-patient-detail-meta">
              <span className="patient-report-chip">{selectedPatient.name}</span>
            </div>
          ) : null}
          {selectedPatientReport ? (
            <div className="patient-report-detail">
              <div className="patient-report-detail-actions">
                <button type="button" className="secondary-btn" onClick={() => setSelectedPatientReportId("")}>Back to report cards</button>
              </div>
              <DoctorReportDocument
                key={`${selectedPatientId}-${selectedPatientReport.id}`}
                report={selectedPatientReport}
                patientNameOverride={selectedPatient?.name}
                onDownload={() => downloadDoctorReport(selectedPatientReport, selectedPatient?.name)}
                onDelete={async (reportId) => {
                  await api.deleteDoctorReport(reportId);
                  setSelectedPatientReportId("");
                  setSelectedPatientReports((current) => current.filter((record) => record.id !== reportId));
                  await onRefreshDashboard();
                }}
              />
            </div>
          ) : (
            reportCards.length ? (
              <div key={selectedPatientId} className="patient-report-card-grid doctor-selected-report-grid">
                {reportCards.map((record, index) => (
                  <button key={record.id} type="button" className="patient-report-card doctor-patient-report-card" onClick={() => setSelectedPatientReportId(record.id)}>
                    <div className="patient-report-card-head">
                      <h3>{selectedPatient?.name || record.patientName}</h3>
                      <div className="patient-report-card-actions">
                        <span>{record.status === "Default report" ? "Default Report" : `Report ${index + 1}`}</span>
                        <button
                          type="button"
                          className="patient-report-download-btn"
                          onClick={(event) => {
                            event.stopPropagation();
                            downloadDoctorReport(record, selectedPatient?.name);
                          }}
                        >
                          Download
                        </button>
                        {record.id !== "default-report" ? (
                          <button
                            type="button"
                            className="patient-report-delete-btn"
                          onClick={async (event) => {
                            event.stopPropagation();
                            await api.deleteDoctorReport(record.id);
                            setSelectedPatientReportId("");
                            setSelectedPatientReports((current) => current.filter((item) => item.id !== record.id));
                            await onRefreshDashboard();
                          }}
                        >
                          Delete
                          </button>
                        ) : null}
                      </div>
                    </div>
                    <p><strong>Symptoms:</strong> {(record.symptoms || []).join(", ") || "Not captured"}</p>
                    <p><strong>Duration:</strong> {record.duration || "Not mentioned"}</p>
                    <p><strong>Diagnosis:</strong> {(record.diagnosis || []).join(", ") || "Pending"}</p>
                    <p><strong>Prescription:</strong> {(record.prescription || []).join(", ") || "Pending"}</p>
                    <p><strong>Status:</strong> {record.status || "Pending"}</p>
                  </button>
                ))}
              </div>
            ) : (
              <div className="patient-report-empty">
                No report is available for this patient yet.
              </div>
            )
          )}
        </section>
      ) : null}

      {active === "Live Report" ? (
        <section className="doctor-live-report-shell">
          <article className="panel translation-command-card doctor-live-editor-card">
            <div className="section-headline">
              <p className="overline">Live Report</p>
              <h3>Update the selected patient report and save it</h3>
            </div>

            <label className="doctor-live-field">
              <span>Patient name</span>
              <select value={selectedPatientId} onChange={(e) => setSelectedPatientId(e.target.value)}>
                {dashboard.patientDetails.map((patient) => <option key={patient.id} value={patient.id}>{patient.name}</option>)}
              </select>
            </label>

            <div className="doctor-live-tools">
              <label className="doctor-live-field">
                <span>Spoken language</span>
                <select value={sourceLanguage} onChange={(e) => setSourceLanguage(e.target.value)}>
                  <option value="en">English</option>
                  <option value="hi">Hindi</option>
                  <option value="kn">Kannada</option>
                </select>
              </label>
              <div className="button-row doctor-live-mic-actions">
                <button className="primary-btn" onClick={speech.start} disabled={!user.certificateVerified || speech.requestingPermission}>
                  {speech.requestingPermission ? "Allowing microphone..." : speech.listening ? "Listening..." : "Start microphone"}
                </button>
                <button className="secondary-btn" onClick={speech.stop} disabled={!user.certificateVerified}>Stop microphone</button>
              </div>
            </div>

            {speech.error ? <p className="error-text">{speech.error}</p> : null}
            {doctorReport?.englishTranscript ? (
              <div className="doctor-live-transcript-note">
                <span>Captured consultation</span>
                <strong>{doctorReport.englishTranscript}</strong>
              </div>
            ) : null}

            <label className="doctor-live-field">
              <span>Diagnosis</span>
              <textarea rows="6" value={diagnosis} onChange={(e) => setDiagnosis(e.target.value)} placeholder="Write one diagnosis item per line" />
            </label>

            <label className="doctor-live-field">
              <span>Prescription</span>
              <textarea rows="6" value={prescription} onChange={(e) => setPrescription(e.target.value)} placeholder="Write one prescription item per line" />
            </label>

            {saveMessage ? <p className="small-note">{saveMessage}</p> : null}
            <button className="primary-btn doctor-live-save-btn" onClick={finalizeReport} disabled={loading}>Save report</button>
          </article>

          <article className="panel translation-output-card doctor-live-preview-card">
            <div className="section-headline">
              <p className="overline">Report</p>
              <h3>Selected patient report preview</h3>
            </div>
            {livePreviewReport ? (
              <DoctorReportDocument
                key={`live-preview-${selectedPatientId}-${livePreviewReport.status}`}
                report={livePreviewReport}
                patientNameOverride={selectedPatient?.name}
              />
            ) : (
              <div className="patient-report-empty">Select a patient to view the report preview.</div>
            )}
          </article>
        </section>
      ) : null}

      {active === "About" ? (
        <section className="patient-about-page">
          <article className="panel about-page-hero patient-about-hero">
            <div>
              <p className="overline">About Doctor</p>
              <h2>{user.name}</h2>
            </div>
            <div className="translation-top-actions patient-about-top-actions">
              <div className="meaning-card">
                <span>Doctor ID</span>
                <strong>DR{String(user.id).slice(0, 6).toUpperCase()}</strong>
              </div>
            </div>
          </article>

          <section className="about-feature-grid patient-about-feature-grid">
            <article className="about-feature-card">
              <span>Name</span>
              <strong>{user.name}</strong>
            </article>
            <article className="about-feature-card">
              <span>Doctor ID</span>
              <strong>DR{String(user.id).slice(0, 6).toUpperCase()}</strong>
            </article>
            <article className="about-feature-card">
              <span>Clinic Name</span>
              <strong>{user.hospitalName || "Not added"}</strong>
            </article>
            <article className="about-feature-card">
              <span>Age</span>
              <strong>{user.age || "Not added"}</strong>
            </article>
            <article className="about-feature-card">
              <span>Phone Number</span>
              <strong>{user.phoneNumber || "Not added"}</strong>
            </article>
            <article className="about-feature-card">
              <span>Email</span>
              <strong>{user.email}</strong>
            </article>
            <article className="about-feature-card">
              <span>Gender</span>
              <strong>{user.gender || "Not added"}</strong>
            </article>
            <article className="about-feature-card">
              <span>Blood Group</span>
              <strong>{user.bloodGroup || "Not added"}</strong>
            </article>
            <article className="about-feature-card">
              <span>Language</span>
              <strong>{user.preferredLanguage?.toUpperCase() || "Not added"}</strong>
            </article>
            <article className="about-feature-card">
              <span>Address</span>
              <strong>{user.address || "Not added"}</strong>
            </article>
          </section>
        </section>
      ) : null}
    </div>
  );
}
