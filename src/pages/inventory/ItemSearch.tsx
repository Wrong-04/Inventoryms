import { useEffect, useState } from "react";
import axios from "axios";
import Pagination from "../../components/Pagination";
import ProductAutocomplete, {
  Product,
} from "../../components/ProductAutocomplete";

const CATEGORIES = [
  "All Categories",
  "Electronics",
  "Consumables",
  "Stationery",
  "Other",
];
const PAGE_SIZE = 10;

const ItemSearch = () => {
  const [products, setProducts] = useState<Product[]>([]);
  const [category, setCategory] = useState("All Categories");
  const [filtered, setFiltered] = useState<Product[]>([]);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [page, setPage] = useState(1);
  const [sortKey, setSortKey] = useState<keyof Product>("productCode");
  const [sortDir, setSortDir] = useState<"asc" | "desc">("asc");

  useEffect(() => {
    axios.get<Product[]>("http://localhost:9999/products").then((r) => {
      setProducts(r.data);
      setFiltered(r.data.filter((p) => p.status === "active"));
    });
  }, []);

  const filterByCategory = (c: string, prods?: Product[]) => {
    const base = (prods || products).filter((p) => p.status === "active");
    const result =
      c === "All Categories" ? base : base.filter((p) => p.category === c);
    setFiltered(result);
    setPage(1);
  };

  const handleSelect = (p: Product) => {
    setSelectedProduct(p);
    // highlight in table
    setFiltered([p]);
    setPage(1);
  };

  const handleClearSelection = () => {
    setSelectedProduct(null);
    filterByCategory(category);
  };

  const handleSort = (key: keyof Product) => {
    if (sortKey === key) setSortDir((d) => (d === "asc" ? "desc" : "asc"));
    else {
      setSortKey(key);
      setSortDir("asc");
    }
  };

  const sorted = [...filtered].sort((a, b) => {
    const av = a[sortKey];
    const bv = b[sortKey];
    if (typeof av === "number" && typeof bv === "number")
      return sortDir === "asc" ? av - bv : bv - av;
    return sortDir === "asc"
      ? String(av || "").localeCompare(String(bv || ""))
      : String(bv || "").localeCompare(String(av || ""));
  });

  const totalPages = Math.ceil(sorted.length / PAGE_SIZE);
  const paginated = sorted.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  const stockBadge = (qty: number) => {
    if (qty === 0)
      return (
        <span className="badge-status badge-outofstock">Out of Stock</span>
      );
    if (qty <= 10)
      return <span className="badge-status badge-lowstock">Low Stock</span>;
    return <span className="badge-status badge-instock">In Stock</span>;
  };

  const SortIcon = ({ k }: { k: keyof Product }) => {
    if (sortKey !== k)
      return <span style={{ opacity: 0.3, marginLeft: 4 }}>↕</span>;
    return (
      <span style={{ marginLeft: 4 }}>{sortDir === "asc" ? "↑" : "↓"}</span>
    );
  };

  const COLS: { key: keyof Product; label: string }[] = [
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
        <div className="page-header-left">
          <div className="page-header-icon" style={{ background: "#eff6ff" }}>
            📦
          </div>
          <div>
            <h4 style={{ margin: 0 }}>Item Search</h4>
            <div className="page-header-sub">Search and browse inventory</div>
          </div>
        </div>
      </div>

      <div className="card-box" style={{ marginBottom: 16 }}>
        <div
          style={{
            display: "flex",
            gap: 12,
            alignItems: "flex-end",
            flexWrap: "wrap",
          }}
        >
          <div style={{ flex: "2 1 260px" }}>
            <label className="form-label-ims">
              Quick Search (autocomplete)
            </label>
            <ProductAutocomplete
              onSelect={handleSelect}
              placeholder="Type product name or code..."
              activeOnly={false}
            />
          </div>
          <div style={{ flex: "1 1 180px" }}>
            <label className="form-label-ims">Filter by Category</label>
            <select
              className="form-select-ims"
              value={category}
              onChange={(e) => {
                setCategory(e.target.value);
                setSelectedProduct(null);
                filterByCategory(e.target.value);
              }}
            >
              {CATEGORIES.map((c) => (
                <option key={c}>{c}</option>
              ))}
            </select>
          </div>
          {selectedProduct && (
            <button
              className="btn-secondary-ims"
              onClick={handleClearSelection}
            >
              ✕ Clear Selection
            </button>
          )}
        </div>

        {/* Selected product detail card */}
        {selectedProduct && (
          <div
            style={{
              marginTop: 16,
              background: "#f0fdf4",
              border: "1.5px solid #86efac",
              borderRadius: 10,
              padding: "14px 18px",
              display: "flex",
              alignItems: "center",
              gap: 16,
            }}
          >
            <div
              style={{
                width: 44,
                height: 44,
                borderRadius: 10,
                background: "#dcfce7",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontSize: 22,
                flexShrink: 0,
              }}
            >
              📦
            </div>
            <div style={{ flex: 1 }}>
              <div style={{ fontWeight: 700, fontSize: 15, color: "#15803d" }}>
                {selectedProduct.name}
              </div>
              <div style={{ fontSize: 12.5, color: "#64748b", marginTop: 3 }}>
                <span style={{ fontWeight: 600, color: "#2563eb" }}>
                  {selectedProduct.productCode}
                </span>
                &nbsp;·&nbsp;{selectedProduct.category}
                &nbsp;·&nbsp;{selectedProduct.price.toLocaleString()} VND
                {selectedProduct.expiryDate && (
                  <>
                    &nbsp;·&nbsp;Expiry:{" "}
                    <span style={{ color: "#dc2626" }}>
                      {selectedProduct.expiryDate}
                    </span>
                  </>
                )}
              </div>
            </div>
            <div style={{ textAlign: "right" }}>
              <div
                style={{
                  fontSize: 11,
                  fontWeight: 700,
                  color: "#94a3b8",
                  textTransform: "uppercase",
                }}
              >
                Stock
              </div>
              <div
                style={{
                  fontSize: 22,
                  fontWeight: 800,
                  color: selectedProduct.quantity <= 10 ? "#dc2626" : "#16a34a",
                }}
              >
                {selectedProduct.quantity}
              </div>
              <div>{stockBadge(selectedProduct.quantity)}</div>
            </div>
          </div>
        )}
      </div>

      <div className="card-box" style={{ padding: 0, overflow: "hidden" }}>
        <div className="table-toolbar">
          <span className="table-toolbar-title">
            {selectedProduct
              ? `Showing: ${selectedProduct.name}`
              : "All Products"}
          </span>
          <span className="table-toolbar-meta">
            {filtered.length} product(s) — click headers to sort
          </span>
        </div>
        {!selectedProduct && filtered.length > 50 && (
          <div
            className="alert-ims"
            style={{
              margin: "0 16px 0",
              background: "#fffbeb",
              border: "1px solid #fcd34d",
              borderRadius: 6,
              padding: "8px 12px",
              fontSize: 13,
              color: "#92400e",
            }}
          >
            ⚠ Too many results ({filtered.length}). Consider filtering by
            category or using the search above.
          </div>
        )}
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
            {paginated.length === 0 && (
              <tr>
                <td colSpan={7}>
                  <div className="empty-state">
                    <div className="empty-icon">🔍</div>
                    <p>No products found.</p>
                  </div>
                </td>
              </tr>
            )}
            {paginated.map((p) => (
              <tr
                key={p.id}
                style={
                  selectedProduct?.id === p.id ? { background: "#f0fdf4" } : {}
                }
              >
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
    </div>
  );
};

export default ItemSearch;
