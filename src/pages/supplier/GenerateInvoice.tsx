import { useEffect, useState } from "react";
import axios from "axios";
import { addLog } from "../../utils/auth";
import { toast } from "../../utils/toast";
import ConfirmModal from "../../components/ConfirmModal";

const GenerateInvoice = () => {
  const [orders, setOrders] = useState([]);
  const [suppliers, setSuppliers] = useState([]);
  const [invoices, setInvoices] = useState([]);
  const [confirm, setConfirm] = useState({ show: false });
  const [confirmLoading, setConfirmLoading] = useState(false);

  const load = () =>
    Promise.all([
      axios.get("http://localhost:9999/orders"),
      axios.get("http://localhost:9999/suppliers"),
      axios.get("http://localhost:9999/invoices"),
    ]).then(([o, s, i]) => {
      setOrders(o.data);
      setSuppliers(s.data);
      setInvoices(i.data);
    });

  useEffect(() => {
    load();
  }, []);

  const getSupplierName = (id) =>
    suppliers.find((s) => s.id === id)?.name || id;
  const hasInvoice = (orderId) => invoices.some((i) => i.orderId === orderId);

  const handleGenerateClick = (order) => {
    setConfirm({
      show: true,
      title: "Generate Invoice",
      message: `Generate invoice for order ${order.orderCode}? Total: ${order.total.toLocaleString()} VND`,
      variant: "primary",
      onConfirm: async () => {
        setConfirmLoading(true);
        try {
          const allRes = await axios.get("http://localhost:9999/invoices");
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

  const statusBadge = (s) => {
    if (s === "invoiced") return "badge-status badge-invoiced";
    if (s === "pending") return "badge-status badge-pending";
    return "badge-status badge-active";
  };

  return (
    <div>
      <div className="page-header">
        <h4>🧾 Generate Supplier Invoice</h4>
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
              <th>Action</th>
            </tr>
          </thead>
          <tbody>
            {orders.length === 0 && (
              <tr>
                <td colSpan={7}>
                  <div className="empty-state">
                    <div className="empty-icon">🛒</div>
                    <p>No orders found</p>
                  </div>
                </td>
              </tr>
            )}
            {orders.map((o, idx) => (
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
                  {!hasInvoice(o.id) ? (
                    <button
                      className="btn-primary-ims"
                      style={{ padding: "5px 12px", fontSize: 13 }}
                      onClick={() => handleGenerateClick(o)}
                    >
                      Generate Invoice
                    </button>
                  ) : (
                    <span className="text-success-ims">✓ Invoiced</span>
                  )}
                </td>
              </tr>
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
