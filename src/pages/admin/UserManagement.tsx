import { useEffect, useState } from "react";
import axios from "axios";
import { addLog } from "../../utils/auth";
import { toast } from "../../utils/toast";
import ConfirmModal from "../../components/ConfirmModal";
import Pagination from "../../components/Pagination";

const ROLES = ["admin", "manager", "salesperson"];
const PAGE_SIZE = 8;

interface User {
  id: string;
  name: string;
  email: string;
  role: string;
  status: string;
  password?: string;
  loginAttempts?: number;
  lockedUntil?: string | null;
}
interface FormState {
  name: string;
  email: string;
  role: string;
  status: string;
}

const UserManagement = () => {
  const [users, setUsers] = useState<User[]>([]);
  const [search, setSearch] = useState("");
  const [roleFilter, setRoleFilter] = useState("");
  const [page, setPage] = useState(1);
  const [modal, setModal] = useState<{ show: boolean; user: User | null }>({
    show: false,
    user: null,
  });
  const [form, setForm] = useState<FormState>({
    name: "",
    email: "",
    role: "salesperson",
    status: "active",
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState(false);
  const [confirm, setConfirm] = useState<any>({ show: false });
  const [confirmLoading, setConfirmLoading] = useState(false);

  const load = () =>
    axios
      .get<User[]>("http://localhost:9999/users")
      .then((r) => setUsers(r.data));
  useEffect(() => {
    load();
  }, []);

  const filtered = users.filter((u) => {
    const q = search.toLowerCase();
    return (
      (!q ||
        u.name.toLowerCase().includes(q) ||
        u.email.toLowerCase().includes(q)) &&
      (!roleFilter || u.role === roleFilter)
    );
  });

  const totalPages = Math.ceil(filtered.length / PAGE_SIZE);
  const paginated = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  const openAdd = () => {
    setForm({ name: "", email: "", role: "salesperson", status: "active" });
    setErrors({});
    setModal({ show: true, user: null });
  };
  const openEdit = (u: User) => {
    setForm({ name: u.name, email: u.email, role: u.role, status: u.status });
    setErrors({});
    setModal({ show: true, user: u });
  };

  const validate = async () => {
    const e: Record<string, string> = {};
    if (!form.name.trim()) e.name = "Name is required.";
    if (!form.email.trim()) e.email = "Email is required.";
    else {
      const res = await axios.get<User[]>(
        `http://localhost:9999/users?email=${form.email}`,
      );
      const dup = res.data.find((u) => !modal.user || u.id !== modal.user.id);
      if (dup) e.email = "Email already exists.";
    }
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleSave = async () => {
    if (!(await validate())) return;
    setSaving(true);
    try {
      if (modal.user) {
        await axios.patch(`http://localhost:9999/users/${modal.user.id}`, form);
        await addLog("Manage Users", `Updated user ${form.email}`);
        toast.success("User updated successfully.");
      } else {
        await axios.post("http://localhost:9999/users", {
          ...form,
          password: "Default@123",
          loginAttempts: 0,
          lockedUntil: null,
        });
        await addLog("Manage Users", `Created user ${form.email}`);
        toast.success("User created. Default password: Default@123");
      }
      setModal({ show: false, user: null });
      load();
    } catch {
      toast.error("Failed to save user.");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = (u: User) => {
    setConfirm({
      show: true,
      title: "Delete User",
      message: `Are you sure you want to delete "${u.name}"? This action cannot be undone.`,
      onConfirm: async () => {
        setConfirmLoading(true);
        try {
          await axios.delete(`http://localhost:9999/users/${u.id}`);
          await addLog("Manage Users", `Deleted user ${u.email}`);
          toast.success(`User "${u.name}" deleted.`);
          load();
        } catch {
          toast.error("Failed to delete user.");
        } finally {
          setConfirmLoading(false);
          setConfirm({ show: false });
        }
      },
    });
  };

  const handleResetPassword = (u: User) => {
    setConfirm({
      show: true,
      title: "Reset Password",
      message: `Reset password for "${u.name}" to Default@123?`,
      variant: "warning",
      onConfirm: async () => {
        setConfirmLoading(true);
        try {
          await axios.patch(`http://localhost:9999/users/${u.id}`, {
            password: "Default@123",
            loginAttempts: 0,
            status: "active",
            lockedUntil: null,
          });
          await addLog("Reset Password", `Reset password for ${u.email}`);
          toast.success(
            `Password reset for "${u.name}". New password: Default@123`,
          );
          load();
        } catch {
          toast.error("Failed to reset password.");
        } finally {
          setConfirmLoading(false);
          setConfirm({ show: false });
        }
      },
    });
  };

  const roleBadge = (r: string) => {
    if (r === "admin") return "badge-role badge-admin";
    if (r === "manager") return "badge-role badge-manager";
    return "badge-role badge-salesperson";
  };

  return (
    <div>
      <div className="page-header">
        <div className="page-header-left">
          <div className="page-header-icon" style={{ background: "#f0f9ff" }}>
            👥
          </div>
          <div>
            <h4 style={{ margin: 0 }}>User Account Management</h4>
            <div className="page-header-sub">Manage system users and roles</div>
          </div>
        </div>
      </div>

      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          marginBottom: 16,
          gap: 12,
          flexWrap: "wrap",
        }}
      >
        <div style={{ display: "flex", gap: 10, flex: 1 }}>
          <input
            className="form-control-ims"
            style={{ maxWidth: 280 }}
            placeholder="Search by name or email..."
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setPage(1);
            }}
          />
          <select
            className="form-select-ims"
            style={{ maxWidth: 180 }}
            value={roleFilter}
            onChange={(e) => {
              setRoleFilter(e.target.value);
              setPage(1);
            }}
          >
            <option value="">All Roles</option>
            {ROLES.map((r) => (
              <option key={r} value={r}>
                {r}
              </option>
            ))}
          </select>
        </div>
        <button className="btn-primary-ims" onClick={openAdd}>
          + Add New User
        </button>
      </div>

      <div className="card-box" style={{ padding: 0, overflow: "hidden" }}>
        <div className="table-toolbar">
          <span className="table-toolbar-title">User Accounts</span>
          <span className="table-toolbar-meta">{filtered.length} user(s)</span>
        </div>
        <table className="ims-table">
          <thead>
            <tr>
              <th>#</th>
              <th>Name</th>
              <th>Email</th>
              <th>Role</th>
              <th>Status</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {paginated.length === 0 && (
              <tr>
                <td colSpan={6}>
                  <div className="empty-state">
                    <div className="empty-icon">👥</div>
                    <p>No users found</p>
                  </div>
                </td>
              </tr>
            )}
            {paginated.map((u, idx) => (
              <tr key={u.id}>
                <td>{(page - 1) * PAGE_SIZE + idx + 1}</td>
                <td>{u.name}</td>
                <td>{u.email}</td>
                <td>
                  <span className={roleBadge(u.role)}>{u.role}</span>
                </td>
                <td>
                  <span
                    className={`badge-status ${u.status === "active" ? "badge-active" : "badge-locked"}`}
                  >
                    {u.status}
                  </span>
                </td>
                <td>
                  <div style={{ display: "flex", gap: 6 }}>
                    <button
                      className="btn-warning-ims"
                      onClick={() => openEdit(u)}
                    >
                      Edit
                    </button>
                    <button
                      className="btn-info-ims"
                      onClick={() => handleResetPassword(u)}
                    >
                      Reset Pwd
                    </button>
                    <button
                      className="btn-danger-ims"
                      onClick={() => handleDelete(u)}
                    >
                      Delete
                    </button>
                  </div>
                </td>
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

      {/* Add/Edit Modal */}
      {modal.show && (
        <div className="modal-overlay">
          <div className="modal-box">
            <h5>{modal.user ? "Edit User" : "Add New User"}</h5>
            <div style={{ marginBottom: 14 }}>
              <label className="form-label-ims">Name *</label>
              <input
                className={`form-control-ims${errors.name ? " is-invalid" : ""}`}
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
              />
              {errors.name && (
                <div className="invalid-feedback-ims">{errors.name}</div>
              )}
            </div>
            <div style={{ marginBottom: 14 }}>
              <label className="form-label-ims">Email *</label>
              <input
                type="email"
                className={`form-control-ims${errors.email ? " is-invalid" : ""}`}
                value={form.email}
                onChange={(e) => setForm({ ...form, email: e.target.value })}
              />
              {errors.email && (
                <div className="invalid-feedback-ims">{errors.email}</div>
              )}
            </div>
            <div className="form-row form-row-2" style={{ marginBottom: 0 }}>
              <div>
                <label className="form-label-ims">Role *</label>
                <select
                  className="form-select-ims"
                  value={form.role}
                  onChange={(e) => setForm({ ...form, role: e.target.value })}
                >
                  {ROLES.map((r) => (
                    <option key={r}>{r}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="form-label-ims">Status</label>
                <select
                  className="form-select-ims"
                  value={form.status}
                  onChange={(e) => setForm({ ...form, status: e.target.value })}
                >
                  <option value="active">Active</option>
                  <option value="locked">Locked</option>
                </select>
              </div>
            </div>
            <div className="modal-footer-ims">
              <button
                className="btn-primary-ims"
                disabled={saving}
                onClick={handleSave}
              >
                {saving ? <span className="btn-spinner" /> : "Save"}
              </button>
              <button
                className="btn-secondary-ims"
                onClick={() => setModal({ show: false, user: null })}
                disabled={saving}
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      <ConfirmModal
        {...confirm}
        loading={confirmLoading}
        onClose={() => setConfirm({ show: false })}
      />
    </div>
  );
};

export default UserManagement;
