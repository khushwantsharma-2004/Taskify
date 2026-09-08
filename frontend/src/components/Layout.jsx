import { NavLink, useLocation, useNavigate } from "react-router-dom";

const links = [["/dashboard", "Dashboard"], ["/subjects", "Subjects"], ["/attendance", "Attendance"], ["/tasks", "Tasks"], ["/notes", "Notes"], ["/profile", "Profile"]];

export default function Layout({ children }) {
  const navigate = useNavigate(); const location = useLocation();
  const user = JSON.parse(localStorage.getItem("student_user") || "null");
  const logout = () => { localStorage.removeItem("student_token"); localStorage.removeItem("student_user"); navigate("/login"); };
  return <div className="layout"><aside className="sidebar"><div className="brand">Taskify</div><nav className="nav">{links.map(([to, label]) => <NavLink key={to} to={to} className={({ isActive }) => isActive ? "active" : ""}>{label}</NavLink>)}</nav><button className="logout ghost" onClick={logout}>Log out</button></aside><main className="main"><header className="topbar"><h1>{links.find(([to]) => location.pathname.startsWith(to))?.[1] || "Dashboard"}</h1><strong className="topbar-name">{user?.name || "Student"}</strong></header><div className="content">{children}</div></main></div>;
}