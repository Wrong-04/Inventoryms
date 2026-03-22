import { useState } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import { addLog } from "../../utils/auth";
import { toast } from "../../utils/toast";

const UpdatePrice = () => {
  const navigate = useNavigate();
  const [searchCode, setSearchCode] = useState("");
  const [product, setProduct] = useState(null);
  const [notFound, setNotFound] = useState(false);
  const [searching, setSearching] = useState(false);
  const [newPrice, setNewPrice] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

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

  const handleUpdate = async () => {
    const price = parseFloat(newPrice);
    if (!newPrice || price <= 0) {
      setError("New price must be greater than 0.");
      return;
    }
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
        {/* Search */}
        <div className="card-box">
          <label className="form-label-ims">Product Code *</label>
          <div style={{ display: "flex", gap: 10 }}>
            <input
              className="form-control-ims"
              placeholder="e.g. P001"
              value={searchCode}
              onChange={(e) => {
                setSearchCode(e.target.value);
                setProduct(null);
              }}
              onKeyDown={(e) => e.key === "Enter" && handleSearch()}
            />
            <button
              className="btn-primary-ims"
              onClick={handleSearch}
              disabled={searching || !searchCode}
            >
              {searching ? <span className="btn-spinner" /> : "🔍 Search"}
            </button>
          </div>
          {notFound && (
            <div
              className="alert-ims alert-warning"
              style={{ marginTop: 12, marginBottom: 0 }}
            >
              ⚠ Product not found.
            </div>
          )}
        </div>

        {product && (
          <>
            {/* Product info */}
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

            {/* Update form */}
            <div className="card-box">
              <div style={{ marginBottom: 20 }}>
                <label className="form-label-ims">New Price (VND) *</label>
                <input
                  type="number"
                  min="1"
                  className={`form-control-ims${error ? " is-invalid" : ""}`}
                  style={{ maxWidth: 260 }}
                  placeholder="Enter new price"
                  value={newPrice}
                  onChange={(e) => {
                    setNewPrice(e.target.value);
                    setError("");
                  }}
                  onKeyDown={(e) => e.key === "Enter" && handleUpdate()}
                />
                {error && <div className="invalid-feedback-ims">⚠ {error}</div>}

                {/* Price diff preview */}
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
