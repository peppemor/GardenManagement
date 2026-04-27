import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { apiFetch } from "../../components/api";

export default function Home() {
  const [clienti, setClienti] = useState([]);

  useEffect(() => {
    apiFetch("/clienti").then(setClienti).catch(() => {});
  }, []);

  return (
    <section>
      <h2>Tutti i Clienti</h2>
      <div className="clients-grid">
        {clienti.map((c) => (
          <article className="card client-card" key={c.id}>
            <h3>{c.nome}</h3>
            <p className="info">Telefono: {c.telefono || "-"}</p>
            <p className="info">Indirizzo: {c.indirizzo || "-"}</p>
            {c.note && <p className="info">Note: {c.note}</p>}
            <Link to={`/operatore/clienti/${c.id}`} className="action-link">Dettaglio e Rapporti</Link>
          </article>
        ))}
      </div>
    </section>
  );
}
