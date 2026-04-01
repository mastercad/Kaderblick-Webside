import React from 'react';
import {
  Box,
  Button,
  Card,
  CardContent,
  Chip,
  Container,
  Stack,
  Typography,
} from '@mui/material';
import { Link as RouterLink, Navigate, useLocation } from 'react-router-dom';
import Seo from '../seo/Seo';
import { intentPages, marketingFeatures } from '../content/marketingContent';

const PublicIntentPage: React.FC = () => {
  const location = useLocation();
  const currentPage = intentPages.find((page) => page.path === location.pathname);

  if (!currentPage) {
    return <Navigate to="/" replace />;
  }

  const linkedFeatures = currentPage.linkedFeatures
    .map((slug) => marketingFeatures.find((feature) => feature.slug === slug))
    .filter((entry): entry is NonNullable<typeof entry> => Boolean(entry));

  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'WebPage',
    name: currentPage.headline,
    description: currentPage.seoDescription,
    url: `https://kaderblick.de${currentPage.path}`,
  };

  return (
    <Container maxWidth="lg" sx={{ py: { xs: 4, md: 6 } }}>
      <Seo
        title={currentPage.seoTitle}
        description={currentPage.seoDescription}
        canonicalPath={currentPage.path}
        jsonLd={jsonLd}
      />

      <Stack spacing={3}>
        <Stack spacing={1.5}>
          <Typography variant="overline" sx={{ letterSpacing: 2.1, color: 'primary.main', fontWeight: 700 }}>
            Suchintention
          </Typography>
          <Typography component="h1" variant="h2" sx={{ fontWeight: 800, maxWidth: 960 }}>
            {currentPage.headline}
          </Typography>
          <Typography variant="h6" color="text.secondary" sx={{ maxWidth: 960, fontWeight: 400 }}>
            {currentPage.intro}
          </Typography>
        </Stack>

        <Typography variant="body1" sx={{ maxWidth: 960, lineHeight: 1.85, fontSize: '1.05rem' }}>
          {currentPage.summary}
        </Typography>

        <Stack direction="row" flexWrap="wrap" useFlexGap gap={1}>
          <Chip label={currentPage.label} color="primary" variant="outlined" />
        </Stack>

        <Box>
          <Typography component="h2" variant="h4" sx={{ fontWeight: 700, mb: 2 }}>
            Wobei Kaderblick in diesem Bereich hilft
          </Typography>
          <Stack component="ul" spacing={1.25} sx={{ m: 0, pl: 3, maxWidth: 920 }}>
            {currentPage.benefits.map((benefit) => (
              <Typography component="li" key={benefit} variant="body1" sx={{ lineHeight: 1.8 }}>
                {benefit}
              </Typography>
            ))}
          </Stack>
        </Box>

        <Box>
          <Typography component="h2" variant="h4" sx={{ fontWeight: 700, mb: 2.5 }}>
            Mehr Details
          </Typography>
          <Stack direction="row" flexWrap="wrap" useFlexGap gap={1.5}>
            {currentPage.docsLinks.map((entry) => (
              <Button
                key={entry.url}
                component="a"
                href={entry.url}
                target="_blank"
                rel="noreferrer"
                variant="outlined"
              >
                {entry.label}
              </Button>
            ))}
          </Stack>
        </Box>

        <Box>
          <Typography component="h2" variant="h4" sx={{ fontWeight: 700, mb: 2.5 }}>
            Passende Funktionen zu diesem Bedarf
          </Typography>
          <Stack spacing={2.5}>
            {linkedFeatures.map((feature) => (
              <Card key={feature.slug}>
                <CardContent>
                  <Stack spacing={1.5}>
                    <Typography component="h3" variant="h5" sx={{ fontWeight: 700 }}>
                      {feature.name}
                    </Typography>
                    <Typography variant="body1" color="text.secondary">
                      {feature.teaser}
                    </Typography>
                    <Button component={RouterLink} to={`/funktionen/${feature.slug}`} variant="contained" sx={{ alignSelf: 'flex-start' }}>
                      Funktionsseite ansehen
                    </Button>
                  </Stack>
                </CardContent>
              </Card>
            ))}
          </Stack>
        </Box>

        <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2}>
          <Button component="a" href={currentPage.docsLinks[0]?.url || '/'} target="_blank" rel="noreferrer" variant="outlined">
            Zur Dokumentation
          </Button>
          <Button component={RouterLink} to="/kontakt" variant="contained">
            Kontakt aufnehmen
          </Button>
        </Stack>
      </Stack>
    </Container>
  );
};

export default PublicIntentPage;