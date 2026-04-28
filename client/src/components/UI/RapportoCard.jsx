import { Button, StatusPill } from "./index";

export default function RapportoCard({
  rapporto,
  isExpanded,
  onToggleExpand,
  onVisualizza,
  onApprovazione,
  onRifiuto,
  showClienteNome = false,
  layout = "card" // "card" o "list"
}) {
  const commonContent = (
    <>
      <h3 style={{ margin: "0 0 12px 0" }}>
        {showClienteNome ? rapporto.cliente_nome : rapporto.template_titolo || "Rapporto"}
      </h3>

      {showClienteNome && rapporto.template_titolo && (
        <p className="info" style={{ margin: "0 0 8px 0", fontSize: "13px" }}>
          <strong>Template:</strong> {rapporto.template_titolo}
        </p>
      )}

      <p className="info">
        <strong>Operatore:</strong> {rapporto.operatore_nome} {rapporto.operatore_cognome}
      </p>

      <p className="info">
        <strong>Data:</strong> {rapporto.created_at ? new Date(rapporto.created_at).toLocaleDateString("it-IT") : "-"}
      </p>

      <p className="info">
        <strong>Status:</strong> <StatusPill status={rapporto.status} />
      </p>
    </>
  );

  const expandedContent = (
    <div style={{ marginTop: "15px", paddingTop: "15px", borderTop: "1px solid #ddd" }}>
      <h4 style={{ margin: "0 0 8px 0" }}>Dati Compilati</h4>
      {Object.keys(rapporto.dati_compilati || {}).length === 0 ? (
        <p style={{ color: "#666", fontSize: "12px", margin: "0" }}>Nessun dato compilato</p>
      ) : (
        <div style={{ fontSize: "12px" }}>
          {Object.entries(rapporto.dati_compilati || {}).map(([key, value]) => (
            <p key={key} style={{ marginBottom: "8px", margin: "0 0 8px 0" }}>
              <strong>{key}:</strong> {String(value)}
            </p>
          ))}
        </div>
      )}

      <div style={{ marginTop: "15px", display: "flex", flexDirection: "column", gap: "10px" }}>
        {rapporto.status === "in_attesa" && (onApprovazione || onRifiuto) && (
          <div style={{ display: "flex", gap: "10px" }}>
            {onApprovazione && (
              <Button variant="primary" style={{ flex: 1 }} onClick={onApprovazione}>
                Approva
              </Button>
            )}
            {onRifiuto && (
              <Button variant="secondary" style={{ flex: 1 }} onClick={onRifiuto}>
                Rifiuta
              </Button>
            )}
          </div>
        )}
        <div style={{ display: "flex" }}>
          <Button variant="secondary" style={{ flex: 1 }} onClick={onVisualizza}>
            👁️ Visualizza Completo
          </Button>
        </div>
      </div>
    </div>
  );

  if (layout === "list") {
    return (
      <div
        onClick={onToggleExpand}
        style={{
          padding: "12px 16px",
          border: "1px solid #e0e0e0",
          borderRadius: "6px",
          cursor: "pointer",
          backgroundColor: "#fff",
          marginBottom: "12px"
        }}
      >
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <div style={{ flex: 1 }}>
            <p style={{ margin: "0 0 4px 0", fontWeight: "500" }}>
              {rapporto.template_titolo || "Rapporto"}
            </p>
            <small style={{ color: "#666" }}>
              Operatore: {rapporto.operatore_nome} {rapporto.operatore_cognome} • {new Date(rapporto.created_at).toLocaleDateString("it-IT")}
            </small>
          </div>
          <StatusPill status={rapporto.status} />
          <span style={{ fontSize: "18px", color: "#666", marginLeft: "12px" }}>
            {isExpanded ? "▼" : "▶"}
          </span>
        </div>

        {isExpanded && (
          <div style={{ marginTop: "12px", paddingTop: "12px", borderTop: "1px solid #e0e0e0" }}>
            <h4 style={{ marginBottom: "8px" }}>Dati Intervento</h4>
            {Object.keys(rapporto.dati_compilati || {}).length === 0 ? (
              <p style={{ fontSize: "12px", color: "#666" }}>Nessun dato disponibile</p>
            ) : (
              <div style={{ fontSize: "13px" }}>
                {Object.entries(rapporto.dati_compilati || {}).map(([key, value]) => (
                  <p key={key} style={{ marginBottom: "6px" }}>
                    <strong>{key}:</strong> {String(value)}
                  </p>
                ))}
              </div>
            )}
            <div style={{ marginTop: "12px" }}>
              <Button variant="secondary" onClick={onVisualizza}>
                👁️ Visualizza Completo
              </Button>
            </div>
          </div>
        )}
      </div>
    );
  }

  // Layout "card" (default per admin)
  return (
    <div
      className="client-card"
      style={{
        border: "1px solid #d8e8dd",
        borderRadius: "8px",
        padding: "16px",
        backgroundColor: "#fff"
      }}
    >
      <div className="card-header" style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "12px" }}>
        <h3 style={{ margin: "0", flex: 1 }}>
          {showClienteNome ? rapporto.cliente_nome : rapporto.template_titolo || "Rapporto"}
        </h3>
        <button
          className="menu-button"
          onClick={onToggleExpand}
          style={{
            background: "none",
            border: "none",
            cursor: "pointer",
            fontSize: "16px"
          }}
        >
          {isExpanded ? "▼" : "▶"}
        </button>
      </div>

      {showClienteNome && rapporto.template_titolo && (
        <p className="info" style={{ margin: "0 0 8px 0", fontSize: "13px" }}>
          <strong>Template:</strong> {rapporto.template_titolo}
        </p>
      )}

      <p className="info">
        <strong>Operatore:</strong> {rapporto.operatore_nome} {rapporto.operatore_cognome}
      </p>

      <p className="info">
        <strong>Data:</strong> {rapporto.created_at ? new Date(rapporto.created_at).toLocaleDateString("it-IT") : "-"}
      </p>

      <p className="info">
        <strong>Status:</strong> <StatusPill status={rapporto.status} />
      </p>

      {isExpanded && (
        <div style={{ marginTop: "15px", paddingTop: "15px", borderTop: "1px solid #ddd" }}>
          <h4 style={{ margin: "0 0 8px 0" }}>Dati Compilati</h4>
          {Object.keys(rapporto.dati_compilati || {}).length === 0 ? (
            <p style={{ color: "#666", fontSize: "12px", margin: "0" }}>Nessun dato compilato</p>
          ) : (
            <div style={{ fontSize: "12px" }}>
              {Object.entries(rapporto.dati_compilati || {}).map(([key, value]) => (
                <p key={key} style={{ marginBottom: "8px", margin: "0 0 8px 0" }}>
                  <strong>{key}:</strong> {String(value)}
                </p>
              ))}
            </div>
          )}

          <div style={{ marginTop: "15px", display: "flex", flexDirection: "column", gap: "10px" }}>
            {rapporto.status === "in_attesa" && (onApprovazione || onRifiuto) && (
              <div style={{ display: "flex", gap: "10px" }}>
                {onApprovazione && (
                  <Button variant="primary" style={{ flex: 1 }} onClick={onApprovazione}>
                    Approva
                  </Button>
                )}
                {onRifiuto && (
                  <Button variant="secondary" style={{ flex: 1 }} onClick={onRifiuto}>
                    Rifiuta
                  </Button>
                )}
              </div>
            )}
            <div style={{ display: "flex" }}>
              <Button variant="secondary" style={{ flex: 1 }} onClick={onVisualizza}>
                👁️ Visualizza Completo
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
