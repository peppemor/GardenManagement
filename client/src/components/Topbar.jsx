import { useState } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { clearAuth } from "./api";
import { Modal } from "./UI";
import useNotifiche from "../hooks/useNotifiche";

export default function Topbar({ auth }) {
  const navigate = useNavigate();
  const location = useLocation();
  const [modal, setModal] = useState(null);
  const { count: notifCount } = useNotifiche(auth);
  const isLockedOperatoreEditing =
    auth?.user?.ruolo === "operatore" &&
    (/^\/operatore\/clienti\/\d+\/nuovo-rapporto$/.test(location.pathname) ||
      /^\/operatore\/nuovo-rapporto$/.test(location.pathname) ||
      /^\/operatore\/bozze\/\d+\/modifica$/.test(location.pathname));

  if (!auth?.token || !auth?.user) {
    return null;
  }

  function logout() {
    if (isLockedOperatoreEditing) {
      setModal({
        title: "Navigazione Bloccata",
        message: "Per uscire dalla compilazione usa il tasto Indietro o la X in alto nel form del rapporto."
      });
      return;
    }
    clearAuth();
    navigate("/login");
  }

  function blockIfLocked(event) {
    if (!isLockedOperatoreEditing) return;
    event.preventDefault();
    setModal({
      title: "Navigazione Bloccata",
      message: "Navigazione bloccata durante la compilazione del rapporto. Usa Indietro o la X in alto nel form per uscire."
    });
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
            <Link to="/admin" className={isActive("/admin") ? "active" : ""} onClick={blockIfLocked}>Dashboard</Link>
            <Link to="/admin/clienti" className={isActive("/admin/clienti") ? "active" : ""} onClick={blockIfLocked}>Clienti</Link>
            <Link to="/admin/operatori" className={isActive("/admin/operatori") ? "active" : ""} onClick={blockIfLocked}>Operatori</Link>
            <Link to="/admin/rapporti" className={isActive("/admin/rapporti") ? "active" : ""} onClick={blockIfLocked}>
              <span className="nav-link-label">
                Rapporti
                {notifCount > 0 && <span className="nav-badge">{notifCount > 99 ? "99+" : notifCount}</span>}
              </span>
            </Link>
            <Link to="/admin/impostazioni" className={isActive("/admin/impostazioni") ? "active" : ""} onClick={blockIfLocked}>⚙ Impostazioni</Link>
          </>
        )}
        {auth?.user?.ruolo === "operatore" && (
          <>
            <Link
              to="/operatore"
              className={isActive("/operatore") ? "active" : ""}
              onClick={blockIfLocked}
              style={isLockedOperatoreEditing ? { opacity: 0.6 } : undefined}
            >
              Home
            </Link>
            <Link
              to="/operatore/richieste"
              className={isActive("/operatore/richieste") ? "active" : ""}
              onClick={blockIfLocked}
              style={isLockedOperatoreEditing ? { opacity: 0.6 } : undefined}
            >
              <span className="nav-link-label">
                I miei rapporti
                {notifCount > 0 && <span className="nav-badge">{notifCount > 99 ? "99+" : notifCount}</span>}
              </span>
            </Link>
            <Link
              to="/operatore/bozze"
              className={isActive("/operatore/bozze") ? "active" : ""}
              onClick={blockIfLocked}
              style={isLockedOperatoreEditing ? { opacity: 0.6 } : undefined}
            >
              Bozze
            </Link>
          </>
        )}
      </nav>
      <button onClick={logout} style={isLockedOperatoreEditing ? { opacity: 0.6 } : undefined}>Esci</button>

      <Modal
        isOpen={Boolean(modal)}
        title={modal?.title}
        message={modal?.message}
        onClose={() => setModal(null)}
      />
    </header>
  );
}
