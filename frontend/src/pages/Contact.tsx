import React from 'react';
import {
  Button,
  Card,
  CardContent,
  Container,
  Stack,
  Typography,
} from '@mui/material';
import Seo from '../seo/Seo';

const ContactPage: React.FC = () => {
  const contactJsonLd = {
    '@context': 'https://schema.org',
    '@type': 'Organization',
    name: 'Kaderblick',
    url: 'https://kaderblick.de/',
    email: 'andreas.kempe@kaderblick.de',
    contactPoint: [
      {
        '@type': 'ContactPoint',
        contactType: 'customer support',
        email: 'andreas.kempe@kaderblick.de',
        availableLanguage: ['de'],
      },
    ],
  };

  const openContactModal = () => {
    window.dispatchEvent(new CustomEvent('openContactModal'));
  };

  return (
    <Container maxWidth="md" sx={{ py: { xs: 4, md: 6 } }}>
      <Seo
        title="Kontakt zu Kaderblick"
        description="Kontaktseite fuer Kaderblick. Austausch zu Vereinsorganisation, Trainer-Workflows, Produktfragen und Einsatz im Fussballverein."
        canonicalPath="/kontakt"
        jsonLd={contactJsonLd}
      />

      <Stack spacing={3}>
        <Stack spacing={1.5}>
          <Typography variant="overline" sx={{ letterSpacing: 2.2, color: 'primary.main', fontWeight: 700 }}>
            Kontakt
          </Typography>
          <Typography component="h1" variant="h2" sx={{ fontWeight: 800 }}>
            Austausch zu Kaderblick
          </Typography>
          <Typography variant="body1" color="text.secondary" sx={{ lineHeight: 1.8 }}>
            Wenn du Kaderblick fuer deinen Verein, dein Trainerteam oder eure organisatorischen Prozesse einordnen moechtest, ist diese Seite der oeffentliche Kontaktpunkt der Plattform.
          </Typography>
        </Stack>

        <Card>
          <CardContent>
            <Stack spacing={1.25}>
              <Typography component="h2" variant="h5" sx={{ fontWeight: 700 }}>
                Direkter Kontakt
              </Typography>
              <Typography variant="body1">Andreas Kempe</Typography>
              <Typography variant="body1">
                E-Mail: <a href="mailto:andreas.kempe@kaderblick.de">andreas.kempe@kaderblick.de</a>
              </Typography>
            </Stack>
          </CardContent>
        </Card>

        <Card>
          <CardContent>
            <Stack spacing={1.25}>
              <Typography component="h2" variant="h5" sx={{ fontWeight: 700 }}>
                Typische Anliegen
              </Typography>
              <Typography component="p" variant="body1">Digitale Vereinsorganisation fuer Training, Spiele und Kommunikation</Typography>
              <Typography component="p" variant="body1">Fragen zu Formationen, Spielanalyse, News und Reporting</Typography>
              <Typography component="p" variant="body1">Einordnung der Plattform fuer Trainer, Eltern, Jugendleitung und Admins</Typography>
            </Stack>
          </CardContent>
        </Card>

        <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2}>
          <Button variant="contained" onClick={openContactModal}>
            Nachricht senden
          </Button>
          <Button variant="outlined" href="mailto:andreas.kempe@kaderblick.de">
            E-Mail schreiben
          </Button>
        </Stack>
      </Stack>
    </Container>
  );
};

export default ContactPage;