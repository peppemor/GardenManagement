import Card from "./Card";

export default function AddClientCard({ onClick }) {
  return (
    <button className="card add-client-card" onClick={onClick}>
      <div className="add-icon">+</div>
      <p>Aggiungi Cliente</p>
    </button>
  );
}
