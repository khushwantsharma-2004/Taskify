import useFetch from "../hooks/useFetch";

export default function History() {
  const { data, loading, error } = useFetch("/attendance");

  return <section className="card history-card">
    <div className="section-title">
      <div>
        <h2>Attendance history</h2>
        <p className="muted">Review attendance records for your current subjects.</p>
      </div>
      <span className="history-count">{data.length} records</span>
    </div>
    {loading ? <div className="empty">Loading history...</div> : error ? <div className="error">{error}</div> : data.length ? <div className="table-wrap"><table className="table"><thead><tr><th>Date</th><th>Subject</th><th>Status</th></tr></thead><tbody>{data.map((attendance) => <tr key={attendance._id}><td>{new Date(attendance.date).toLocaleDateString()}</td><td><strong>{attendance.subjectId?.name}</strong></td><td><span className={`badge ${attendance.status === "Present" ? "done" : "high"}`}>{attendance.status}</span></td></tr>)}</tbody></table></div> : <div className="empty">No attendance history yet.</div>}
  </section>;
}
