import { useEffect, useState } from "react";
import axios from "axios";
import Pagination from "../../components/Pagination";

const PAGE_SIZE = 15;

const ACTION_COLORS = {
  Login: "badge-active",
  Logout: "badge-locked",
  "Add Goods": "badge-salesperson",
  "Remove Goods": "badge-cancelled",
  "Update Price": "badge-pending",
  "Place Order": "badge-manager",
  "Generate Invoice": "badge-invoiced",
  "Generate Receipt": "badge-completed",
  "Cancel Receipt": "badge-cancelled",
  "Manage Users": "badge-admin",
  "Reset Password": "badge-warning",
  "Change Password": "badge-pending",
  "Customer Request": "badge-salesperson",
  "Replace Item": "badge-pending",
  "Manage Expired Goods": "badge-expired",
};

const SystemLogs = () => {
  const [logs, setLogs] = useState([]);
  const [users, setUsers] = useState([]);
  const [filterDate, setFilterDate] = useState("");
  const [filterUser, setFilterUser] = useState("");
  const [filterAction, setFilterAction] = useState("");
  const [page, setPage] = useState(1);

  useEffect(() => {
    Promise.all([
      axios.get("http://localhost:9999/system_logs"),
      axios.get("http://localhost:9999/users"),
    ]).then(([l, u]) => {
      setLogs(l.data.reverse());
      setUsers(u.data);
    });
  }, []);

  const actions = [...new Set(logs.map((l) => l.action))];

  const filtered = logs.filter((l) => {
    if (filterDate && !l.timestamp.startsWith(filterDate)) return false;
    if (filterUser && l.userId !== filterUser) return false;
    if (filterAction && l.action !== filterAction) return false;
    return true;
  });

  const totalPages = Math.ceil(filtered.length / PAGE_SIZE);
  const paginated = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  const handleReset = () => {
    setFilterDate("");
    setFilterUser("");
    setFilterAction("");
    setPage(1);
  };

  return (
    <div>
      <div className="page-header">
        <h4>📋 System Logs</h4>
      </div>

      <div className="card-box">
        <div
          style={{
            display: "flex",
            gap: 12,
            flexWrap: "wrap",
            alignItems: "flex-end",
          }}
        >
          <div>
            <label className="form-label-ims">Date</label>
            <input
              type="date"
              className="form-control-ims"
              style={{ width: 180 }}
              value={filterDate}
              onChange={(e) => {
                setFilterDate(e.target.value);
                setPage(1);
              }}
            />
          </div>
          <div>
            <label className="form-label-ims">User</label>
            <select
              className="form-select-ims"
              style={{ width: 200 }}
              value={filterUser}
              onChange={(e) => {
                setFilterUser(e.target.value);
                setPage(1);
              }}
            >
              <option value="">All Users</option>
              {users.map((u) => (
                <option key={u.id} value={u.id}>
                  {u.name}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="form-label-ims">Action</label>
            <select
              className="form-select-ims"
              style={{ width: 200 }}
              value={filterAction}
              onChange={(e) => {
                setFilterAction(e.target.value);
                setPage(1);
              }}
            >
              <option value="">All Actions</option>
              {actions.map((a) => (
                <option key={a}>{a}</option>
              ))}
            </select>
          </div>
          <button className="btn-secondary-ims" onClick={handleReset}>
            Reset
          </button>
        </div>
      </div>

      <div className="card-box" style={{ padding: 0, overflow: "hidden" }}>
        <div className="table-toolbar">
          <span className="table-toolbar-title">Activity Logs</span>
          <span className="table-toolbar-meta">{filtered.length} log(s)</span>
        </div>
        <table className="ims-table">
          <thead>
            <tr>
              <th>#</th>
              <th>User</th>
              <th>Action</th>
              <th>Description</th>
              <th>Date</th>
              <th>Time</th>
            </tr>
          </thead>
          <tbody>
            {paginated.length === 0 && (
              <tr>
                <td colSpan={6}>
                  <div className="empty-state">
                    <div className="empty-icon">📋</div>
                    <p>No logs match the filter</p>
                  </div>
                </td>
              </tr>
            )}
            {paginated.map((l, idx) => (
              <tr key={l.id}>
                <td>{(page - 1) * PAGE_SIZE + idx + 1}</td>
                <td>{l.userName}</td>
                <td>
                  <span
                    className={`badge-status ${ACTION_COLORS[l.action] || "badge-salesperson"}`}
                    style={{ fontSize: 12 }}
                  >
                    {l.action}
                  </span>
                </td>
                <td style={{ color: "#6b7280", fontSize: 13 }}>
                  {l.description}
                </td>
                <td>{new Date(l.timestamp).toLocaleDateString()}</td>
                <td>{new Date(l.timestamp).toLocaleTimeString()}</td>
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
  );
};

export default SystemLogs;
