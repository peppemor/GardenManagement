import Card from "./Card";

export default function KPICard({ title, value }) {
  return (
    <Card>
      <h3>{title}</h3>
      <p>{value}</p>
    </Card>
  );
}
