import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import api from "../services/api";
import { getData, messageOf } from "../utils/apiHelpers";

export default function Auth({ mode }) {
  const navigate = useNavigate();
  const [form, setForm] = useState({ name: "", email: "", password: "", course: "", semester: "" });
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const update = (event) => setForm({ ...form, [event.target.name]: event.target.value });
  const submit = async (event) => {
    event.preventDefault(); setError("");
    if (!form.email || !form.password || (mode === "register" && !form.name)) return setError("Please fill in all required fields.");
    setBusy(true);
    try {
      const response = await api.post(`/auth/${mode}`, mode === "register" ? { ...form, semester: form.semester ? Number(form.semester) : undefined } : { email: form.email, password: form.password });
      const data = getData(response);
      if (mode === "login") { localStorage.setItem("student_token", data.token); localStorage.setItem("student_user", JSON.stringify(data.user)); navigate("/dashboard"); }
      else navigate("/login", { state: { message: "Registration successful. Please log in." } });
    } catch (requestError) { setError(messageOf(requestError)); } finally { setBusy(false); }
  };
  return <div className="auth-shell"><div className="auth-orbit auth-orbit-one" /><div className="auth-orbit auth-orbit-two" /><div className="auth-card">
    <div className="brand"><span className="brand-mark">T</span><span>Taskify</span></div>
    <span className="auth-kicker">A calmer way to keep up</span>
    <h1>{mode === "login" ? "Welcome back" : "Create your account"}</h1>
    <p className="muted">{mode === "login" ? "Manage your college routine in one place." : "Start organizing your subjects, tasks and attendance."}</p>
    <form className="form" onSubmit={submit}>
      {mode === "register" && <><label className="field">Full name<input name="name" value={form.name} onChange={update} /></label><div className="form-grid"><label className="field">Course<input name="course" value={form.course} onChange={update} placeholder="BCA" /></label><label className="field">Semester<input name="semester" type="number" min="1" max="12" value={form.semester} onChange={update} /></label></div></>}
      <label className="field">Email<input name="email" type="email" value={form.email} onChange={update} /></label>
      <label className="field">Password<input name="password" type="password" minLength="6" value={form.password} onChange={update} /></label>
      {error && <div className="error">{error}</div>}
      <button className="primary" disabled={busy}>{busy ? "Please wait..." : mode === "login" ? "Log in" : "Create account"}</button>
    </form>
    <p className="muted">{mode === "login" ? <>New here? <Link to="/register">Create an account</Link></> : <>Already registered? <Link to="/login">Log in</Link></>}</p>
  </div></div>;
}