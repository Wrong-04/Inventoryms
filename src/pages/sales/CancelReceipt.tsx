import { useEffect, useState } from "react";
import axios from "axios";
import { getUser, addLog } from "../../utils/auth";
import { toast } from "../../utils/toast";
import ConfirmModal from "../../components/ConfirmModal";
import Pagination from "../../components/Pagination";

const PAGE_SIZE = 8;

interface ReceiptItem {
  productId: string;
  productName: string;
  quantity: number;
  unitPrice: number;
}
interface Receipt {
  id: string;
  receiptCode: string;
  customerId: string;
  total: number;
  status: string;
  createdBy: string;
  createdAt: string;
  items: ReceiptItem[];
}
interface Customer {
  id: string;
  name: string;
}

const CancelReceipt = () => {
  const user = getUser();
  const [receipts, setReceipts] = useState<Receipt[]>([]);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [confirm, setConfirm] = useState<any>({ show: false });
  const [confirmLoading, setConfirmLoading] = useState(false);
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const load = async () => {
    const url =
      user?.role === "manager" || user?.role === "admin"
        ? "http://localhost:9999/receipts"
        : `http://localhost:9999/receipts?createdBy=${user?.id}`;
    const [r, c] = await Promise.all([
      axios.get<Receipt[]>(url),
      axios.get<Customer[]>("http://localhost:9999/customers"),
    ]);
    setReceipts(r.data);
    setCustomers(c.data);
  };

  useEffect(() => {
    load();
  }, []);

  const getCustomerName = (id: string) =>
    customers.find((c) => c.id === id)?.name || id;

  const filtered = receipts.filter(
    (r) =>
      !search || r.receiptCode.toLowerCase().includes(search.toLowerCase()),
  );

  const totalPages = Math.ceil(filtered.length / PAGE_SIZE);
  const paginated = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  const handleCancelClick = (receipt: Receipt) => {
    setConfirm({
      show: true,
      title: "Cancel Receipt",
      message: `Cancel receipt ${receipt.receiptCode} (${receipt.items?.length || 0} item(s), total ${receipt.total.toLocaleString()} VND)? Stock will be restored automatically.`,
      onConfirm: async () => {
        setConfirmLoading(true);
        try {
          for (const item of receipt.items) {
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
          await axios.patch(`http://localhost:9999/receipts/${receipt.id}`, {
            status: "cancelled",
          });
          await addLog(
            "Cancel Receipt",
            `Cancelled receipt ${receipt.receiptCode}`,
          );
          toast.success(
            `Receipt ${receipt.receiptCode} cancelled. Stock restored.`,
          );
          load();
        } catch {
          toast.error("Failed to cancel receipt.");
        } finally {
          setConfirmLoading(false);
          setConfirm({ show: false });
        }
      },
    });
  };

  const statusClass = (s: string) => {
    if (s === "completed") return "badge-status badge-completed";
    if (s === "cancelled") return "badge-status badge-cancelled";
    return "badge-status badge-pending";
  };

  return (
    <div>
      <div className="page-header">
        <div className="page-header-left">
          <div className="page-header-icon" style={{ background: "#fef2f2" }}>
            ❌
          </div>
          <div>
            <h4 style={{ margin: 0 }}>Cancel Receipt</h4>
            <div className="page-header-sub">
              {user?.role === "manager" || user?.role === "admin"
                ? "All receipts"
                : "Your receipts"}
            </div>
          </div>
        </div>
      </div>

      <div className="card-box" style={{ marginBottom: 16 }}>
        <input
          className="form-control-ims"
          style={{ maxWidth: 280 }}
          placeholder="Search by receipt code..."
          value={search}
          onChange={(e) => {
            setSearch(e.target.value);
            setPage(1);
          }}
        />
      </div>

      <div className="card-box" style={{ padding: 0, overflow: "hidden" }}>
        <div className="table-toolbar">
          <span className="table-toolbar-title">Receipts</span>
          <span className="table-toolbar-meta">
            {filtered.length} receipt(s)
          </span>
        </div>
        <table className="ims-table">
          <thead>
            <tr>
              <th>#</th>
              <th>Receipt Code</th>
              <th>Customer</th>
              <th>Total (VND)</th>
              <th>Date</th>
              <th>Status</th>
              <th>Items</th>
              <th>Action</th>
            </tr>
          </thead>
          <tbody>
            {paginated.length === 0 && (
              <tr>
                <td colSpan={8}>
                  <div className="empty-state">
                    <div className="empty-icon">🧾</div>
                    <p>No receipts found</p>
                  </div>
                </td>
              </tr>
            )}
            {paginated.map((r, idx) => (
              <>
                <tr key={r.id}>
                  <td>{(page - 1) * PAGE_SIZE + idx + 1}</td>
                  <td style={{ fontWeight: 600 }}>{r.receiptCode}</td>
                  <td>{getCustomerName(r.customerId)}</td>
                  <td>{r.total.toLocaleString()}</td>
                  <td>{new Date(r.createdAt).toLocaleDateString()}</td>
                  <td>
                    <span className={statusClass(r.status)}>{r.status}</span>
                  </td>
                  <td>
                    <button
                      className="btn-secondary-ims"
                      style={{ padding: "4px 10px", fontSize: 12 }}
                      onClick={() =>
                        setExpandedId(expandedId === r.id ? null : r.id)
                      }
                    >
                      {expandedId === r.id ? "▲ Hide" : "▼ View"}
                    </button>
                  </td>
                  <td>
                    {r.status === "completed" ? (
                      <button
                        className="btn-danger-ims"
                        onClick={() => handleCancelClick(r)}
                      >
                        Cancel
                      </button>
                    ) : (
                      <span className="text-muted-ims">—</span>
                    )}
                  </td>
                </tr>
                {expandedId === r.id && (
                  <tr key={`${r.id}-detail`}>
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
                          {(r.items || []).map((item, i) => (
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
          total={filtered.length}
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

export default CancelReceipt;
