import { NavLink, Outlet } from "react-router-dom";
import "./settingsLayout.css";

export default function SettingsLayout() {
  return (
    <>
      {/* SETTINGS SIDEBAR ONLY */}
      <aside className="sidebar settings-sidebar">
        <h3>Settings</h3>
        <nav>
          <NavLink to="profile" end className="settings-link">
            Profile
          </NavLink>
          <NavLink to="preferences" end className="settings-link">
            Personalization & Preferences
          </NavLink>
          <NavLink to="help" end className="settings-link">
            Help
          </NavLink>
          <NavLink to="about" end className="settings-link">
            About
          </NavLink>
        </nav>
      </aside>

      {/* SETTINGS CONTENT */}
      <main className="content">
        <Outlet />
      </main>
    </>
  );
}
