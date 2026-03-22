import { useState, useEffect, useRef } from "react";
import axios from "axios";

export interface Product {
  id: string;
  productCode: string;
  name: string;
  category: string;
  quantity: number;
  price: number;
  status: string;
  expiryDate: string | null;
  supplierId: string;
}

interface Props {
  onSelect: (product: Product) => void;
  placeholder?: string;
  error?: string;
  /** nếu true chỉ tìm sản phẩm active */
  activeOnly?: boolean;
}

const ProductAutocomplete = ({
  onSelect,
  placeholder = "Product name or code...",
  error,
  activeOnly = true,
}: Props) => {
  const [query, setQuery] = useState("");
  const [suggestions, setSuggestions] = useState<Product[]>([]);
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [selected, setSelected] = useState<Product | null>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const wrapRef = useRef<HTMLDivElement>(null);

  // close dropdown on outside click
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (wrapRef.current && !wrapRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const search = async (q: string) => {
    if (!q.trim()) {
      setSuggestions([]);
      setOpen(false);
      return;
    }
    setLoading(true);
    try {
      const res = await axios.get<Product[]>("http://localhost:9999/products");
      const lower = q.toLowerCase();
      let results = res.data.filter(
        (p) =>
          p.name.toLowerCase().includes(lower) ||
          p.productCode.toLowerCase().includes(lower),
      );
      if (activeOnly) results = results.filter((p) => p.status === "active");
      setSuggestions(results.slice(0, 8));
      setOpen(results.length > 0);
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setQuery(val);
    setSelected(null);
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => search(val), 220);
  };

  const handleSelect = (p: Product) => {
    setSelected(p);
    setQuery(`${p.productCode} — ${p.name}`);
    setSuggestions([]);
    setOpen(false);
    onSelect(p);
  };

  const handleClear = () => {
    setQuery("");
    setSelected(null);
    setSuggestions([]);
    setOpen(false);
  };

  const stockColor = (qty: number) =>
    qty === 0 ? "#dc2626" : qty <= 10 ? "#d97706" : "#16a34a";

  return (
    <div ref={wrapRef} style={{ position: "relative" }}>
      <div style={{ position: "relative" }}>
        <input
          className={`form-control-ims${error ? " is-invalid" : selected ? " is-valid-ims" : ""}`}
          value={query}
          onChange={handleChange}
          onFocus={() => suggestions.length > 0 && setOpen(true)}
          placeholder={placeholder}
          autoComplete="off"
          style={{ paddingRight: query ? 36 : undefined }}
        />
        {/* loading / clear icon */}
        <div
          style={{
            position: "absolute",
            right: 10,
            top: "50%",
            transform: "translateY(-50%)",
            display: "flex",
            alignItems: "center",
          }}
        >
          {loading && (
            <span
              className="btn-spinner-dark"
              style={{ width: 13, height: 13 }}
            />
          )}
          {!loading && query && (
            <button
              type="button"
              onClick={handleClear}
              style={{
                background: "none",
                border: "none",
                cursor: "pointer",
                color: "#94a3b8",
                fontSize: 16,
                padding: 0,
                lineHeight: 1,
                display: "flex",
              }}
            >
              ×
            </button>
          )}
        </div>
      </div>

      {/* Dropdown */}
      {open && suggestions.length > 0 && (
        <div
          style={{
            position: "absolute",
            top: "calc(100% + 4px)",
            left: 0,
            right: 0,
            background: "#fff",
            border: "1.5px solid #e2e8f0",
            borderRadius: 10,
            boxShadow: "0 8px 24px rgba(0,0,0,0.10)",
            zIndex: 200,
            overflow: "hidden",
          }}
        >
          {suggestions.map((p) => (
            <div
              key={p.id}
              onMouseDown={() => handleSelect(p)}
              style={{
                padding: "9px 14px",
                cursor: "pointer",
                display: "flex",
                alignItems: "center",
                gap: 12,
                transition: "background 0.1s",
                borderBottom: "1px solid #f1f5f9",
              }}
              onMouseEnter={(e) =>
                (e.currentTarget.style.background = "#f8fafc")
              }
              onMouseLeave={(e) => (e.currentTarget.style.background = "#fff")}
            >
              <div
                style={{
                  width: 32,
                  height: 32,
                  borderRadius: 8,
                  background: "#eff6ff",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontSize: 15,
                  flexShrink: 0,
                }}
              >
                📦
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div
                  style={{
                    fontWeight: 600,
                    fontSize: 13.5,
                    color: "#1a2332",
                    whiteSpace: "nowrap",
                    overflow: "hidden",
                    textOverflow: "ellipsis",
                  }}
                >
                  {p.name}
                </div>
                <div style={{ fontSize: 12, color: "#64748b", marginTop: 1 }}>
                  <span style={{ fontWeight: 600, color: "#2563eb" }}>
                    {p.productCode}
                  </span>
                  &nbsp;·&nbsp;{p.category}
                  &nbsp;·&nbsp;{p.price.toLocaleString()} VND
                </div>
              </div>
              <div style={{ textAlign: "right", flexShrink: 0 }}>
                <div
                  style={{
                    fontSize: 13,
                    fontWeight: 700,
                    color: stockColor(p.quantity),
                  }}
                >
                  {p.quantity}
                </div>
                <div style={{ fontSize: 10.5, color: "#94a3b8" }}>in stock</div>
              </div>
            </div>
          ))}
        </div>
      )}

      {error && <div className="invalid-feedback-ims">⚠ {error}</div>}
    </div>
  );
};

export default ProductAutocomplete;
