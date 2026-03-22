import { useEffect, useState } from "react";
import axios from "axios";
import Pagination from "../../components/Pagination";

const CATEGORIES = [
  "All Categories",
  "Electronics",
  "Consumables",
  "Stationery",
  "Other",
];
const PAGE_SIZE = 10;

const ItemSearch = () => {
  const [products, setProducts] = useState([]);
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("All Categories");
  const [filtered, setFiltered] = useState([]);
  const [searched, setSearched] = useState(false);
  const [warning, setWarning] = useState("");
  const [page, setPage] = useState(1);
  const [sortKey, setSortKey] = useState("productCode");
  const [sortDir, setSortDir] = useState("asc");

  useEffect(() => {
    axios
      .get("http://localhost:9999/products")
      .then((r) => setProducts(r.data));
  }, []);

  const runFilter = (s, c, prods) => {
    setWarning("");
    let results = (prods || products).filter((p) => p.status === "active");
    if (s)
      results = results.filter(
        (p) =>
          p.name.toLowerCase().includes(s.toLowerCase()) || p.productCode === s,
      );
    if (c !== "All Categories")
      results = results.filter((p) => p.category === c);
    if (results.length === 0)
      setWarning("No products found matching your search.");
    setFiltered(results);
    setPage(1);
  };

  const handleSearch = () => {
    setSearched(true);
    runFilter(search, category);
  };
  const handleReset = () => {
    setSearch("");
    setCategory("All Categories");
    setFiltered([]);
    setSearched(false);
    setWarning("");
    setPage(1);
  };

  const handleSort = (key) => {
    if (sortKey === key) setSortDir((d) => (d === "asc" ? "desc" : "asc"));
    else {
      setSortKey(key);
      setSortDir("asc");
    }
  };

  const sorted = [...filtered].sort((a, b) => {
    const av = a[sortKey];
    const bv = b[sortKey];
    if (typeof av === "number") return sortDir === "asc" ? av - bv : bv - av;
    return sortDir === "asc"
      ? String(av || "").localeCompare(String(bv || ""))
      : String(bv || "").localeCompare(String(av || ""));
  });

  const totalPages = Math.ceil(sorted.length / PAGE_SIZE);
  const paginated = sorted.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  const stockBadge = (qty) => {
    if (qty === 0)
      return (
        <span className="badge-status badge-outofstock">Out of Stock</span>
      );
    if (qty <= 10)
      return <span className="badge-status badge-lowstock">Low Stock</span>;
    return <span className="badge-status badge-instock">In Stock</span>;
  };

  const SortIcon = ({ k }) => {
    if (sortKey !== k)
      return <span style={{ opacity: 0.3, marginLeft: 4 }}>↕</span>;
    return (
      <span style={{ marginLeft: 4 }}>{sortDir === "asc" ? "↑" : "↓"}</span>
    );
  };

  const COLS = [
    { key: "productCode", label: "Code" },
    { key: "name", label: "Name" },
    { key: "category", label: "Category" },
    { key: "quantity", label: "Qty" },
    { key: "price", label: "Price (VND)" },
    { key: "expiryDate", label: "Expiry" },
  ];

  return (
    <div>
      <div className="page-header">
        <h4>📦 Inventory – Item Search</h4>
      </div>

      <div className="card-box">
        <div
          style={{
            display: "flex",
            gap: 12,
            alignItems: "flex-end",
            flexWrap: "wrap",
          }}
        >
          <div>
            <label className="form-label-ims">Search Keyword</label>
            <input
              className="form-control-ims"
              style={{ width: 240 }}
              placeholder="Product name or code..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleSearch()}
            />
          </div>
          <div>
            <label className="form-label-ims">Category</label>
            <select
              className="form-select-ims"
              style={{ width: 180 }}
              value={category}
              onChange={(e) => setCategory(e.target.value)}
            >
              {CATEGORIES.map((c) => (
                <option key={c}>{c}</option>
              ))}
            </select>
          </div>
          <button className="btn-primary-ims" onClick={handleSearch}>
            🔍 Search
          </button>
          <button className="btn-secondary-ims" onClick={handleReset}>
            Reset
          </button>
        </div>
      </div>

      {warning && (
        <div
          className={`alert-ims ${warning.startsWith("No") ? "alert-info" : "alert-warning"}`}
        >
          {warning}
        </div>
      )}

      {searched && filtered.length > 0 && (
        <div className="card-box" style={{ padding: 0, overflow: "hidden" }}>
          <div className="table-toolbar">
            <span className="table-toolbar-title">Search Results</span>
            <span className="table-toolbar-meta">
              {filtered.length} product(s) found — click headers to sort
            </span>
          </div>
          <table className="ims-table">
            <thead>
              <tr>
                {COLS.map(({ key, label }) => (
                  <th
                    key={key}
                    className="sortable"
                    onClick={() => handleSort(key)}
                  >
                    {label}
                    <SortIcon k={key} />
                  </th>
                ))}
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {paginated.map((p) => (
                <tr key={p.id}>
                  <td style={{ fontWeight: 600 }}>{p.productCode}</td>
                  <td>{p.name}</td>
                  <td>{p.category}</td>
                  <td>{p.quantity}</td>
                  <td>{p.price.toLocaleString()}</td>
                  <td style={{ color: p.expiryDate ? "#dc2626" : "#9ca3af" }}>
                    {p.expiryDate || "N/A"}
                  </td>
                  <td>{stockBadge(p.quantity)}</td>
                </tr>
              ))}
            </tbody>
          </table>
          <Pagination
            page={page}
            totalPages={totalPages}
            onChange={setPage}
            total={sorted.length}
            pageSize={PAGE_SIZE}
          />
        </div>
      )}

      {searched && filtered.length === 0 && !warning && (
        <div className="card-box">
          <div className="empty-state">
            <div className="empty-icon">🔍</div>
            <p>No products found. Try a different keyword.</p>
          </div>
        </div>
      )}
    </div>
  );
};

export default ItemSearch;
