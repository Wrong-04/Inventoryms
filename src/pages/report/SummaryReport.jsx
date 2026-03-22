import { useEffect, useState } from "react";
import axios from "axios";

const SummaryReport = () => {
  const [receipts, setReceipts] = useState([]);
  const [products, setProducts] = useState([]);
  const [customers, setCustomers] = useState([]);
  const [fromDate, setFromDate] = useState("");
  const [toDate, setToDate] = useState("");

  useEffect(() => {
    Promise.all([
      axios.get("http://localhost:9999/receipts"),
      axios.get("http://localhost:9999/products"),
      axios.get("http://localhost:9999/customers"),
    ]).then(([r, p, c]) => {
      setReceipts(r.data);
      setProducts(p.data);
      setCustomers(c.data);
    });
  }, []);

  const filtered = receipts.filter((r) => {
    if (r.status !== "completed") return false;
    const d = new Date(r.createdAt);
    if (fromDate && d < new Date(fromDate)) return false;
    if (toDate && d > new Date(toDate + "T23:59:59")) return false;
    return true;
  });

  const totalRevenue = filtered.reduce((s, r) => s + r.total, 0);
  const totalDiscount = filtered.reduce((s, r) => s + r.discount, 0);
  const totalTax = filtered.reduce((s, r) => s + r.tax, 0);
  const lowStock = products.filter(
    (p) => p.status === "active" && p.quantity <= 10,
  );
  const getCustomerName = (id) =>
    customers.find((c) => c.id === id)?.name || id;

  return (
    <div>
      <div className="page-header" style={{ justifyContent: "space-between" }}>
        <h4>📈 Summary Report</h4>
        <button
          className="btn-secondary-ims"
          onClick={() => window.print()}
          style={{ fontSize: 13 }}
        >
          🖨️ Print Report
        </button>
      </div>

      {/* Date filter */}
      <div className="card-box">
        <div className="section-title">Filter by Date Range</div>
        <div
          style={{
            display: "flex",
            gap: 16,
            alignItems: "flex-end",
            flexWrap: "wrap",
          }}
        >
          <div>
            <label className="form-label-ims">From Date</label>
            <input
              type="date"
              className="form-control-ims"
              style={{ width: 180 }}
              value={fromDate}
              onChange={(e) => setFromDate(e.target.value)}
            />
          </div>
          <div>
            <label className="form-label-ims">To Date</label>
            <input
              type="date"
              className="form-control-ims"
              style={{ width: 180 }}
              value={toDate}
              onChange={(e) => setToDate(e.target.value)}
            />
          </div>
          {(fromDate || toDate) && (
            <button
              className="btn-secondary-ims"
              onClick={() => {
                setFromDate("");
                setToDate("");
              }}
            >
              Clear Filter
            </button>
          )}
        </div>
      </div>

      {/* Stats */}
      <div className="stat-grid-4">
        {[
          {
            label: "Net Revenue",
            value: totalRevenue.toLocaleString(),
            suffix: "VND",
            color: "#16a34a",
            accent: "#22c55e",
            icon: "💰",
            iconBg: "#f0fdf4",
          },
          {
            label: "Total Discount",
            value: totalDiscount.toLocaleString(),
            suffix: "VND",
            color: "#d97706",
            accent: "#f59e0b",
            icon: "🏷️",
            iconBg: "#fffbeb",
          },
          {
            label: "Total Tax",
            value: totalTax.toLocaleString(),
            suffix: "VND",
            color: "#dc2626",
            accent: "#ef4444",
            icon: "📋",
            iconBg: "#fef2f2",
          },
          {
            label: "Transactions",
            value: filtered.length,
            suffix: null,
            color: "#2563eb",
            accent: "#3b82f6",
            icon: "🧾",
            iconBg: "#eff6ff",
          },
        ].map((card) => (
          <div className="stat-card" key={card.label}>
            <div
              className="stat-card-accent"
              style={{ background: card.accent }}
            />
            <div className="stat-card-body">
              <div className="stat-card-content">
                <div
                  className="stat-number"
                  style={{ color: card.color, fontSize: 22 }}
                >
                  {card.value}
                </div>
                {card.suffix && (
                  <div style={{ fontSize: 11, color: "#94a3b8", marginTop: 2 }}>
                    {card.suffix}
                  </div>
                )}
                <div className="stat-label">{card.label}</div>
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

      {/* Transaction history */}
      <div
        className="card-box"
        style={{ padding: 0, overflow: "hidden", marginBottom: 20 }}
      >
        <div className="table-toolbar">
          <span className="table-toolbar-title">Transaction History</span>
          <span className="table-toolbar-meta">
            {filtered.length} completed transaction(s)
          </span>
        </div>
        <table className="ims-table">
          <thead>
            <tr>
              <th>#</th>
              <th>Receipt</th>
              <th>Customer</th>
              <th>Subtotal</th>
              <th>Discount</th>
              <th>Tax</th>
              <th>Total</th>
              <th>Date</th>
            </tr>
          </thead>
          <tbody>
            {filtered.length === 0 && (
              <tr>
                <td colSpan={8}>
                  <div className="empty-state">
                    <div className="empty-icon">📊</div>
                    <p>No transactions found for the selected period</p>
                  </div>
                </td>
              </tr>
            )}
            {filtered.map((r, idx) => (
              <tr key={r.id}>
                <td style={{ color: "#9ca3af" }}>{idx + 1}</td>
                <td style={{ fontWeight: 600, color: "#2563eb" }}>
                  {r.receiptCode}
                </td>
                <td>{getCustomerName(r.customerId)}</td>
                <td>{r.subtotal.toLocaleString()}</td>
                <td className="text-success-ims">
                  −{r.discount.toLocaleString()}
                </td>
                <td className="text-danger-ims">+{r.tax.toLocaleString()}</td>
                <td style={{ fontWeight: 700 }}>{r.total.toLocaleString()}</td>
                <td style={{ color: "#6b7280" }}>
                  {new Date(r.createdAt).toLocaleDateString()}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {filtered.length > 0 && (
          <div
            className="totals-box"
            style={{ borderTop: "1px solid #e2e8f0" }}
          >
            <div>
              Total Discount:{" "}
              <span className="text-success-ims">
                −{totalDiscount.toLocaleString()} VND
              </span>
            </div>
            <div>
              Total Tax:{" "}
              <span className="text-danger-ims">
                +{totalTax.toLocaleString()} VND
              </span>
            </div>
            <div className="total-final">
              Net Revenue: {totalRevenue.toLocaleString()} VND
            </div>
          </div>
        )}
      </div>

      {/* Low stock alert */}
      {lowStock.length > 0 && (
        <div className="card-box" style={{ padding: 0, overflow: "hidden" }}>
          <div className="table-toolbar">
            <span className="table-toolbar-title" style={{ color: "#dc2626" }}>
              ⚠ Low Stock Alert
            </span>
            <span className="badge-status badge-cancelled">
              {lowStock.length} items
            </span>
          </div>
          <table className="ims-table">
            <thead>
              <tr>
                <th>#</th>
                <th>Code</th>
                <th>Name</th>
                <th>Category</th>
                <th>Stock</th>
              </tr>
            </thead>
            <tbody>
              {lowStock.map((p, idx) => (
                <tr key={p.id}>
                  <td style={{ color: "#9ca3af" }}>{idx + 1}</td>
                  <td style={{ fontWeight: 600 }}>{p.productCode}</td>
                  <td>{p.name}</td>
                  <td>{p.category}</td>
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
        </div>
      )}
    </div>
  );
};

export default SummaryReport;
