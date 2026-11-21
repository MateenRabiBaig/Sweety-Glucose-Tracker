import { useEffect, useState } from "react";
import { getTodayDate } from "../utils/formatDate";

const initialForm = {
  date: getTodayDate(),
  slot: "",
  value: ""
};

const ReadingForm = ({ onSubmit, editingReading, onCancel, loading }) => {
  const [formData, setFormData] = useState(initialForm);
  const [error, setError] = useState("");

  useEffect(() => {
    if (editingReading) {
      setFormData({
        date: editingReading.reading_date.slice(0, 10),
        slot: editingReading.time_slot,
        value: String(editingReading.value)
      });
    }
    else {
      setFormData(initialForm);
    }
    setError("");
  }, [editingReading]);

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");

    if (!formData.value.trim()) {
      setError("Please enter a glucose value.");
      return;
    }

    const value = Number(formData.value);

    if (!Number.isInteger(value) || value < 40 || value > 600) {
      setError("Value must be between 40 and 600 mg/dl.");
      return;
    }

    try {
      await onSubmit({
        ...formData,
        value
      });
      setFormData(initialForm);
    }
    catch (error) {
      setError(error.message);
    }
  };

  return (
    <section className="panel">
      <div className="panel-heading">
        <div>
          <h2>{editingReading ? "Edit Reading" : "Add Glucose Reading"}</h2>
          <p>Record your blood glucose level.</p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="reading-form">
        <div className="form-group">
          <label htmlFor="date">Date</label>
          <input
            id="date"
            type="date"
            name="date"
            value={formData.date}
            max={getTodayDate()}
            onChange={handleChange}
            required
          />
        </div>

        <div className="form-group">
          <label htmlFor="slot">Time Slot</label>
          <select
            id="slot"
            name="slot"
            value={formData.slot}
            onChange={handleChange}
            required
          >
            <option value="">Select time slot</option>
            <option value="Morning (fasting)">Morning (fasting)</option>
            <option value="After breakfast">After breakfast</option>
            <option value="After lunch">After lunch</option>
            <option value="After dinner">After dinner</option>
          </select>
        </div>

        <div className="form-group">
          <label htmlFor="value">Glucose Value (mg/dl)</label>
          <input
            id="value"
            type="number"
            name="value"
            min="40"
            max="600"
            step="1"
            value={formData.value}
            onChange={handleChange}
            placeholder="Enter value"
            required
          />
        </div>

        {error && (
          <p className="error-message">{error}</p>
        )}

        <div className="form-actions">
          <button type="submit" disabled={loading}>{loading ? "Saving..." : editingReading ? "Update Reading" : "Save Reading"}</button>
          {editingReading && (
            <button type="button" className="secondary-button" onClick={onCancel} disabled={loading}>Cancel</button>
          )}
        </div>
      </form>
    </section>
  );
};

export default ReadingForm;