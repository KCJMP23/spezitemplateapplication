import { Container, Typography } from '@mui/material';

export default function ContactsView(): JSX.Element {
  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
      <Typography variant="h4">Contacts</Typography>
      <Typography>View study and organization contact information.</Typography>
    </Container>
  );
}
