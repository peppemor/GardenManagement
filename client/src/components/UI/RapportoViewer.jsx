import { useRef } from "react";
import html2pdf from "html2pdf.js";
import { Button } from "./index";

export default function RapportoViewer({
  rapporto,
  isLoading = false,
  onApprovazione,
  onRifiuto
}) {
  const contentRef = useRef(null);

  function exportToPDF() {
    if (!contentRef.current) return;

    const element = contentRef.current;
    const opt = {
      margin: 10,
      filename: `Rapporto_${rapporto.cliente_nome}_${new Date(rapporto.created_at).toLocaleDateString("it-IT")}.pdf`,
      image: { type: "jpeg", quality: 0.98 },
      html2canvas: { scale: 2 },
      jsPDF: { orientation: "portrait", unit: "mm", format: "a4" }
    };

    html2pdf().set(opt).from(element).save();
  }

  if (isLoading) {
    return <p>Caricamento rapporto...</p>;
  }

  if (!rapporto) {
    return <p style={{ color: "#666" }}>Rapporto non trovato</p>;
  }

  const dataCreazione = new Date(rapporto.created_at).toLocaleDateString("it-IT");
  const oraCreazione = new Date(rapporto.created_at).toLocaleTimeString("it-IT");
  const statusLabel =
    rapporto.status === "approvato"
      ? "Approvato"
      : rapporto.status === "in_attesa"
        ? "In Attesa"
        : rapporto.status === "rifiutato"
          ? "Rifiutato"
          : "Bozza";
  const statusClass =
    rapporto.status === "approvato"
      ? "approved"
      : rapporto.status === "rifiutato"
        ? "rejected"
        : "pending";

  return (
    <div style={{ maxWidth: "900px", margin: "0 auto" }}>
      {/* Bottone Export */}
      <div style={{ display: "flex", justifyContent: "flex-end", marginBottom: "20px", gap: "10px" }}>
        <Button variant="primary" onClick={exportToPDF}>
          📥 Esporta in PDF
        </Button>
      </div>

      {/* Contenuto da esportare */}
      <article
        ref={contentRef}
        style={{
          background: "#fff",
          border: "1px solid #d8e8dd",
          borderRadius: "10px",
          padding: "30px",
          boxShadow: "0 8px 18px rgba(20, 62, 33, 0.08)"
        }}
      >
        {/* Header */}
        <div style={{ marginBottom: "30px", borderBottom: "2px solid #194d33", paddingBottom: "15px" }}>
          <h1 style={{ margin: "0 0 10px 0", color: "#173426" }}>Rapporto di Intervento</h1>
          <p style={{ margin: "0", fontSize: "14px", color: "#666" }}>
            {dataCreazione} - {oraCreazione}
          </p>
        </div>

        {/* Informazioni Cliente */}
        <div style={{ marginBottom: "25px" }}>
          <h3 style={{ borderBottom: "1px solid #cfe5d5", paddingBottom: "8px", color: "#194d33" }}>
            Cliente
          </h3>
          <p style={{ margin: "12px 0 0 0", fontSize: "16px", fontWeight: "600", color: "#173426" }}>
            {rapporto.cliente_nome}
          </p>
        </div>

        {/* Informazioni Operatore */}
        <div style={{ marginBottom: "25px" }}>
          <h3 style={{ borderBottom: "1px solid #cfe5d5", paddingBottom: "8px", color: "#194d33" }}>
            Operatore
          </h3>
          <p style={{ margin: "12px 0 0 0", fontSize: "14px", color: "#333" }}>
            {rapporto.operatore_nome} {rapporto.operatore_cognome}
          </p>
        </div>

        {/* Informazioni Template */}
        {rapporto.template_titolo && (
          <div style={{ marginBottom: "25px" }}>
            <h3 style={{ borderBottom: "1px solid #cfe5d5", paddingBottom: "8px", color: "#194d33" }}>
              Template
            </h3>
            <p style={{ margin: "12px 0 0 0", fontSize: "14px", color: "#333" }}>
              {rapporto.template_titolo}
            </p>
          </div>
        )}

        {/* Dati Compilati */}
        <div style={{ marginBottom: "25px" }}>
          <h3 style={{ borderBottom: "1px solid #cfe5d5", paddingBottom: "8px", color: "#194d33" }}>
            Dati dell'Intervento
          </h3>

          {Object.keys(rapporto.dati_compilati || {}).length === 0 ? (
            <p style={{ margin: "12px 0 0 0", fontSize: "14px", color: "#666", fontStyle: "italic" }}>
              Nessun dato compilato
            </p>
          ) : (
            <div style={{ marginTop: "12px" }}>
              {Object.entries(rapporto.dati_compilati || {}).map(([key, value]) => (
                <div
                  key={key}
                  style={{
                    display: "grid",
                    gridTemplateColumns: "200px 1fr",
                    gap: "15px",
                    padding: "10px 0",
                    borderBottom: "1px solid #f0f0f0"
                  }}
                >
                  <strong style={{ color: "#194d33" }}>{key}:</strong>
                  <span style={{ color: "#333", wordBreak: "break-word" }}>{String(value)}</span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Status + Azioni Admin */}
        <div className="viewer-status-bar">
          <p className="viewer-status-line">
            <strong>Status:</strong>
            <span className={`viewer-status-badge ${statusClass}`}>{statusLabel}</span>
          </p>

          {rapporto.status === "in_attesa" && (onApprovazione || onRifiuto) && (
            <div className="viewer-status-actions">
              {onApprovazione && (
                <Button variant="primary" onClick={onApprovazione}>
                  Approva
                </Button>
              )}
              {onRifiuto && (
                <Button variant="danger" onClick={onRifiuto}>
                  Rifiuta
                </Button>
              )}
            </div>
          )}
        </div>
      </article>
    </div>
  );
}
