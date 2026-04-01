let getTokenFn = null;

export const setAuthTokenGetter = (tokenGetter) => {
  getTokenFn = typeof tokenGetter === "function" ? tokenGetter : null;
};

export const getAuthToken = async () => {
  if (!getTokenFn) return null;
  try {
    return await getTokenFn();
  } catch {
    return null;
  }
};
