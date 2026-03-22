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

  return (
    <div>
      <div className="page-header">
        <h4>💲 Update Price</h4>
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
        <div className="card-box" style={{ maxWidth: 480 }}>
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
                <div className="info-label">Current Price</div>
                <div className="info-value" style={{ color: "#2563eb" }}>
                  {product.price.toLocaleString()} VND
                </div>
              </div>
            </div>
          </div>
          <div style={{ marginBottom: 20, maxWidth: 260 }}>
            <label className="form-label-ims">New Price (VND) *</label>
            <input
              type="number"
              min="1"
              className={`form-control-ims${error ? " is-invalid" : ""}`}
              placeholder="Enter new price"
              value={newPrice}
              onChange={(e) => setNewPrice(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleUpdate()}
            />
            {error && <div className="invalid-feedback-ims">{error}</div>}
          </div>
          <div style={{ display: "flex", gap: 10 }}>
            <button
              className="btn-primary-ims"
              onClick={handleUpdate}
              disabled={loading}
            >
              {loading ? <span className="btn-spinner" /> : "✓ Update Price"}
            </button>
            <button className="btn-secondary-ims" onClick={() => navigate("/")}>
              Cancel
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default UpdatePrice;
