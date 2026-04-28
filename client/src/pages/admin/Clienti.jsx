import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { apiFetch } from "../../components/api";
import { Card, Button, AddClientCard, InfoSection } from "../../components/UI";

export default function Clienti() {
  const [clienti, setClienti] = useState([]);
  const [openMenuId, setOpenMenuId] = useState(null);
  const [editingId, setEditingId] = useState(null);
  const [form, setForm] = useState({ nome: "", telefono: "", indirizzo: "", note: "" });
  const [error, setError] = useState("");

  async function load() {
    try {
      const data = await apiFetch("/clienti");
      setClienti(data);
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
      await apiFetch(isNew ? "/clienti" : `/clienti/${editingId}`, {
        method: isNew ? "POST" : "PUT",
        body: JSON.stringify(form)
      });

      resetForm();
      await load();
    } catch (err) {
      setError(err.message);
    }
  }

  function startEdit(cliente) {
    setEditingId(cliente.id || "new");
    setForm({
      nome: cliente.nome || "",
      telefono: cliente.telefono || "",
      indirizzo: cliente.indirizzo || "",
      note: cliente.note || ""
    });
    setOpenMenuId(null);
  }

  function resetForm() {
    setEditingId(null);
    setForm({ nome: "", telefono: "", indirizzo: "", note: "" });
    setOpenMenuId(null);
  }

  async function removeCliente(id) {
    setError("");
    try {
      await apiFetch(`/clienti/${id}`, { method: "DELETE" });
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

  if (clienti.length === 0) {
    return (
      <section>
        <h2>Clienti</h2>
        {editingId ? (
          <Card className="form-grid">
            <form onSubmit={submit} style={{ display: "contents" }}>
              <input placeholder="Nome" value={form.nome} onChange={(e) => setForm({ ...form, nome: e.target.value })} required />
              <input placeholder="Telefono" value={form.telefono} onChange={(e) => setForm({ ...form, telefono: e.target.value })} />
              <input placeholder="Indirizzo" value={form.indirizzo} onChange={(e) => setForm({ ...form, indirizzo: e.target.value })} />
              <textarea placeholder="Note" value={form.note} onChange={(e) => setForm({ ...form, note: e.target.value })} />
              {error ? <p className="error">{error}</p> : null}
              <div className="inline-actions">
                <Button variant="primary" type="submit">Salva Cliente</Button>
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
      <h2>Clienti</h2>
      {editingId ? (
        <Card className="form-grid">
          <form onSubmit={submit} style={{ display: "contents" }}>
            <input placeholder="Nome" value={form.nome} onChange={(e) => setForm({ ...form, nome: e.target.value })} required />
            <input placeholder="Telefono" value={form.telefono} onChange={(e) => setForm({ ...form, telefono: e.target.value })} />
            <input placeholder="Indirizzo" value={form.indirizzo} onChange={(e) => setForm({ ...form, indirizzo: e.target.value })} />
            <textarea placeholder="Note" value={form.note} onChange={(e) => setForm({ ...form, note: e.target.value })} />
            {error ? <p className="error">{error}</p> : null}
            <div className="inline-actions">
              <Button variant="primary" type="submit">Salva Cliente</Button>
              <Button variant="secondary" type="button" onClick={resetForm}>Annulla</Button>
            </div>
          </form>
        </Card>
      ) : (
        <div className="clients-grid">
          {clienti.map((cliente) => (
            <Card className="client-card" key={cliente.id}>
              <div className="card-header">
                <h3>{cliente.nome}</h3>
                <div className="menu-wrapper">
                  <button className="menu-button" onClick={() => toggleMenu(cliente.id)}>⋯</button>
                  {openMenuId === cliente.id && (
                    <div className="menu-dropdown">
                      <button onClick={() => startEdit(cliente)}>Modifica</button>
                      <button onClick={() => removeCliente(cliente.id)}>Elimina</button>
                      <Link to={`/admin/rapporti?cliente=${cliente.id}`}>Rapporti</Link>
                    </div>
                  )}
                </div>
              </div>
              <InfoSection label="Telefono" value={cliente.telefono} />
              <InfoSection label="Indirizzo" value={cliente.indirizzo} />
              {cliente.note && <InfoSection label="Note" value={cliente.note} />}
            </Card>
          ))}

          <AddClientCard onClick={() => startEdit({})} />
        </div>
      )}
    </section>
  );
}
