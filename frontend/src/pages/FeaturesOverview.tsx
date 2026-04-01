import React from 'react';
import {
  Box,
  Button,
  Card,
  CardActions,
  CardContent,
  Chip,
  Container,
  Grid,
  Stack,
  Typography,
} from '@mui/material';
import { Link as RouterLink } from 'react-router-dom';
import Seo from '../seo/Seo';
import { intentPages, marketingFeatures } from '../content/marketingContent';

const FeaturesOverview: React.FC = () => {
  const itemList = {
    '@context': 'https://schema.org',
    '@type': 'ItemList',
    name: 'Kaderblick Funktionen',
    itemListElement: marketingFeatures.map((feature, index) => ({
      '@type': 'ListItem',
      position: index + 1,
      name: feature.name,
      url: `https://kaderblick.de/funktionen/${feature.slug}`,
    })),
  };

  return (
    <Container maxWidth="lg" sx={{ py: { xs: 4, md: 6 } }}>
      <Seo
        title="Funktionen fuer Fussballvereine | Kaderblick"
        description="Entdecke die wichtigsten Funktionen von Kaderblick fuer Fussballvereine: Kalender, Teilnahmen, Spielanalyse, Formationen, Kommunikation, Berichte und Vereinsorganisation."
        canonicalPath="/funktionen"
        jsonLd={itemList}
      />

      <Stack spacing={2} sx={{ mb: 5 }}>
        <Typography variant="overline" sx={{ letterSpacing: 2.2, color: 'primary.main', fontWeight: 700 }}>
          Oeffentliche Produktseiten
        </Typography>
        <Typography component="h1" variant="h2" sx={{ fontWeight: 800, maxWidth: 900 }}>
          Funktionen fuer Vereine, Trainer und Teams
        </Typography>
        <Typography variant="body1" color="text.secondary" sx={{ maxWidth: 900, fontSize: '1.05rem' }}>
          Hier findest du die zentralen Bereiche von Kaderblick im kompakten Ueberblick. Fuer konkrete Ablaeufe und Funktionen gibt es die passende Dokumentation.
        </Typography>
      </Stack>

      <Grid container spacing={3}>
        {marketingFeatures.map((feature) => (
          <Grid key={feature.slug} size={{ xs: 12, md: 6, xl: 4 }}>
            <Card sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
              <Box
                component="img"
                src={feature.image}
                alt={feature.name}
                sx={{ width: '100%', aspectRatio: '16 / 9', objectFit: 'cover' }}
              />
              <CardContent sx={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 1.5 }}>
                <Typography component="h2" variant="h5" sx={{ fontWeight: 700 }}>
                  {feature.name}
                </Typography>
                <Typography variant="body1" color="text.secondary">
                  {feature.teaser}
                </Typography>
                <Stack direction="row" flexWrap="wrap" useFlexGap gap={1}>
                  {feature.suitableFor.map((entry) => (
                    <Chip key={entry} label={entry} size="small" variant="outlined" />
                  ))}
                </Stack>
              </CardContent>
              <CardActions sx={{ px: 2, pb: 2 }}>
                <Button
                  component={RouterLink}
                  to={`/funktionen/${feature.slug}`}
                  variant="contained"
                >
                  Mehr erfahren
                </Button>
              </CardActions>
            </Card>
          </Grid>
        ))}
      </Grid>

      <Stack spacing={2} sx={{ mt: 6 }}>
        <Typography component="h2" variant="h4" sx={{ fontWeight: 700 }}>
          Bereiche fuer unterschiedliche Anforderungen
        </Typography>
        <Typography variant="body1" color="text.secondary" sx={{ maxWidth: 900 }}>
          Je nach Rolle oder Schwerpunkt gibt es kompakte Einstiegsseiten, die den passenden Bereich schneller einordnen.
        </Typography>
        <Grid container spacing={3}>
          {intentPages.map((page) => (
            <Grid key={page.path} size={{ xs: 12, md: 6 }}>
              <Card sx={{ height: '100%' }}>
                <CardContent sx={{ display: 'flex', flexDirection: 'column', gap: 1.5 }}>
                  <Typography component="h3" variant="h5" sx={{ fontWeight: 700 }}>
                    {page.label}
                  </Typography>
                  <Typography variant="body1" color="text.secondary">
                    {page.summary}
                  </Typography>
                  <Button component={RouterLink} to={page.path} variant="outlined" sx={{ alignSelf: 'flex-start' }}>
                    Landingpage ansehen
                  </Button>
                </CardContent>
              </Card>
            </Grid>
          ))}
        </Grid>
      </Stack>
    </Container>
  );
};

export default FeaturesOverview;