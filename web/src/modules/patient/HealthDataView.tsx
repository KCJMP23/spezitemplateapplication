import { Container, Typography } from '@mui/material';

export default function HealthDataView(): JSX.Element {
  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
      <Typography variant="h4">Health Data</Typography>
      <Typography>Track and monitor your health data from wearables.</Typography>
    </Container>
  );
}
