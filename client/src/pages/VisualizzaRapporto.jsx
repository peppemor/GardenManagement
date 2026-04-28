import { useEffect, useRef, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { apiFetch, getAuth } from "../components/api";
import { RapportoViewer, Button, Modal } from "../components/UI";

export default function VisualizzaRapporto() {
  const { id } = useParams();
  const navigate = useNavigate();
  const auth = getAuth();
  const isAdmin = auth?.user?.ruolo === "admin";
  const [rapporto, setRapporto] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");
  const [modal, setModal] = useState(null);
  const [rifiutoModalOpen, setRifiutoModalOpen] = useState(false);
  const [commentoRifiuto, setCommentoRifiuto] = useState("");
  const commentoRifiutoRef = useRef("");
  const commentoTextareaRef = useRef(null);

  async function loadRapporto() {
    setIsLoading(true);
    setError("");
    try {
      const data = await apiFetch(`/rapporti/${id}`);
      setRapporto({
        ...data,
        dati_compilati: typeof data.dati_compilati === "string" ? JSON.parse(data.dati_compilati || "{}") : data.dati_compilati
      });
    } catch (err) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  }

  useEffect(() => {
    loadRapporto();
  }, [id]);

  async function approvaRapporto() {
    try {
      await apiFetch(`/rapporti/${id}/approva`, { method: "PATCH" });
      await loadRapporto();
    } catch (err) {
      setModal({ title: "Errore", message: `Errore: ${err.message}` });
    }
  }

  async function rifiutaRapporto(commento = "") {
    try {
      await apiFetch(`/rapporti/${id}/rifiuta`, {
        method: "PATCH",
        body: JSON.stringify({ commento })
      });
      await loadRapporto();
    } catch (err) {
      setModal({ title: "Errore", message: `Errore: ${err.message}` });
    }
  }

  function confermaRifiuto() {
    setCommentoRifiuto("");
    commentoRifiutoRef.current = "";
    setRifiutoModalOpen(true);
  }

  return (
    <section>
      <div style={{ maxWidth: "900px", margin: "0 auto 20px", display: "flex", gap: "10px", alignItems: "center" }}>
        <Button variant="secondary" onClick={() => navigate(-1)}>
          ← Indietro
        </Button>
        <h2 style={{ margin: 0, flex: 1 }}>Visualizza Rapporto</h2>
      </div>

      {error && <p style={{ color: "#d32f2f", marginBottom: "20px" }}>Errore: {error}</p>}

      <RapportoViewer
        rapporto={rapporto}
        isLoading={isLoading}
        onApprovazione={isAdmin ? approvaRapporto : undefined}
        onRifiuto={isAdmin ? confermaRifiuto : undefined}
      />

      {rapporto?.motivo_rifiuto ? (
        <section className="card" style={{ maxWidth: "900px", margin: "16px auto 0" }}>
          <h3 style={{ marginTop: 0 }}>Motivo del rifiuto</h3>
          <p style={{ margin: "0 0 10px 0", color: "#667c70", fontSize: "13px" }}>
            <strong>Data rifiuto:</strong>{" "}
            {rapporto.updated_at ? new Date(rapporto.updated_at).toLocaleDateString("it-IT") : "-"}
            {" · "}
            <strong>Ora rifiuto:</strong>{" "}
            {rapporto.updated_at ? new Date(rapporto.updated_at).toLocaleTimeString("it-IT") : "-"}
          </p>
          <p style={{ margin: 0, color: "#40574b", whiteSpace: "pre-wrap" }}>{rapporto.motivo_rifiuto}</p>
        </section>
      ) : null}

      <Modal
        isOpen={Boolean(modal)}
        title={modal?.title}
        message={modal?.message}
        actions={modal?.actions}
        onClose={() => setModal(null)}
      />

      <Modal
        isOpen={rifiutoModalOpen}
        title="Conferma Rifiuto"
        actions={[
          { label: "Annulla", variant: "secondary", onClick: () => setRifiutoModalOpen(false) },
          {
            label: "Conferma",
            variant: "danger",
            onClick: async () => {
              const commentoCorrente = commentoTextareaRef.current?.value || commentoRifiutoRef.current || "";
              setRifiutoModalOpen(false);
              await rifiutaRapporto(commentoCorrente);
            }
          }
        ]}
        onClose={() => setRifiutoModalOpen(false)}
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
