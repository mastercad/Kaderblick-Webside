import React from 'react';
import {
  Accordion,
  AccordionDetails,
  AccordionSummary,
  Button,
  Container,
  Stack,
  Typography,
} from '@mui/material';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import Seo from '../seo/Seo';
import { faqEntries } from '../content/marketingContent';
import { DOCS_URL } from '../seo/siteConfig';

const Faq: React.FC = () => {
  const faqJsonLd = {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: faqEntries.map((entry) => ({
      '@type': 'Question',
      name: entry.question,
      acceptedAnswer: {
        '@type': 'Answer',
        text: entry.answer,
      },
    })),
  };

  return (
    <Container maxWidth="md" sx={{ py: { xs: 4, md: 6 } }}>
      <Seo
        title="FAQ zur Vereinssoftware Kaderblick"
        description="Antworten auf haeufige Fragen zu Kaderblick: Zielgruppe, Einsatz im Amateurfussball, PWA, Vereinsorganisation und digitale Kommunikation im Verein."
        canonicalPath="/faq"
        jsonLd={faqJsonLd}
      />

      <Stack spacing={2.5} sx={{ mb: 4 }}>
        <Typography variant="overline" sx={{ letterSpacing: 2.1, color: 'primary.main', fontWeight: 700 }}>
          Hauefige Fragen
        </Typography>
        <Typography component="h1" variant="h2" sx={{ fontWeight: 800 }}>
          FAQ zu Kaderblick
        </Typography>
        <Typography variant="body1" color="text.secondary" sx={{ lineHeight: 1.8 }}>
          Antworten auf haeufige Fragen rund um Nutzung, Zielgruppen und Einsatz von Kaderblick im Vereinsalltag.
        </Typography>
        <Button component="a" href={DOCS_URL} target="_blank" rel="noreferrer" variant="outlined" sx={{ alignSelf: 'flex-start' }}>
          Zur gesamten Dokumentation
        </Button>
      </Stack>

      <Stack spacing={1.5}>
        {faqEntries.map((entry) => (
          <Accordion key={entry.question} disableGutters>
            <AccordionSummary expandIcon={<ExpandMoreIcon />}>
              <Typography component="h2" variant="h6" sx={{ fontWeight: 700 }}>
                {entry.question}
              </Typography>
            </AccordionSummary>
            <AccordionDetails>
              <Typography variant="body1" sx={{ lineHeight: 1.8 }}>
                {entry.answer}
              </Typography>
            </AccordionDetails>
          </Accordion>
        ))}
      </Stack>
    </Container>
  );
};

export default Faq;