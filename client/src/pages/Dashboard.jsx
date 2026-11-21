import { useCallback, useEffect, useState } from "react";
import { useAuth } from "../context/AuthContext";
import apiRequest from "../services/api";
import Navbar from "../components/Navbar";
import StatCard from "../components/StatCard";
import ReadingForm from "../components/ReadingForm";
import ReadingList from "../components/ReadingList";
import { getTodayDate } from "../utils/formatDate";

const Dashboard = () => {
  const { token } = useAuth();
  const [readings, setReadings] = useState([]);
  const [editingReading, setEditingReading] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [deletingId, setDeletingId] = useState(null);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");

  const loadReadings = useCallback(async () => {
    try {
      setError("");
      const data = await apiRequest("/readings", { token });
      setReadings(data.readings || []);
    }
    catch (error) {
      setError(error.message);
    }
    finally {
      setLoading(false);
    }
  }, [token]);

  useEffect(() => {
    loadReadings();
  }, [loadReadings]);

  const handleSaveReading = async (formData) => {
    setSaving(true);
    setNotice("");
    try {
      if (editingReading) {
        await apiRequest(`/readings/${editingReading.id}`, {
          method: "PUT",
          body: formData,
          token
        });
        setNotice("Reading updated successfully.");
      }
      else {
        await apiRequest("/readings", {
          method: "POST",
          body: formData,
          token
        });
        setNotice("Reading added successfully.");
      }
      setEditingReading(null);
      await loadReadings();
    }
    finally {
      setSaving(false);
    }
  };

  const handleDeleteReading = async (id) => {
    const confirmed = window.confirm("Are you sure you want to delete this reading?");

    if (!confirmed) return;

    setDeletingId(id);
    setNotice("");
    setError("");

    try {
      await apiRequest(`/readings/${id}`, {
        method: "DELETE",
        token
      });

      if (editingReading?.id === id) {
        setEditingReading(null);
      }
      setNotice("Reading deleted successfully.");
      await loadReadings();
    }
    catch (error) {
      setError(error.message);
    }
    finally {
      setDeletingId(null);
    }
  };

  const today = getTodayDate();
  const todayReadings = readings.filter((reading) => reading.reading_date.slice(0, 10) === today);
  const latestReading = readings.length > 0 ? readings[0] : null;

  return (
    <div className="app-layout">
      <Navbar />
      <main className="dashboard-main">
        <div className="dashboard-heading">
          <div>
            <h1>Dashboard</h1>
            <p>Keep track of your blood glucose readings.</p>
          </div>

          <span className="today-date">
            {new Date().toLocaleDateString("en-IN", {
              day: "numeric",
              month: "long",
              year: "numeric"
            })}
          </span>
        </div>

        <section className="stats-grid">
          <StatCard
            title="Total Readings"
            value={readings.length}
            description="All recorded readings"
          />

          <StatCard
            title="Today's Readings"
            value={todayReadings.length}
            description="Readings recorded today"
          />

          <StatCard
            title="Latest Reading"
            value={latestReading ? `${latestReading.value} mg/dl` : "--"}
            description={latestReading ? latestReading.time_slot : "No readings recorded"}
          />
        </section>

        {error && (
          <div className="alert alert-error">
            {error}
          </div>
        )}

        {notice && (
          <div className="alert alert-success">
            {notice}
          </div>
        )}

        <div className="dashboard-grid">
          <ReadingForm
            onSubmit={handleSaveReading}
            editingReading={editingReading}
            onCancel={() => setEditingReading(null)}
            loading={saving}
          />

          <section className="panel readings-panel">
            <div className="panel-heading">
              <div>
                <h2>Glucose History</h2>
                <p>Your recorded glucose readings.</p>
              </div>
              <span className="reading-count">{readings.length} records</span>
            </div>

            {loading ? (
              <p className="loading-message">Loading readings...</p>
            ) : (
              <ReadingList
                readings={readings}
                onEdit={setEditingReading}
                onDelete={handleDeleteReading}
                deletingId={deletingId}
              />
            )}
          </section>
        </div>
      </main>
    </div>
  );
};

export default Dashboard;