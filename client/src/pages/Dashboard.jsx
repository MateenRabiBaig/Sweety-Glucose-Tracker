import { useAuth } from "../context/AuthContext";

const Dashboard = () => {
  const { user, logout } = useAuth();

  return (
    <div className="dashboard-page">
      <div className="dashboard-header">
        <div>
          <h1>Welcome, {user?.name}</h1>
          <p>Your glucose tracking dashboard.</p>
        </div>

        <button onClick={logout}>Logout</button>
      </div>

      <div className="dashboard-content">
        <h2>Dashboard</h2>
        <p>Your glucose tracking information will appear here.</p>
      </div>
    </div>
  );
};

export default Dashboard;