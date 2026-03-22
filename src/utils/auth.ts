export interface IUser {
  id: string;
  name: string;
  email: string;
  role: "admin" | "manager" | "salesperson";
}

export const getUser = (): IUser | null => {
  const user = sessionStorage.getItem("ims_user");
  return user ? JSON.parse(user) : null;
};

export const setUser = (user: IUser): void => {
  sessionStorage.setItem("ims_user", JSON.stringify(user));
};

export const logout = (): void => {
  sessionStorage.removeItem("ims_user");
};

export const hasRole = (roles: string[]): boolean => {
  const user = getUser();
  if (!user) return false;
  if (!roles || roles.length === 0) return true;
  return roles.includes(user.role);
};

export const addLog = async (
  action: string,
  description: string,
): Promise<void> => {
  const user = getUser();
  if (!user) return;
  try {
    const { default: axios } = await import("axios");
    await axios.post("http://localhost:9999/system_logs", {
      id: Math.random().toString(16).slice(2, 6),
      userId: user.id,
      userName: user.name,
      action,
      description,
      timestamp: new Date().toISOString(),
    });
  } catch (_) {}
};
