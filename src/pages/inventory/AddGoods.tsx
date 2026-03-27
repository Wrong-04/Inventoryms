import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import { addLog } from "../../utils/auth";
import { toast } from "../../utils/toast";

const CATEGORIES = ["Electronics", "Consumables", "Stationery", "Other"];

interface Supplier {
  id: string;
  name: string;
}
interface FormState {
  name: string;
  category: string;
  quantity: string;
  price: string;
  supplierId: string;
  expiryDate: string;
}
interface ExistingProduct {
  id: string;
  name: string;
  quantity: number;
}
interface CustomerReq {
  id: string;
  productName: string;
  customerName: string;
  status: string;
}

const Field = ({
  label,
  required,
  children,
  error,
  hint,
}: {
  label: string;
  required?: boolean;
  children: React.ReactNode;
  error?: string;
  hint?: string;
}) => (
  <div>
    <label className="form-label-ims">
      {label}
      {required && " *"}
    </label>
    {children}
    {error && <div className="invalid-feedback-ims">⚠ {error}</div>}
    {hint && (
      <div style={{ fontSize: 12, color: "#94a3b8", marginTop: 4 }}>{hint}</div>
    )}
  </div>
);

const AddGoods = () => {
  const navigate = useNavigate();
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [form, setForm] = useState<FormState>({
    name: "",
    category: "Electronics",
    quantity: "",
    price: "",
    supplierId: "",
    expiryDate: "",
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(false);
  const [dupModal, setDupModal] = useState<{
    show: boolean;
    existing: ExistingProduct | null;
  }>({ show: false, existing: null });
  const [dupLoading, setDupLoading] = useState(false);
  const [pendingRequests, setPendingRequests] = useState<CustomerReq[]>([]);
  const [reqSearch, setReqSearch] = useState("");

  useEffect(() => {
    axios
      .get<Supplier[]>("http://localhost:9999/suppliers")
      .then((r) => setSuppliers(r.data));
    axios
      .get<CustomerReq[]>("http://localhost:9999/customer_requests?status=pending")
      .then((r) => setPendingRequests(r.data));
  }, []);

  const validate = () => {
    const e: Record<string, string> = {};
    if (!form.name.trim()) e.name = "Name is required.";
    if (!form.supplierId) e.supplierId = "Supplier is required.";
    if (form.quantity === "" || parseInt(form.quantity) < 0)
      e.quantity = "Quantity must be ≥ 0.";
    if (form.price === "" || parseFloat(form.price) < 0)
      e.price = "Price must be ≥ 0.";
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleAddGoods = async (e) => {
    e.preventDefault();
    if (!validate()) return;
    setLoading(true);
    try {
      const res = await axios.get(
        `http://localhost:9999/products?name=${encodeURIComponent(form.name)}&category=${form.category}`,
      );
      if (res.data[0]) {
        setDupModal({ show: true, existing: res.data[0] });
        return;
      }
      await saveNewProduct();
    } finally {
      setLoading(false);
    }
  };

  const autoFulfillRequests = async (productName: string) => {
    const res = await axios.get<CustomerReq[]>(
      "http://localhost:9999/customer_requests?status=pending",
    );
    const lower = productName.toLowerCase();
    const matches = res.data.filter(
      (r) =>
        r.productName.toLowerCase().includes(lower) ||
        lower.includes(r.productName.toLowerCase()),
    );
    for (const req of matches) {
      await axios.patch(`http://localhost:9999/customer_requests/${req.id}`, {
        status: "fulfilled",
      });
    }
    if (matches.length > 0) {
      toast.info(
        `Auto-fulfilled ${matches.length} customer request(s) for "${productName}".`,
      );
    }
  };

  const saveNewProduct = async () => {
    const allRes = await axios.get<unknown[]>("http://localhost:9999/products");
    const newCode = "P" + String(allRes.data.length + 1).padStart(3, "0");
    await axios.post("http://localhost:9999/products", {
      productCode: newCode,
      name: form.name,
      category: form.category,
      quantity: parseInt(form.quantity),
      price: parseFloat(form.price) || 0,
      supplierId: form.supplierId,
      expiryDate: form.expiryDate || null,
      status: "active",
    });
    if (parseInt(form.quantity) > 0)
      await autoFulfillRequests(form.name);
    await addLog("Add Goods", `Added product ${form.name}`);
    toast.success(`Product "${form.name}" added successfully!`);
    setForm({
      name: "",
      category: "Electronics",
      quantity: "",
      price: "",
      supplierId: "",
      expiryDate: "",
    });
  };

  const handleIncreaseStock = async () => {
    setDupLoading(true);
    try {
      const { existing } = dupModal;
      await axios.patch(`http://localhost:9999/products/${existing.id}`, {
        quantity: existing.quantity + parseInt(form.quantity),
      });
      if (parseInt(form.quantity) > 0)
        await autoFulfillRequests(existing.name);
      await addLog(
        "Add Goods",
        `Increased stock for ${existing.name} by ${form.quantity}`,
      );
      setDupModal({ show: false, existing: null });
      toast.success(`Stock updated for "${existing.name}"!`);
      setForm({
        name: "",
        category: "Electronics",
        quantity: "",
        price: "",
        supplierId: "",
        expiryDate: "",
      });
    } finally {
      setDupLoading(false);
    }
  };

  const bindField = (key) => ({
    value: form[key],
    onChange: (e) => setForm({ ...form, [key]: e.target.value }),
  });

  return (
    <div>
      <div className="page-header">
        <div className="page-header-left">
          <div className="page-header-icon" style={{ background: "#f0fdf4" }}>
            ➕
          </div>
          <div>
            <h4 style={{ margin: 0 }}>Add Goods</h4>
            <div className="page-header-sub">
              Register a new product or increase existing stock
            </div>
          </div>
        </div>
      </div>

      <div style={{ display: "flex", gap: 24, alignItems: "flex-start", flexWrap: "wrap" }}>
        <div style={{ flex: "1 1 500px" }}>
          <div className="card-box">


          <form onSubmit={handleAddGoods}>
            <div className="form-row form-row-2" style={{ marginBottom: 16 }}>
              <Field label="Product Name" required error={errors.name}>
                <input
                  className={`form-control-ims${errors.name ? " is-invalid" : ""}`}
                  placeholder="e.g. Laptop Dell XPS"
                  {...bindField("name")}
                />
              </Field>
              <Field label="Category" required>
                <select className="form-select-ims" {...bindField("category")}>
                  {CATEGORIES.map((c) => (
                    <option key={c}>{c}</option>
                  ))}
                </select>
              </Field>
            </div>

            <div className="form-row form-row-2" style={{ marginBottom: 16 }}>
              <Field label="Initial Quantity" required error={errors.quantity}>
                <input
                  type="number"
                  min="0"
                  className={`form-control-ims${errors.quantity ? " is-invalid" : ""}`}
                  placeholder="0"
                  {...bindField("quantity")}
                />
              </Field>
              <Field label="Supplier" required error={errors.supplierId}>
                <select
                  className={`form-select-ims${errors.supplierId ? " is-invalid" : ""}`}
                  {...bindField("supplierId")}
                >
                  <option value="">-- Select Supplier --</option>
                  {suppliers.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.name}
                    </option>
                  ))}
                </select>
              </Field>
            </div>

            <div className="form-row form-row-2" style={{ marginBottom: 24 }}>
              <Field label="Price (VND)" required error={errors.price}>
                <input
                  type="number"
                  min="0"
                  step="1000"
                  className={`form-control-ims${errors.price ? " is-invalid" : ""}`}
                  placeholder="e.g. 350000"
                  {...bindField("price")}
                />
              </Field>
              <Field
                label="Expiry Date"
              >
                <input
                  type="date"
                  className="form-control-ims"
                  {...bindField("expiryDate")}
                />
              </Field>
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
                {loading ? <span className="btn-spinner" /> : "➕ Add Goods"}
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
      </div>

      {dupModal.show && (
        <div className="modal-overlay">
          <div className="modal-box">
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: 12,
                marginBottom: 16,
              }}
            >
              <div
                style={{
                  width: 40,
                  height: 40,
                  borderRadius: 10,
                  background: "#fef3c7",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontSize: 20,
                }}
              >
                ⚠️
              </div>
              <h5 style={{ margin: 0 }}>Duplicate Product Found</h5>
            </div>
            <div
              style={{
                background: "#f8fafc",
                borderRadius: 8,
                padding: "12px 16px",
                marginBottom: 16,
                fontSize: 13.5,
                color: "#374151",
                lineHeight: 1.7,
              }}
            >
              <strong>{dupModal.existing?.name}</strong> already exists with{" "}
              <strong style={{ color: "#2563eb" }}>
                {dupModal.existing?.quantity}
              </strong>{" "}
              units in stock.
              <br />
              Add <strong style={{ color: "#16a34a" }}>
                {form.quantity}
              </strong>{" "}
              more units?
            </div>
            <div className="modal-footer-ims">
              <button
                className="btn-primary-ims"
                disabled={dupLoading}
                onClick={handleIncreaseStock}
              >
                {dupLoading ? (
                  <span className="btn-spinner" />
                ) : (
                  "✓ Yes, Increase Stock"
                )}
              </button>
              <button
                className="btn-secondary-ims"
                onClick={() => setDupModal({ show: false, existing: null })}
                disabled={dupLoading}
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

        {/* Pending Customer Requests panel */}
        <div style={{ flex: "0 0 320px", width: "100%" }}>
          <div className="card-box" style={{ padding: 0, overflow: "hidden" }}>
            <div className="table-toolbar">
            <div>
              <div className="table-toolbar-title" style={{ color: "#d97706" }}>
                📝 Pending Requests
              </div>
              <div className="table-toolbar-meta">
                {pendingRequests.length} awaiting stock — click to fill name
              </div>
            </div>
          </div>
          {/* Search inside panel */}
          <div style={{ padding: "8px 12px", borderBottom: "1px solid #f1f5f9" }}>
            <input
              className="form-control-ims"
              style={{ fontSize: 12.5 }}
              placeholder="Filter requests..."
              value={reqSearch}
              onChange={(e) => setReqSearch(e.target.value)}
            />
          </div>
          {(() => {
            const filtered = pendingRequests.filter((r) =>
              r.productName.toLowerCase().includes(reqSearch.toLowerCase()) ||
              r.customerName.toLowerCase().includes(reqSearch.toLowerCase())
            );
            return filtered.length === 0 ? (
              <div style={{ padding: "20px 16px", color: "#94a3b8", fontSize: 13, textAlign: "center" }}>
                {pendingRequests.length === 0 ? "✅ No pending requests" : "No matches found"}
              </div>
            ) : (
              <div style={{ padding: "8px 12px", display: "flex", flexDirection: "column", gap: 6, maxHeight: 360, overflowY: "auto" }}>
                {filtered.map((req) => (
                  <button
                    key={req.id}
                    type="button"
                    onClick={() => setForm((f) => ({ ...f, name: req.productName }))}
                    style={{
                      background: "linear-gradient(135deg,#fffbeb,#fef9c3)",
                      border: "1px solid #fcd34d",
                      borderRadius: 8,
                      padding: "9px 12px",
                      textAlign: "left",
                      cursor: "pointer",
                      fontSize: 13,
                      color: "#78350f",
                      fontFamily: "inherit",
                      transition: "opacity 0.15s",
                    }}
                    title={`Click to fill: ${req.productName}`}
                  >
                    <div style={{ fontWeight: 600, marginBottom: 2 }}>{req.productName}</div>
                    <div style={{ fontSize: 11.5, color: "#92400e" }}>👤 {req.customerName}</div>
                  </button>
                ))}
              </div>
            );
          })()}
        </div>
        </div>
      </div>

    </div>
  );
};

export default AddGoods;
