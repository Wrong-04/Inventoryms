import { useState } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import { getUser, addLog } from "../../utils/auth";
import { toast } from "../../utils/toast";
import ProductAutocomplete, {
  Product,
} from "../../components/ProductAutocomplete";

interface ReceiptItem {
  productId: string;
  productName: string;
  quantity: number;
  unitPrice: number;
  maxStock: number;
}

const calcDiscount = (sub: number) => (sub > 1000000 ? sub * 0.1 : 0);
const calcTax = (sub: number, disc: number) => (sub - disc) * 0.1;

const GenerateReceipt = () => {
  const navigate = useNavigate();
  const user = getUser();
  const [foundProduct, setFoundProduct] = useState<Product | null>(null);
  const [qty, setQty] = useState("");
  const [items, setItems] = useState<ReceiptItem[]>([]);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [customerName, setCustomerName] = useState("");
  const [customerPhone, setCustomerPhone] = useState("");
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(false);

  const handleAddItem = () => {
    const e: Record<string, string> = {};
    if (!foundProduct) {
      e.product = "Select a product first.";
      setErrors(e);
      return;
    }
    const q = parseInt(qty);
    if (!qty || q <= 0) {
      e.qty = "Quantity must be > 0.";
      setErrors(e);
      return;
    }

    const existing = items.find((i) => i.productId === foundProduct.id);
    const alreadyInCart = existing ? existing.quantity : 0;
    const totalRequested = alreadyInCart + q;

    if (totalRequested > foundProduct.quantity) {
      e.qty = `Only ${foundProduct.quantity - alreadyInCart} more available (${foundProduct.quantity} in stock, ${alreadyInCart} already in cart).`;
      setErrors(e);
      return;
    }
    setErrors({});
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
          maxStock: foundProduct.quantity,
        },
      ]);
    }
    setFoundProduct(null);
    setQty("");
  };

  const updateItemQty = (productId: string, newQty: number) => {
    const item = items.find((i) => i.productId === productId);
    if (!item) return;
    if (newQty <= 0) {
      setItems(items.filter((i) => i.productId !== productId));
      return;
    }
    if (newQty > item.maxStock) return;
    setItems(
      items.map((i) =>
        i.productId === productId ? { ...i, quantity: newQty } : i,
      ),
    );
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
      let customerId: string;
      const custRes = await axios.get<
        { id: string; name: string; phone: string }[]
      >(`http://localhost:9999/customers?phone=${customerPhone}`);
      if (custRes.data.length > 0) {
        customerId = custRes.data[0].id;
      } else {
        const newCust = await axios.post<{ id: string }>(
          "http://localhost:9999/customers",
          {
            name: customerName,
            phone: customerPhone,
            email: "",
          },
        );
        customerId = newCust.data.id;
      }
      const allRes = await axios.get<unknown[]>(
        "http://localhost:9999/receipts",
      );
      const code = "RC" + String(allRes.data.length + 1).padStart(3, "0");
      await axios.post("http://localhost:9999/receipts", {
        receiptCode: code,
        customerId,
        items: items.map(({ productId, productName, quantity, unitPrice }) => ({
          productId,
          productName,
          quantity,
          unitPrice,
        })),
        subtotal,
        discount,
        tax,
        total,
        status: "completed",
        createdBy: user!.id,
        createdAt: new Date().toISOString(),
      });
      for (const item of items) {
        const pRes = await axios.get<{ quantity: number }>(
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
      setFoundProduct(null);
      setQty("");
    } catch {
      toast.error("Failed to generate receipt.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <div className="page-header">
        <div className="page-header-left">
          <div className="page-header-icon" style={{ background: "#f0fdf4" }}>
            🧾
          </div>
          <div>
            <h4 style={{ margin: 0 }}>Generate Receipt</h4>
            <div className="page-header-sub">Create a sales transaction</div>
          </div>
        </div>
      </div>

      {errors.general && (
        <div className="alert-ims alert-danger">⚠ {errors.general}</div>
      )}

      <div style={{ maxWidth: 680 }}>
        {/* Customer */}
        <div className="card-box" style={{ marginBottom: 16 }}>
          <div className="section-title">Customer Information</div>
          <div className="form-row form-row-2">
            <div>
              <label className="form-label-ims">Customer Name *</label>
              <input
                className={`form-control-ims${errors.customer ? " is-invalid" : ""}`}
                value={customerName}
                onChange={(e) => setCustomerName(e.target.value)}
                placeholder="Enter customer name"
              />
              {errors.customer && (
                <div className="invalid-feedback-ims">⚠ {errors.customer}</div>
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

        {/* Add item */}
        <div className="card-box" style={{ marginBottom: 16 }}>
          <div className="section-title">Add Item</div>
          <div
            style={{
              display: "flex",
              gap: 10,
              alignItems: "flex-end",
              flexWrap: "wrap",
            }}
          >
            <div style={{ flex: "2 1 240px" }}>
              <label className="form-label-ims">Product</label>
              <ProductAutocomplete
                onSelect={(p) => {
                  setFoundProduct(p);
                  setErrors({});
                }}
                placeholder="Type product name or code..."
                error={errors.product}
              />
            </div>
            <div style={{ flex: "1 1 110px" }}>
              <label className="form-label-ims">Quantity</label>
              <input
                type="number"
                min="1"
                className={`form-control-ims${errors.qty ? " is-invalid" : ""}`}
                value={qty}
                onChange={(e) => setQty(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleAddItem()}
              />
              {errors.qty && (
                <div className="invalid-feedback-ims">⚠ {errors.qty}</div>
              )}
            </div>
            <button className="btn-primary-ims" onClick={handleAddItem}>
              + Add
            </button>
          </div>
          {foundProduct && (
            <div
              className="alert-ims alert-info"
              style={{ marginTop: 12, marginBottom: 0 }}
            >
              📦 <strong>{foundProduct.name}</strong> —{" "}
              {foundProduct.price.toLocaleString()} VND &nbsp;|&nbsp; Stock:{" "}
              {foundProduct.quantity}
            </div>
          )}
        </div>

        {/* Items table */}
        {items.length > 0 && (
          <>
            <div
              className="card-box"
              style={{ padding: 0, overflow: "hidden", marginBottom: 16 }}
            >
              <div className="table-toolbar">
                <span className="table-toolbar-title">Receipt Items</span>
                <span className="table-toolbar-meta">
                  {items.length} item(s)
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
                  {items.map((i) => (
                    <tr key={i.productId}>
                      <td>{i.productName}</td>
                      <td>
                        <div
                          style={{
                            display: "flex",
                            alignItems: "center",
                            gap: 6,
                          }}
                        >
                          <button
                            className="btn-secondary-ims"
                            style={{
                              padding: "2px 8px",
                              fontSize: 14,
                              lineHeight: 1,
                            }}
                            onClick={() =>
                              updateItemQty(i.productId, i.quantity - 1)
                            }
                          >
                            −
                          </button>
                          <span
                            style={{
                              minWidth: 28,
                              textAlign: "center",
                              fontWeight: 600,
                            }}
                          >
                            {i.quantity}
                          </span>
                          <button
                            className="btn-secondary-ims"
                            style={{
                              padding: "2px 8px",
                              fontSize: 14,
                              lineHeight: 1,
                            }}
                            onClick={() =>
                              updateItemQty(i.productId, i.quantity + 1)
                            }
                            disabled={i.quantity >= i.maxStock}
                          >
                            +
                          </button>
                        </div>
                      </td>
                      <td>{i.unitPrice.toLocaleString()}</td>
                      <td style={{ fontWeight: 600 }}>
                        {(i.quantity * i.unitPrice).toLocaleString()}
                      </td>
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
              <button
                className="btn-secondary-ims"
                onClick={() => navigate("/")}
              >
                Cancel
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default GenerateReceipt;
