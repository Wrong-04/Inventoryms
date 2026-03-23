import { useState } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import { setUser, addLog } from "../../utils/auth";

const DEMO = [
  {
    role: "Admin",
    email: "admin@ims.com",
    pwd: "Admin@123",
    color: "#a78bfa",
    bg: "rgba(167,139,250,0.12)",
    border: "rgba(167,139,250,0.3)",
  },
  {
    role: "Manager",
    email: "manager@ims.com",
    pwd: "Manager@123",
    color: "#fb923c",
    bg: "rgba(251,146,60,0.12)",
    border: "rgba(251,146,60,0.3)",
  },
  {
    role: "Salesperson",
    email: "sales@ims.com",
    pwd: "Sales@123",
    color: "#60a5fa",
    bg: "rgba(96,165,250,0.12)",
    border: "rgba(96,165,250,0.3)",
  },
];

const Login = () => {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPwd, setShowPwd] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleLogin = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const res = await axios.get(`http://localhost:9999/users?email=${email}`);
      const user = res.data[0];
      if (!user) {
        setError("Invalid email or password.");
        return;
      }

      if (user.status === "locked") {
        const lockedUntil = new Date(user.lockedUntil);
        if (new Date() < lockedUntil) {
          setError(`Account locked until ${lockedUntil.toLocaleTimeString()}.`);
          return;
        }
        await axios.patch(`http://localhost:9999/users/${user.id}`, {
          status: "active",
          loginAttempts: 0,
          lockedUntil: null,
        });
      }

      if (user.status !== "active") {
        setError("Account is not active.");
        return;
      }

      if (user.password !== password) {
        const attempts = (user.loginAttempts || 0) + 1;
        if (attempts >= 6) {
          await axios.patch(`http://localhost:9999/users/${user.id}`, {
            loginAttempts: attempts,
            status: "locked",
            lockedUntil: new Date(Date.now() + 10 * 1000).toISOString(),
          });
          setError("Too many failed attempts. Account locked for 10 seconds.");
        } else {
          await axios.patch(`http://localhost:9999/users/${user.id}`, {
            loginAttempts: attempts,
          });
          setError(
            `Invalid password. ${6 - attempts} attempt${6 - attempts !== 1 ? "s" : ""} left.`,
          );
        }
        return;
      }

      await axios.patch(`http://localhost:9999/users/${user.id}`, {
        loginAttempts: 0,
      });
      setUser({
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
      });
      await addLog("Login", "Logged in successfully");
      navigate("/");
    } catch {
      setError("Server error. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-page">
      <div className="login-card">
        <div className="login-logo">
          <div className="login-logo-icon">🏪</div>
          <h2>Welcome back</h2>
          <p>Sign in to Inventory Management System</p>
        </div>

        {error && (
          <div className="alert-ims alert-danger" style={{ marginBottom: 20 }}>
            ⚠ {error}
          </div>
        )}

        <form onSubmit={handleLogin}>
          <div style={{ marginBottom: 16 }}>
            <label className="form-label-ims">Email</label>
            <input
              type="email"
              className="form-control-ims"
              placeholder="your@email.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              autoComplete="email"
            />
          </div>
          <div style={{ marginBottom: 24 }}>
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                marginBottom: 6,
              }}
            >
              <label className="form-label-ims" style={{ margin: 0 }}>
                Password
              </label>
              <button
                type="button"
                onClick={() => navigate("/forgot-password")}
                style={{
                  background: "none",
                  border: "none",
                  color: "#3b82f6",
                  fontSize: 12,
                  cursor: "pointer",
                  padding: 0,
                  fontWeight: 600,
                }}
              >
                Forgot Password?
              </button>
            </div>
            <div className="password-input-wrap">
              <input
                type={showPwd ? "text" : "password"}
                className="form-control-ims"
                placeholder="Enter your password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                autoComplete="current-password"
              />
              <button
                type="button"
                className="password-toggle-btn"
                onClick={() => setShowPwd(!showPwd)}
                tabIndex={-1}
              >
                {showPwd ? "🙈" : "👁"}
              </button>
            </div>
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
            {loading ? <span className="btn-spinner" /> : "Sign In"}
          </button>
        </form>

        {/* Demo accounts */}
        <div
          style={{
            marginTop: 24,
            borderTop: "1px solid #e8edf3",
            paddingTop: 18,
          }}
        >
          <div
            style={{
              fontSize: 11.5,
              color: "#94a3b8",
              marginBottom: 10,
              textAlign: "center",
              fontWeight: 600,
              textTransform: "uppercase",
              letterSpacing: "0.5px",
            }}
          >
            Demo Accounts
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: 7 }}>
            {DEMO.map((a) => (
              <button
                key={a.role}
                type="button"
                style={{
                  background: a.bg,
                  border: `1px solid ${a.border}`,
                  borderRadius: 9,
                  padding: "8px 14px",
                  fontSize: 13,
                  cursor: "pointer",
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  fontFamily: "inherit",
                  transition: "opacity 0.15s",
                }}
                onClick={() => {
                  setEmail(a.email);
                  setPassword(a.pwd);
                }}
              >
                <span style={{ fontWeight: 700, color: a.color }}>
                  {a.role}
                </span>
                <span style={{ color: "#64748b", fontSize: 12 }}>
                  {a.email}
                </span>
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Login;
