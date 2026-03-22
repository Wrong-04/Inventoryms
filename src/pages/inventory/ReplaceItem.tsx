import { useState } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import { addLog } from "../../utils/auth";
import { toast } from "../../utils/toast";
import ConfirmModal from "../../components/ConfirmModal";

const ProductCard = ({ product, label, error }) => (
  <div style={{ flex: 1 }}>
    <div
      style={{
        background: product ? "#f0fdf4" : error ? "#fef2f2" : "#f8fafc",
        border: `1.5px solid ${product ? "#86efac" : error ? "#fca5a5" : "#e2e8f0"}`,
        borderRadius: 10,
        padding: "14px 16px",
        minHeight: 72,
        display: "flex",
        alignItems: "center",
        gap: 12,
        transition: "all 0.2s",
      }}
    >
      <div
        style={{
          width: 38,
          height: 38,
          borderRadius: 9,
          background: product ? "#dcfce7" : error ? "#fee2e2" : "#e2e8f0",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          fontSize: 18,
          flexShrink: 0,
        }}
      >
        {product ? "📦" : error ? "❌" : label === "old" ? "⬅️" : "➡️"}
      </div>
      {product ? (
        <div>
          <div style={{ fontWeight: 700, fontSize: 13.5, color: "#15803d" }}>
            {product.name}
          </div>
          <div style={{ fontSize: 12, color: "#64748b", marginTop: 2 }}>
            Code: {product.productCode} &nbsp;·&nbsp; Stock:{" "}
            <span
              style={{
                fontWeight: 600,
                color: product.quantity <= 10 ? "#d97706" : "#15803d",
              }}
            >
              {product.quantity}
            </span>
            &nbsp;·&nbsp; {product.price.toLocaleString()} VND
          </div>
        </div>
      ) : (
        <div style={{ fontSize: 13, color: error ? "#dc2626" : "#94a3b8" }}>
          {error ||
            (label === "old"
              ? "Search old item above"
              : "Search new item above")}
        </div>
      )}
    </div>
  </div>
);

