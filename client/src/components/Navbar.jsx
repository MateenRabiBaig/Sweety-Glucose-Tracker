import { NavLink } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

const Navbar = () => {
  const { user, logout } = useAuth();

  return (
    <header className="navbar">
      <div className="navbar-brand">
        <h2>Sweety</h2>
        <span>Blood Glucose Tracker</span>
      </div>

      <nav className="navbar-links">
        <NavLink to="/dashboard">Dashboard</NavLink>
        <NavLink to="/reports">Reports</NavLink>
      </nav>

      <div className="navbar-user">
        <span>{user?.name}</span>
        <button onClick={logout}>Logout</button>
      </div>
    </header>
  );
};

export default Navbar;