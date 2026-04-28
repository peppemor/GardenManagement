import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { apiFetch, getAuth } from "../../components/api";
import { Card, StatusPill, InfoSection, RapportoCard, Button } from "../../components/UI";

export default function ClienteDettaglio() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [cliente, setCliente] = useState(null);
  const [rapporti, setRapporti] = useState([]);
  const [expandedId, setExpandedId] = useState(null);

  useEffect(() => {
    apiFetch(`/clienti/${id}`).then(setCliente).catch(() => {});
    apiFetch(`/rapporti?cliente=${id}`).then((data) => {
      const oggi = new Date();
      oggi.setHours(0, 0, 0, 0);
      const operatoreId = getAuth()?.user?.id;

      const visibili = data.filter((r) => {
        // Rapporti approvati: visibili a tutti, solo quelli di oggi
        if (r.status === "approvato") {
          const dataRapporto = new Date(r.created_at);
          dataRapporto.setHours(0, 0, 0, 0);
          return dataRapporto.getTime() === oggi.getTime();
        }

        // Rapporti in_attesa: visibili solo all'operatore che li ha creati, solo quelli di oggi
        if (r.status === "in_attesa") {
          if (r.operatore_id !== operatoreId) return false;
          const dataRapporto = new Date(r.created_at);
          dataRapporto.setHours(0, 0, 0, 0);
          return dataRapporto.getTime() === oggi.getTime();
        }

        return false;
      });
      setRapporti(visibili);
    }).catch(() => {});
  }, [id]);

  if (!cliente) return <p>Caricamento...</p>;

  return (
    <section className="cliente-dettaglio-shell">
      <Card className="cliente-info-card">
        <h2>{cliente.nome}</h2>
        <InfoSection label="Telefono" value={cliente.telefono} />
        <InfoSection label="Indirizzo" value={cliente.indirizzo} />
        {cliente.note && <InfoSection label="Note" value={cliente.note} />}
      </Card>

      <div className="cliente-dettaglio-actions">
        <Button
          variant="primary"
          type="button"
          onClick={() => navigate(`/operatore/clienti/${id}/nuovo-rapporto`)}
        >
          + Nuovo Rapporto
        </Button>
      </div>

      <Card style={{ marginTop: "20px" }}>
        <h3>Rapporti Cliente</h3>
        <p className="info" style={{ marginTop: "4px" }}>
          Mostrati: rapporti approvati e in attesa di approvazione di oggi.
        </p>
        
        {rapporti.length === 0 ? (
          <p style={{ color: "#666" }}>Nessun rapporto approvato o in attesa per questo cliente</p>
        ) : (
          <div className="rapporti-list">
            {rapporti.map((r) => (
              <RapportoCard
                key={r.id}
                rapporto={r}
                isExpanded={expandedId === r.id}
                onToggleExpand={() => setExpandedId(expandedId === r.id ? null : r.id)}
                onVisualizza={() => navigate(`/operatore/rapporti/${r.id}`)}
                showClienteNome={false}
                layout="list"
              />
            ))}
          </div>
        )}
      </Card>
    </section>
  );
}