const ReplaceItem = () => {
  const navigate = useNavigate();
  const [oldCode, setOldCode] = useState("");
  const [newCode, setNewCode] = useState("");
  const [oldProduct, setOldProduct] = useState(null);
  const [newProduct, setNewProduct] = useState(null);
  const [qty, setQty] = useState("");
  const [errors, setErrors] = useState({});
  const [searching, setSearching] = useState({ old: false, new: false });
  const [confirm, setConfirm] = useState({ show: false });
  const [confirmLoading, setConfirmLoading] = useState(false);

  const searchProduct = async (code, setter, field) => {
    setSearching((s) => ({ ...s, [field]: true }));
    try {
      const res = await axios.get(
        `http://localhost:9999/products?productCode=${code}`,
      );
      if (res.data.length === 0 || res.data[0].status !== "active") {
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
    } finally {
      setSearching((s) => ({ ...s, [field]: false }));
    }
  };

  const validate = () => {
    const e = {};
    if (!oldProduct) e.old = "Please find the old product first.";
    if (!newProduct) e.new = "Please find the new product first.";
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

  const canReplace = oldProduct && newProduct && qty && parseInt(qty) > 0;

  return (
    <div>
      <div className="page-header">
        <div className="page-header-left">
          <div className="page-header-icon" style={{ background: "#eff6ff" }}>
            🔄
          </div>
          <div>
            <h4 style={{ margin: 0 }}>Replace Item</h4>
            <div className="page-header-sub">
              Transfer stock from one product to another
            </div>
          </div>
        </div>
      </div>

      <div style={{ maxWidth: 720 }}>
        {/* Step 1 - Search */}
        <div className="card-box" style={{ marginBottom: 16 }}>
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 8,
              marginBottom: 18,
            }}
          >
            <div
              style={{
                width: 24,
                height: 24,
                borderRadius: "50%",
                background: "#2563eb",
                color: "#fff",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontSize: 12,
                fontWeight: 700,
                flexShrink: 0,
              }}
            >
              1
            </div>
            <span style={{ fontWeight: 600, fontSize: 14, color: "#1a2332" }}>
              Select Products
            </span>
          </div>

          <div
            style={{
              display: "grid",
              gridTemplateColumns: "1fr auto 1fr",
              gap: 16,
              alignItems: "start",
            }}
          >
            {/* Old item */}
            <div>
              <label className="form-label-ims">Old Item Code *</label>
              <div style={{ display: "flex", gap: 8 }}>
                <input
                  className={`form-control-ims${errors.old ? " is-invalid" : ""}`}
                  value={oldCode}
                  onChange={(e) => {
                    setOldCode(e.target.value);
                    setOldProduct(null);
                  }}
                  placeholder="e.g. P001"
                  onKeyDown={(e) =>
                    e.key === "Enter" &&
                    searchProduct(oldCode, setOldProduct, "old")
                  }
                />
                <button
                  className="btn-secondary-ims"
                  style={{ flexShrink: 0 }}
                  disabled={searching.old || !oldCode}
                  onClick={() => searchProduct(oldCode, setOldProduct, "old")}
                >
                  {searching.old ? (
                    <span className="btn-spinner-dark" />
                  ) : (
                    "Find"
                  )}
                </button>
              </div>
            </div>

            {/* Arrow */}
            <div
              style={{
                display: "flex",
                alignItems: "flex-end",
                paddingBottom: 10,
                color: "#94a3b8",
                fontSize: 20,
              }}
            >
              →
            </div>

            {/* New item */}
            <div>
              <label className="form-label-ims">New Item Code *</label>
              <div style={{ display: "flex", gap: 8 }}>
                <input
                  className={`form-control-ims${errors.new ? " is-invalid" : ""}`}
                  value={newCode}
                  onChange={(e) => {
                    setNewCode(e.target.value);
                    setNewProduct(null);
                  }}
                  placeholder="e.g. P002"
                  onKeyDown={(e) =>
                    e.key === "Enter" &&
                    searchProduct(newCode, setNewProduct, "new")
                  }
                />
                <button
                  className="btn-secondary-ims"
                  style={{ flexShrink: 0 }}
                  disabled={searching.new || !newCode}
                  onClick={() => searchProduct(newCode, setNewProduct, "new")}
                >
                  {searching.new ? (
                    <span className="btn-spinner-dark" />
                  ) : (
                    "Find"
                  )}
                </button>
              </div>
            </div>
          </div>

          {/* Product preview cards */}
          <div
            style={{
              display: "flex",
              gap: 16,
              marginTop: 14,
              alignItems: "stretch",
            }}
          >
            <ProductCard product={oldProduct} label="old" error={errors.old} />
            <div
              style={{
                display: "flex",
                alignItems: "center",
                color: "#cbd5e1",
                fontSize: 22,
              }}
            >
              ⇄
            </div>
            <ProductCard product={newProduct} label="new" error={errors.new} />
          </div>
        </div>

        {/* Step 2 - Quantity */}
        <div className="card-box" style={{ marginBottom: 16 }}>
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 8,
              marginBottom: 18,
            }}
          >
            <div
              style={{
                width: 24,
                height: 24,
                borderRadius: "50%",
                background: "#2563eb",
                color: "#fff",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontSize: 12,
                fontWeight: 700,
                flexShrink: 0,
              }}
            >
              2
            </div>
            <span style={{ fontWeight: 600, fontSize: 14, color: "#1a2332" }}>
              Set Quantity
            </span>
          </div>

          <div
            style={{
              display: "flex",
              alignItems: "flex-end",
              gap: 16,
              flexWrap: "wrap",
            }}
          >
            <div style={{ width: 200 }}>
              <label className="form-label-ims">Quantity to Replace *</label>
              <input
                type="number"
                min="1"
                max={oldProduct?.quantity || undefined}
                className={`form-control-ims${errors.qty ? " is-invalid" : ""}`}
                value={qty}
                onChange={(e) => setQty(e.target.value)}
                placeholder="0"
              />
              {errors.qty && (
                <div className="invalid-feedback-ims">{errors.qty}</div>
              )}
            </div>

            {oldProduct &&
              qty &&
              parseInt(qty) > 0 &&
              parseInt(qty) <= oldProduct.quantity && (
                <div
                  style={{
                    background: "#f8fafc",
                    border: "1px solid #e2e8f0",
                    borderRadius: 8,
                    padding: "10px 16px",
                    fontSize: 13,
                    color: "#374151",
                    lineHeight: 1.7,
                  }}
                >
                  <div>
                    Old stock after:{" "}
                    <strong style={{ color: "#dc2626" }}>
                      {oldProduct.quantity - parseInt(qty)}
                    </strong>
                  </div>
                  {newProduct && (
                    <div>
                      New stock after:{" "}
                      <strong style={{ color: "#16a34a" }}>
                        {newProduct.quantity + parseInt(qty)}
                      </strong>
                    </div>
                  )}
                </div>
              )}
          </div>
        </div>

        {/* Actions */}
        <div style={{ display: "flex", gap: 10 }}>
          <button
            className="btn-primary-ims"
            onClick={handleReplaceClick}
            disabled={!canReplace}
            style={{ opacity: canReplace ? 1 : 0.5 }}
          >
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
