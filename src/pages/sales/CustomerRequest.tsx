import { useEffect, useState } from "react";
import axios from "axios";
import { getUser, addLog } from "../../utils/auth";
import { toast } from "../../utils/toast";
import Pagination from "../../components/Pagination";

const PAGE_SIZE = 8;

interface Request {
  id: string;
  productName: string;
  customerName: string;
  phone: string;
  note: string;
  status: string;
  createdBy: string;
  createdByName: string;
  createdAt: string;
}

interface FormState {
  productName: string;
  customerName: string;
  phone: string;
  note: string;
}

const CustomerRequest = () => {
  const user = getUser();
  const [requests, setRequests] = useState<Request[]>([]);
  const [form, setForm] = useState<FormState>({
    productName: "",
    customerName: "",
    phone: "",
    note: "",
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(false);
  const [page, setPage] = useState(1);
  const [filterStatus, setFilterStatus] = useState("all");
  const [search, setSearch] = useState("");

  const load = () =>
    axios
      .get<Request[]>("http://localhost:9999/customer_requests")
      .then((r) => setRequests(r.data));
  useEffect(() => {
    load();
  }, []);

  const validate = () => {
    const e: Record<string, string> = {};
    if (!form.productName.trim()) e.productName = "Product name is required.";
    if (!form.customerName.trim())
      e.customerName = "Customer name is required.";
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;
    setLoading(true);
    try {
      await axios.post("http://localhost:9999/customer_requests", {
        ...form,
        status: "pending",
        createdBy: user?.id,
        createdByName: user?.name,
        createdAt: new Date().toISOString(),
      });
      await addLog(
        "Customer Request",
        `Logged request for: ${form.productName}`,
      );
      toast.success(`Request for "${form.productName}" logged successfully.`);
      setForm({ productName: "", customerName: "", phone: "", note: "" });
      load();
    } catch {
      toast.error("Failed to submit request.");
    } finally {
      setLoading(false);
    }
  };

  const handleFulfill = async (req: Request) => {
    try {
      await axios.patch(`http://localhost:9999/customer_requests/${req.id}`, {
        status: "fulfilled",
      });
      await addLog(
        "Customer Request",
        `Marked request for "${req.productName}" as fulfilled`,
      );
      toast.success("Request marked as fulfilled.");
      load();
    } catch {
      toast.error("Failed to update request.");
    }
  };

  const filtered = requests.filter((r) => {
    const q = search.toLowerCase();
    const matchSearch =
      !q ||
      r.productName.toLowerCase().includes(q) ||
      r.customerName.toLowerCase().includes(q);
    const matchStatus = filterStatus === "all" || r.status === filterStatus;
    return matchSearch && matchStatus;
  });
  const totalPages = Math.ceil(filtered.length / PAGE_SIZE);
  const paginated = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  const statusClass = (s: string) =>
    s === "pending"
      ? "badge-status badge-pending"
      : "badge-status badge-completed";

  const canFulfill = user?.role === "manager" || user?.role === "admin";

  return (
    <div>
      <div className="page-header">
        <div className="page-header-left">
          <div className="page-header-icon" style={{ background: "#f0f9ff" }}>
            📝
          </div>
          <div>
            <h4 style={{ margin: 0 }}>Customer Request</h4>
            <div className="page-header-sub">
              Log and track product requests from customers
            </div>
          </div>
        </div>
      </div>

      <div
        style={{
          display: "grid",
          gridTemplateColumns: "380px 1fr",
          gap: 20,
          alignItems: "start",
        }}
      >
        {/* Form */}
        <div className="card-box">
          <div className="section-title">New Request</div>
          <form onSubmit={handleSubmit}>
            <div style={{ marginBottom: 14 }}>
              <label className="form-label-ims">Product Name *</label>
              <input
                className={`form-control-ims${errors.productName ? " is-invalid" : ""}`}
                value={form.productName}
                onChange={(e) =>
                  setForm({ ...form, productName: e.target.value })
                }
                placeholder="Enter product name"
              />
              {errors.productName && (
                <div className="invalid-feedback-ims">{errors.productName}</div>
              )}
            </div>
            <div style={{ marginBottom: 14 }}>
              <label className="form-label-ims">Customer Name *</label>
              <input
                className={`form-control-ims${errors.customerName ? " is-invalid" : ""}`}
                value={form.customerName}
                onChange={(e) =>
                  setForm({ ...form, customerName: e.target.value })
                }
                placeholder="Enter customer name"
              />
              {errors.customerName && (
                <div className="invalid-feedback-ims">
                  {errors.customerName}
                </div>
              )}
            </div>
            <div style={{ marginBottom: 14 }}>
              <label className="form-label-ims">Phone</label>
              <input
                className="form-control-ims"
                value={form.phone}
                onChange={(e) => setForm({ ...form, phone: e.target.value })}
                placeholder="Enter phone number"
              />
            </div>
            <div style={{ marginBottom: 20 }}>
              <label className="form-label-ims">Note</label>
              <textarea
                className="form-control-ims"
                rows={3}
                value={form.note}
                onChange={(e) => setForm({ ...form, note: e.target.value })}
                placeholder="Additional notes..."
              />
            </div>
            <button
              type="submit"
              className="btn-primary-ims"
              disabled={loading}
            >
              {loading ? <span className="btn-spinner" /> : "📝 Submit Request"}
            </button>
          </form>
        </div>

        {/* Table */}
        <div className="card-box" style={{ padding: 0, overflow: "hidden" }}>
          <div className="table-toolbar">
            <span className="table-toolbar-title">All Requests</span>
            <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
              <input
                className="form-control-ims"
                style={{ width: 200, fontSize: 12.5 }}
                placeholder="Search product or customer..."
                value={search}
                onChange={(e) => {
                  setSearch(e.target.value);
                  setPage(1);
                }}
              />
              <span className="table-toolbar-meta">
                {filtered.length} request(s)
              </span>
              <select
                className="form-select-ims"
                style={{ fontSize: 12.5, padding: "4px 10px", width: "auto" }}
                value={filterStatus}
                onChange={(e) => {
                  setFilterStatus(e.target.value);
                  setPage(1);
                }}
              >
                <option value="all">All Status</option>
                <option value="pending">Pending</option>
                <option value="fulfilled">Fulfilled</option>
              </select>
            </div>
          </div>
          <table className="ims-table">
            <thead>
              <tr>
                <th>#</th>
                <th>Product</th>
                <th>Customer</th>
                <th>Phone</th>
                <th>Note</th>
                <th>Logged by</th>
                <th>Status</th>
                {canFulfill && <th>Action</th>}
              </tr>
            </thead>
            <tbody>
              {paginated.length === 0 && (
                <tr>
                  <td colSpan={canFulfill ? 8 : 7}>
                    <div className="empty-state">
                      <div className="empty-icon">📝</div>
                      <p>No requests found</p>
                    </div>
                  </td>
                </tr>
              )}
              {paginated.map((r, idx) => (
                <tr key={r.id}>
                  <td>{(page - 1) * PAGE_SIZE + idx + 1}</td>
                  <td style={{ fontWeight: 500 }}>{r.productName}</td>
                  <td>{r.customerName}</td>
                  <td>{r.phone || "—"}</td>
                  <td style={{ color: "#6b7280", fontSize: 13 }}>
                    {r.note || "—"}
                  </td>
                  <td style={{ fontSize: 12.5, color: "#64748b" }}>
                    {r.createdByName || "—"}
                  </td>
                  <td>
                    <span className={statusClass(r.status)}>{r.status}</span>
                  </td>
                  {canFulfill && (
                    <td>
                      {r.status === "pending" ? (
                        <button
                          className="btn-primary-ims"
                          style={{ padding: "4px 12px", fontSize: 12.5 }}
                          onClick={() => handleFulfill(r)}
                        >
                          ✓ Fulfill
                        </button>
                      ) : (
                        <span className="text-muted-ims">—</span>
                      )}
                    </td>
                  )}
                </tr>
              ))}
            </tbody>
          </table>
          <Pagination
            page={page}
            totalPages={totalPages}
            onChange={setPage}
            total={filtered.length}
            pageSize={PAGE_SIZE}
          />
        </div>
      </div>
    </div>
  );
};

export default CustomerRequest;
