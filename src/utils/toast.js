import { useState, useCallback } from "react";

let _setToasts = null;

export const initToast = (setter) => {
  _setToasts = setter;
};

export const toast = {
  success: (msg) => _push({ type: "success", msg }),
  error: (msg) => _push({ type: "error", msg }),
  warning: (msg) => _push({ type: "warning", msg }),
  info: (msg) => _push({ type: "info", msg }),
};

let _id = 0;
function _push(t) {
  if (!_setToasts) return;
  const id = ++_id;
  _setToasts((prev) => [...prev, { ...t, id }]);
  setTimeout(() => _setToasts((prev) => prev.filter((x) => x.id !== id)), 3200);
}

export function useToastState() {
  const [toasts, setToasts] = useState([]);
  initToast(setToasts);
  const remove = useCallback(
    (id) => setToasts((p) => p.filter((x) => x.id !== id)),
    [],
  );
  return { toasts, remove };
}
