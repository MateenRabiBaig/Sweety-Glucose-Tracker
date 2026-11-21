import { useCallback, useEffect, useState } from "react";
import { useAuth } from "../context/AuthContext";
import apiRequest from "../services/api";
import Navbar from "../components/Navbar";
import StatCard from "../components/StatCard";
import ReadingForm from "../components/ReadingForm";
import ReadingList from "../components/ReadingList";
import { getTodayDate } from "../utils/formatDate";
import MonthlyTrendChart from "../components/MonthlyTrendChart";

const Dashboard = () => {
  const { token } = useAuth();
  const [readings, setReadings] = useState([]);
  const [editingReading, setEditingReading] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [deletingId, setDeletingId] = useState(null);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [allReadings, setAllReadings] = useState([]);
  const [page, setPage] = useState(1);
  const [pagination, setPagination] = useState({ page: 1, limit: 20, total: 0, totalPages: 0 });

  const loadReadings = useCallback(async (pageNumber = page) => {
    try {
        setError("");
        const [allData, pageData] = await Promise.all([apiRequest("/readings", { token }), apiRequest(`/readings?page=${pageNumber}&limit=20`, { token })]);
        setAllReadings(allData.readings || []);
        setReadings(pageData.readings || []);
        setPagination(pageData.pagination);
    }
    catch (error) {
        setError(error.message);
    }
    finally {
        setLoading(false);
    }
  }, [token, page]);

  useEffect(() => {
    void loadReadings();
  }, [loadReadings]);

  useEffect(() => {
    if (pagination.totalPages > 0 && page > pagination.totalPages) {
        setPage(pagination.totalPages);
    }
  }, [page, pagination.totalPages]);

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
      setPage(1);
      await loadReadings(1);
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
      await loadReadings(page);
    }
    catch (error) {
      setError(error.message);
    }
    finally {
      setDeletingId(null);
    }
  };
  
  const today = getTodayDate();
  const todayReadings = allReadings.filter((reading) => reading.reading_date.slice(0, 10) === today);
  const latestReading = allReadings.length > 0 ? allReadings[0] : null;

  return (
    <div className="app-layout">
      <Navbar />
      <main className="dashboard-main">
        <section className="stats-grid">
          <StatCard
            title="Total Readings"
            value={allReadings.length}
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

        <MonthlyTrendChart />

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
            {pagination.totalPages > 1 && (
                <div className="pagination">
                    <button onClick={() => setPage((current) => current - 1)} disabled={page === 1}>Previous</button>
                    <span>Page {page} of {pagination.totalPages}</span>
                    <button onClick={() => setPage((current) => current + 1)} disabled={page === pagination.totalPages}>Next</button>
                </div>
            )}
          </section>
        </div>
      </main>
    </div>
  );
};

export default Dashboard;
