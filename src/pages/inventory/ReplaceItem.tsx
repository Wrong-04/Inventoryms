import { useState } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import { addLog } from "../../utils/auth";
import { toast } from "../../utils/toast";
import ConfirmModal from "../../components/ConfirmModal";
import ProductAutocomplete, {
  Product,
} from "../../components/ProductAutocomplete";

const ProductCard = ({
  product,
  label,
  error,
}: {
  product: Product | null;
  label: string;
  error?: string;
}) => (
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
  const [oldProduct, setOldProduct] = useState<Product | null>(null);
  const [newProduct, setNewProduct] = useState<Product | null>(null);
  const [qty, setQty] = useState("");
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [confirm, setConfirm] = useState<any>({ show: false });
  const [confirmLoading, setConfirmLoading] = useState(false);

  const validate = () => {
    const e: Record<string, string> = {};
    if (!oldProduct) e.old = "Please select the old product.";
    if (!newProduct) e.new = "Please select the new product.";
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
      message: `Replace ${qty} unit(s) of "${oldProduct!.name}" with "${newProduct!.name}"?`,
      variant: "primary",
      onConfirm: async () => {
        setConfirmLoading(true);
        try {
          const q = parseInt(qty);
          await axios.patch(
            `http://localhost:9999/products/${oldProduct!.id}`,
            { quantity: oldProduct!.quantity - q },
          );
          await axios.patch(
            `http://localhost:9999/products/${newProduct!.id}`,
            { quantity: newProduct!.quantity + q },
          );
          await addLog(
            "Replace Item",
            `Replaced ${q} of ${oldProduct!.name} with ${newProduct!.name}`,
          );
          toast.success(
            `Replaced ${q} unit(s) of "${oldProduct!.name}" → "${newProduct!.name}".`,
          );
          setOldProduct(null);
          setNewProduct(null);
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
        {/* Step 1 */}
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
            <div>
              <label className="form-label-ims">Old Item *</label>
              <ProductAutocomplete
                onSelect={(p) => {
                  setOldProduct(p);
                  setErrors((e) => {
                    const n = { ...e };
                    delete n.old;
                    return n;
                  });
                }}
                placeholder="Search old product..."
                error={errors.old}
              />
            </div>
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
            <div>
              <label className="form-label-ims">New Item *</label>
              <ProductAutocomplete
                onSelect={(p) => {
                  setNewProduct(p);
                  setErrors((e) => {
                    const n = { ...e };
                    delete n.new;
                    return n;
                  });
                }}
                placeholder="Search new product..."
                error={errors.new}
              />
            </div>
          </div>

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

        {/* Step 2 */}
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
                max={oldProduct?.quantity}
                className={`form-control-ims${errors.qty ? " is-invalid" : ""}`}
                value={qty}
                onChange={(e) => setQty(e.target.value)}
                placeholder="0"
              />
              {errors.qty && (
                <div className="invalid-feedback-ims">⚠ {errors.qty}</div>
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
