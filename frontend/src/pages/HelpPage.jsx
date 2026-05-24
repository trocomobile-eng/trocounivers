// src/pages/HelpPage.jsx
import InfoPageLayout from "../components/InfoPageLayout";

export default function HelpPage() {
  return (
    <InfoPageLayout
      eyebrow="Aide"
      title="Comment utiliser Troco ?"
      subtitle="Les bases pour ajouter un objet, proposer un troc, négocier et organiser une rencontre."
    >
      <h2>Ajouter un objet</h2>
      <p>
        Va dans ta Biblio, clique sur “Ajouter un objet”, ajoute des photos, choisis une catégorie,
        décris l’état de l’objet et indique ton secteur.
      </p>

      <h2>Proposer un troc</h2>
      <p>
        Depuis un objet qui t’intéresse, choisis un ou plusieurs objets de ta Biblio à proposer.
        L’autre personne pourra accepter, refuser ou demander un objet en plus.
      </p>

      <h2>Organiser la rencontre</h2>
      <p>
        Une fois l’échange accepté, Troco te guide pour proposer des disponibilités.
        Si aucun créneau ne convient après deux tours, une discussion s’ouvre pour finaliser le rendez-vous.
      </p>

      <h2>Modifier ou supprimer un objet</h2>
      <p>
        Depuis ta Biblio ou la fiche de ton objet, tu peux modifier les informations, les photos,
        l’ordre des images ou supprimer l’objet.
      </p>
    </InfoPageLayout>
  );
}
