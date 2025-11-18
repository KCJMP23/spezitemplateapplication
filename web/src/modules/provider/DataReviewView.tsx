import { Container, Typography } from '@mui/material';

export default function DataReviewView(): JSX.Element {
  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
      <Typography variant="h4">Data Review</Typography>
      <Typography>Review patient health data and questionnaire responses.</Typography>
    </Container>
  );
}
