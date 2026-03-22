import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import { getUser, addLog } from "../../utils/auth";
import { toast } from "../../utils/toast";
import ConfirmModal from "../../components/ConfirmModal";

const PlaceOrder = () => {
  const navigate = useNavigate();
  const user = getUser();
  const [suppliers, setSuppliers] = useState([]);
  const [supplierId, setSupplierId] = useState("");
  const [searchCode, setSearchCode] = useState("");
  const [foundProduct, setFoundProduct] = useState(null);
  const [notFound, setNotFound] = useState(false);
  const [searching, setSearching] = useState(false);
  const [orderQty, setOrderQty] = useState("");
  const [orderItems, setOrderItems] = useState([]);
  const [errors, setErrors] = useState({});
  const [confirm, setConfirm] = useState({ show: false });
  const [confirmLoading, setConfirmLoading] = useState(false);

  useEffect(() => {
    axios.get("http://localhost:9999/suppliers").then((r) => {
      setSuppliers(r.data);
      if (r.data.length > 0) setSupplierId(r.data[0].id);
    });
  }, []);

  const handleSearch = async () => {
    setNotFound(false);
    setFoundProduct(null);
    setSearching(true);
    try {
      const res = await axios.get(
        `http://localhost:9999/products?productCode=${searchCode}`,
      );
      if (res.data.length === 0) {
        setNotFound(true);
        return;
      }
      setFoundProduct(res.data[0]);
    } finally {
      setSearching(false);
    }
  };

  const handleAddItem = () => {
    const e = {};
    if (!foundProduct) {
      e.product = "Search a product first.";
      setErrors(e);
      return;
    }
    if (!orderQty || parseInt(orderQty) <= 0) {
      e.qty = "Quantity must be > 0.";
      setErrors(e);
      return;
    }
    setErrors({});
    const existing = orderItems.find((i) => i.productId === foundProduct.id);
    if (existing) {
      setOrderItems(
        orderItems.map((i) =>
          i.productId === foundProduct.id
            ? { ...i, quantity: i.quantity + parseInt(orderQty) }
            : i,
        ),
      );
    } else {
      setOrderItems([
        ...orderItems,
        {
          productId: foundProduct.id,
          productName: foundProduct.name,
          quantity: parseInt(orderQty),
          unitPrice: foundProduct.price,
        },
      ]);
    }
    setFoundProduct(null);
    setSearchCode("");
    setOrderQty("");
  };

  const total = orderItems.reduce((s, i) => s + i.quantity * i.unitPrice, 0);

  const handlePlaceOrderClick = () => {
    if (orderItems.length === 0) {
      setErrors({ general: "Add at least one item." });
      return;
    }
    const supplierName =
      suppliers.find((s) => s.id === supplierId)?.name || supplierId;
    setConfirm({
      show: true,
      title: "Confirm Order",
      message: `Place order to "${supplierName}" for ${orderItems.length} item(s)? Total: ${total.toLocaleString()} VND`,
      variant: "primary",
      onConfirm: async () => {
        setConfirmLoading(true);
        try {
          const allRes = await axios.get("http://localhost:9999/orders");
          const code = "ORD" + String(allRes.data.length + 1).padStart(3, "0");
          await axios.post("http://localhost:9999/orders", {
            orderCode: code,
            supplierId,
            items: orderItems,
            total,
            status: "pending",
            createdBy: user.id,
            createdAt: new Date().toISOString(),
          });
          await addLog("Place Order", `Placed order ${code} to supplier`);
          toast.success(`Order ${code} placed successfully!`);
          setOrderItems([]);
        } catch {
          toast.error("Failed to place order.");
        } finally {
          setConfirmLoading(false);
          setConfirm({ show: false });
        }
      },
    });
  };

  const selectedSupplier = suppliers.find((s) => s.id === supplierId);

  return (
    <div>
      <div className="page-header">
        <div className="page-header-left">
          <div className="page-header-icon" style={{ background: "#f5f3ff" }}>
            🛒
          </div>
          <div>
            <h4 style={{ margin: 0 }}>Place Order</h4>
            <div className="page-header-sub">
              Create a purchase order to a supplier
            </div>
          </div>
        </div>
      </div>

      {errors.general && (
        <div className="alert-ims alert-danger">⚠ {errors.general}</div>
      )}

      <div style={{ maxWidth: 720 }}>
        <div className="card-box" style={{ marginBottom: 16 }}>
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 8,
              marginBottom: 16,
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
              }}
            >
              1
            </div>
            <span style={{ fontWeight: 600, fontSize: 14, color: "#1a2332" }}>
              Select Supplier
            </span>
          </div>
          <div
            style={{
              display: "flex",
              gap: 16,
              alignItems: "flex-start",
              flexWrap: "wrap",
            }}
          >
            <div style={{ flex: "1 1 260px" }}>
              <label className="form-label-ims">Supplier *</label>
              <select
                className="form-select-ims"
                value={supplierId}
                onChange={(e) => setSupplierId(e.target.value)}
              >
                {suppliers.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.name}
                  </option>
                ))}
              </select>
            </div>
            {selectedSupplier && (
              <div
                style={{
                  flex: "1 1 200px",
                  background: "#f8fafc",
                  border: "1px solid #e2e8f0",
                  borderRadius: 8,
                  padding: "10px 14px",
                  fontSize: 12.5,
                  color: "#64748b",
                  lineHeight: 1.8,
                }}
              >
                <div>📞 {selectedSupplier.phone}</div>
                <div>📧 {selectedSupplier.email}</div>
                <div>📍 {selectedSupplier.address}</div>
              </div>
            )}
          </div>
        </div>

        <div className="card-box" style={{ marginBottom: 16 }}>
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 8,
              marginBottom: 16,
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
              }}
            >
              2
            </div>
            <span style={{ fontWeight: 600, fontSize: 14, color: "#1a2332" }}>
              Add Items
            </span>
          </div>
          <div
            style={{
              display: "flex",
              gap: 10,
              alignItems: "flex-end",
              flexWrap: "wrap",
            }}
          >
            <div style={{ flex: "2 1 180px" }}>
              <label className="form-label-ims">Product Code</label>
              <input
                className={`form-control-ims${errors.product ? " is-invalid" : ""}`}
                value={searchCode}
                onChange={(e) => {
                  setSearchCode(e.target.value);
                  setFoundProduct(null);
                }}
                placeholder="e.g. P001"
                onKeyDown={(e) => e.key === "Enter" && handleSearch()}
              />
              {errors.product && (
                <div className="invalid-feedback-ims">⚠ {errors.product}</div>
              )}
            </div>
            <button
              className="btn-secondary-ims"
              onClick={handleSearch}
              disabled={searching || !searchCode}
            >
              {searching ? <span className="btn-spinner-dark" /> : "Find"}
            </button>
            <div style={{ flex: "1 1 120px" }}>
              <label className="form-label-ims">Quantity</label>
              <input
                type="number"
                min="1"
                className={`form-control-ims${errors.qty ? " is-invalid" : ""}`}
                value={orderQty}
                onChange={(e) => setOrderQty(e.target.value)}
                placeholder="0"
              />
              {errors.qty && (
                <div className="invalid-feedback-ims">⚠ {errors.qty}</div>
              )}
            </div>
            <button className="btn-primary-ims" onClick={handleAddItem}>
              + Add
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
          {foundProduct && (
            <div
              className="alert-ims alert-info"
              style={{ marginTop: 12, marginBottom: 0 }}
            >
              📦 <strong>{foundProduct.name}</strong> —{" "}
              {foundProduct.price.toLocaleString()} VND &nbsp;·&nbsp; Stock:{" "}
              {foundProduct.quantity}
            </div>
          )}
        </div>

        {orderItems.length > 0 && (
          <div className="card-box" style={{ padding: 0, overflow: "hidden" }}>
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: 8,
                padding: "14px 20px",
                borderBottom: "1px solid #e8edf3",
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
                }}
              >
                3
              </div>
              <span style={{ fontWeight: 600, fontSize: 14, color: "#1a2332" }}>
                Review Order
              </span>
              <span
                style={{ marginLeft: "auto", fontSize: 12.5, color: "#94a3b8" }}
              >
                {orderItems.length} item(s)
              </span>
            </div>
            <table className="ims-table">
              <thead>
                <tr>
                  <th>Product</th>
                  <th>Qty</th>
                  <th>Unit Price (VND)</th>
                  <th>Subtotal (VND)</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                {orderItems.map((i) => (
                  <tr key={i.productId}>
                    <td style={{ fontWeight: 500 }}>{i.productName}</td>
                    <td>{i.quantity}</td>
                    <td>{i.unitPrice.toLocaleString()}</td>
                    <td style={{ fontWeight: 600 }}>
                      {(i.quantity * i.unitPrice).toLocaleString()}
                    </td>
                    <td>
                      <button
                        className="btn-danger-ims"
                        onClick={() =>
                          setOrderItems(
                            orderItems.filter(
                              (x) => x.productId !== i.productId,
                            ),
                          )
                        }
                      >
                        Remove
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            <div
              className="totals-box"
              style={{ borderTop: "1px solid #e2e8f0" }}
            >
              <div className="total-final">
                Total: {total.toLocaleString()} VND
              </div>
            </div>
            <div
              style={{
                padding: "16px 20px",
                display: "flex",
                gap: 10,
                borderTop: "1px solid #f1f5f9",
              }}
            >
              <button
                className="btn-primary-ims"
                onClick={handlePlaceOrderClick}
              >
                🛒 Place Order
              </button>
              <button
                className="btn-secondary-ims"
                onClick={() => navigate("/")}
              >
                Cancel
              </button>
            </div>
          </div>
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

export default PlaceOrder;
