import { Outlet } from "react-router";
import Navbar from "../components/Navbar";
import Sidebar from "../components/Sidebar";

function DashboardLayout({ isDark, onThemeToggle }) {
  return (
    <div className="drawer lg:drawer-open">
      <input id="my-drawer" type="checkbox" className="drawer-toggle" defaultChecked />

      <div className="drawer-content">
        <Navbar isDark={isDark} onThemeToggle={onThemeToggle} />

        <main className="p-6">
          <Outlet />
        </main>
      </div>

      <Sidebar />
    </div>
  );
}

export default DashboardLayout;
