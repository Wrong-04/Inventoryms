import { useState } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import { getUser, addLog } from "../../utils/auth";
import { toast } from "../../utils/toast";

const calcDiscount = (sub) => (sub > 1000000 ? sub * 0.1 : 0);
const calcTax = (sub, disc) => (sub - disc) * 0.1;

const GenerateReceipt = () => {
  const navigate = useNavigate();
  const user = getUser();
  const [searchCode, setSearchCode] = useState("");
  const [foundProduct, setFoundProduct] = useState(null);
  const [notFound, setNotFound] = useState(false);
  const [searching, setSearching] = useState(false);
  const [qty, setQty] = useState("");
  const [items, setItems] = useState([]);
  const [customerName, setCustomerName] = useState("");
  const [customerPhone, setCustomerPhone] = useState("");
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);

  const handleSearch = async () => {
    setNotFound(false);
    setFoundProduct(null);
    setSearching(true);
    try {
      const res = await axios.get(
        `http://localhost:9999/products?productCode=${searchCode}`,
      );
      if (res.data.length === 0 || res.data[0].status !== "active") {
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
    const q = parseInt(qty);
    if (!qty || q <= 0) {
      e.qty = "Quantity must be > 0.";
      setErrors(e);
      return;
    }
    if (q > foundProduct.quantity) {
      e.qty = `Only ${foundProduct.quantity} in stock.`;
      setErrors(e);
      return;
    }
    setErrors({});
    const existing = items.find((i) => i.productId === foundProduct.id);
    if (existing) {
      setItems(
        items.map((i) =>
          i.productId === foundProduct.id
            ? { ...i, quantity: i.quantity + q }
            : i,
        ),
      );
    } else {
      setItems([
        ...items,
        {
          productId: foundProduct.id,
          productName: foundProduct.name,
          quantity: q,
          unitPrice: foundProduct.price,
        },
      ]);
    }
    setFoundProduct(null);
    setSearchCode("");
    setQty("");
  };

  const subtotal = items.reduce((s, i) => s + i.quantity * i.unitPrice, 0);
  const discount = calcDiscount(subtotal);
  const tax = calcTax(subtotal, discount);
  const total = subtotal - discount + tax;

  const handleGenerate = async () => {
    if (items.length === 0) {
      setErrors({ general: "Add at least one item." });
      return;
    }
    if (!customerName.trim()) {
      setErrors({ customer: "Customer name is required." });
      return;
    }
    setErrors({});
    setLoading(true);
    try {
      let customerId;
      const custRes = await axios.get(
        `http://localhost:9999/customers?phone=${customerPhone}`,
      );
      if (custRes.data.length > 0) {
        customerId = custRes.data[0].id;
      } else {
        const newCust = await axios.post("http://localhost:9999/customers", {
          name: customerName,
          phone: customerPhone,
          email: "",
        });
        customerId = newCust.data.id;
      }
      const allRes = await axios.get("http://localhost:9999/receipts");
      const code = "RC" + String(allRes.data.length + 1).padStart(3, "0");
      await axios.post("http://localhost:9999/receipts", {
        receiptCode: code,
        customerId,
        items,
        subtotal,
        discount,
        tax,
        total,
        status: "completed",
        createdBy: user.id,
        createdAt: new Date().toISOString(),
      });
      for (const item of items) {
        const pRes = await axios.get(
          `http://localhost:9999/products/${item.productId}`,
        );
        await axios.patch(`http://localhost:9999/products/${item.productId}`, {
          quantity: pRes.data.quantity - item.quantity,
        });
      }
      await addLog(
        "Generate Receipt",
        `Generated receipt ${code} for ${customerName}`,
      );
      toast.success(
        `Receipt ${code} generated! Total: ${total.toLocaleString()} VND`,
      );
      setItems([]);
      setCustomerName("");
      setCustomerPhone("");
    } catch {
      toast.error("Failed to generate receipt.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <div className="page-header">
        <h4>🧾 Generate Receipt</h4>
      </div>
      {errors.general && (
        <div className="alert-ims alert-danger">⚠ {errors.general}</div>
      )}

      <div className="card-box">
        <div className="section-title">Customer Information</div>
        <div className="form-row form-row-2" style={{ maxWidth: 560 }}>
          <div>
            <label className="form-label-ims">Customer Name *</label>
            <input
              className={`form-control-ims${errors.customer ? " is-invalid" : ""}`}
              value={customerName}
              onChange={(e) => setCustomerName(e.target.value)}
              placeholder="Enter customer name"
            />
            {errors.customer && (
              <div className="invalid-feedback-ims">{errors.customer}</div>
            )}
          </div>
          <div>
            <label className="form-label-ims">Phone</label>
            <input
              className="form-control-ims"
              value={customerPhone}
              onChange={(e) => setCustomerPhone(e.target.value)}
              placeholder="Enter phone number"
            />
          </div>
        </div>
      </div>

      <div className="card-box">
        <div className="section-title">Add Item</div>
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
              onChange={(e) => setSearchCode(e.target.value)}
              placeholder="e.g. P001"
              onKeyDown={(e) => e.key === "Enter" && handleSearch()}
            />
            {errors.product && (
              <div className="invalid-feedback-ims">{errors.product}</div>
            )}
          </div>
          <button
            className="btn-secondary-ims"
            onClick={handleSearch}
            disabled={searching}
          >
            {searching ? <span className="btn-spinner-dark" /> : "Find"}
          </button>
          <div style={{ flex: "1 1 120px" }}>
            <label className="form-label-ims">Quantity</label>
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
          <button className="btn-primary-ims" onClick={handleAddItem}>
            + Add
          </button>
        </div>
        {notFound && (
          <div className="alert-ims alert-warning" style={{ marginTop: 12 }}>
            ⚠ Product not found or out of stock.
          </div>
        )}
        {foundProduct && (
          <div className="alert-ims alert-info" style={{ marginTop: 12 }}>
            📦 <strong>{foundProduct.name}</strong> —{" "}
            {foundProduct.price.toLocaleString()} VND &nbsp;|&nbsp; Stock:{" "}
            {foundProduct.quantity}
          </div>
        )}
      </div>

      {items.length > 0 && (
        <>
          <div className="card-box" style={{ padding: 0, overflow: "hidden" }}>
            <div className="table-toolbar">
              <span className="table-toolbar-title">Receipt Items</span>
              <span className="table-toolbar-meta">{items.length} item(s)</span>
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
                {items.map((i) => (
                  <tr key={i.productId}>
                    <td>{i.productName}</td>
                    <td>{i.quantity}</td>
                    <td>{i.unitPrice.toLocaleString()}</td>
                    <td>{(i.quantity * i.unitPrice).toLocaleString()}</td>
                    <td>
                      <button
                        className="btn-danger-ims"
                        onClick={() =>
                          setItems(
                            items.filter((x) => x.productId !== i.productId),
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
              <div>Subtotal: {subtotal.toLocaleString()} VND</div>
              <div className="text-success-ims">
                Discount (10% if &gt;1M): −{discount.toLocaleString()} VND
              </div>
              <div className="text-danger-ims">
                Tax (10%): +{tax.toLocaleString()} VND
              </div>
              <div className="total-final">
                Total: {total.toLocaleString()} VND
              </div>
            </div>
          </div>
          <div style={{ display: "flex", gap: 10 }}>
            <button
              className="btn-primary-ims"
              onClick={handleGenerate}
              disabled={loading}
            >
              {loading ? (
                <span className="btn-spinner" />
              ) : (
                "🧾 Generate Receipt"
              )}
            </button>
            <button className="btn-secondary-ims" onClick={() => navigate("/")}>
              Cancel
            </button>
          </div>
        </>
      )}
    </div>
  );
};

export default GenerateReceipt;
