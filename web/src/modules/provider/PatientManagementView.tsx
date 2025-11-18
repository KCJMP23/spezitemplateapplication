import { Container, Typography } from '@mui/material';

export default function PatientManagementView(): JSX.Element {
  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
      <Typography variant="h4">Patient Management</Typography>
      <Typography>View and manage your patient roster.</Typography>
    </Container>
  );
}
