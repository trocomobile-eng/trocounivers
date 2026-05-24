// src/pages/SafetyPage.jsx
import InfoPageLayout from "../components/InfoPageLayout";

export default function SafetyPage() {
  return (
    <InfoPageLayout
      eyebrow="Sécurité"
      title="Des échanges plus clairs et plus rassurants."
      subtitle="Troco encourage les échanges responsables, les rencontres dans des lieux publics et la protection des informations personnelles."
    >
      <h2>Rencontre dans un lieu public</h2>
      <p>
        Pour un premier échange, privilégie un lieu public, fréquenté et facile d’accès :
        café, place animée, commerce partenaire ou lieu de passage.
      </p>

      <h2>Informations privées</h2>
      <p>
        Ne partage pas d’adresse personnelle, de document sensible ou d’information bancaire dans la messagerie.
        Les détails pratiques doivent rester limités au rendez-vous.
      </p>

      <h2>Objets et échanges</h2>
      <p>
        Vérifie l’état de l’objet avant de confirmer l’échange. Si une proposition ne semble pas équilibrée,
        tu peux refuser ou demander une compensation avec un objet supplémentaire.
      </p>

      <h2>Signalement</h2>
      <p>
        Si un comportement paraît suspect ou inapproprié, interromps l’échange et contacte l’équipe Troco
        lorsqu’un canal de support est disponible.
      </p>
    </InfoPageLayout>
  );
}
