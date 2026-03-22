import { useState } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import { addLog } from "../../utils/auth";
import { toast } from "../../utils/toast";
import ConfirmModal from "../../components/ConfirmModal";

const REASONS = ["Damaged", "Lost", "Obsolete", "Other"];

const RemoveGoods = () => {
  const navigate = useNavigate();
  const [searchCode, setSearchCode] = useState("");
  const [product, setProduct] = useState(null);
  const [notFound, setNotFound] = useState(false);
  const [searching, setSearching] = useState(false);
  const [removeQty, setRemoveQty] = useState("");
  const [reason, setReason] = useState("Damaged");
  const [errors, setErrors] = useState({});
  const [confirm, setConfirm] = useState({ show: false });
  const [confirmLoading, setConfirmLoading] = useState(false);

  const handleSearch = async () => {
    setNotFound(false);
    setProduct(null);
    setSearching(true);
    try {
      const res = await axios.get(
        `http://localhost:9999/products?productCode=${searchCode}`,
      );
      if (!res.data[0]) {
        setNotFound(true);
        return;
      }
      setProduct(res.data[0]);
    } finally {
      setSearching(false);
    }
  };

  const validate = () => {
    const e = {};
    const qty = parseInt(removeQty);
    if (!removeQty || qty <= 0) e.qty = "Quantity must be > 0.";
    else if (qty > product.quantity)
      e.qty = `Cannot exceed current stock (${product.quantity}).`;
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleRemoveClick = () => {
    if (!validate()) return;
    setConfirm({
      show: true,
      title: "Confirm Removal",
      message: `Remove ${removeQty} unit(s) of "${product.name}"? Reason: ${reason}`,
      onConfirm: async () => {
        setConfirmLoading(true);
        try {
          const newQty = product.quantity - parseInt(removeQty);
          await axios.patch(`http://localhost:9999/products/${product.id}`, {
            quantity: newQty,
          });
          await addLog(
            "Remove Goods",
            `Removed ${removeQty} of ${product.name}. Reason: ${reason}`,
          );
          toast.success(`Removed ${removeQty} unit(s) of "${product.name}".`);
          setProduct({ ...product, quantity: newQty });
          setRemoveQty("");
        } catch {
          toast.error("Failed to remove goods.");
        } finally {
          setConfirmLoading(false);
          setConfirm({ show: false });
        }
      },
    });
  };

  return (
    <div>
      <div className="page-header">
        <h4>➖ Remove Goods</h4>
      </div>

      <div className="card-box">
        <label className="form-label-ims">Search by Product Code</label>
        <div style={{ display: "flex", gap: 10, maxWidth: 420 }}>
          <input
            className="form-control-ims"
            placeholder="e.g. P001"
            value={searchCode}
            onChange={(e) => setSearchCode(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleSearch()}
          />
          <button
            className="btn-primary-ims"
            onClick={handleSearch}
            disabled={searching}
          >
            {searching ? <span className="btn-spinner" /> : "Search"}
          </button>
        </div>
        {notFound && (
          <div className="alert-ims alert-warning" style={{ marginTop: 12 }}>
            ⚠ Product not found.
          </div>
        )}
      </div>

      {product && (
        <div className="card-box" style={{ maxWidth: 520 }}>
          <div className="product-info-card">
            <div className="product-info-grid">
              <div>
                <div className="info-label">Code</div>
                <div className="info-value">{product.productCode}</div>
              </div>
              <div>
                <div className="info-label">Name</div>
                <div className="info-value">{product.name}</div>
              </div>
              <div>
                <div className="info-label">Category</div>
                <div className="info-value">{product.category}</div>
              </div>
              <div>
                <div className="info-label">Current Stock</div>
                <div
                  className="info-value"
                  style={{
                    color: product.quantity <= 10 ? "#dc2626" : "#16a34a",
                  }}
                >
                  {product.quantity} units
                </div>
              </div>
            </div>
          </div>
          <div className="form-row form-row-2">
            <div>
              <label className="form-label-ims">Remove Quantity *</label>
              <input
                type="number"
                min="1"
                className={`form-control-ims${errors.qty ? " is-invalid" : ""}`}
                value={removeQty}
                onChange={(e) => setRemoveQty(e.target.value)}
              />
              {errors.qty && (
                <div className="invalid-feedback-ims">{errors.qty}</div>
              )}
            </div>
            <div>
              <label className="form-label-ims">Removal Reason *</label>
              <select
                className="form-select-ims"
                value={reason}
                onChange={(e) => setReason(e.target.value)}
              >
                {REASONS.map((r) => (
                  <option key={r}>{r}</option>
                ))}
              </select>
            </div>
          </div>
          <div style={{ display: "flex", gap: 10, marginTop: 8 }}>
            <button
              className="btn-danger-ims"
              style={{ padding: "8px 20px", fontSize: 14 }}
              onClick={handleRemoveClick}
            >
              🗑 Remove
            </button>
            <button className="btn-secondary-ims" onClick={() => navigate("/")}>
              Cancel
            </button>
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

export default RemoveGoods;
