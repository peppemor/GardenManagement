import { useEffect, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { apiFetch, setAuth } from "../components/api";
import { Modal } from "../components/UI";

export default function Login() {
  const navigate = useNavigate();
  const location = useLocation();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [modal, setModal] = useState(null);
  const params = new URLSearchParams(location.search);
  const sessionExpired = params.get("sessionExpired") === "1";

  useEffect(() => {
    if (!sessionExpired) return;

    setModal({
      title: "Sessione Scaduta",
      message: "La sessione e' scaduta per sicurezza. Effettua di nuovo il login."
    });

    navigate("/login", { replace: true });
  }, [sessionExpired, navigate]);

  async function onSubmit(e) {
    e.preventDefault();
    try {
      const data = await apiFetch("/auth/login", {
        method: "POST",
        body: JSON.stringify({ username, password })
      });

      setAuth(data);
      navigate(data.user.ruolo === "admin" ? "/admin" : "/operatore");
    } catch (err) {
      setModal({
        title: "Errore di Accesso",
        message: err.message || "Credenziali non valide. Riprova."
      });
    }
  }

  return (
    <section className="card login-card">
      <h1>Accesso Gestionale Vivaio</h1>
      <p>Inserisci le credenziali per entrare.</p>
      <form onSubmit={onSubmit} className="form-grid">
        <label>
          Username
          <input value={username} onChange={(e) => setUsername(e.target.value)} required />
        </label>
        <label>
          Password
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />
        </label>
        <button type="submit">Entra</button>
      </form>
      <small>Utente iniziale: admin / admin123</small>

      <Modal
        isOpen={Boolean(modal)}
        title={modal?.title}
        message={modal?.message}
        onClose={() => setModal(null)}
      />
    </section>
  );
}