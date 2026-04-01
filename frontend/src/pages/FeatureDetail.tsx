import React from 'react';
import {
  Box,
  Breadcrumbs,
  Button,
  Chip,
  Container,
  Divider,
  Link,
  Stack,
  Typography,
} from '@mui/material';
import { Link as RouterLink, Navigate, useParams } from 'react-router-dom';
import Seo from '../seo/Seo';
import { marketingFeatures } from '../content/marketingContent';
import { DOCS_URL } from '../seo/siteConfig';

const FeatureDetail: React.FC = () => {
  const { slug } = useParams<{ slug: string }>();
  const feature = marketingFeatures.find((entry) => entry.slug === slug);

  if (!feature) {
    return <Navigate to="/funktionen" replace />;
  }

  const breadcrumbJsonLd = {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: [
      {
        '@type': 'ListItem',
        position: 1,
        name: 'Startseite',
        item: 'https://kaderblick.de/',
      },
      {
        '@type': 'ListItem',
        position: 2,
        name: 'Funktionen',
        item: 'https://kaderblick.de/funktionen',
      },
      {
        '@type': 'ListItem',
        position: 3,
        name: feature.name,
        item: `https://kaderblick.de/funktionen/${feature.slug}`,
      },
    ],
  };

  return (
    <Container maxWidth="lg" sx={{ py: { xs: 4, md: 6 } }}>
      <Seo
        title={feature.seoTitle}
        description={feature.seoDescription}
        canonicalPath={`/funktionen/${feature.slug}`}
        jsonLd={breadcrumbJsonLd}
      />

      <Stack spacing={3}>
        <Breadcrumbs aria-label="Breadcrumb">
          <Link component={RouterLink} underline="hover" color="inherit" to="/">
            Startseite
          </Link>
          <Link component={RouterLink} underline="hover" color="inherit" to="/funktionen">
            Funktionen
          </Link>
          <Typography color="text.primary">{feature.name}</Typography>
        </Breadcrumbs>

        <Stack spacing={2}>
          <Typography variant="overline" sx={{ letterSpacing: 2, color: 'primary.main', fontWeight: 700 }}>
            Themenseite
          </Typography>
          <Typography component="h1" variant="h2" sx={{ fontWeight: 800, maxWidth: 950 }}>
            {feature.name}
          </Typography>
          <Typography variant="h6" color="text.secondary" sx={{ maxWidth: 960, fontWeight: 400 }}>
            {feature.teaser}
          </Typography>
        </Stack>

        <Box
          component="img"
          src={feature.image}
          alt={feature.name}
          sx={{ width: '100%', borderRadius: 3, aspectRatio: '16 / 8', objectFit: 'cover', boxShadow: 4 }}
        />

        <Stack direction="row" flexWrap="wrap" useFlexGap gap={1}>
          {feature.suitableFor.map((entry) => (
            <Chip key={entry} label={entry} variant="outlined" />
          ))}
        </Stack>

        <Typography variant="body1" sx={{ fontSize: '1.05rem', lineHeight: 1.85, maxWidth: 960 }}>
          {feature.summary}
        </Typography>

        <Divider />

        <Stack spacing={2}>
          <Typography component="h2" variant="h4" sx={{ fontWeight: 700 }}>
            Worin der Nutzen liegt
          </Typography>
          <Stack component="ul" spacing={1.25} sx={{ m: 0, pl: 3 }}>
            {feature.benefits.map((benefit) => (
              <Typography component="li" key={benefit} variant="body1" sx={{ lineHeight: 1.8 }}>
                {benefit}
              </Typography>
            ))}
          </Stack>
        </Stack>

        <Divider />

        <Stack spacing={2} sx={{ maxWidth: 960 }}>
          <Typography component="h2" variant="h4" sx={{ fontWeight: 700 }}>
            Mehr Details
          </Typography>
          <Typography variant="body1" sx={{ lineHeight: 1.8 }}>
            Wenn du tiefer in das Thema einsteigen willst, findest du die passenden Kapitel in der Dokumentation.
          </Typography>
          <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1.5} flexWrap="wrap" useFlexGap>
            {feature.docsLinks.map((entry) => (
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
            <Button component="a" href={DOCS_URL} target="_blank" rel="noreferrer" variant="text">
              Gesamte Dokumentation
            </Button>
          </Stack>
        </Stack>

        <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2}>
          <Button component={RouterLink} to="/kontakt" variant="contained">
            Kontakt aufnehmen
          </Button>
          <Button component={RouterLink} to="/funktionen" variant="text">
            Weitere Funktionen ansehen
          </Button>
        </Stack>
      </Stack>
    </Container>
  );
};

export default FeatureDetail;