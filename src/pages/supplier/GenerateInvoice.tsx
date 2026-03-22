import { useEffect, useState } from "react";
import axios from "axios";
import { addLog } from "../../utils/auth";
import { toast } from "../../utils/toast";
import ConfirmModal from "../../components/ConfirmModal";

interface OrderItem {
  productId: string;
  productName: string;
  quantity: number;
  unitPrice: number;
}
interface Order {
  id: string;
  orderCode: string;
  supplierId: string;
  total: number;
  status: string;
  createdAt: string;
  items: OrderItem[];
}
interface Supplier {
  id: string;
  name: string;
}
interface Invoice {
  id: string;
  orderId: string;
}

const GenerateInvoice = () => {
  const [orders, setOrders] = useState<Order[]>([]);
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [confirm, setConfirm] = useState<any>({ show: false });
  const [confirmLoading, setConfirmLoading] = useState(false);
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const load = () =>
    Promise.all([
      axios.get<Order[]>("http://localhost:9999/orders"),
      axios.get<Supplier[]>("http://localhost:9999/suppliers"),
      axios.get<Invoice[]>("http://localhost:9999/invoices"),
    ]).then(([o, s, i]) => {
      setOrders(o.data);
      setSuppliers(s.data);
      setInvoices(i.data);
    });

  useEffect(() => {
    load();
  }, []);

  const getSupplierName = (id: string) =>
    suppliers.find((s) => s.id === id)?.name || id;
  const hasInvoice = (orderId: string) =>
    invoices.some((i) => i.orderId === orderId);

  const handleGenerateClick = (order: Order) => {
    setConfirm({
      show: true,
      title: "Generate Invoice",
      message: `Generate invoice for order ${order.orderCode}? Total: ${order.total.toLocaleString()} VND`,
      variant: "primary",
      onConfirm: async () => {
        setConfirmLoading(true);
        try {
          const allRes = await axios.get<Invoice[]>(
            "http://localhost:9999/invoices",
          );
          const code = "INV" + String(allRes.data.length + 1).padStart(3, "0");
          await axios.post("http://localhost:9999/invoices", {
            invoiceCode: code,
            orderId: order.id,
            total: order.total,
            createdAt: new Date().toISOString(),
          });
          await axios.patch(`http://localhost:9999/orders/${order.id}`, {
            status: "invoiced",
          });
          await addLog(
            "Generate Invoice",
            `Generated invoice ${code} for order ${order.orderCode}`,
          );
          toast.success(
            `Invoice ${code} generated for order ${order.orderCode}.`,
          );
          load();
        } catch {
          toast.error("Failed to generate invoice.");
        } finally {
          setConfirmLoading(false);
          setConfirm({ show: false });
        }
      },
    });
  };

  const handleReceiveClick = (order: Order) => {
    setConfirm({
      show: true,
      title: "Confirm Goods Received",
      message: `Confirm receiving goods for order ${order.orderCode}? Stock will be updated automatically for ${order.items?.length || 0} item(s).`,
      variant: "primary",
      onConfirm: async () => {
        setConfirmLoading(true);
        try {
          for (const item of order.items || []) {
            const pRes = await axios.get<{ quantity: number }>(
              `http://localhost:9999/products/${item.productId}`,
            );
            await axios.patch(
              `http://localhost:9999/products/${item.productId}`,
              {
                quantity: pRes.data.quantity + item.quantity,
              },
            );
          }
          await axios.patch(`http://localhost:9999/orders/${order.id}`, {
            status: "received",
          });
          await addLog(
            "Receive Goods",
            `Received goods for order ${order.orderCode}`,
          );
          toast.success(
            `Goods received for order ${order.orderCode}. Stock updated.`,
          );
          load();
        } catch {
          toast.error("Failed to receive goods.");
        } finally {
          setConfirmLoading(false);
          setConfirm({ show: false });
        }
      },
    });
  };

  const statusBadge = (s: string) => {
    if (s === "received") return "badge-status badge-completed";
    if (s === "invoiced") return "badge-status badge-invoiced";
    if (s === "pending") return "badge-status badge-pending";
    return "badge-status badge-active";
  };

  return (
    <div>
      <div className="page-header">
        <div className="page-header-left">
          <div className="page-header-icon" style={{ background: "#f0fdf4" }}>
            🧾
          </div>
          <div>
            <h4 style={{ margin: 0 }}>Generate Supplier Invoice</h4>
            <div className="page-header-sub">
              Invoice orders then confirm goods received
            </div>
          </div>
        </div>
      </div>

      {/* Flow hint */}
      <div
        style={{
          display: "flex",
          gap: 8,
          alignItems: "center",
          marginBottom: 16,
          fontSize: 13,
          color: "#64748b",
        }}
      >
        <span className="badge-status badge-pending">Pending</span>
        <span>→</span>
        <span className="badge-status badge-invoiced">Invoiced</span>
        <span>→</span>
        <span className="badge-status badge-completed">Received</span>
        <span style={{ marginLeft: 8, color: "#94a3b8" }}>
          Stock is updated only after "Receive Goods"
        </span>
      </div>

      <div className="card-box" style={{ padding: 0, overflow: "hidden" }}>
        <div className="table-toolbar">
          <span className="table-toolbar-title">Purchase Orders</span>
          <span className="table-toolbar-meta">{orders.length} order(s)</span>
        </div>
        <table className="ims-table">
          <thead>
            <tr>
              <th>#</th>
              <th>Order Code</th>
              <th>Supplier</th>
              <th>Total (VND)</th>
              <th>Date</th>
              <th>Status</th>
              <th>Items</th>
              <th>Action</th>
            </tr>
          </thead>
          <tbody>
            {orders.length === 0 && (
              <tr>
                <td colSpan={8}>
                  <div className="empty-state">
                    <div className="empty-icon">🛒</div>
                    <p>No orders found</p>
                  </div>
                </td>
              </tr>
            )}
            {orders.map((o, idx) => (
              <>
                <tr key={o.id}>
                  <td>{idx + 1}</td>
                  <td style={{ fontWeight: 600 }}>{o.orderCode}</td>
                  <td>{getSupplierName(o.supplierId)}</td>
                  <td>{o.total.toLocaleString()}</td>
                  <td>{new Date(o.createdAt).toLocaleDateString()}</td>
                  <td>
                    <span className={statusBadge(o.status)}>{o.status}</span>
                  </td>
                  <td>
                    <button
                      className="btn-secondary-ims"
                      style={{ padding: "4px 10px", fontSize: 12 }}
                      onClick={() =>
                        setExpandedId(expandedId === o.id ? null : o.id)
                      }
                    >
                      {expandedId === o.id ? "▲ Hide" : "▼ View"}
                    </button>
                  </td>
                  <td>
                    {o.status === "pending" && !hasInvoice(o.id) && (
                      <button
                        className="btn-primary-ims"
                        style={{ padding: "5px 12px", fontSize: 13 }}
                        onClick={() => handleGenerateClick(o)}
                      >
                        Generate Invoice
                      </button>
                    )}
                    {o.status === "invoiced" && (
                      <button
                        className="btn-primary-ims"
                        style={{
                          padding: "5px 12px",
                          fontSize: 13,
                          background: "#16a34a",
                        }}
                        onClick={() => handleReceiveClick(o)}
                      >
                        ✓ Receive Goods
                      </button>
                    )}
                    {o.status === "received" && (
                      <span className="text-success-ims">✓ Completed</span>
                    )}
                  </td>
                </tr>
                {expandedId === o.id && (
                  <tr key={`${o.id}-detail`}>
                    <td
                      colSpan={8}
                      style={{ background: "#f8fafc", padding: "12px 20px" }}
                    >
                      <table
                        style={{
                          width: "100%",
                          fontSize: 13,
                          borderCollapse: "collapse",
                        }}
                      >
                        <thead>
                          <tr style={{ color: "#64748b" }}>
                            <th style={{ textAlign: "left", paddingBottom: 6 }}>
                              Product
                            </th>
                            <th
                              style={{ textAlign: "right", paddingBottom: 6 }}
                            >
                              Qty
                            </th>
                            <th
                              style={{ textAlign: "right", paddingBottom: 6 }}
                            >
                              Unit Price
                            </th>
                            <th
                              style={{ textAlign: "right", paddingBottom: 6 }}
                            >
                              Subtotal
                            </th>
                          </tr>
                        </thead>
                        <tbody>
                          {(o.items || []).map((item, i) => (
                            <tr
                              key={i}
                              style={{ borderTop: "1px solid #e2e8f0" }}
                            >
                              <td style={{ padding: "5px 0" }}>
                                {item.productName}
                              </td>
                              <td style={{ textAlign: "right" }}>
                                {item.quantity}
                              </td>
                              <td style={{ textAlign: "right" }}>
                                {item.unitPrice.toLocaleString()}
                              </td>
                              <td
                                style={{ textAlign: "right", fontWeight: 600 }}
                              >
                                {(
                                  item.quantity * item.unitPrice
                                ).toLocaleString()}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </td>
                  </tr>
                )}
              </>
            ))}
          </tbody>
        </table>
      </div>

      <ConfirmModal
        {...confirm}
        loading={confirmLoading}
        onClose={() => setConfirm({ show: false })}
      />
    </div>
  );
};

export default GenerateInvoice;
