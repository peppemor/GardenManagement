import { useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { apiFetch, setAuth } from "../components/api";

export default function Login() {
  const navigate = useNavigate();
  const location = useLocation();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const params = new URLSearchParams(location.search);
  const sessionExpired = params.get("sessionExpired") === "1";

  async function onSubmit(e) {
    e.preventDefault();
    setError("");
    try {
      const data = await apiFetch("/auth/login", {
        method: "POST",
        body: JSON.stringify({ username, password })
      });

      setAuth(data);
      navigate(data.user.ruolo === "admin" ? "/admin" : "/operatore");
    } catch (err) {
      setError(err.message);
    }
  }

  return (
    <section className="card login-card">
      <h1>Accesso Gestionale Vivaio</h1>
      <p>Inserisci le credenziali per entrare.</p>
      {sessionExpired ? (
        <p className="error">Sessione scaduta: effettua di nuovo il login.</p>
      ) : null}
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
        {error ? <p className="error">{error}</p> : null}
        <button type="submit">Entra</button>
      </form>
      <small>Utente iniziale: admin / admin123</small>
    </section>
  );
}