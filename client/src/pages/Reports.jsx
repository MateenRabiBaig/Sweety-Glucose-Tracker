import { useEffect, useState } from "react";
import { useAuth } from "../context/AuthContext";
import apiRequest from "../services/api";
import { formatDate, getTodayDate } from "../utils/formatDate";
import Navbar from "../components/Navbar";

const Reports = () => {
  const { token } = useAuth();
  const [reportType, setReportType] = useState("daily");
  const [selectedDate, setSelectedDate] = useState(getTodayDate());
  const [report, setReport] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    const fetchReport = async () => {
      setLoading(true);
      setError("");
      setReport(null);

      try {
        const endpoint = `/reports/${reportType}?date=${selectedDate}`;
        const data = await apiRequest(endpoint, { token });
        setReport(data);
      }
      catch (error) {
        setError(error.message);
      }
      finally {
        setLoading(false);
      }
    };
    fetchReport();
  }, [reportType, selectedDate, token]);

  const summary = report?.summary || report || {};
  const readings = report?.readings || [];
  const formatValue = (value) => {
    if (value === null || value === undefined) {
      return "--";
    }
    return `${Number(value).toFixed(1)} mg/dl`;
  };

  const reportTitles = {
    daily: "Daily Report",
    mtd: "Month-to-Date Report",
    monthly: "Previous Month Report"
  };
  const getDescription = () => {
    if (reportType === "daily") {
      return `Readings for ${formatDate(selectedDate)}`;
    }
    if (reportType === "mtd") {
      return `From the beginning of the month to ${formatDate(selectedDate)}`;
    }
    const date = new Date(`${selectedDate}T00:00:00`);
    date.setDate(1);
    date.setMonth(date.getMonth() - 1);

    return date.toLocaleDateString("en-IN", { month: "long", year: "numeric" });
  };

  return (
    <div className="reports-page">
        <div className="app-layout">
            <Navbar />
            <main className="reports-main">
                <section className="panel report-controls">
                    <div className="report-tabs">
                        <button className={reportType === "daily" ? "active" : ""} onClick={() => setReportType("daily")}>Daily</button>
                        <button className={reportType === "mtd" ? "active" : ""} onClick={() => setReportType("mtd")}>Month to Date</button>
                        <button className={reportType === "monthly" ? "active" : ""} onClick={() => setReportType("monthly")}>Previous Month</button>
                    </div>

                    <div className="report-date">
                        <label htmlFor="reportDate">Select Date</label>
                        <input
                        id="reportDate"
                        type="date"
                        value={selectedDate}
                        max={getTodayDate()}
                        onChange={(e) => setSelectedDate(e.target.value)}
                        />
                    </div>
                </section>

                <div className="report-title">
                    <div>
                        <h2>{reportTitles[reportType]}</h2>
                        <p>{getDescription()}</p>
                    </div>
                </div>

                {error && (
                <div className="alert alert-error">{error}</div>
                )}

                {loading ? (
                <div className="panel report-message">Loading report...</div>
                ) : !error && report && (
                <>
                    <section className="stats-grid report-stats">
                        <div className="stat-card">
                            <p className="stat-title">Highest Reading</p>
                            <h2>{formatValue(summary.highest)}</h2>
                            <span>Maximum glucose level</span>
                        </div>

                        <div className="stat-card">
                            <p className="stat-title">Lowest Reading</p>
                            <h2>{formatValue(summary.lowest)}</h2>
                            <span>Minimum glucose level</span>
                        </div>

                        <div className="stat-card">
                            <p className="stat-title">Average Reading</p>
                            <h2>{formatValue(summary.average)}</h2>
                            <span>Average glucose level</span>
                        </div>

                        <div className="stat-card">
                            <p className="stat-title">Total Readings</p>
                            <h2>{summary.totalReadings ?? 0}</h2>
                            <span>Recorded readings</span>
                        </div>
                    </section>

                    {reportType === "daily" && (
                    <section className="panel daily-report-panel">
                        <div className="panel-heading">
                        <div>
                            <h2>Daily Reading Details</h2>
                            <p>Individual readings recorded on this date.</p>
                        </div>

                        <span className="reading-count">{readings.length} records</span>
                        </div>

                        {readings.length === 0 ? (
                        <div className="empty-state">
                            <h3>No readings found</h3>
                            <p>There are no glucose readings recorded for this date.</p>
                        </div>
                        ) : (
                        <div className="reading-table-wrapper">
                            <table className="reading-table">
                            <thead>
                                <tr>
                                <th>Time Slot</th>
                                <th>Glucose Value</th>
                                </tr>
                            </thead>

                            <tbody>
                                {readings.map((reading) => (
                                <tr key={reading.id}>
                                    <td>{reading.time_slot}</td>
                                    <td><strong>{reading.value} mg/dl</strong></td>
                                </tr>
                                ))}
                            </tbody>
                            </table>
                        </div>
                        )}
                    </section>
                    )}

                    {reportType !== "daily" &&
                    Number(summary.totalReadings) === 0 && (
                        <div className="panel report-message">
                        <h3>No readings found</h3>
                        <p>No glucose readings are available for this period.</p>
                        </div>
                    )}
                </>
                )}
            </main>
        </div>
    </div>
  );
};

export default Reports;
