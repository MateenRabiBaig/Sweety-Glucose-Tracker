import { formatDate } from "../utils/formatDate";

const ReadingList = ({readings, onEdit, onDelete, deletingId}) => {
  if (readings.length === 0) {
    return (
      <div className="empty-state">
        <h3>No readings yet</h3>
        <p>Add your first glucose reading to start tracking your levels.</p>
      </div>
    );
  }

  return (
    <div className="reading-table-wrapper">
      <table className="reading-table">
        <thead>
          <tr>
            <th>Date</th>
            <th>Time Slot</th>
            <th>Glucose Value</th>
            <th>Actions</th>
          </tr>
        </thead>

        <tbody>
          {readings.map((reading) => (
            <tr key={reading.id}>
              <td>{formatDate(reading.reading_date)}</td>
              <td>{reading.time_slot}</td>
              <td><strong>{reading.value} mg/dl</strong></td>
              <td>
                <div className="table-actions">
                  <button className="edit-button" onClick={() => onEdit(reading)}>Edit</button>
                  <button className="delete-button" onClick={() => onDelete(reading.id)} disabled={deletingId === reading.id}>
                    {deletingId === reading.id ? "Deleting..." : "Delete"}
                  </button>
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default ReadingList;