import { Link, useNavigate, useLocation } from "react-router-dom";
import { clearAuth } from "./api";

export default function Topbar({ auth }) {
  const navigate = useNavigate();
  const location = useLocation();

  if (!auth?.token || !auth?.user) {
    return null;
  }

  function logout() {
    clearAuth();
    navigate("/login");
  }

  function isActive(path) {
    return location.pathname === path;
  }

  return (
    <header className="topbar">
      <strong>Vivaio Gestionale</strong>
      <nav>
        {auth?.user?.ruolo === "admin" && (
          <>
            <Link to="/admin" className={isActive("/admin") ? "active" : ""}>Dashboard</Link>
            <Link to="/admin/clienti" className={isActive("/admin/clienti") ? "active" : ""}>Clienti</Link>
            <Link to="/admin/operatori" className={isActive("/admin/operatori") ? "active" : ""}>Operatori</Link>
            <Link to="/admin/template" className={isActive("/admin/template") ? "active" : ""}>Template</Link>
            <Link to="/admin/impostazioni" className={isActive("/admin/impostazioni") ? "active" : ""}>⚙ Impostazioni</Link>
            <Link to="/admin/rapporti" className={isActive("/admin/rapporti") ? "active" : ""}>Rapporti</Link>
          </>
        )}
        {auth?.user?.ruolo === "operatore" && (
          <>
            <Link to="/operatore" className={isActive("/operatore") ? "active" : ""}>Home</Link>
            <Link to="/operatore/bozze" className={isActive("/operatore/bozze") ? "active" : ""}>Bozze</Link>
          </>
        )}
      </nav>
      <button onClick={logout}>Esci</button>
    </header>
  );
}
