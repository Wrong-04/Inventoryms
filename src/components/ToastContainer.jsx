import { useToastState } from "../utils/toast";

const ICONS = { success: "✓", error: "✕", warning: "⚠", info: "ℹ" };
const STYLES = {
  success: {
    background: "#dcfce7",
    color: "#15803d",
    border: "1px solid #bbf7d0",
  },
  error: {
    background: "#fee2e2",
    color: "#dc2626",
    border: "1px solid #fecaca",
  },
  warning: {
    background: "#fef9c3",
    color: "#a16207",
    border: "1px solid #fde68a",
  },
  info: {
    background: "#eff6ff",
    color: "#1d4ed8",
    border: "1px solid #bfdbfe",
  },
};

const ToastContainer = () => {
  const { toasts, remove } = useToastState();

  return (
    <div
      style={{
        position: "fixed",
        top: 20,
        right: 20,
        zIndex: 9999,
        display: "flex",
        flexDirection: "column",
        gap: 10,
        pointerEvents: "none",
      }}
    >
      {toasts.map((t) => (
        <div
          key={t.id}
          style={{
            ...STYLES[t.type],
            padding: "12px 16px",
            borderRadius: 10,
            fontSize: 14,
            fontWeight: 500,
            display: "flex",
            alignItems: "center",
            gap: 10,
            minWidth: 280,
            maxWidth: 380,
            boxShadow: "0 4px 20px rgba(0,0,0,0.12)",
            pointerEvents: "all",
            animation: "toastIn 0.25s ease",
          }}
        >
          <span style={{ fontSize: 16, flexShrink: 0 }}>{ICONS[t.type]}</span>
          <span style={{ flex: 1 }}>{t.msg}</span>
          <button
            onClick={() => remove(t.id)}
            style={{
              background: "none",
              border: "none",
              cursor: "pointer",
              color: "inherit",
              opacity: 0.6,
              fontSize: 16,
              padding: 0,
              lineHeight: 1,
            }}
          >
            ×
          </button>
        </div>
      ))}
    </div>
  );
};

export default ToastContainer;
