import { useState } from "react";
import api from "../services/api";
import { messageOf } from "../utils/apiHelpers";
import useFetch from "../hooks/useFetch";

export default function Attendance() {
  const subjects = useFetch("/subjects"); const [form, setForm] = useState({ subjectId: "", date: new Date().toISOString().slice(0, 10), status: "Present" });
  const save = async (event) => { event.preventDefault(); try { await api.post("/attendance", form); setForm({ ...form, subjectId: "" }); } catch (requestError) { alert(messageOf(requestError)); } };
  return <section className="card attendance-form-card"><div className="section-title"><div><h2>Mark attendance</h2><p className="muted">Record today's class attendance by subject.</p></div></div><form className="form" onSubmit={save}><label className="field">Subject<select required value={form.subjectId} onChange={(event) => setForm({ ...form, subjectId: event.target.value })}><option value="">Select subject</option>{subjects.data.map((subject) => <option value={subject._id} key={subject._id}>{subject.name}</option>)}</select></label><label className="field">Date<input required type="date" value={form.date} onChange={(event) => setForm({ ...form, date: event.target.value })} /></label><label className="field">Status<select value={form.status} onChange={(event) => setForm({ ...form, status: event.target.value })}><option>Present</option><option>Absent</option></select></label><button className="primary">Save attendance</button></form></section>;
}