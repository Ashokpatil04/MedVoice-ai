import { useState } from "react";

export default function CertificateModal({ onSubmit, loading }) {
  const [certificateNumber, setCertificateNumber] = useState("");
  const [hospitalName, setHospitalName] = useState("");

  return (
    <div className="modal-backdrop">
      <div className="modal-card">
        <h3>Doctor certificate verification</h3>
        <p>Please confirm your medical certificate once. It will be saved for future logins.</p>
        <label>
          Certificate ID
          <input value={certificateNumber} onChange={(e) => setCertificateNumber(e.target.value)} />
        </label>
        <label>
          Hospital or clinic
          <input value={hospitalName} onChange={(e) => setHospitalName(e.target.value)} />
        </label>
        <button
          className="primary-btn"
          disabled={loading}
          onClick={() => onSubmit({ certificateNumber, hospitalName })}
        >
          {loading ? "Verifying..." : "Confirm certificate"}
        </button>
      </div>
    </div>
  );
}
