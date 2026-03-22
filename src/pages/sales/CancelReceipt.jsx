import { useEffect, useState } from "react";
import axios from "axios";
import { getUser, addLog } from "../../utils/auth";
import { toast } from "../../utils/toast";
import ConfirmModal from "../../components/ConfirmModal";
import Pagination from "../../components/Pagination";

const PAGE_SIZE = 8;

const CancelReceipt = () => {
  const user = getUser();
  const [receipts, setReceipts] = useState([]);
  const [customers, setCustomers] = useState([]);
  const [page, setPage] = useState(1);
  const [confirm, setConfirm] = useState({ show: false });
  const [confirmLoading, setConfirmLoading] = useState(false);

  const load = async () => {
    const [r, c] = await Promise.all([
      axios.get(`http://localhost:9999/receipts?createdBy=${user.id}`),
      axios.get("http://localhost:9999/customers"),
    ]);
    setReceipts(r.data);
    setCustomers(c.data);
  };

  useEffect(() => {
    load();
  }, []);

  const getCustomerName = (id) =>
    customers.find((c) => c.id === id)?.name || id;

  const handleCancelClick = (receipt) => {
    setConfirm({
      show: true,
      title: "Cancel Receipt",
      message: `Cancel receipt ${receipt.receiptCode}? Stock will be restored automatically.`,
      onConfirm: async () => {
        setConfirmLoading(true);
        try {
          for (const item of receipt.items) {
            const pRes = await axios.get(
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

  const statusClass = (s) => {
    if (s === "completed") return "badge-status badge-completed";
    if (s === "cancelled") return "badge-status badge-cancelled";
    return "badge-status badge-pending";
  };

  const totalPages = Math.ceil(receipts.length / PAGE_SIZE);
  const paginated = receipts.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  return (
    <div>
      <div className="page-header">
        <h4>❌ Cancel Receipt</h4>
      </div>

      <div className="card-box" style={{ padding: 0, overflow: "hidden" }}>
        <div className="table-toolbar">
          <span className="table-toolbar-title">My Receipts</span>
          <span className="table-toolbar-meta">
            {receipts.length} receipt(s)
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
              <th>Action</th>
            </tr>
          </thead>
          <tbody>
            {paginated.length === 0 && (
              <tr>
                <td colSpan={7}>
                  <div className="empty-state">
                    <div className="empty-icon">🧾</div>
                    <p>No receipts found</p>
                  </div>
                </td>
              </tr>
            )}
            {paginated.map((r, idx) => (
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
            ))}
          </tbody>
        </table>
        <Pagination
          page={page}
          totalPages={totalPages}
          onChange={setPage}
          total={receipts.length}
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
