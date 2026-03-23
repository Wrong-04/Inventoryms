import { useState } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import { toast } from "../../utils/toast";

const RULES = [
  { label: "At least 8 characters", test: (v) => v.length >= 8 },
  { label: "Uppercase letter", test: (v) => /[A-Z]/.test(v) },
  { label: "Lowercase letter", test: (v) => /[a-z]/.test(v) },
  { label: "Number", test: (v) => /\d/.test(v) },
  { label: "Special character", test: (v) => /[\W_]/.test(v) },
];

const PwdInput = ({ value, onChange, error, show, onToggle, placeholder }) => (
  <div className="password-input-wrap">
    <input
      type={show ? "text" : "password"}
      className={`form-control-ims${error ? " is-invalid" : ""}`}
      value={value}
      onChange={onChange}
      placeholder={placeholder}
    />
    <button type="button" className="password-toggle-btn" onClick={onToggle}>
      {show ? "🙈" : "👁"}
    </button>
  </div>
);

const ForgotPassword = () => {
  const navigate = useNavigate();
  const [step, setStep] = useState(1); // 1: email, 2: reset password
  const [email, setEmail] = useState("");
  const [userId, setUserId] = useState("");
  const [form, setForm] = useState({ newPass: "", confirm: "" });
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);
  const [show, setShow] = useState({ newPass: false, confirm: false });

  const toggleShow = (key) => setShow((s) => ({ ...s, [key]: !s[key] }));

  const handleEmailSubmit = async (e) => {
    e.preventDefault();
    if (!email) {
      setErrors({ email: "Email is required." });
      return;
    }
    setLoading(true);
    try {
      const res = await axios.get(`http://localhost:9999/users?email=${email}`);
      const user = res.data[0];
      if (!user) {
        setErrors({ email: "Email not found in system." });
        return;
      }
      setUserId(user.id);
      setStep(2);
      setErrors({});
      toast.success("Email verified! Please enter your new password.");
    } catch {
      toast.error("Server error. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const validatePassword = () => {
    const e = {};
    const pwdRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[\W_]).{8,}$/;
    if (!pwdRegex.test(form.newPass))
      e.newPass = "Password does not meet requirements.";
    if (form.newPass !== form.confirm) e.confirm = "Passwords do not match.";
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handlePasswordSubmit = async (e) => {
    e.preventDefault();
    if (!validatePassword()) return;
    setLoading(true);
    try {
      await axios.patch(`http://localhost:9999/users/${userId}`, {
        password: form.newPass,
        loginAttempts: 0,
      });
      toast.success("Password reset successfully!");
      setTimeout(() => navigate("/login"), 1500);
    } catch {
      toast.error("Failed to reset password.");
    } finally {
      setLoading(false);
    }
  };

  const strength = RULES.filter((r) => r.test(form.newPass)).length;
  const strengthColor =
    strength <= 2
      ? "#dc2626"
      : strength <= 3
        ? "#d97706"
        : strength <= 4
          ? "#2563eb"
          : "#16a34a";
  const strengthLabel = ["", "Weak", "Weak", "Fair", "Good", "Strong"][
    strength
  ];

  return (
    <div className="login-page">
      <div className="login-card">
        <div className="login-logo">
          <div className="login-logo-icon">🔐</div>
          <h2>Forgot Password</h2>
          <p>
            {step === 1
              ? "Enter your email to reset password"
              : "Create your new password"}
          </p>
        </div>

        {step === 1 ? (
          <form onSubmit={handleEmailSubmit}>
            <div style={{ marginBottom: 24 }}>
              <label className="form-label-ims">Email Address</label>
              <input
                type="email"
                className={`form-control-ims${errors.email ? " is-invalid" : ""}`}
                placeholder="your@email.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                autoComplete="email"
              />
              {errors.email && (
                <div className="invalid-feedback-ims">⚠ {errors.email}</div>
              )}
            </div>

            <button
              type="submit"
              className="btn-primary-ims"
              style={{
                width: "100%",
                justifyContent: "center",
                padding: "11px",
                fontSize: 14,
                borderRadius: 9,
                marginBottom: 12,
              }}
              disabled={loading}
            >
              {loading ? <span className="btn-spinner" /> : "Verify Email"}
            </button>

            <button
              type="button"
              className="btn-secondary-ims"
              style={{
                width: "100%",
                justifyContent: "center",
                padding: "11px",
                fontSize: 14,
                borderRadius: 9,
              }}
              onClick={() => navigate("/login")}
            >
              Back to Login
            </button>
          </form>
        ) : (
          <form onSubmit={handlePasswordSubmit}>
            <div style={{ marginBottom: 16 }}>
              <label className="form-label-ims">New Password *</label>
              <PwdInput
                value={form.newPass}
                onChange={(e) => setForm({ ...form, newPass: e.target.value })}
                error={errors.newPass}
                show={show.newPass}
                onToggle={() => toggleShow("newPass")}
                placeholder="Enter new password"
              />
              {errors.newPass && (
                <div className="invalid-feedback-ims">⚠ {errors.newPass}</div>
              )}

              {/* Strength bar */}
              {form.newPass && (
                <div style={{ marginTop: 10 }}>
                  <div style={{ display: "flex", gap: 4, marginBottom: 6 }}>
                    {[1, 2, 3, 4, 5].map((i) => (
                      <div
                        key={i}
                        style={{
                          flex: 1,
                          height: 4,
                          borderRadius: 4,
                          background: i <= strength ? strengthColor : "#e2e8f0",
                          transition: "background 0.2s",
                        }}
                      />
                    ))}
                  </div>
                  <div
                    style={{
                      fontSize: 11.5,
                      fontWeight: 600,
                      color: strengthColor,
                    }}
                  >
                    {strengthLabel}
                  </div>
                </div>
              )}

              {/* Rules checklist */}
              <div
                style={{
                  marginTop: 10,
                  display: "flex",
                  flexDirection: "column",
                  gap: 4,
                }}
              >
                {RULES.map((r) => {
                  const ok = r.test(form.newPass);
                  return (
                    <div
                      key={r.label}
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: 7,
                        fontSize: 12,
                        color: ok ? "#16a34a" : "#94a3b8",
                      }}
                    >
                      <span style={{ fontSize: 11 }}>{ok ? "✓" : "○"}</span>{" "}
                      {r.label}
                    </div>
                  );
                })}
              </div>
            </div>

            <div style={{ marginBottom: 24 }}>
              <label className="form-label-ims">Confirm New Password *</label>
              <PwdInput
                value={form.confirm}
                onChange={(e) => setForm({ ...form, confirm: e.target.value })}
                error={errors.confirm}
                show={show.confirm}
                onToggle={() => toggleShow("confirm")}
                placeholder="Re-enter new password"
              />
              {errors.confirm && (
                <div className="invalid-feedback-ims">⚠ {errors.confirm}</div>
              )}
              {form.confirm && form.newPass === form.confirm && (
                <div style={{ fontSize: 12, color: "#16a34a", marginTop: 4 }}>
                  ✓ Passwords match
                </div>
              )}
            </div>

            <button
              type="submit"
              className="btn-primary-ims"
              style={{
                width: "100%",
                justifyContent: "center",
                padding: "11px",
                fontSize: 14,
                borderRadius: 9,
              }}
              disabled={loading}
            >
              {loading ? <span className="btn-spinner" /> : "🔑 Reset Password"}
            </button>
          </form>
        )}
      </div>
    </div>
  );
};

export default ForgotPassword;
