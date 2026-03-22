import { useState } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import { addLog } from "../../utils/auth";
import { toast } from "../../utils/toast";
import ConfirmModal from "../../components/ConfirmModal";

const ReplaceItem = () => {
  const navigate = useNavigate();
  const [oldCode, setOldCode] = useState("");
  const [newCode, setNewCode] = useState("");
  const [oldProduct, setOldProduct] = useState(null);
  const [newProduct, setNewProduct] = useState(null);
  const [qty, setQty] = useState("");
  const [errors, setErrors] = useState({});
  const [confirm, setConfirm] = useState({ show: false });
  const [confirmLoading, setConfirmLoading] = useState(false);

  const searchProduct = async (code, setter, field) => {
    const res = await axios.get(
      `http://localhost:9999/products?productCode=${code}`,
    );
    if (res.data.length === 0) {
      setter(null);
      setErrors((e) => ({ ...e, [field]: "Product not found." }));
      return;
    }
    setter(res.data[0]);
    setErrors((e) => {
      const n = { ...e };
      delete n[field];
      return n;
    });
  };

  const validate = () => {
    const e = {};
    if (!oldProduct) e.old = "Old product not found.";
    if (!newProduct) e.new = "New product not found.";
    if (!qty || parseInt(qty) <= 0) e.qty = "Quantity must be > 0.";
    else if (oldProduct && parseInt(qty) > oldProduct.quantity)
      e.qty = `Cannot exceed old stock (${oldProduct.quantity}).`;
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleReplaceClick = () => {
    if (!validate()) return;
    setConfirm({
      show: true,
      title: "Confirm Replacement",
      message: `Replace ${qty} unit(s) of "${oldProduct.name}" with "${newProduct.name}"?`,
      variant: "primary",
      onConfirm: async () => {
        setConfirmLoading(true);
        try {
          const q = parseInt(qty);
          await axios.patch(`http://localhost:9999/products/${oldProduct.id}`, {
            quantity: oldProduct.quantity - q,
          });
          await axios.patch(`http://localhost:9999/products/${newProduct.id}`, {
            quantity: newProduct.quantity + q,
          });
          await addLog(
            "Replace Item",
            `Replaced ${q} of ${oldProduct.name} with ${newProduct.name}`,
          );
          toast.success(
            `Replaced ${q} unit(s) of "${oldProduct.name}" → "${newProduct.name}".`,
          );
          setOldProduct(null);
          setNewProduct(null);
          setOldCode("");
          setNewCode("");
          setQty("");
        } catch {
          toast.error("Failed to replace item.");
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
        <h4>🔄 Replace Item</h4>
      </div>

      <div className="card-box" style={{ maxWidth: 680 }}>
        <div className="form-row form-row-2" style={{ marginBottom: 20 }}>
          <div>
            <label className="form-label-ims">Old Item Code *</label>
            <div style={{ display: "flex", gap: 8 }}>
              <input
                className={`form-control-ims${errors.old ? " is-invalid" : ""}`}
                value={oldCode}
                onChange={(e) => setOldCode(e.target.value)}
                placeholder="e.g. P001"
              />
              <button
                className="btn-secondary-ims"
                onClick={() => searchProduct(oldCode, setOldProduct, "old")}
              >
                Find
              </button>
            </div>
            {errors.old && (
              <div className="invalid-feedback-ims">{errors.old}</div>
            )}
            {oldProduct && (
              <div
                className="alert-ims alert-info"
                style={{ marginTop: 8, marginBottom: 0 }}
              >
                📦 <strong>{oldProduct.name}</strong> — Stock:{" "}
                {oldProduct.quantity}
              </div>
            )}
          </div>
          <div>
            <label className="form-label-ims">New Item Code *</label>
            <div style={{ display: "flex", gap: 8 }}>
              <input
                className={`form-control-ims${errors.new ? " is-invalid" : ""}`}
                value={newCode}
                onChange={(e) => setNewCode(e.target.value)}
                placeholder="e.g. P002"
              />
              <button
                className="btn-secondary-ims"
                onClick={() => searchProduct(newCode, setNewProduct, "new")}
              >
                Find
              </button>
            </div>
            {errors.new && (
              <div className="invalid-feedback-ims">{errors.new}</div>
            )}
            {newProduct && (
              <div
                className="alert-ims alert-info"
                style={{ marginTop: 8, marginBottom: 0 }}
              >
                📦 <strong>{newProduct.name}</strong> — Stock:{" "}
                {newProduct.quantity}
              </div>
            )}
          </div>
        </div>
        <div style={{ maxWidth: 200, marginBottom: 24 }}>
          <label className="form-label-ims">Quantity to Replace *</label>
          <input
            type="number"
            min="1"
            className={`form-control-ims${errors.qty ? " is-invalid" : ""}`}
            value={qty}
            onChange={(e) => setQty(e.target.value)}
          />
          {errors.qty && (
            <div className="invalid-feedback-ims">{errors.qty}</div>
          )}
        </div>
        <div style={{ display: "flex", gap: 10 }}>
          <button className="btn-primary-ims" onClick={handleReplaceClick}>
            🔄 Replace
          </button>
          <button className="btn-secondary-ims" onClick={() => navigate("/")}>
            Cancel
          </button>
        </div>
      </div>

      <ConfirmModal
        {...confirm}
        loading={confirmLoading}
        onClose={() => setConfirm({ show: false })}
      />
    </div>
  );
};

export default ReplaceItem;
