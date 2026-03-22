import { useState } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import { getUser, addLog } from "../../utils/auth";
import { toast } from "../../utils/toast";

const ChangePassword = () => {
  const navigate = useNavigate();
  const user = getUser();
  const [form, setForm] = useState({ current: "", newPass: "", confirm: "" });
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);
  const [showCurrent, setShowCurrent] = useState(false);
  const [showNew, setShowNew] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

  const validate = () => {
    const e = {};
    if (!form.current) e.current = "Current password is required.";
    const pwdRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[\W_]).{8,}$/;
    if (!pwdRegex.test(form.newPass))
      e.newPass = "Min 8 chars, uppercase, lowercase, number, special char.";
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

  const PasswordInput = ({
    value,
    onChange,
    error,
    show,
    onToggle,
    placeholder,
  }) => (
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

  return (
    <div>
      <div className="page-header">
        <h4>🔑 Change Password</h4>
      </div>
      <div className="card-box" style={{ maxWidth: 480 }}>
        <form onSubmit={handleSubmit}>
          <div style={{ marginBottom: 16 }}>
            <label className="form-label-ims">Current Password *</label>
            <PasswordInput
              value={form.current}
              onChange={(e) => setForm({ ...form, current: e.target.value })}
              error={errors.current}
              show={showCurrent}
              onToggle={() => setShowCurrent(!showCurrent)}
            />
            {errors.current && (
              <div className="invalid-feedback-ims">{errors.current}</div>
            )}
          </div>
          <div style={{ marginBottom: 16 }}>
            <label className="form-label-ims">New Password *</label>
            <PasswordInput
              value={form.newPass}
              onChange={(e) => setForm({ ...form, newPass: e.target.value })}
              error={errors.newPass}
              show={showNew}
              onToggle={() => setShowNew(!showNew)}
            />
            {errors.newPass && (
              <div className="invalid-feedback-ims">{errors.newPass}</div>
            )}
            <div style={{ fontSize: 12, color: "#9ca3af", marginTop: 4 }}>
              Min 8 chars · uppercase · lowercase · number · special character
            </div>
          </div>
          <div style={{ marginBottom: 24 }}>
            <label className="form-label-ims">Confirm New Password *</label>
            <PasswordInput
              value={form.confirm}
              onChange={(e) => setForm({ ...form, confirm: e.target.value })}
              error={errors.confirm}
              show={showConfirm}
              onToggle={() => setShowConfirm(!showConfirm)}
            />
            {errors.confirm && (
              <div className="invalid-feedback-ims">{errors.confirm}</div>
            )}
          </div>
          <div style={{ display: "flex", gap: 10 }}>
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
  );
};

export default ChangePassword;
