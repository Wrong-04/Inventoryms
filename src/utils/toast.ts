import { useState, useCallback } from "react";

export interface ToastItem {
  id: number;
  type: "success" | "error" | "warning" | "info";
  msg: string;
}

type Setter = React.Dispatch<React.SetStateAction<ToastItem[]>>;

let _setToasts: Setter | null = null;
let _id = 0;

export const initToast = (setter: Setter): void => {
  _setToasts = setter;
};

function _push(t: Omit<ToastItem, "id">): void {
  if (!_setToasts) return;
  const id = ++_id;
  _setToasts((prev) => [...prev, { ...t, id }]);
  setTimeout(
    () => _setToasts!((prev) => prev.filter((x) => x.id !== id)),
    3200,
  );
}

export const toast = {
  success: (msg: string) => _push({ type: "success", msg }),
  error: (msg: string) => _push({ type: "error", msg }),
  warning: (msg: string) => _push({ type: "warning", msg }),
  info: (msg: string) => _push({ type: "info", msg }),
};

export function useToastState() {
  const [toasts, setToasts] = useState<ToastItem[]>([]);
  initToast(setToasts);
  const remove = useCallback(
    (id: number) => setToasts((p) => p.filter((x) => x.id !== id)),
    [],
  );
  return { toasts, remove };
}
