export const getUser = () => {
  const user = sessionStorage.getItem("ims_user");
  return user ? JSON.parse(user) : null;
};

export const setUser = (user) => {
  sessionStorage.setItem("ims_user", JSON.stringify(user));
};

export const logout = () => {
  sessionStorage.removeItem("ims_user");
};

export const hasRole = (roles) => {
  const user = getUser();
  if (!user) return false;
  if (!roles || roles.length === 0) return true;
  return roles.includes(user.role);
};

export const addLog = async (action, description) => {
  const user = getUser();
  if (!user) return;
  try {
    const axios = (await import("axios")).default;
    await axios.post("http://localhost:9999/system_logs", {
      userId: user.id,
      userName: user.name,
      action,
      description,
      timestamp: new Date().toISOString(),
    });
  } catch (e) {}
};
