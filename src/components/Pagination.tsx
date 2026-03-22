/**
 * Usage:
 *   <Pagination page={page} totalPages={totalPages} onChange={setPage} total={filtered.length} pageSize={PAGE_SIZE} />
 */
const Pagination = ({ page, totalPages, onChange, total, pageSize }) => {
  if (totalPages <= 1) return null;

  const from = (page - 1) * pageSize + 1;
  const to = Math.min(page * pageSize, total);

  const pages = [];
  for (let i = 1; i <= totalPages; i++) {
    if (i === 1 || i === totalPages || Math.abs(i - page) <= 1) {
      pages.push(i);
    } else if (pages[pages.length - 1] !== "...") {
      pages.push("...");
    }
  }

  return (
    <div
      style={{
        padding: "12px 20px",
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        borderTop: "1px solid #e2e8f0",
        flexWrap: "wrap",
        gap: 8,
      }}
    >
      <span style={{ fontSize: 13, color: "#6b7280" }}>
        Showing {from}–{to} of {total} records
      </span>
      <div style={{ display: "flex", gap: 4, alignItems: "center" }}>
        <button
          className="btn-secondary-ims"
          style={{ padding: "4px 12px", fontSize: 13 }}
          disabled={page === 1}
          onClick={() => onChange(page - 1)}
        >
          ← Prev
        </button>
        {pages.map((p, i) =>
          p === "..." ? (
            <span
              key={`e${i}`}
              style={{ padding: "4px 6px", color: "#9ca3af", fontSize: 13 }}
            >
              …
            </span>
          ) : (
            <button
              key={p}
              onClick={() => onChange(p)}
              style={{
                padding: "4px 10px",
                fontSize: 13,
                borderRadius: 6,
                border: p === page ? "none" : "1px solid #e2e8f0",
                background: p === page ? "#2563eb" : "#fff",
                color: p === page ? "#fff" : "#374151",
                cursor: "pointer",
                fontWeight: p === page ? 600 : 400,
                minWidth: 32,
              }}
            >
              {p}
            </button>
          ),
        )}
        <button
          className="btn-secondary-ims"
          style={{ padding: "4px 12px", fontSize: 13 }}
          disabled={page === totalPages}
          onClick={() => onChange(page + 1)}
        >
          Next →
        </button>
      </div>
    </div>
  );
};

export default Pagination;
