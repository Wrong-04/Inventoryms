import { useEffect, useState } from "react";
import axios from "axios";
import { addLog } from "../../utils/auth";
import { toast } from "../../utils/toast";
import ConfirmModal from "../../components/ConfirmModal";

const ExpiredGoods = () => {
  const [expired, setExpired] = useState([]);
  const [actions, setActions] = useState({});
  const [confirm, setConfirm] = useState({ show: false });
  const [confirmLoading, setConfirmLoading] = useState(false);

  const load = async () => {
    const res = await axios.get("http://localhost:9999/products?status=active");
    const today = new Date();
    const exp = res.data.filter(
      (p) => p.expiryDate && new Date(p.expiryDate) < today,
    );
    setExpired(exp);
    const init = {};
    exp.forEach((p) => {
      init[p.id] = "Remove";
    });
    setActions(init);
  };

  useEffect(() => {
    load();
  }, []);

  const handleConfirmClick = (product) => {
    const action = actions[product.id];
    setConfirm({
      show: true,
      title: action === "Remove" ? "Remove Expired Product" : "Mark as Expired",
      message: `${action === "Remove" ? "Remove" : "Mark"} "${product.name}" (expired: ${product.expiryDate})?`,
      onConfirm: async () => {
        setConfirmLoading(true);
        try {
          if (action === "Remove") {
            await axios.patch(`http://localhost:9999/products/${product.id}`, {
              status: "expired",
              quantity: 0,
            });
            await addLog(
              "Manage Expired Goods",
              `Removed expired product: ${product.name}`,
            );
          } else {
            await axios.patch(`http://localhost:9999/products/${product.id}`, {
              status: "expired",
            });
            await addLog(
              "Manage Expired Goods",
              `Marked as expired: ${product.name}`,
            );
          }
          toast.success(`Processed "${product.name}" successfully.`);
          load();
        } catch {
          toast.error("Failed to process product.");
        } finally {
          setConfirmLoading(false);
          setConfirm({ show: false });
        }
      },
    });
  };

  return (
    <div>
      <div className="page-header">
        <h4>⚠️ Manage Expired Goods</h4>
      </div>

      {expired.length === 0 ? (
        <div className="card-box">
          <div className="empty-state">
            <div className="empty-icon">✅</div>
            <p>
              No expired goods found. All products are within their expiry
              dates.
            </p>
          </div>
        </div>
      ) : (
        <>
          <div className="alert-ims alert-warning">
            ⚠ {expired.length} expired item(s) found. Please take action.
          </div>
          <div className="card-box" style={{ padding: 0, overflow: "hidden" }}>
            <table className="ims-table">
              <thead>
                <tr>
                  <th>Code</th>
                  <th>Name</th>
                  <th>Category</th>
                  <th>Quantity</th>
                  <th>Expiry Date</th>
                  <th>Action</th>
                  <th>Confirm</th>
                </tr>
              </thead>
              <tbody>
                {expired.map((p) => (
                  <tr key={p.id}>
                    <td>{p.productCode}</td>
                    <td>{p.name}</td>
                    <td>{p.category}</td>
                    <td>{p.quantity}</td>
                    <td>
                      <span className="badge-status badge-cancelled">
                        {p.expiryDate}
                      </span>
                    </td>
                    <td>
                      <select
                        className="form-select-ims"
                        style={{
                          width: 160,
                          padding: "5px 10px",
                          fontSize: 13,
                        }}
                        value={actions[p.id]}
                        onChange={(e) =>
                          setActions({ ...actions, [p.id]: e.target.value })
                        }
                      >
                        <option>Remove</option>
                        <option>Mark as Expired</option>
                      </select>
                    </td>
                    <td>
                      <button
                        className="btn-danger-ims"
                        onClick={() => handleConfirmClick(p)}
                      >
                        Confirm
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      )}

      <ConfirmModal
        {...confirm}
        loading={confirmLoading}
        onClose={() => setConfirm({ show: false })}
      />
    </div>
  );
};

export default ExpiredGoods;
