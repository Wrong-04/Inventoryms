import { useState } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import { addLog } from "../../utils/auth";
import { toast } from "../../utils/toast";
import ConfirmModal from "../../components/ConfirmModal";
import ProductAutocomplete, {
  Product,
} from "../../components/ProductAutocomplete";

const REASONS = [
  { value: "Damaged", icon: "💥", color: "#dc2626", bg: "#fee2e2" },
  { value: "Lost", icon: "🔍", color: "#d97706", bg: "#fef3c7" },
  { value: "Obsolete", icon: "🗃️", color: "#7c3aed", bg: "#ede9fe" },
  { value: "Other", icon: "📝", color: "#64748b", bg: "#f1f5f9" },
];

const RemoveGoods = () => {
  const navigate = useNavigate();
  const [product, setProduct] = useState<Product | null>(null);
  const [removeQty, setRemoveQty] = useState("");
  const [reason, setReason] = useState("Damaged");
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [confirm, setConfirm] = useState<any>({ show: false });
  const [confirmLoading, setConfirmLoading] = useState(false);

  const validate = () => {
    const e: Record<string, string> = {};
    const qty = parseInt(removeQty);
    if (!removeQty || qty <= 0) e.qty = "Quantity must be > 0.";
    else if (product && qty > product.quantity)
      e.qty = `Cannot exceed current stock (${product.quantity}).`;
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleRemoveClick = () => {
    if (!product || !validate()) return;
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

  const selectedReason = REASONS.find((r) => r.value === reason);

  return (
    <div>
      <div className="page-header">
        <div className="page-header-left">
          <div className="page-header-icon" style={{ background: "#fef2f2" }}>
            ➖
          </div>
          <div>
            <h4 style={{ margin: 0 }}>Remove Goods</h4>
            <div className="page-header-sub">
              Reduce stock with reason tracking
            </div>
          </div>
        </div>
      </div>

      <div style={{ maxWidth: 580 }}>
        <div className="card-box">
          <label className="form-label-ims">Search Product *</label>
          <ProductAutocomplete
            onSelect={(p) => {
              setProduct(p);
              setRemoveQty("");
            }}
            placeholder="Type product name or code..."
          />
        </div>

        {product && (
          <>
            <div className="card-box" style={{ padding: "16px 20px" }}>
              <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
                <div
                  style={{
                    width: 46,
                    height: 46,
                    borderRadius: 12,
                    background: "#eff6ff",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    fontSize: 22,
                    flexShrink: 0,
                  }}
                >
                  📦
                </div>
                <div style={{ flex: 1 }}>
                  <div
                    style={{ fontWeight: 700, fontSize: 15, color: "#1a2332" }}
                  >
                    {product.name}
                  </div>
                  <div
                    style={{ fontSize: 12.5, color: "#64748b", marginTop: 3 }}
                  >
                    Code: <strong>{product.productCode}</strong> &nbsp;·&nbsp;{" "}
                    {product.category}
                  </div>
                </div>
                <div style={{ textAlign: "right" }}>
                  <div
                    style={{
                      fontSize: 11,
                      fontWeight: 700,
                      color: "#94a3b8",
                      textTransform: "uppercase",
                      letterSpacing: "0.4px",
                    }}
                  >
                    Current Stock
                  </div>
                  <div
                    style={{
                      fontSize: 22,
                      fontWeight: 800,
                      color: product.quantity <= 10 ? "#dc2626" : "#16a34a",
                      lineHeight: 1.2,
                    }}
                  >
                    {product.quantity}
                  </div>
                  <div style={{ fontSize: 11, color: "#94a3b8" }}>units</div>
                </div>
              </div>
            </div>

            <div className="card-box">
              <div style={{ marginBottom: 20 }}>
                <label className="form-label-ims">Removal Reason *</label>
                <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                  {REASONS.map((r) => (
                    <button
                      key={r.value}
                      type="button"
                      onClick={() => setReason(r.value)}
                      style={{
                        padding: "7px 14px",
                        borderRadius: 8,
                        fontSize: 13,
                        fontWeight: 600,
                        cursor: "pointer",
                        fontFamily: "inherit",
                        border: `1.5px solid ${reason === r.value ? r.color : "#e2e8f0"}`,
                        background: reason === r.value ? r.bg : "#fff",
                        color: reason === r.value ? r.color : "#64748b",
                        transition: "all 0.15s",
                        display: "flex",
                        alignItems: "center",
                        gap: 6,
                      }}
                    >
                      {r.icon} {r.value}
                    </button>
                  ))}
                </div>
              </div>

              <div style={{ marginBottom: 20, maxWidth: 200 }}>
                <label className="form-label-ims">Quantity to Remove *</label>
                <input
                  type="number"
                  min="1"
                  max={product.quantity}
                  className={`form-control-ims${errors.qty ? " is-invalid" : ""}`}
                  value={removeQty}
                  onChange={(e) => setRemoveQty(e.target.value)}
                  placeholder="0"
                />
                {errors.qty && (
                  <div className="invalid-feedback-ims">⚠ {errors.qty}</div>
                )}
                {removeQty &&
                  parseInt(removeQty) > 0 &&
                  parseInt(removeQty) <= product.quantity && (
                    <div
                      style={{ fontSize: 12, color: "#64748b", marginTop: 6 }}
                    >
                      Stock after:{" "}
                      <strong style={{ color: "#dc2626" }}>
                        {product.quantity - parseInt(removeQty)}
                      </strong>
                    </div>
                  )}
              </div>

              {removeQty && parseInt(removeQty) > 0 && (
                <div
                  style={{
                    background: "#fef2f2",
                    border: "1px solid #fecaca",
                    borderRadius: 8,
                    padding: "10px 14px",
                    marginBottom: 20,
                    fontSize: 13,
                    color: "#dc2626",
                    display: "flex",
                    alignItems: "center",
                    gap: 8,
                  }}
                >
                  <span style={{ fontSize: 16 }}>{selectedReason?.icon}</span>
                  Removing <strong>{removeQty}</strong> unit(s) — Reason:{" "}
                  <strong>{reason}</strong>
                </div>
              )}

              <div
                style={{
                  display: "flex",
                  gap: 10,
                  paddingTop: 4,
                  borderTop: "1px solid #f1f5f9",
                }}
              >
                <button
                  className="btn-danger-ims"
                  style={{ padding: "8px 20px", fontSize: 13.5 }}
                  onClick={handleRemoveClick}
                >
                  🗑 Remove Goods
                </button>
                <button
                  className="btn-secondary-ims"
                  onClick={() => navigate("/")}
                >
                  Cancel
                </button>
              </div>
            </div>
          </>
        )}
      </div>

      <ConfirmModal
        {...confirm}
        loading={confirmLoading}
        onClose={() => setConfirm({ show: false })}
      />
    </div>
  );
};

export default RemoveGoods;
