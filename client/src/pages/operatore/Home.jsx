import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { apiFetch } from "../../components/api";
import { Card, InfoSection } from "../../components/UI";

export default function Home() {
  const [clienti, setClienti] = useState([]);
  const [search, setSearch] = useState("");

  useEffect(() => {
    apiFetch("/clienti").then(setClienti).catch(() => {});
  }, []);

  const query = search.trim().toLowerCase();
  const clientiFiltrati = clienti.filter((c) => {
    if (!query) return true;

    const searchable = [c.nome, c.telefono, c.indirizzo, c.note]
      .filter(Boolean)
      .join(" ")
      .toLowerCase();

    return searchable.includes(query);
  });

  return (
    <section>
      <h2>Tutti i Clienti</h2>
      <div className="operator-search-row">
        <input
          className="operator-search-input"
          type="search"
          placeholder="Cerca cliente per nome, telefono, indirizzo o note"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          aria-label="Cerca cliente"
        />
      </div>
      <div className="clients-grid">
        {clientiFiltrati.map((c) => (
          <Card className="client-card" key={c.id}>
            <h3>{c.nome}</h3>
            <InfoSection label="Telefono" value={c.telefono} />
            <InfoSection label="Indirizzo" value={c.indirizzo} />
            {c.note && <InfoSection label="Note" value={c.note} />}
            <Link to={`/operatore/clienti/${c.id}`} className="action-link">Dettaglio e Rapporti</Link>
          </Card>
        ))}
      </div>
      {clientiFiltrati.length === 0 ? (
        <p className="info">Nessun cliente trovato con i criteri inseriti.</p>
      ) : null}
    </section>
  );
}
