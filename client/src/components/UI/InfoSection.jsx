export default function InfoSection({ label, value }) {
  return (
    <p className="info">
      <strong>{label}:</strong> {value || "-"}
    </p>
  );
}
