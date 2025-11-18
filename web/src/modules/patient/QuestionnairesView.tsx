import { Container, Typography } from '@mui/material';

export default function QuestionnairesView(): JSX.Element {
  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
      <Typography variant="h4">Questionnaires</Typography>
      <Typography>Complete your scheduled questionnaires and assessments.</Typography>
    </Container>
  );
}
