import { useEffect, useState } from "react";
import axios from "axios";
import { getUser, addLog } from "../../utils/auth";
import { toast } from "../../utils/toast";
import Pagination from "../../components/Pagination";

const PAGE_SIZE = 8;

const CustomerRequest = () => {
  const user = getUser();
  const [requests, setRequests] = useState([]);
  const [form, setForm] = useState({
    productName: "",
    customerName: "",
    phone: "",
    note: "",
  });
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);
  const [page, setPage] = useState(1);

  const load = () =>
    axios
      .get("http://localhost:9999/customer_requests")
      .then((r) => setRequests(r.data));
  useEffect(() => {
    load();
  }, []);

  const validate = () => {
    const e = {};
    if (!form.productName.trim()) e.productName = "Product name is required.";
    if (!form.customerName.trim())
      e.customerName = "Customer name is required.";
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validate()) return;
    setLoading(true);
    try {
      await axios.post("http://localhost:9999/customer_requests", {
        ...form,
        status: "pending",
        createdBy: user.id,
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

  const statusClass = (s) =>
    s === "pending"
      ? "badge-status badge-pending"
      : "badge-status badge-completed";

  const totalPages = Math.ceil(requests.length / PAGE_SIZE);
  const paginated = requests.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  return (
    <div>
      <div className="page-header">
        <h4>📝 Customer Request</h4>
      </div>

      <div
        style={{
          display: "grid",
          gridTemplateColumns: "380px 1fr",
          gap: 20,
          alignItems: "start",
        }}
      >
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

        <div className="card-box" style={{ padding: 0, overflow: "hidden" }}>
          <div className="table-toolbar">
            <span className="table-toolbar-title">All Requests</span>
            <span className="table-toolbar-meta">
              {requests.length} request(s)
            </span>
          </div>
          <table className="ims-table">
            <thead>
              <tr>
                <th>#</th>
                <th>Product</th>
                <th>Customer</th>
                <th>Phone</th>
                <th>Note</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {paginated.length === 0 && (
                <tr>
                  <td colSpan={6}>
                    <div className="empty-state">
                      <div className="empty-icon">📝</div>
                      <p>No requests yet</p>
                    </div>
                  </td>
                </tr>
              )}
              {paginated.map((r, idx) => (
                <tr key={r.id}>
                  <td>{(page - 1) * PAGE_SIZE + idx + 1}</td>
                  <td>{r.productName}</td>
                  <td>{r.customerName}</td>
                  <td>{r.phone || "—"}</td>
                  <td style={{ color: "#6b7280", fontSize: 13 }}>
                    {r.note || "—"}
                  </td>
                  <td>
                    <span className={statusClass(r.status)}>{r.status}</span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          <Pagination
            page={page}
            totalPages={totalPages}
            onChange={setPage}
            total={requests.length}
            pageSize={PAGE_SIZE}
          />
        </div>
      </div>
    </div>
  );
};

export default CustomerRequest;
