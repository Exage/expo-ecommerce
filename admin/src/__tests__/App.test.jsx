import { render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const { useAuthMock, setAuthTokenGetterMock, toggleThemeMock } = vi.hoisted(() => ({
  useAuthMock: vi.fn(),
  setAuthTokenGetterMock: vi.fn(),
  toggleThemeMock: vi.fn(),
}));

vi.mock("@clerk/clerk-react", () => ({
  useAuth: useAuthMock,
}));

vi.mock("../lib/authToken", () => ({
  setAuthTokenGetter: setAuthTokenGetterMock,
}));

vi.mock("../hooks/useAdminTheme", () => ({
  useAdminTheme: () => ({
    isDark: false,
    toggleTheme: toggleThemeMock,
  }),
}));

vi.mock("../components/PageLoader", () => ({
  default: () => <div>Loading...</div>,
}));

vi.mock("../pages/LoginPage", () => ({
  default: () => <div>Login Page</div>,
}));

vi.mock("../pages/DashboardPage", () => ({
  default: () => <div>Dashboard Page</div>,
}));

vi.mock("../pages/ProductsPage", () => ({
  default: () => <div>Products Page</div>,
}));

vi.mock("../pages/OrdersPage", () => ({
  default: () => <div>Orders Page</div>,
}));

vi.mock("../pages/CustomersPage", () => ({
  default: () => <div>Customers Page</div>,
}));

vi.mock("../layouts/DashboardLayout", async () => {
  const { Outlet } = await vi.importActual("react-router");

  return {
    default: ({ isDark, onThemeToggle }) => (
      <div>
        <div>{isDark ? "Dark Theme" : "Light Theme"}</div>
        <button onClick={onThemeToggle}>Toggle Theme</button>
        <Outlet />
      </div>
    ),
  };
});

import App from "../App";

const renderAt = (path) => {
  return render(
    <MemoryRouter initialEntries={[path]}>
      <App />
    </MemoryRouter>
  );
};

describe("App routing", () => {
  beforeEach(() => {
    useAuthMock.mockReset();
    setAuthTokenGetterMock.mockReset();
    toggleThemeMock.mockReset();
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  it("shows loader while auth is not loaded", () => {
    useAuthMock.mockReturnValue({
      isSignedIn: false,
      isLoaded: false,
      getToken: vi.fn(),
    });

    renderAt("/dashboard");

    expect(screen.getByText("Loading...")).toBeInTheDocument();
  });

  it("redirects signed-out user from protected route to login", async () => {
    useAuthMock.mockReturnValue({
      isSignedIn: false,
      isLoaded: true,
      getToken: vi.fn(),
    });

    renderAt("/products");

    expect(await screen.findByText("Login Page")).toBeInTheDocument();
  });

  it("redirects signed-in user from login route to dashboard", async () => {
    useAuthMock.mockReturnValue({
      isSignedIn: true,
      isLoaded: true,
      getToken: vi.fn(),
    });

    renderAt("/login");

    expect(await screen.findByText("Dashboard Page")).toBeInTheDocument();
  });

  it("renders protected route when user is signed in", async () => {
    useAuthMock.mockReturnValue({
      isSignedIn: true,
      isLoaded: true,
      getToken: vi.fn(),
    });

    renderAt("/orders");

    expect(await screen.findByText("Orders Page")).toBeInTheDocument();
    expect(screen.getByText("Light Theme")).toBeInTheDocument();
  });

  it("registers auth token getter and clears it on unmount", () => {
    const getToken = vi.fn();
    useAuthMock.mockReturnValue({
      isSignedIn: true,
      isLoaded: true,
      getToken,
    });

    const { unmount } = renderAt("/dashboard");

    expect(setAuthTokenGetterMock).toHaveBeenCalledWith(getToken);

    unmount();

    expect(setAuthTokenGetterMock).toHaveBeenLastCalledWith(null);
  });
});
