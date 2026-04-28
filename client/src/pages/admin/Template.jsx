import { TemplatePreviewCard } from "../../components/UI";

export default function Template() {
  return (
    <section>
      <h2>Template Rapporti</h2>
      <p className="info" style={{ marginBottom: "18px" }}>
        Il template e' gestito nella pagina Impostazioni insieme a tutte le configurazioni.
      </p>

      <TemplatePreviewCard />
    </section>
  );
}
