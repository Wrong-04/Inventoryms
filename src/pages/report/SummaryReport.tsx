import { useEffect, useState } from "react";
import axios from "axios";
import Pagination from "../../components/Pagination";

const PAGE_SIZE = 10;

const StatCard = ({
  label,
  value,
  suffix,
  color,
  accent,
  icon,
  iconBg,
}: any) => (
  <div className="stat-card">
    <div className="stat-card-accent" style={{ background: accent }} />
    <div className="stat-card-body">
      <div className="stat-card-content">
        <div className="stat-number" style={{ color, fontSize: 20 }}>
          {value}
        </div>
        {suffix && (
          <div style={{ fontSize: 11, color: "#94a3b8", marginTop: 2 }}>
            {suffix}
          </div>
        )}
        <div className="stat-label">{label}</div>
      </div>
      <div className="stat-card-icon" style={{ background: iconBg }}>
        {icon}
      </div>
    </div>
  </div>
);

const SummaryReport = () => {
  const [receipts, setReceipts] = useState([]);
  const [invoices, setInvoices] = useState([]);
  const [products, setProducts] = useState([]);
  const [customers, setCustomers] = useState([]);
  const [fromDate, setFromDate] = useState("");
  const [toDate, setToDate] = useState("");
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);

  useEffect(() => {
    Promise.all([
      axios.get<any[]>("http://localhost:9999/receipts"),
      axios.get<any[]>("http://localhost:9999/invoices"),
      axios.get<any[]>("http://localhost:9999/products"),
      axios.get<any[]>("http://localhost:9999/customers"),
    ]).then(([r, inv, p, c]) => {
      setReceipts(r.data);
      setInvoices(inv.data);
      setProducts(p.data);
      setCustomers(c.data);
    });
  }, []);

  const getCustomerName = (id: string) =>
    (customers as any[]).find((c: any) => c.id === id)?.name || id;

  // ── Filtered receipts (sales) ──────────────────────────────────────────
  const filteredReceipts = (receipts as any[]).filter((r: any) => {
    if (r.status !== "completed") return false;
    const d = new Date(r.createdAt);
    if (fromDate && d < new Date(fromDate)) return false;
    if (toDate && d > new Date(toDate + "T23:59:59")) return false;
    if (search) {
      const q = search.toLowerCase();
      const custName = getCustomerName(r.customerId).toLowerCase();
      if (!r.receiptCode.toLowerCase().includes(q) && !custName.includes(q))
        return false;
    }
    return true;
  });

  // ── Filtered invoices (purchases) ──────────────────────────────────────
  const filteredInvoices = (invoices as any[]).filter((inv: any) => {
    const d = new Date(inv.createdAt);
    if (fromDate && d < new Date(fromDate)) return false;
    if (toDate && d > new Date(toDate + "T23:59:59")) return false;
    return true;
  });

  // ── Calculations ───────────────────────────────────────────────────────
  const totalRevenue = filteredReceipts.reduce((s, r: any) => s + r.total, 0);
  const totalDiscount = filteredReceipts.reduce(
    (s, r: any) => s + r.discount,
    0,
  );
  const totalTax = filteredReceipts.reduce((s, r: any) => s + r.tax, 0);
  const totalExpenses = filteredInvoices.reduce(
    (s, inv: any) => s + inv.total,
    0,
  );
  const netIncome = totalRevenue - totalExpenses;

  const totalPages = Math.ceil(filteredReceipts.length / PAGE_SIZE);
  const paginated = filteredReceipts.slice(
    (page - 1) * PAGE_SIZE,
    page * PAGE_SIZE,
  );

  const lowStock = (products as any[]).filter(
    (p: any) => p.status === "active" && p.quantity <= 10,
  );

  const profit = netIncome >= 0;

  return (
    <div>
      {/* ── Header ── */}
      <div className="page-header">
        <div className="page-header-left">
          <div className="page-header-icon" style={{ background: "#f0fdf4" }}>
            📈
          </div>
          <div>
            <h4 style={{ margin: 0 }}>Summary Report</h4>
            <div className="page-header-sub">
              Financial overview & analytics
            </div>
          </div>
        </div>
        <button
          className="btn-secondary-ims"
          onClick={() => window.print()}
          style={{ fontSize: 13 }}
        >
          🖨️ Print Report
        </button>
      </div>

      {/* ── Filter ── */}
      <div className="card-box" style={{ marginBottom: 16 }}>
        <div
          style={{
            display: "flex",
            gap: 12,
            alignItems: "flex-end",
            flexWrap: "wrap",
          }}
        >
          <div style={{ flex: "1 1 220px" }}>
            <label className="form-label-ims">Search Receipt / Customer</label>
            <input
              className="form-control-ims"
              placeholder="Receipt code or customer name..."
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                setPage(1);
              }}
            />
          </div>
          <div>
            <label className="form-label-ims">From Date</label>
            <input
              type="date"
              className="form-control-ims"
              style={{ width: 170 }}
              value={fromDate}
              onChange={(e) => {
                setFromDate(e.target.value);
                setPage(1);
              }}
            />
          </div>
          <div>
            <label className="form-label-ims">To Date</label>
            <input
              type="date"
              className="form-control-ims"
              style={{ width: 170 }}
              value={toDate}
              onChange={(e) => {
                setToDate(e.target.value);
                setPage(1);
              }}
            />
          </div>
          {(fromDate || toDate || search) && (
            <button
              className="btn-secondary-ims"
              onClick={() => {
                setFromDate("");
                setToDate("");
                setSearch("");
                setPage(1);
              }}
            >
              ✕ Clear
            </button>
          )}
        </div>
      </div>

      {/* ── Net Income Hero ── */}
      <div
        className="card-box"
        style={{
          marginBottom: 16,
          background: profit
            ? "linear-gradient(135deg,#f0fdf4,#dcfce7)"
            : "linear-gradient(135deg,#fef2f2,#fee2e2)",
          border: `1.5px solid ${profit ? "#86efac" : "#fca5a5"}`,
        }}
      >
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            flexWrap: "wrap",
            gap: 16,
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
            <div
              style={{
                width: 52,
                height: 52,
                borderRadius: 14,
                background: profit ? "#dcfce7" : "#fee2e2",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontSize: 26,
              }}
            >
              {profit ? "📈" : "📉"}
            </div>
            <div>
              <div
                style={{
                  fontSize: 12,
                  fontWeight: 700,
                  color: "#94a3b8",
                  textTransform: "uppercase",
                  letterSpacing: "0.5px",
                }}
              >
                Net Income
              </div>
              <div
                style={{
                  fontSize: 30,
                  fontWeight: 800,
                  color: profit ? "#15803d" : "#dc2626",
                  lineHeight: 1.2,
                }}
              >
                {profit ? "+" : ""}
                {netIncome.toLocaleString()} VND
              </div>
            </div>
          </div>
          <div style={{ display: "flex", gap: 24, flexWrap: "wrap" }}>
            <div style={{ textAlign: "center" }}>
              <div
                style={{
                  fontSize: 11,
                  color: "#94a3b8",
                  fontWeight: 600,
                  textTransform: "uppercase",
                }}
              >
                Revenue
              </div>
              <div style={{ fontSize: 16, fontWeight: 700, color: "#16a34a" }}>
                +{totalRevenue.toLocaleString()}
              </div>
              <div style={{ fontSize: 10, color: "#94a3b8" }}>VND</div>
            </div>
            <div
              style={{
                display: "flex",
                alignItems: "center",
                color: "#cbd5e1",
                fontSize: 18,
              }}
            >
              −
            </div>
            <div style={{ textAlign: "center" }}>
              <div
                style={{
                  fontSize: 11,
                  color: "#94a3b8",
                  fontWeight: 600,
                  textTransform: "uppercase",
                }}
              >
                Expenses
              </div>
              <div style={{ fontSize: 16, fontWeight: 700, color: "#dc2626" }}>
                {totalExpenses.toLocaleString()}
              </div>
              <div style={{ fontSize: 10, color: "#94a3b8" }}>VND</div>
            </div>
            <div
              style={{
                display: "flex",
                alignItems: "center",
                color: "#cbd5e1",
                fontSize: 18,
              }}
            >
              =
            </div>
            <div style={{ textAlign: "center" }}>
              <div
                style={{
                  fontSize: 11,
                  color: "#94a3b8",
                  fontWeight: 600,
                  textTransform: "uppercase",
                }}
              >
                Net Income
              </div>
              <div
                style={{
                  fontSize: 16,
                  fontWeight: 700,
                  color: profit ? "#16a34a" : "#dc2626",
                }}
              >
                {profit ? "+" : ""}
                {netIncome.toLocaleString()}
              </div>
              <div style={{ fontSize: 10, color: "#94a3b8" }}>VND</div>
            </div>
          </div>
        </div>
      </div>

      {/* ── Stat Cards: Row 1 — Financial ── */}
      <div className="stat-grid-4" style={{ marginBottom: 0 }}>
        <StatCard
          label="Total Revenue"
          value={totalRevenue.toLocaleString()}
          suffix="VND"
          color="#16a34a"
          accent="#22c55e"
          icon="�"
          iconBg="#f0fdf4"
        />
        <StatCard
          label="Total Expenses"
          value={totalExpenses.toLocaleString()}
          suffix="VND"
          color="#dc2626"
          accent="#ef4444"
          icon="🛒"
          iconBg="#fef2f2"
        />
        <StatCard
          label="Total Discount"
          value={totalDiscount.toLocaleString()}
          suffix="VND"
          color="#d97706"
          accent="#f59e0b"
          icon="🏷️"
          iconBg="#fffbeb"
        />
        <StatCard
          label="Total Tax"
          value={totalTax.toLocaleString()}
          suffix="VND"
          color="#7c3aed"
          accent="#8b5cf6"
          icon="📋"
          iconBg="#f5f3ff"
        />
      </div>

      {/* ── Stat Cards: Row 2 — Counts ── */}
      <div className="stat-grid-4" style={{ marginBottom: 16 }}>
        <StatCard
          label="Sales Transactions"
          value={filteredReceipts.length}
          suffix={null}
          color="#2563eb"
          accent="#3b82f6"
          icon="🧾"
          iconBg="#eff6ff"
        />
        <StatCard
          label="Purchase Invoices"
          value={filteredInvoices.length}
          suffix={null}
          color="#0891b2"
          accent="#06b6d4"
          icon="📦"
          iconBg="#ecfeff"
        />
        <StatCard
          label="Low Stock Items"
          value={lowStock.length}
          suffix={null}
          color={lowStock.length > 0 ? "#dc2626" : "#16a34a"}
          accent={lowStock.length > 0 ? "#ef4444" : "#22c55e"}
          icon="⚠️"
          iconBg={lowStock.length > 0 ? "#fef2f2" : "#f0fdf4"}
        />
        <StatCard
          label="Avg. Sale Value"
          value={
            filteredReceipts.length > 0
              ? Math.round(
                  totalRevenue / filteredReceipts.length,
                ).toLocaleString()
              : "0"
          }
          suffix="VND"
          color="#0f766e"
          accent="#14b8a6"
          icon="📊"
          iconBg="#f0fdfa"
        />
      </div>

      {/* ── Two-column: Sales History + Purchase Invoices ── */}
      <div
        style={{
          display: "flex",
          gap: 16,
          alignItems: "flex-start",
          flexWrap: "wrap",
          marginBottom: 16,
        }}
      >
        {/* Sales Receipts */}
        <div style={{ flex: "3 1 480px" }}>
          <div className="card-box" style={{ padding: 0, overflow: "hidden" }}>
            <div className="table-toolbar">
              <span className="table-toolbar-title">💰 Sales Receipts</span>
              <span className="table-toolbar-meta">
                {filteredReceipts.length} completed
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
                {filteredReceipts.length === 0 && (
                  <tr>
                    <td colSpan={8}>
                      <div className="empty-state">
                        <div className="empty-icon">📊</div>
                        <p>No transactions found</p>
                      </div>
                    </td>
                  </tr>
                )}
                {paginated.map((r: any, idx: number) => (
                  <tr key={r.id}>
                    <td style={{ color: "#9ca3af" }}>
                      {(page - 1) * PAGE_SIZE + idx + 1}
                    </td>
                    <td style={{ fontWeight: 600, color: "#2563eb" }}>
                      {r.receiptCode}
                    </td>
                    <td>{getCustomerName(r.customerId)}</td>
                    <td>{r.subtotal.toLocaleString()}</td>
                    <td className="text-success-ims">
                      −{r.discount.toLocaleString()}
                    </td>
                    <td className="text-danger-ims">
                      +{r.tax.toLocaleString()}
                    </td>
                    <td style={{ fontWeight: 700 }}>
                      {r.total.toLocaleString()}
                    </td>
                    <td style={{ color: "#6b7280" }}>
                      {new Date(r.createdAt).toLocaleDateString()}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            {filteredReceipts.length > 0 && (
              <div
                className="totals-box"
                style={{ borderTop: "1px solid #e2e8f0" }}
              >
                <div>
                  Discount:{" "}
                  <span className="text-success-ims">
                    −{totalDiscount.toLocaleString()} VND
                  </span>
                </div>
                <div>
                  Tax:{" "}
                  <span className="text-danger-ims">
                    +{totalTax.toLocaleString()} VND
                  </span>
                </div>
                <div className="total-final">
                  Revenue: {totalRevenue.toLocaleString()} VND
                </div>
              </div>
            )}
            <Pagination
              page={page}
              totalPages={totalPages}
              onChange={setPage}
              total={filteredReceipts.length}
              pageSize={PAGE_SIZE}
            />
          </div>
        </div>

        {/* Purchase Invoices */}
        <div style={{ flex: "1 1 260px" }}>
          <div className="card-box" style={{ padding: 0, overflow: "hidden" }}>
            <div className="table-toolbar">
              <span className="table-toolbar-title">🛒 Purchase Invoices</span>
              <span className="table-toolbar-meta">
                {filteredInvoices.length} invoice(s)
              </span>
            </div>
            {filteredInvoices.length === 0 ? (
              <div className="empty-state" style={{ padding: "24px 16px" }}>
                <div className="empty-icon">�</div>
                <p>No invoices in this period</p>
              </div>
            ) : (
              <>
                <table className="ims-table">
                  <thead>
                    <tr>
                      <th>Invoice</th>
                      <th>Total (VND)</th>
                      <th>Date</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredInvoices.map((inv: any) => (
                      <tr key={inv.id}>
                        <td style={{ fontWeight: 600, color: "#dc2626" }}>
                          {inv.invoiceCode}
                        </td>
                        <td style={{ fontWeight: 700 }}>
                          {inv.total.toLocaleString()}
                        </td>
                        <td style={{ color: "#6b7280" }}>
                          {new Date(inv.createdAt).toLocaleDateString()}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                <div
                  className="totals-box"
                  style={{ borderTop: "1px solid #e2e8f0" }}
                >
                  <div className="total-final" style={{ color: "#dc2626" }}>
                    Expenses: {totalExpenses.toLocaleString()} VND
                  </div>
                </div>
              </>
            )}
          </div>

          {/* Low Stock */}
          {lowStock.length > 0 && (
            <div
              className="card-box"
              style={{ padding: 0, overflow: "hidden", marginTop: 16 }}
            >
              <div className="table-toolbar">
                <span
                  className="table-toolbar-title"
                  style={{ color: "#dc2626" }}
                >
                  ⚠ Low Stock
                </span>
                <span className="badge-status badge-cancelled">
                  {lowStock.length} items
                </span>
              </div>
              <table className="ims-table">
                <thead>
                  <tr>
                    <th>Name</th>
                    <th>Stock</th>
                  </tr>
                </thead>
                <tbody>
                  {lowStock.map((p: any) => (
                    <tr key={p.id}>
                      <td style={{ fontSize: 12.5 }}>{p.name}</td>
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
      </div>
    </div>
  );
};

export default SummaryReport;
