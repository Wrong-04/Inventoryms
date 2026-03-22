import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import { addLog } from "../../utils/auth";
import { toast } from "../../utils/toast";

const CATEGORIES = ["Electronics", "Consumables", "Stationery", "Other"];

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
        <h4>➕ Add Goods</h4>
      </div>

      <div className="card-box" style={{ maxWidth: 560 }}>
        <form onSubmit={handleSubmit}>
          <div style={{ marginBottom: 14 }}>
            <label className="form-label-ims">Product ID</label>
            <input
              className="form-control-ims"
              value="Auto-generated"
              disabled
            />
          </div>
          <div className="form-row form-row-2">
            <div>
              <label className="form-label-ims">Name *</label>
              <input
                className={`form-control-ims${errors.name ? " is-invalid" : ""}`}
                {...f("name")}
              />
              {errors.name && (
                <div className="invalid-feedback-ims">{errors.name}</div>
              )}
            </div>
            <div>
              <label className="form-label-ims">Category *</label>
              <select className="form-select-ims" {...f("category")}>
                {CATEGORIES.map((c) => (
                  <option key={c}>{c}</option>
                ))}
              </select>
            </div>
          </div>
          <div className="form-row form-row-2">
            <div>
              <label className="form-label-ims">Quantity *</label>
              <input
                type="number"
                min="1"
                className={`form-control-ims${errors.quantity ? " is-invalid" : ""}`}
                {...f("quantity")}
              />
              {errors.quantity && (
                <div className="invalid-feedback-ims">{errors.quantity}</div>
              )}
            </div>
            <div>
              <label className="form-label-ims">Supplier *</label>
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
              {errors.supplierId && (
                <div className="invalid-feedback-ims">{errors.supplierId}</div>
              )}
            </div>
          </div>
          <div style={{ marginBottom: 24 }}>
            <label className="form-label-ims">Expiry Date</label>
            <input
              type="date"
              className="form-control-ims"
              {...f("expiryDate")}
            />
          </div>
          <div style={{ display: "flex", gap: 10 }}>
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

      {dupModal.show && (
        <div className="modal-overlay">
          <div className="modal-box">
            <h5>Duplicate Product Found</h5>
            <p style={{ color: "#374151", fontSize: 14 }}>
              <strong>{dupModal.existing?.name}</strong> already exists with{" "}
              <strong>{dupModal.existing?.quantity}</strong> in stock.
              <br />
              Do you want to increase the stock by{" "}
              <strong>{form.quantity}</strong>?
            </p>
            <div className="modal-footer-ims">
              <button
                className="btn-primary-ims"
                disabled={dupLoading}
                onClick={handleIncreaseStock}
              >
                {dupLoading ? (
                  <span className="btn-spinner" />
                ) : (
                  "Yes, Increase Stock"
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
