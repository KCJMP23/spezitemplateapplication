import { Card, CardContent, Typography, Button, Box } from '@mui/material';
import { Favorite } from '@mui/icons-material';

interface WelcomeProps {
  onNext: () => void;
}

export default function Welcome({ onNext }: WelcomeProps): JSX.Element {
  return (
    <Card>
      <CardContent sx={{ p: 4, textAlign: 'center' }}>
        <Box sx={{ display: 'flex', justifyContent: 'center', mb: 3 }}>
          <Favorite sx={{ fontSize: 80, color: 'primary.main' }} />
        </Box>

        <Typography variant="h3" gutterBottom fontWeight="bold">
          Welcome to Spezi Health
        </Typography>

        <Typography variant="h6" color="text.secondary" sx={{ mb: 4 }}>
          A modular platform for healthcare research
        </Typography>

        <Typography variant="body1" paragraph sx={{ maxWidth: 600, mx: 'auto' }}>
          Spezi Health connects patients, providers, and researchers in a secure,
          HIPAA-compliant environment. Track your health data, participate in research
          studies, and contribute to advancing healthcare.
        </Typography>

        <Typography variant="body2" color="text.secondary" paragraph sx={{ maxWidth: 600, mx: 'auto' }}>
          This application is built with your privacy in mind. All data is encrypted,
          and you have full control over what information you share and with whom.
        </Typography>

        <Button
          variant="contained"
          size="large"
          onClick={onNext}
          sx={{ mt: 3, minWidth: 200 }}
        >
          Get Started
        </Button>
      </CardContent>
    </Card>
  );
}
