import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

const Login = () => {
  const navigate = useNavigate();
  const { login } = useAuth();
  const [formData, setFormData] = useState({ email: "", password: "" });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      await login(formData);
      navigate("/dashboard");
    }
    catch (error) {
      setError(error.message);
    }
    finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-page">
        <div className="auth-card">
            <h1>Sweety</h1>
            <p className="auth-subtitle">Welcome back! Log in to track your glucose levels.</p>
            
            <form onSubmit={handleSubmit}>
                <div className="form-group">
                    <label htmlFor="email">Email</label>
                    <input
                        id="email"
                        type="email"
                        name="email"
                        value={formData.email}
                        onChange={handleChange}
                        placeholder="Enter your email"
                        required
                    />
                </div>

                <div className="form-group">
                    <label htmlFor="password">Password</label>
                    <input
                        id="password"
                        type="password"
                        name="password"
                        value={formData.password}
                        onChange={handleChange}
                        placeholder="Enter your password"
                        required
                    />
                </div>
                
                {error && <p className="error-message">{error}</p>}
                
                <button type="submit" disabled={loading}>{loading ? "Logging in..." : "Login"}</button>
            </form>
            <p className="auth-footer">Don't have an account? <Link to="/register">Sign up</Link></p>
        </div>
    </div>
  );
};

export default Login;