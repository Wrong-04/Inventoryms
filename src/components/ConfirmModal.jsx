/**
 * Usage:
 *   const [confirm, setConfirm] = useState({ show: false, message: "", onConfirm: null });
 *   <ConfirmModal {...confirm} onClose={() => setConfirm({ show: false })} />
 *
 *   setConfirm({ show: true, title: "Delete?", message: "...", variant: "danger", onConfirm: async () => { ... } });
 */
const ConfirmModal = ({
  show,
  title = "Confirm",
  message,
  variant = "danger",
  onConfirm,
  onClose,
  loading,
}) => {
  if (!show) return null;

  const btnClass = variant === "danger" ? "btn-danger-ims" : "btn-primary-ims";

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-box" onClick={(e) => e.stopPropagation()}>
        <h5>{title}</h5>
        <p
          style={{
            color: "#374151",
            fontSize: 14,
            margin: "0 0 4px",
            lineHeight: 1.6,
          }}
        >
          {message}
        </p>
        <div className="modal-footer-ims">
          <button
            className={btnClass}
            style={{ padding: "8px 20px", minWidth: 100 }}
            disabled={loading}
            onClick={onConfirm}
          >
            {loading ? <span className="btn-spinner" /> : "Confirm"}
          </button>
          <button
            className="btn-secondary-ims"
            onClick={onClose}
            disabled={loading}
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
};

export default ConfirmModal;
