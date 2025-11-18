import { Container, Typography } from '@mui/material';

export default function StudyManagementView(): JSX.Element {
  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
      <Typography variant="h4">Study Management</Typography>
      <Typography>Manage research studies and participant enrollment.</Typography>
    </Container>
  );
}
