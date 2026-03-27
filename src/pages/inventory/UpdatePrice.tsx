import { useState } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import { addLog } from "../../utils/auth";
import { toast } from "../../utils/toast";

const Field = ({ label, required, error, children }: any) => (
  <div>
    <label className="form-label-ims">
      {label} {required && <span style={{ color: "#ef4444" }}>*</span>}
    </label>
    {children}
    {error && <div className="invalid-feedback-ims">{error}</div>}
  </div>
);

import ProductAutocomplete, {
  Product,
} from "../../components/ProductAutocomplete";

const UpdatePrice = () => {
  const navigate = useNavigate();
  const [product, setProduct] = useState<Product | null>(null);
  const [newPrice, setNewPrice] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleUpdate = async () => {
    const price = parseFloat(newPrice);
    if (!newPrice || price <= 0) {
      setError("New price must be greater than 0.");
      return;
    }
    if (!product) return;
    setError("");
    setLoading(true);
    try {
      await axios.patch(`http://localhost:9999/products/${product.id}`, {
        price,
      });
      await addLog(
        "Update Price",
        `Updated price of ${product.name} to ${price}`,
      );
      toast.success(`Price updated to ${price.toLocaleString()} VND.`);
      setProduct({ ...product, price });
      setNewPrice("");
    } catch {
      toast.error("Failed to update price.");
    } finally {
      setLoading(false);
    }
  };

  const priceDiff =
    newPrice && product ? parseFloat(newPrice) - product.price : null;

  return (
    <div>
      <div className="page-header">
        <div className="page-header-left">
          <div className="page-header-icon" style={{ background: "#fffbeb" }}>
            💲
          </div>
          <div>
            <h4 style={{ margin: 0 }}>Update Price</h4>
            <div className="page-header-sub">Modify product pricing</div>
          </div>
        </div>
      </div>

      <div style={{ maxWidth: 520 }}>
        <div className="card-box">
          <label className="form-label-ims">Search Product *</label>
          <ProductAutocomplete
            onSelect={(p) => {
              setProduct(p);
              setNewPrice("");
              setError("");
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
                    background: "#fffbeb",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    fontSize: 22,
                    flexShrink: 0,
                  }}
                >
                  💲
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
                    Current Price
                  </div>
                  <div
                    style={{
                      fontSize: 18,
                      fontWeight: 800,
                      color: "#2563eb",
                      lineHeight: 1.3,
                    }}
                  >
                    {product.price.toLocaleString()}
                  </div>
                  <div style={{ fontSize: 11, color: "#94a3b8" }}>VND</div>
                </div>
              </div>
            </div>

            <div className="card-box">
              <div className="form-row form-row-2" style={{ marginBottom: 20 }}>
                <Field label="New Price (VND)" required error={error}>
                  <input
                    type="number"
                    min="1"
                    className={`form-control-ims${error ? " is-invalid" : ""}`}
                    placeholder="Enter new price"
                    value={newPrice}
                    onChange={(e) => {
                      setNewPrice(e.target.value);
                      setError("");
                    }}
                    onKeyDown={(e) => e.key === "Enter" && handleUpdate()}
                  />
                </Field>

                {priceDiff !== null && newPrice && parseFloat(newPrice) > 0 && (
                  <div
                    style={{
                      marginTop: 10,
                      display: "flex",
                      alignItems: "center",
                      gap: 10,
                      flexWrap: "wrap",
                    }}
                  >
                    <div style={{ fontSize: 13, color: "#64748b" }}>
                      {product.price.toLocaleString()} VND
                    </div>
                    <span style={{ color: "#94a3b8" }}>→</span>
                    <div
                      style={{
                        fontSize: 14,
                        fontWeight: 700,
                        color: "#2563eb",
                      }}
                    >
                      {parseFloat(newPrice).toLocaleString()} VND
                    </div>
                    <span
                      style={{
                        fontSize: 12,
                        fontWeight: 600,
                        padding: "2px 8px",
                        borderRadius: 20,
                        background:
                          priceDiff > 0
                            ? "#dcfce7"
                            : priceDiff < 0
                              ? "#fee2e2"
                              : "#f1f5f9",
                        color:
                          priceDiff > 0
                            ? "#16a34a"
                            : priceDiff < 0
                              ? "#dc2626"
                              : "#64748b",
                      }}
                    >
                      {priceDiff > 0 ? "▲" : priceDiff < 0 ? "▼" : "="}{" "}
                      {Math.abs(priceDiff).toLocaleString()} VND
                    </span>
                  </div>
                )}
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
                  className="btn-primary-ims"
                  onClick={handleUpdate}
                  disabled={loading}
                >
                  {loading ? (
                    <span className="btn-spinner" />
                  ) : (
                    "✓ Update Price"
                  )}
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
    </div>
  );
};

export default UpdatePrice;
