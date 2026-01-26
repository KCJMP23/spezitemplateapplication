import { Card, CardContent, Typography, Button, Box, Grid, Paper } from '@mui/material';
import {
  MonitorHeart,
  Assignment,
  People,
  Analytics,
  Science,
  Security,
} from '@mui/icons-material';

interface InterestingModulesProps {
  onNext: () => void;
  onBack: () => void;
}

const modules = [
  {
    icon: <MonitorHeart fontSize="large" />,
    title: 'Health Data Tracking',
    description: 'Monitor your vitals and activity from wearable devices',
  },
  {
    icon: <Assignment fontSize="large" />,
    title: 'Questionnaires',
    description: 'Complete surveys and assessments on your schedule',
  },
  {
    icon: <People fontSize="large" />,
    title: 'Care Coordination',
    description: 'Connect with your healthcare providers',
  },
  {
    icon: <Science fontSize="large" />,
    title: 'Research Participation',
    description: 'Contribute to medical research studies',
  },
  {
    icon: <Analytics fontSize="large" />,
    title: 'Data Insights',
    description: 'Visualize trends and patterns in your health',
  },
  {
    icon: <Security fontSize="large" />,
    title: 'Privacy & Security',
    description: 'HIPAA-compliant data protection and encryption',
  },
];

export default function InterestingModules({ onNext, onBack }: InterestingModulesProps): JSX.Element {
  return (
    <Card>
      <CardContent sx={{ p: 4 }}>
        <Typography variant="h4" gutterBottom fontWeight="bold" textAlign="center">
          Interesting Modules
        </Typography>

        <Typography variant="body1" color="text.secondary" paragraph textAlign="center" sx={{ mb: 4 }}>
          Explore the features available in Spezi Health
        </Typography>

        <Grid container spacing={3} sx={{ mb: 4 }}>
          {modules.map((module) => (
            <Grid item xs={12} sm={6} key={module.title}>
              <Paper
                elevation={0}
                sx={{
                  p: 3,
                  border: '1px solid',
                  borderColor: 'divider',
                  height: '100%',
                  '&:hover': {
                    borderColor: 'primary.main',
                    boxShadow: 1,
                  },
                }}
              >
                <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 2 }}>
                  <Box sx={{ color: 'primary.main' }}>{module.icon}</Box>
                  <Box>
                    <Typography variant="h6" gutterBottom>
                      {module.title}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      {module.description}
                    </Typography>
                  </Box>
                </Box>
              </Paper>
            </Grid>
          ))}
        </Grid>

        <Box sx={{ display: 'flex', gap: 2, justifyContent: 'center' }}>
          <Button onClick={onBack} variant="outlined">
            Back
          </Button>
          <Button onClick={onNext} variant="contained">
            Continue
          </Button>
        </Box>
      </CardContent>
    </Card>
  );
}
