import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { apiFetch } from "../../components/api";

export default function Dashboard() {
  const [stats, setStats] = useState({ clienti: 0, operatori: 0, rapporti: 0, template: 0 });

  useEffect(() => {
    async function load() {
      const [clienti, operatori, rapporti, template] = await Promise.all([
        apiFetch("/clienti"),
        apiFetch("/operatori"),
        apiFetch("/rapporti"),
        apiFetch("/template")
      ]);
      setStats({
        clienti: clienti.length,
        operatori: operatori.length,
        rapporti: rapporti.length,
        template: template.length
      });
    }
    load().catch(() => {});
  }, []);

  return (
    <section>
      <h2>Dashboard Admin</h2>
      <div className="kpi-grid">
        <article className="card"><h3>Clienti</h3><p>{stats.clienti}</p></article>
        <article className="card"><h3>Operatori</h3><p>{stats.operatori}</p></article>
        <article className="card"><h3>Rapporti</h3><p>{stats.rapporti}</p></article>
        <article className="card"><h3>Template</h3><p>{stats.template}</p></article>
      </div>
      <div className="card action-grid">
        <Link className="action-link" to="/admin/clienti">Gestisci clienti</Link>
        <Link className="action-link" to="/admin/operatori">Gestisci operatori</Link>
        <Link className="action-link" to="/admin/rapporti">Vedi rapporti</Link>
        <Link className="action-link" to="/admin/template">Gestisci template</Link>        
      </div>
    </section>
  );
}
