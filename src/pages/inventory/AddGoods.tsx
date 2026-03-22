import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import { addLog } from "../../utils/auth";
import { toast } from "../../utils/toast";

const CATEGORIES = ["Electronics", "Consumables", "Stationery", "Other"];

const Field = ({ label, required, children, error, hint }) => (
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
  const [suppliers, setSuppliers] = useState([]);
  const [form, setForm] = useState({
    name: "",
    category: "Electronics",
    quantity: "",
    supplierId: "",
    expiryDate: "",
  });
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);
  const [dupModal, setDupModal] = useState({ show: false, existing: null });
  const [dupLoading, setDupLoading] = useState(false);

  useEffect(() => {
    axios
      .get("http://localhost:9999/suppliers")
      .then((r) => setSuppliers(r.data));
  }, []);

  const validate = () => {
    const e = {};
    if (!form.name.trim()) e.name = "Name is required.";
    if (!form.supplierId) e.supplierId = "Supplier is required.";
    if (!form.quantity || parseInt(form.quantity) <= 0)
      e.quantity = "Quantity must be > 0.";
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleSubmit = async (e) => {
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
      await saveNew();
    } finally {
      setLoading(false);
    }
  };

  const saveNew = async () => {
    const allRes = await axios.get("http://localhost:9999/products");
    const newCode = "P" + String(allRes.data.length + 1).padStart(3, "0");
    await axios.post("http://localhost:9999/products", {
      productCode: newCode,
      name: form.name,
      category: form.category,
      quantity: parseInt(form.quantity),
      price: 0,
      supplierId: form.supplierId,
      expiryDate: form.expiryDate || null,
      status: "active",
    });
    await addLog("Add Goods", `Added product ${form.name}`);
    toast.success(`Product "${form.name}" added successfully!`);
    setForm({
      name: "",
      category: "Electronics",
      quantity: "",
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
        supplierId: "",
        expiryDate: "",
      });
    } finally {
      setDupLoading(false);
    }
  };

  const f = (key) => ({
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

      <div style={{ maxWidth: 600 }}>
        <div className="card-box">
          {/* Auto ID banner */}
          <div
            style={{
              background: "#f8fafc",
              border: "1px dashed #cbd5e1",
              borderRadius: 8,
              padding: "10px 14px",
              marginBottom: 20,
              display: "flex",
              alignItems: "center",
              gap: 10,
            }}
          >
            <span style={{ fontSize: 18 }}>🏷️</span>
            <div>
              <div
                style={{
                  fontSize: 11,
                  fontWeight: 700,
                  color: "#94a3b8",
                  textTransform: "uppercase",
                  letterSpacing: "0.4px",
                }}
              >
                Product ID
              </div>
              <div style={{ fontSize: 13, color: "#64748b" }}>
                Auto-generated on save
              </div>
            </div>
          </div>

          <form onSubmit={handleSubmit}>
            <div className="form-row form-row-2" style={{ marginBottom: 16 }}>
              <Field label="Product Name" required error={errors.name}>
                <input
                  className={`form-control-ims${errors.name ? " is-invalid" : ""}`}
                  placeholder="e.g. Laptop Dell XPS"
                  {...f("name")}
                />
              </Field>
              <Field label="Category" required>
                <select className="form-select-ims" {...f("category")}>
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
                  min="1"
                  className={`form-control-ims${errors.quantity ? " is-invalid" : ""}`}
                  placeholder="0"
                  {...f("quantity")}
                />
              </Field>
              <Field label="Supplier" required error={errors.supplierId}>
                <select
                  className={`form-select-ims${errors.supplierId ? " is-invalid" : ""}`}
                  {...f("supplierId")}
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

            <div style={{ marginBottom: 24 }}>
              <Field
                label="Expiry Date"
                hint="Leave blank for non-perishable items"
              >
                <input
                  type="date"
                  className="form-control-ims"
                  style={{ maxWidth: 220 }}
                  {...f("expiryDate")}
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
    </div>
  );
};

export default AddGoods;
