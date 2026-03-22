import { useState } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import { getUser, addLog } from "../../utils/auth";
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

const ChangePassword = () => {
  const navigate = useNavigate();
  const user = getUser();
  const [form, setForm] = useState({ current: "", newPass: "", confirm: "" });
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);
  const [show, setShow] = useState({
    current: false,
    newPass: false,
    confirm: false,
  });

  const toggleShow = (key) => setShow((s) => ({ ...s, [key]: !s[key] }));

  const validate = () => {
    const e = {};
    if (!form.current) e.current = "Current password is required.";
    const pwdRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[\W_]).{8,}$/;
    if (!pwdRegex.test(form.newPass))
      e.newPass = "Password does not meet requirements.";
    if (form.newPass !== form.confirm) e.confirm = "Passwords do not match.";
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validate()) return;
    setLoading(true);
    try {
      const res = await axios.get(`http://localhost:9999/users/${user.id}`);
      if (res.data.password !== form.current) {
        setErrors({ current: "Current password is incorrect." });
        return;
      }
      await axios.patch(`http://localhost:9999/users/${user.id}`, {
        password: form.newPass,
      });
      await addLog("Change Password", "Password changed successfully");
      toast.success("Password updated successfully!");
      setForm({ current: "", newPass: "", confirm: "" });
    } catch {
      toast.error("Failed to update password.");
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
    <div>
      <div className="page-header">
        <div className="page-header-left">
          <div className="page-header-icon" style={{ background: "#f0fdf4" }}>
            🔑
          </div>
          <div>
            <h4 style={{ margin: 0 }}>Change Password</h4>
            <div className="page-header-sub">Update your account password</div>
          </div>
        </div>
      </div>

      <div style={{ maxWidth: 480 }}>
        <div className="card-box">
          <form onSubmit={handleSubmit}>
            <div style={{ marginBottom: 16 }}>
              <label className="form-label-ims">Current Password *</label>
              <PwdInput
                value={form.current}
                onChange={(e) => setForm({ ...form, current: e.target.value })}
                error={errors.current}
                show={show.current}
                onToggle={() => toggleShow("current")}
                placeholder="Enter current password"
              />
              {errors.current && (
                <div className="invalid-feedback-ims">⚠ {errors.current}</div>
              )}
            </div>

            <hr className="divider-ims" />

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

            <div
              style={{
                display: "flex",
                gap: 10,
                paddingTop: 4,
                borderTop: "1px solid #f1f5f9",
              }}
            >
              <button
                type="submit"
                className="btn-primary-ims"
                disabled={loading}
              >
                {loading ? (
                  <span className="btn-spinner" />
                ) : (
                  "🔑 Update Password"
                )}
              </button>
              <button
                type="button"
                className="btn-secondary-ims"
                onClick={() => navigate("/")}
              >
                Cancel
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default ChangePassword;
