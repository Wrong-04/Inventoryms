import { useState } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import { getUser, addLog, setUser } from "../utils/auth";
import { toast } from "../utils/toast";

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

const ROLE_STYLE = {
  admin: { color: "#a78bfa", bg: "rgba(167,139,250,0.15)" },
  manager: { color: "#fb923c", bg: "rgba(251,146,60,0.15)" },
  salesperson: { color: "#60a5fa", bg: "rgba(96,165,250,0.15)" },
};

const ROLE_LABEL = {
  admin: "Admin",
  manager: "Manager",
  salesperson: "Salesperson",
};

const getInitials = (name = "") =>
  name
    .split(" ")
    .map((w) => w[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();

const Profile = () => {
  const navigate = useNavigate();
  const user = getUser();
  const [activeTab, setActiveTab] = useState("info");
  const [profileForm, setProfileForm] = useState({
    name: user?.name || "",
    email: user?.email || "",
  });
  const [passwordForm, setPasswordForm] = useState({
    current: "",
    newPass: "",
    confirm: "",
  });
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);
  const [show, setShow] = useState({
    current: false,
    newPass: false,
    confirm: false,
  });

  const toggleShow = (key) => setShow((s) => ({ ...s, [key]: !s[key] }));
  const rs = ROLE_STYLE[user?.role] || ROLE_STYLE.salesperson;

  // Profile Update
  const handleProfileSubmit = async (e) => {
    e.preventDefault();
    const e_obj: { name?: string; email?: string } = {};
    if (!profileForm.name.trim()) e_obj.name = "Name is required.";
    if (!profileForm.email.trim()) e_obj.email = "Email is required.";
    setErrors(e_obj);
    if (Object.keys(e_obj).length > 0) return;

    setLoading(true);
    try {
      await axios.patch(`http://localhost:9999/users/${user.id}`, {
        name: profileForm.name,
        email: profileForm.email,
      });
      setUser({
        ...user,
        name: profileForm.name,
        email: profileForm.email,
      });
      await addLog("Update Profile", "Profile information updated");
      toast.success("Profile updated successfully!");
    } catch {
      toast.error("Failed to update profile.");
    } finally {
      setLoading(false);
    }
  };

  // Password Change
  const validatePassword = () => {
    const e: { current?: string; newPass?: string; confirm?: string } = {};
    if (!passwordForm.current) e.current = "Current password is required.";
    const pwdRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[\W_]).{8,}$/;
    if (!pwdRegex.test(passwordForm.newPass))
      e.newPass = "Password does not meet requirements.";
    if (passwordForm.newPass !== passwordForm.confirm)
      e.confirm = "Passwords do not match.";
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handlePasswordSubmit = async (e) => {
    e.preventDefault();
    if (!validatePassword()) return;
    setLoading(true);
    try {
      const res = await axios.get(`http://localhost:9999/users/${user.id}`);
      if ((res.data as any).password !== passwordForm.current) {
        setErrors({ current: "Current password is incorrect." });
        return;
      }
      await axios.patch(`http://localhost:9999/users/${user.id}`, {
        password: passwordForm.newPass,
      });
      await addLog("Change Password", "Password changed successfully");
      toast.success("Password updated successfully!");
      setPasswordForm({ current: "", newPass: "", confirm: "" });
    } catch {
      toast.error("Failed to update password.");
    } finally {
      setLoading(false);
    }
  };

  const strength = RULES.filter((r) => r.test(passwordForm.newPass)).length;
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
          <div className="page-header-icon" style={{ background: "#f0f9ff" }}>
            👤
          </div>
          <div>
            <h4 style={{ margin: 0 }}>My Profile</h4>
            <div className="page-header-sub">
              Manage your account information
            </div>
          </div>
        </div>
      </div>

      <div style={{ maxWidth: 800 }}>
        {/* User Card */}
        <div className="card-box" style={{ marginBottom: 20 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
            <div
              style={{
                width: 80,
                height: 80,
                borderRadius: "50%",
                background: "linear-gradient(135deg,#3b82f6,#1d4ed8)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontSize: 28,
                fontWeight: 700,
                color: "#fff",
                flexShrink: 0,
              }}
            >
              {getInitials(user?.name)}
            </div>
            <div style={{ flex: 1 }}>
              <h3 style={{ margin: 0, fontSize: 20, marginBottom: 4 }}>
                {user?.name}
              </h3>
              <div style={{ fontSize: 14, color: "#64748b", marginBottom: 8 }}>
                {user?.email}
              </div>
              <div
                style={{
                  display: "inline-block",
                  padding: "4px 12px",
                  borderRadius: 6,
                  fontSize: 12,
                  fontWeight: 600,
                  background: rs.bg,
                  color: rs.color,
                }}
              >
                {ROLE_LABEL[user?.role]}
              </div>
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div
          style={{
            display: "flex",
            gap: 8,
            marginBottom: 20,
            borderBottom: "2px solid #f1f5f9",
          }}
        >
          <button
            onClick={() => {
              setActiveTab("info");
              setErrors({});
            }}
            style={{
              background: "none",
              border: "none",
              padding: "12px 20px",
              fontSize: 14,
              fontWeight: 600,
              cursor: "pointer",
              color: activeTab === "info" ? "#3b82f6" : "#64748b",
              borderBottom:
                activeTab === "info" ? "2px solid #3b82f6" : "2px solid transparent",
              marginBottom: -2,
              transition: "all 0.2s",
            }}
          >
            📋 Personal Information
          </button>
          <button
            onClick={() => {
              setActiveTab("password");
              setErrors({});
            }}
            style={{
              background: "none",
              border: "none",
              padding: "12px 20px",
              fontSize: 14,
              fontWeight: 600,
              cursor: "pointer",
              color: activeTab === "password" ? "#3b82f6" : "#64748b",
              borderBottom:
                activeTab === "password"
                  ? "2px solid #3b82f6"
                  : "2px solid transparent",
              marginBottom: -2,
              transition: "all 0.2s",
            }}
          >
            🔑 Change Password
          </button>
        </div>

        {/* Tab Content */}
        {activeTab === "info" ? (
          <div className="card-box">
            <form onSubmit={handleProfileSubmit}>
              <div style={{ marginBottom: 16 }}>
                <label className="form-label-ims">Full Name *</label>
                <input
                  type="text"
                  className={`form-control-ims${(errors as any).name ? " is-invalid" : ""}`}
                  value={profileForm.name}
                  onChange={(e) =>
                    setProfileForm({ ...profileForm, name: e.target.value })
                  }
                  placeholder="Enter your full name"
                />
                {(errors as any).name && (
                  <div className="invalid-feedback-ims">⚠ {(errors as any).name}</div>
                )}
              </div>

              <div style={{ marginBottom: 24 }}>
                <label className="form-label-ims">Email Address *</label>
                <input
                  type="email"
                  className={`form-control-ims${(errors as any).email ? " is-invalid" : ""}`}
                  value={profileForm.email}
                  onChange={(e) =>
                    setProfileForm({ ...profileForm, email: e.target.value })
                  }
                  placeholder="your@email.com"
                />
                {(errors as any).email && (
                  <div className="invalid-feedback-ims">⚠ {(errors as any).email}</div>
                )}
              </div>

              <div style={{ marginBottom: 16 }}>
                <label className="form-label-ims">Role</label>
                <input
                  type="text"
                  className="form-control-ims"
                  value={ROLE_LABEL[user?.role]}
                  disabled
                  style={{ background: "#f8fafc", cursor: "not-allowed" }}
                />
                <div style={{ fontSize: 12, color: "#94a3b8", marginTop: 4 }}>
                  Role cannot be changed
                </div>
              </div>

              <div
                style={{
                  display: "flex",
                  gap: 10,
                  paddingTop: 16,
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
                    "💾 Save Changes"
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
        ) : (
          <div className="card-box">
            <form onSubmit={handlePasswordSubmit}>
              <div style={{ marginBottom: 16 }}>
                <label className="form-label-ims">Current Password *</label>
                <PwdInput
                  value={passwordForm.current}
                  onChange={(e) =>
                    setPasswordForm({ ...passwordForm, current: e.target.value })
                  }
                  error={(errors as any).current}
                  show={show.current}
                  onToggle={() => toggleShow("current")}
                  placeholder="Enter current password"
                />
                {(errors as any).current && (
                  <div className="invalid-feedback-ims">⚠ {(errors as any).current}</div>
                )}
              </div>

              <hr className="divider-ims" />

              <div style={{ marginBottom: 16 }}>
                <label className="form-label-ims">New Password *</label>
                <PwdInput
                  value={passwordForm.newPass}
                  onChange={(e) =>
                    setPasswordForm({ ...passwordForm, newPass: e.target.value })
                  }
                  error={(errors as any).newPass}
                  show={show.newPass}
                  onToggle={() => toggleShow("newPass")}
                  placeholder="Enter new password"
                />
                {(errors as any).newPass && (
                  <div className="invalid-feedback-ims">⚠ {(errors as any).newPass}</div>
                )}

                {/* Strength bar */}
                {passwordForm.newPass && (
                  <div style={{ marginTop: 10 }}>
                    <div style={{ display: "flex", gap: 4, marginBottom: 6 }}>
                      {[1, 2, 3, 4, 5].map((i) => (
                        <div
                          key={i}
                          style={{
                            flex: 1,
                            height: 4,
                            borderRadius: 4,
                            background:
                              i <= strength ? strengthColor : "#e2e8f0",
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
                    const ok = r.test(passwordForm.newPass);
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
                  value={passwordForm.confirm}
                  onChange={(e) =>
                    setPasswordForm({ ...passwordForm, confirm: e.target.value })
                  }
                  error={(errors as any).confirm}
                  show={show.confirm}
                  onToggle={() => toggleShow("confirm")}
                  placeholder="Re-enter new password"
                />
                {(errors as any).confirm && (
                  <div className="invalid-feedback-ims">⚠ {(errors as any).confirm}</div>
                )}
                {passwordForm.confirm &&
                  passwordForm.newPass === passwordForm.confirm && (
                    <div
                      style={{ fontSize: 12, color: "#16a34a", marginTop: 4 }}
                    >
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
                  onClick={() => {
                    setPasswordForm({ current: "", newPass: "", confirm: "" });
                    setErrors({});
                  }}
                >
                  Clear
                </button>
              </div>
            </form>
          </div>
        )}
      </div>
    </div>
  );
};

export default Profile;
