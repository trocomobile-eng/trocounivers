// src/pages/AboutPage.jsx
import InfoPageLayout from "../components/InfoPageLayout";

export default function AboutPage() {
  return (
    <InfoPageLayout
      eyebrow="À propos"
      title="Redonner une seconde vie aux objets."
      subtitle="Troco aide les personnes d’un même quartier à échanger des objets simplement, sans paiement obligatoire, dans une logique locale et humaine."
    >
      <h2>Notre idée</h2>
      <p>
        Beaucoup d’objets dorment dans nos placards alors qu’ils pourraient être utiles à quelqu’un d’autre.
        Troco propose une alternative simple : échanger, donner, proposer, discuter et organiser une rencontre.
      </p>

      <h2>Une application locale</h2>
      <p>
        Troco est pensé pour les échanges de proximité. L’objectif est de favoriser les rencontres simples,
        les objets qui circulent et les échanges responsables dans la ville.
      </p>

      <h2>Une approche humaine</h2>
      <p>
        L’application met l’accent sur la clarté, la confiance et une expérience chaleureuse.
        Les échanges peuvent être acceptés, ajustés ou discutés avant la rencontre.
      </p>
    </InfoPageLayout>
  );
}
