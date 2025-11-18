import { Container, Typography } from '@mui/material';

export default function DataAnalysisView(): JSX.Element {
  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
      <Typography variant="h4">Data Analysis</Typography>
      <Typography>Analyze aggregate and de-identified research data.</Typography>
    </Container>
  );
}
