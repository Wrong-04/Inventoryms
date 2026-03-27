import { useEffect, useState } from "react";
import axios from "axios";
import { addLog } from "../../utils/auth";
import { toast } from "../../utils/toast";
import ConfirmModal from "../../components/ConfirmModal";

import Pagination from "../../components/Pagination";

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
  const [filterStatus, setFilterStatus] = useState("all");
  const [filterSupplier, setFilterSupplier] = useState("");
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const PAGE_SIZE = 8;

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

  const filteredOrders = orders.filter((o) => {
    if (filterStatus !== "all" && o.status !== filterStatus) return false;
    if (filterSupplier && o.supplierId !== filterSupplier) return false;
    if (search && !o.orderCode.toLowerCase().includes(search.toLowerCase()))
      return false;
    return true;
  });

  const totalPages = Math.ceil(filteredOrders.length / PAGE_SIZE);
  const paginated = filteredOrders.slice(
    (page - 1) * PAGE_SIZE,
    page * PAGE_SIZE,
  );

  const handleGenerateClick = (order: Order) => {
    setConfirm({
      show: true,
      title: "Generate Invoice & Receive Goods",
      message: `Generate invoice for order ${order.orderCode} and update stock automatically? Total: ${order.total.toLocaleString()} VND`,
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
          // Update stock for each item
          for (const item of order.items || []) {
            const pRes = await axios.get<{ quantity: number }>(
              `http://localhost:9999/products/${item.productId}`,
            );
            await axios.patch(
              `http://localhost:9999/products/${item.productId}`,
              { quantity: pRes.data.quantity + item.quantity },
            );
          }
          await axios.patch(`http://localhost:9999/orders/${order.id}`, {
            status: "received",
          });
          await addLog(
            "Generate Invoice",
            `Generated invoice ${code} and received goods for order ${order.orderCode}`,
          );
          toast.success(
            `Invoice ${code} generated. Goods received & stock updated for order ${order.orderCode}.`,
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



  const statusBadge = (s: string) => {
    if (s === "received") return "badge-status badge-completed";
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

      <div className="card-box" style={{ marginBottom: 16 }}>
        <div
          style={{
            display: "flex",
            gap: 12,
            flexWrap: "wrap",
            alignItems: "flex-end",
          }}
        >
          <div style={{ flex: "1 1 200px" }}>
            <label className="form-label-ims">Search</label>
            <input
              className="form-control-ims"
              placeholder="Search by order code..."
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                setPage(1);
              }}
            />
          </div>
          <div>
            <label className="form-label-ims">Status</label>
            <select
              className="form-select-ims"
              style={{ width: 180 }}
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
            >
              <option value="all">All Status</option>
              <option value="pending">Pending</option>
              <option value="received">Received</option>
            </select>
          </div>
          <div>
            <label className="form-label-ims">Supplier</label>
            <select
              className="form-select-ims"
              style={{ width: 200 }}
              value={filterSupplier}
              onChange={(e) => setFilterSupplier(e.target.value)}
            >
              <option value="">All Suppliers</option>
              {suppliers.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.name}
                </option>
              ))}
            </select>
          </div>
          {(filterStatus !== "all" || filterSupplier || search) && (
            <button
              className="btn-secondary-ims"
              onClick={() => {
                setFilterStatus("all");
                setFilterSupplier("");
                setSearch("");
                setPage(1);
              }}
            >
              Reset
            </button>
          )}
        </div>
      </div>

      <div className="card-box" style={{ padding: 0, overflow: "hidden" }}>
        <div className="table-toolbar">
          <span className="table-toolbar-title">Purchase Orders</span>
          <span className="table-toolbar-meta">
            {filteredOrders.length} order(s)
          </span>{" "}
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
            {filteredOrders.length === 0 && (
              <tr>
                <td colSpan={8}>
                  <div className="empty-state">
                    <div className="empty-icon">🛒</div>
                    <p>No orders found</p>
                  </div>
                </td>
              </tr>
            )}
            {paginated.map((o, idx) => (
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
                    {o.status === "pending" && (
                      <button
                        className="btn-primary-ims"
                        style={{ padding: "5px 12px", fontSize: 13 }}
                        onClick={() => handleGenerateClick(o)}
                      >
                        🧾 Generate Invoice
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
        <Pagination
          page={page}
          totalPages={totalPages}
          onChange={setPage}
          total={filteredOrders.length}
          pageSize={PAGE_SIZE}
        />
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
