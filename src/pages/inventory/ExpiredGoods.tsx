import { useEffect, useState } from "react";
import axios from "axios";
import { addLog } from "../../utils/auth";
import { toast } from "../../utils/toast";
import ConfirmModal from "../../components/ConfirmModal";
import Pagination from "../../components/Pagination";

const PAGE_SIZE = 10;

interface Product {
  id: string;
  name: string;
  productCode: string;
  category: string;
  quantity: number;
  expiryDate: string;
}

const ExpiredGoods = () => {
  const [expired, setExpired] = useState<Product[]>([]);
  const [actions, setActions] = useState<Record<string, string>>({});
  const [confirm, setConfirm] = useState<any>({ show: false });
  const [confirmLoading, setConfirmLoading] = useState(false);
  const [search, setSearch] = useState("");
  const [filterCategory, setFilterCategory] = useState("");
  const [page, setPage] = useState(1);

  const load = async () => {
    const res = await axios.get<Product[]>(
      "http://localhost:9999/products?status=active",
    );
    const today = new Date();
    const exp = res.data.filter(
      (p) => p.expiryDate && new Date(p.expiryDate) < today,
    );
    setExpired(exp);
    const init: Record<string, string> = {};
    exp.forEach((p) => {
      init[p.id] = "Remove";
    });
    setActions(init);
  };

  useEffect(() => {
    load();
  }, []);

  const handleConfirmClick = (product: Product) => {
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

  const categories = [...new Set(expired.map((p) => p.category))];

  const filtered = expired.filter((p) => {
    const q = search.toLowerCase();
    const matchSearch =
      !q ||
      p.name.toLowerCase().includes(q) ||
      p.productCode.toLowerCase().includes(q);
    const matchCat = !filterCategory || p.category === filterCategory;
    return matchSearch && matchCat;
  });

  const totalPages = Math.ceil(filtered.length / PAGE_SIZE);
  const paginated = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  return (
    <div>
      <div className="page-header">
        <div className="page-header-left">
          <div className="page-header-icon" style={{ background: "#fef2f2" }}>
            ⚠️
          </div>
          <div>
            <h4 style={{ margin: 0 }}>Expired Goods</h4>
            <div className="page-header-sub">
              Manage products past their expiry date
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
          <div style={{ flex: "1 1 220px" }}>
            <label className="form-label-ims">Search</label>
            <input
              className="form-control-ims"
              placeholder="Search by name or code..."
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                setPage(1);
              }}
            />
          </div>
          <div>
            <label className="form-label-ims">Category</label>
            <select
              className="form-select-ims"
              style={{ width: 180 }}
              value={filterCategory}
              onChange={(e) => {
                setFilterCategory(e.target.value);
                setPage(1);
              }}
            >
              <option value="">All Categories</option>
              {categories.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>
          </div>
          {(search || filterCategory) && (
            <button
              className="btn-secondary-ims"
              onClick={() => {
                setSearch("");
                setFilterCategory("");
                setPage(1);
              }}
            >
              Reset
            </button>
          )}
        </div>
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
        <div className="card-box" style={{ padding: 0, overflow: "hidden" }}>
          <div className="table-toolbar">
            <span className="table-toolbar-title">Expired Products</span>
            <span className="table-toolbar-meta">
              {filtered.length} item(s)
              {expired.length !== filtered.length
                ? ` of ${expired.length}`
                : ""}
            </span>
          </div>
          {expired.length > 0 && filtered.length === 0 ? (
            <div className="empty-state">
              <div className="empty-icon">🔍</div>
              <p>No products match the filter.</p>
            </div>
          ) : (
            <>
              <table className="ims-table">
                <thead>
                  <tr>
                    <th>#</th>
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
                  {paginated.map((p, idx) => (
                    <tr key={p.id}>
                      <td>{(page - 1) * PAGE_SIZE + idx + 1}</td>
                      <td style={{ fontWeight: 600 }}>{p.productCode}</td>
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
              <Pagination
                page={page}
                totalPages={totalPages}
                onChange={setPage}
                total={filtered.length}
                pageSize={PAGE_SIZE}
              />
            </>
          )}
        </div>
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
