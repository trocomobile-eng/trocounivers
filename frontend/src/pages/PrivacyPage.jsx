// src/pages/PrivacyPage.jsx
import InfoPageLayout from "../components/InfoPageLayout";

export default function PrivacyPage() {
  return (
    <InfoPageLayout
      eyebrow="Confidentialité"
      title="Confidentialité et données personnelles"
      subtitle="Troco doit protéger les informations personnelles et limiter les données collectées à ce qui est nécessaire au fonctionnement du service."
    >
      <h2>Données utilisées</h2>
      <p>
        Troco peut utiliser les informations nécessaires au compte utilisateur, aux objets publiés,
        aux propositions d’échange, aux messages et à l’organisation des rendez-vous.
      </p>

      <h2>Photos et objets</h2>
      <p>
        Les photos ajoutées servent à présenter les objets dans l’application.
        Évite d’inclure des informations personnelles visibles sur les images.
      </p>

      <h2>Messages</h2>
      <p>
        Les messages servent à finaliser les échanges et les rencontres.
        Ne partage pas d’informations sensibles dans la conversation.
      </p>

      <h2>Suppression</h2>
      <p>
        Un utilisateur doit pouvoir supprimer ses objets et demander la suppression de certaines données
        selon les règles applicables.
      </p>

      <h2>Note importante</h2>
      <p>
        Cette page est une base de présentation. Avant lancement public, une politique de confidentialité complète
        conforme au RGPD devra être rédigée ou validée juridiquement.
      </p>
    </InfoPageLayout>
  );
}
