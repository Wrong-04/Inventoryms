import { NavLink, Outlet, useNavigate } from "react-router-dom";
import { getUser, logout, addLog } from "../utils/auth";
import { toast } from "../utils/toast";
import ToastContainer from "./ToastContainer";

const NAV = {
  manager: {
    Overview: [{ icon: "📊", label: "Dashboard", to: "/" }],
    Inventory: [
      { icon: "📦", label: "Item Search", to: "/inventory/search" },
      { icon: "➕", label: "Add Goods", to: "/inventory/add" },
      { icon: "➖", label: "Remove Goods", to: "/inventory/remove" },
      { icon: "💲", label: "Update Price", to: "/inventory/update-price" },
      { icon: "⚠️", label: "Expired Goods", to: "/inventory/expired" },
      { icon: "🔄", label: "Replace Item", to: "/inventory/replace" },
    ],
    Supplier: [
      { icon: "🛒", label: "Place Order", to: "/supplier/place-order" },
      { icon: "🧾", label: "Invoices", to: "/supplier/invoice" },
    ],
    Sales: [
      { icon: "🧾", label: "Receipts", to: "/sales/receipt" },
      { icon: "❌", label: "Cancel Receipt", to: "/sales/cancel-receipt" },
      { icon: "📝", label: "Customer Request", to: "/sales/customer-request" },
    ],
    Reports: [{ icon: "📈", label: "Summary Report", to: "/report" }],
  },
  salesperson: {
    Overview: [{ icon: "📊", label: "Dashboard", to: "/" }],
    Inventory: [
      { icon: "📦", label: "Item Search", to: "/inventory/search" },
      { icon: "🔄", label: "Replace Item", to: "/inventory/replace" },
    ],
    Sales: [
      { icon: "🧾", label: "Receipts", to: "/sales/receipt" },
      { icon: "❌", label: "Cancel Receipt", to: "/sales/cancel-receipt" },
      { icon: "📝", label: "Customer Request", to: "/sales/customer-request" },
    ],
  },
  admin: {
    Overview: [{ icon: "📊", label: "Dashboard", to: "/" }],
    Admin: [
      { icon: "👥", label: "Users", to: "/admin/users" },
      { icon: "📋", label: "System Logs", to: "/admin/logs" },
    ],
    Reports: [{ icon: "📈", label: "Summary Report", to: "/report" }],
  },
};

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

const TOPBAR_ROLE_STYLE = {
  admin: { color: "#6d28d9", bg: "#ede9fe" },
  manager: { color: "#c2410c", bg: "#fff7ed" },
  salesperson: { color: "#1d4ed8", bg: "#eff6ff" },
};

const getInitials = (name = "") =>
  name
    .split(" ")
    .map((w) => w[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();

const NavBar = () => {
  const user = getUser();
  const navigate = useNavigate();
  const groups = NAV[user?.role] || {};
  const rs = ROLE_STYLE[user?.role] || ROLE_STYLE.salesperson;
  const trs = TOPBAR_ROLE_STYLE[user?.role] || TOPBAR_ROLE_STYLE.salesperson;

  const handleLogout = async () => {
    await addLog("Logout", "User logged out");
    logout();
    toast.info("Logged out successfully.");
    navigate("/login");
  };

  return (
    <div className="layout">
      {/* ── Sidebar ── */}
      <aside className="sidebar">
        <div className="sidebar-brand">
          <div className="sidebar-brand-icon">🏪</div>
          <div className="sidebar-brand-text">
            <strong>IMS</strong>
            <span>Inventory System</span>
          </div>
        </div>

        <nav className="sidebar-nav">
          {Object.entries(groups).map(([group, links]) => (
            <div key={group}>
              <div className="sidebar-section-label">{group}</div>
              {(links as any[]).map((l) => (
                <NavLink
                  key={l.to}
                  to={l.to}
                  end={l.to === "/"}
                  className={({ isActive }) => (isActive ? "active" : "")}
                >
                  <span className="nav-icon">{l.icon}</span>
                  <span>{l.label}</span>
                </NavLink>
              ))}
            </div>
          ))}
        </nav>

        {/* User card at bottom */}
        <div className="sidebar-footer">
          <div
            style={{
              margin: "10px 12px 4px",
              background: "rgba(255,255,255,0.05)",
              border: "1px solid rgba(255,255,255,0.08)",
              borderRadius: 10,
              padding: "10px 12px",
              display: "flex",
              alignItems: "center",
              gap: 10,
            }}
          >
            <div
              style={{
                width: 32,
                height: 32,
                borderRadius: "50%",
                background: "linear-gradient(135deg,#3b82f6,#1d4ed8)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontSize: 12,
                fontWeight: 700,
                color: "#fff",
                flexShrink: 0,
              }}
            >
              {getInitials(user?.name)}
            </div>
            <div style={{ minWidth: 0 }}>
              <div
                style={{
                  fontSize: 12.5,
                  fontWeight: 600,
                  color: "#e2e8f0",
                  whiteSpace: "nowrap",
                  overflow: "hidden",
                  textOverflow: "ellipsis",
                }}
              >
                {user?.name}
              </div>
              <div
                style={{
                  fontSize: 11,
                  fontWeight: 600,
                  color: rs.color,
                  marginTop: 2,
                }}
              >
                {ROLE_LABEL[user?.role]}
              </div>
            </div>
          </div>
        </div>
      </aside>

      {/* ── Main ── */}
      <div className="main-wrapper">
        <header className="topbar">
          <span className="topbar-title">Inventory Management System</span>
          <div className="topbar-right">
            <NavLink 
              to="/profile" 
              className="topbar-user" 
              style={{ textDecoration: "none" }}
              title="View My Profile"
            >
              <div className="user-avatar">{getInitials(user?.name)}</div>
              <div>
                <div className="user-info-name" style={{ color: "#1a2332" }}>{user?.name}</div>
                <div
                  className="user-info-role"
                  style={{ background: trs.bg, color: trs.color }}
                >
                  {ROLE_LABEL[user?.role]}
                </div>
              </div>
            </NavLink>
            <div className="topbar-divider" />
            <button className="topbar-logout" onClick={handleLogout}>
              <span>↩</span> Logout
            </button>
          </div>
        </header>

        <main className="page-content">
          <Outlet />
        </main>
      </div>
      <ToastContainer />
    </div>
  );
};

export default NavBar;
