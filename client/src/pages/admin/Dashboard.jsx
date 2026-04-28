import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { apiFetch } from "../../components/api";
import { KPICard, Card } from "../../components/UI";

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
        <KPICard title="Clienti" value={stats.clienti} />
        <KPICard title="Operatori" value={stats.operatori} />
        <KPICard title="Rapporti" value={stats.rapporti} />
        <KPICard title="Template" value={stats.template} />
      </div>
      <Card className="action-grid">
        <Link className="action-link" to="/admin/clienti">Gestisci clienti</Link>
        <Link className="action-link" to="/admin/operatori">Gestisci operatori</Link>
        <Link className="action-link" to="/admin/rapporti">Vedi rapporti</Link>
        <Link className="action-link" to="/admin/template">Gestisci template</Link>        
      </Card>
    </section>
  );
}
