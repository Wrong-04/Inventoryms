import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import { getUser } from "../utils/auth";

const Dashboard = () => {
  const user = getUser();
  const navigate = useNavigate();
  const [stats, setStats] = useState({
    products: 0,
    lowStock: 0,
    pendingOrders: 0,
    todayReceipts: 0,
  });
  const [recentReceipts, setRecentReceipts] = useState([]);
  const [customers, setCustomers] = useState([]);
  const [lowStockItems, setLowStockItems] = useState([]);

  useEffect(() => {
    Promise.all([
      axios.get("http://localhost:9999/products"),
      axios.get("http://localhost:9999/orders"),
      axios.get("http://localhost:9999/receipts"),
      axios.get("http://localhost:9999/customers"),
    ]).then(([p, o, r, c]) => {
      const today = new Date().toDateString();
      const low = p.data.filter(
        (x) => x.status === "active" && x.quantity <= 10,
      );
      setStats({
        products: p.data.filter((x) => x.status === "active").length,
        lowStock: low.length,
        pendingOrders: o.data.filter((x) => x.status === "pending").length,
        todayReceipts: r.data.filter(
          (x) => new Date(x.createdAt).toDateString() === today,
        ).length,
      });
      setRecentReceipts(r.data.slice(-6).reverse());
      setCustomers(c.data);
      setLowStockItems(low.slice(0, 6));
    });
  }, []);

  const getCustomerName = (id) =>
    customers.find((c) => c.id === id)?.name || "—";

  const statusClass = (s) => {
    if (s === "completed") return "badge-status badge-completed";
    if (s === "cancelled") return "badge-status badge-cancelled";
    return "badge-status badge-pending";
  };

  const greeting = () => {
    const h = new Date().getHours();
    if (h < 12) return "Good morning";
    if (h < 18) return "Good afternoon";
    return "Good evening";
  };

  const CARDS = [
    {
      accent: "#3b82f6",
      icon: "📦",
      iconBg: "#eff6ff",
      number: stats.products,
      label: "Active Products",
      hint: "View all →",
      onClick: () => navigate("/inventory/search"),
    },
    {
      accent: stats.lowStock > 0 ? "#f59e0b" : "#22c55e",
      icon: stats.lowStock > 0 ? "⚠️" : "✅",
      iconBg: stats.lowStock > 0 ? "#fffbeb" : "#f0fdf4",
      number: stats.lowStock,
      label: "Low Stock Items",
      numberColor: stats.lowStock > 0 ? "#d97706" : "#16a34a",
    },
    {
      accent: "#8b5cf6",
      icon: "🛒",
      iconBg: "#f5f3ff",
      number: stats.pendingOrders,
      label: "Pending Orders",
      numberColor: "#7c3aed",
      hint: user?.role === "manager" ? "Manage →" : null,
      onClick:
        user?.role === "manager"
          ? () => navigate("/supplier/place-order")
          : null,
    },
    {
      accent: "#06b6d4",
      icon: "🧾",
      iconBg: "#ecfeff",
      number: stats.todayReceipts,
      label: "Today's Receipts",
      numberColor: "#0891b2",
    },
  ];

  return (
    <div>
      {/* Welcome banner */}
      <div className="welcome-banner">
        <div>
          <div
            style={{
              fontSize: 22,
              fontWeight: 800,
              marginBottom: 6,
              letterSpacing: "-0.5px",
            }}
          >
            {greeting()}, {user?.name} 👋
          </div>
          <div style={{ fontSize: 13.5, opacity: 0.7, lineHeight: 1.5 }}>
            Here's your inventory overview for today.
          </div>
        </div>
        <div className="welcome-banner-date">
          📅{" "}
          {new Date().toLocaleDateString("en-GB", {
            weekday: "long",
            year: "numeric",
            month: "long",
            day: "numeric",
          })}
        </div>
      </div>

      {/* Stat cards */}
      <div className="stat-grid-4">
        {CARDS.map((card, i) => (
          <div
            key={i}
            className="stat-card"
            style={{ cursor: card.onClick ? "pointer" : "default" }}
            onClick={card.onClick || undefined}
          >
            <div
              className="stat-card-accent"
              style={{ background: card.accent }}
            />
            <div className="stat-card-body">
              <div className="stat-card-content">
                <div
                  className="stat-number"
                  style={{ color: card.numberColor || card.accent }}
                >
                  {card.number}
                </div>
                <div className="stat-label">{card.label}</div>
                {card.hint && (
                  <div
                    className="stat-card-hint"
                    style={{ color: card.accent }}
                  >
                    {card.hint}
                  </div>
                )}
              </div>
              <div
                className="stat-card-icon"
                style={{ background: card.iconBg }}
              >
                {card.icon}
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Bottom grid */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "1fr 290px",
          gap: 20,
          alignItems: "start",
        }}
      >
        {/* Recent Receipts */}
        <div className="card-box" style={{ padding: 0, overflow: "hidden" }}>
          <div className="table-toolbar">
            <div>
              <div className="table-toolbar-title">Recent Receipts</div>
              <div className="table-toolbar-meta">Last 6 transactions</div>
            </div>
            {user?.role === "salesperson" && (
              <button
                className="btn-primary-ims"
                style={{ fontSize: 12.5, padding: "6px 14px" }}
                onClick={() => navigate("/sales/receipt")}
              >
                + New Receipt
              </button>
            )}
          </div>
          <table className="ims-table">
            <thead>
              <tr>
                <th>Receipt</th>
                <th>Date</th>
                <th>Customer</th>
                <th>Total (VND)</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {recentReceipts.length === 0 && (
                <tr>
                  <td colSpan={5}>
                    <div
                      className="empty-state"
                      style={{ padding: "32px 24px" }}
                    >
                      <div className="empty-icon">🧾</div>
                      <p>No receipts yet</p>
                    </div>
                  </td>
                </tr>
              )}
              {recentReceipts.map((r) => (
                <tr key={r.id}>
                  <td style={{ fontWeight: 600, color: "#2563eb" }}>
                    {r.receiptCode}
                  </td>
                  <td style={{ color: "#64748b" }}>
                    {new Date(r.createdAt).toLocaleDateString()}
                  </td>
                  <td>{getCustomerName(r.customerId)}</td>
                  <td style={{ fontWeight: 600 }}>
                    {r.total.toLocaleString()}
                  </td>
                  <td>
                    <span className={statusClass(r.status)}>{r.status}</span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Low stock panel */}
        <div className="card-box" style={{ padding: 0, overflow: "hidden" }}>
          <div className="table-toolbar">
            <div>
              <div
                className="table-toolbar-title"
                style={{ color: stats.lowStock > 0 ? "#d97706" : "#1a2332" }}
              >
                {stats.lowStock > 0 ? "⚠️ Low Stock" : "✅ Stock OK"}
              </div>
              <div className="table-toolbar-meta">
                {stats.lowStock > 0
                  ? `${stats.lowStock} items need attention`
                  : "All items stocked"}
              </div>
            </div>
          </div>
          {lowStockItems.length === 0 ? (
            <div
              style={{
                padding: "20px",
                color: "#16a34a",
                fontSize: 13.5,
                display: "flex",
                alignItems: "center",
                gap: 8,
              }}
            >
              ✅ All items are well stocked.
            </div>
          ) : (
            <table className="ims-table">
              <thead>
                <tr>
                  <th>Product</th>
                  <th>Qty</th>
                </tr>
              </thead>
              <tbody>
                {lowStockItems.map((p) => (
                  <tr key={p.id}>
                    <td style={{ fontSize: 13 }}>{p.name}</td>
                    <td>
                      <span
                        className={`badge-status ${p.quantity === 0 ? "badge-outofstock" : "badge-lowstock"}`}
                      >
                        {p.quantity}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
