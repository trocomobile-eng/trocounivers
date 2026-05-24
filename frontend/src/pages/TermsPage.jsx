// src/pages/TermsPage.jsx
import InfoPageLayout from "../components/InfoPageLayout";

export default function TermsPage() {
  return (
    <InfoPageLayout
      eyebrow="Conditions"
      title="Conditions d’utilisation"
      subtitle="Ces conditions décrivent les règles générales d’utilisation de Troco. Elles devront être validées juridiquement avant un lancement public."
    >
      <h2>Utilisation du service</h2>
      <p>
        Troco permet de publier des objets, de proposer des échanges et d’organiser des rencontres entre utilisateurs.
        Chaque utilisateur reste responsable des objets qu’il publie et des échanges qu’il accepte.
      </p>

      <h2>Objets interdits</h2>
      <p>
        Les objets illégaux, dangereux, contrefaits, volés ou soumis à réglementation spécifique ne doivent pas être proposés.
        Troco peut retirer un contenu qui ne respecte pas ces règles.
      </p>

      <h2>Rencontres et responsabilité</h2>
      <p>
        Les utilisateurs organisent leurs rencontres sous leur propre responsabilité.
        Il est recommandé de se rencontrer dans des lieux publics et de vérifier l’objet avant l’échange.
      </p>

      <h2>Disponibilité du service</h2>
      <p>
        Troco peut évoluer, être modifié ou interrompu temporairement pour des raisons techniques,
        de maintenance ou d’amélioration du produit.
      </p>

      <h2>Note importante</h2>
      <p>
        Ce texte est une base produit non juridique. Avant mise en ligne officielle,
        il faudra faire relire les conditions par un professionnel du droit.
      </p>
    </InfoPageLayout>
  );
}
