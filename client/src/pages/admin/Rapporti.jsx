import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { apiFetch, getAuth } from "../../components/api";
import { RapportoCard, Modal } from "../../components/UI";
import { broadcastNotificheChanged } from "../../hooks/useNotifiche";

export default function Rapporti() {
  const navigate = useNavigate();
  const auth = getAuth();
  const [rows, setRows] = useState([]);
  const [selectedStatus, setSelectedStatus] = useState("tutti");
  const [search, setSearch] = useState("");
  const [expandedId, setExpandedId] = useState(null);
  const [error, setError] = useState("");
  const [modal, setModal] = useState(null);
  const [rifiutoRapportoId, setRifiutoRapportoId] = useState(null);
  const [commentoRifiuto, setCommentoRifiuto] = useState("");
  const commentoRifiutoRef = useRef("");
  const commentoTextareaRef = useRef(null);

  async function load() {
    try {
      const data = await apiFetch("/rapporti");
      const nonBozze = data.filter((r) => r.status !== "bozza");
      setRows(nonBozze);
      // Mantieni filtro coerente con lo stato pending.
      if (nonBozze.some((r) => r.status === "in_attesa")) {
        setSelectedStatus("in_attesa");
      } else {
        setSelectedStatus("tutti");
      }
    } catch (err) {
      setError(err.message);
    }
  }

  useEffect(() => {
    load();
    // Apertura pagina admin rapporti: segna notifiche come lette subito.
    if (auth?.user?.ruolo === "admin") {
      apiFetch("/notifiche/leggi-tutte", { method: "PATCH" })
        .then(() => broadcastNotificheChanged())
        .catch(() => {});
    }
  }, []);

  const query = search.trim().toLowerCase();

  const filtered = rows.filter((r) => {
    const statusMatch =
      selectedStatus === "tutti"
        ? true
        : r.status === selectedStatus;

    if (!statusMatch) return false;
    if (!query) return true;

    const searchable = [
      r.cliente_nome,
      r.operatore_nome,
      r.operatore_cognome,
      r.template_titolo
    ]
      .filter(Boolean)
      .join(" ")
      .toLowerCase();

    return searchable.includes(query);
  });

  async function approva(id) {
    try {
      await apiFetch(`/rapporti/${id}/approva`, { method: "PATCH" });
      await load();
    } catch (err) {
      setModal({ title: "Errore", message: `Errore: ${err.message}` });
    }
  }

  async function confermaRifiuto(id, commento = "") {
    try {
      await apiFetch(`/rapporti/${id}/rifiuta`, {
        method: "PATCH",
        body: JSON.stringify({ commento })
      });
      await load();
    } catch (err) {
      setModal({ title: "Errore", message: `Errore: ${err.message}` });
    }
  }

  function rifiuta(id) {
    setCommentoRifiuto("");
    commentoRifiutoRef.current = "";
    setRifiutoRapportoId(id);
  }

  const inAttesa = rows.filter(r => r.status === "in_attesa");
  const approvati = rows.filter(r => r.status === "approvato");
  const rifiutati = rows.filter(r => r.status === "rifiutato");

  return (
    <section>
      <h2>Rapporti</h2>

      {error && <p className="error">{error}</p>}

      <div className="report-filters-row">
        <input
          className="operator-search-input"
          type="search"
          placeholder="Cerca per cliente, operatore o template"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          aria-label="Ricerca rapporti"
        />
        <select
          className="report-status-select"
          value={selectedStatus}
          onChange={(e) => setSelectedStatus(e.target.value)}
          aria-label="Filtro stato rapporti"
        >
          <option value="tutti">Tutti ({rows.length})</option>
          <option value="in_attesa">In Attesa ({inAttesa.length})</option>
          <option value="approvato">Approvati ({approvati.length})</option>
          <option value="rifiutato">Rifiutati ({rifiutati.length})</option>
        </select>
      </div>

      {filtered.length === 0 ? (
        <p style={{ color: "#666" }}>Nessun rapporto trovato con i filtri selezionati</p>
      ) : (
        <div className="clients-grid">
          {filtered.map((r) => (
            <RapportoCard
              key={r.id}
              rapporto={r}
              isExpanded={expandedId === r.id}
              onToggleExpand={() => setExpandedId(expandedId === r.id ? null : r.id)}
              onVisualizza={() => navigate(`/admin/rapporti/${r.id}`)}
              onApprovazione={() => approva(r.id)}
              onRifiuto={() => rifiuta(r.id)}
              showClienteNome={true}
              layout="card"
            />
          ))}
        </div>
      )}

      <Modal
        isOpen={Boolean(modal)}
        title={modal?.title}
        message={modal?.message}
        actions={modal?.actions}
        onClose={() => setModal(null)}
      />

      <Modal
        isOpen={Boolean(rifiutoRapportoId)}
        title="Conferma Rifiuto"
        actions={[
          { label: "Annulla", variant: "secondary", onClick: () => setRifiutoRapportoId(null) },
          {
            label: "Conferma",
            variant: "danger",
            onClick: async () => {
              const commentoCorrente = commentoTextareaRef.current?.value || commentoRifiutoRef.current || "";
              const targetId = rifiutoRapportoId;
              setRifiutoRapportoId(null);
              if (targetId) await confermaRifiuto(targetId, commentoCorrente);
            }
          }
        ]}
        onClose={() => setRifiutoRapportoId(null)}
      >
        <div>
          <p className="modal-message" style={{ marginBottom: "10px" }}>
            Rifiutare questo rapporto? Lo stato passerà a Rifiutato.
          </p>
          <label style={{ display: "block", fontSize: "13px", color: "#40574b", marginBottom: "6px" }}>
            Commento (opzionale)
          </label>
          <textarea
            ref={commentoTextareaRef}
            rows="4"
            value={commentoRifiuto}
            onChange={(e) => {
              setCommentoRifiuto(e.target.value);
              commentoRifiutoRef.current = e.target.value;
            }}
            placeholder="Motivo del rifiuto..."
            style={{
              width: "100%",
              border: "1px solid #cfe5d5",
              borderRadius: "8px",
              padding: "10px",
              resize: "vertical"
            }}
          />
        </div>
      </Modal>
    </section>
  );
}
