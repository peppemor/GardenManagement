import { useEffect, useState } from "react";
import { apiFetch } from "../../components/api";
import { Card, Button, AddClientCard, InfoSection } from "../../components/UI";

export default function Operatori() {
  const [operatori, setOperatori] = useState([]);
  const [openMenuId, setOpenMenuId] = useState(null);
  const [editingId, setEditingId] = useState(null);
  const [form, setForm] = useState({ nome: "", cognome: "", username: "", password: "" });
  const [error, setError] = useState("");

  async function load() {
    try {
      const data = await apiFetch("/operatori");
      setOperatori(data);
    } catch (err) {
      setError(err.message);
    }
  }

  useEffect(() => {
    load();
  }, []);

  async function submit(e) {
    e.preventDefault();
    setError("");

    try {
      const isNew = editingId === "new";
      const payload = {
        nome: form.nome,
        cognome: form.cognome,
        username: form.username,
        ...(form.password ? { password: form.password } : {})
      };

      if (isNew && !form.password) {
        setError("Password obbligatoria per nuovo operatore");
        return;
      }

      await apiFetch(isNew ? "/operatori" : `/operatori/${editingId}`, {
        method: isNew ? "POST" : "PUT",
        body: JSON.stringify(payload)
      });

      resetForm();
      await load();
    } catch (err) {
      setError(err.message);
    }
  }

  function startEdit(operatore) {
    setEditingId(operatore.id || "new");
    setForm({
      nome: operatore.nome || "",
      cognome: operatore.cognome || "",
      username: operatore.username || "",
      password: ""
    });
    setOpenMenuId(null);
  }

  function resetForm() {
    setEditingId(null);
    setForm({ nome: "", cognome: "", username: "", password: "" });
    setOpenMenuId(null);
  }

  async function removeOperatore(id) {
    setError("");
    try {
      await apiFetch(`/operatori/${id}`, { method: "DELETE" });
      if (editingId === id) {
        resetForm();
      }
      await load();
    } catch (err) {
      setError(err.message);
    }
  }

  function toggleMenu(id) {
    setOpenMenuId(openMenuId === id ? null : id);
  }

  if (operatori.length === 0) {
    return (
      <section>
        <h2>Operatori</h2>
        {editingId ? (
          <Card className="form-grid">
            <form onSubmit={submit} style={{ display: "contents" }}>
              <input placeholder="Nome" value={form.nome} onChange={(e) => setForm({ ...form, nome: e.target.value })} />
              <input placeholder="Cognome" value={form.cognome} onChange={(e) => setForm({ ...form, cognome: e.target.value })} />
              <input placeholder="Username" value={form.username} onChange={(e) => setForm({ ...form, username: e.target.value })} required />
              <input
                type="password"
                placeholder={editingId === "new" ? "Password" : "Nuova password (opzionale)"}
                value={form.password}
                onChange={(e) => setForm({ ...form, password: e.target.value })}
                required={editingId === "new"}
              />
              {error ? <p className="error">{error}</p> : null}
              <div className="inline-actions">
                <Button variant="primary" type="submit">Salva Operatore</Button>
                <Button variant="secondary" type="button" onClick={resetForm}>Annulla</Button>
              </div>
            </form>
          </Card>
        ) : (
          <div className="clients-grid">
            <AddClientCard onClick={() => startEdit({})} />
          </div>
        )}
      </section>
    );
  }

  return (
    <section>
      <h2>Operatori</h2>
      {editingId ? (
        <Card className="form-grid">
          <form onSubmit={submit} style={{ display: "contents" }}>
            <input placeholder="Nome" value={form.nome} onChange={(e) => setForm({ ...form, nome: e.target.value })} />
            <input placeholder="Cognome" value={form.cognome} onChange={(e) => setForm({ ...form, cognome: e.target.value })} />
            <input placeholder="Username" value={form.username} onChange={(e) => setForm({ ...form, username: e.target.value })} required />
            <input
              type="password"
              placeholder={editingId === "new" ? "Password" : "Nuova password (opzionale)"}
              value={form.password}
              onChange={(e) => setForm({ ...form, password: e.target.value })}
              required={editingId === "new"}
            />
            {error ? <p className="error">{error}</p> : null}
            <div className="inline-actions">
              <Button variant="primary" type="submit">Salva Operatore</Button>
              <Button variant="secondary" type="button" onClick={resetForm}>Annulla</Button>
            </div>
          </form>
        </Card>
      ) : (
        <div className="clients-grid">
          {operatori.map((operatore) => (
            <Card className="client-card" key={operatore.id}>
              <div className="card-header">
                <h3>{`${operatore.nome || ''} ${operatore.cognome || ''}`.trim() || 'Operatore'}</h3>
                <div className="menu-wrapper">
                  <button className="menu-button" onClick={() => toggleMenu(operatore.id)}>⋯</button>
                  {openMenuId === operatore.id && (
                    <div className="menu-dropdown">
                      <button onClick={() => startEdit(operatore)}>Modifica</button>
                      <button onClick={() => removeOperatore(operatore.id)}>Elimina</button>
                    </div>
                  )}
                </div>
              </div>
              <InfoSection label="Username" value={operatore.username} />
              <InfoSection label="Ruolo" value={operatore.ruolo} />
            </Card>
          ))}

          <AddClientCard onClick={() => startEdit({})} />
        </div>
      )}
    </section>
  );
}
