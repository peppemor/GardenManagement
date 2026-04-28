export default function StatusPill({ status }) {
  const labelMap = {
    approvato: { label: "Approvato", cls: "approved" },
    in_attesa: { label: "In attesa", cls: "pending" },
    bozza: { label: "Bozza", cls: "pending" },
    rifiutato: { label: "Rifiutato", cls: "rejected" }
  };
  const { label, cls } = labelMap[status] || { label: status, cls: "pending" };
  return <span className={`status-pill ${cls}`}>{label}</span>;
}
