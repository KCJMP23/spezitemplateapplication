import { Container, Typography, Box, Alert, Card, CardContent, Grid, Chip, Tab, Tabs } from '@mui/material';
import { useState } from 'react';
import { MonitorHeart, Assignment } from '@mui/icons-material';

export default function DataReviewView(): JSX.Element {
  const [tab, setTab] = useState(0);

  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
      <Typography variant="h4" gutterBottom>Data Review</Typography>
      <Typography variant="body2" color="text.secondary" paragraph>
        Review patient health data and questionnaire responses
      </Typography>

      <Alert severity="info" sx={{ mb: 3 }}>
        <Typography variant="body2">
          <strong>Demo Mode:</strong> Patient data review would display here with proper HIPAA authorization.
          Providers can view trends, flag concerns, and coordinate care.
        </Typography>
      </Alert>

      <Tabs value={tab} onChange={(_, v) => setTab(v)} sx={{ mb: 3 }}>
        <Tab label="Health Data" icon={<MonitorHeart />} iconPosition="start" />
        <Tab label="Questionnaires" icon={<Assignment />} iconPosition="start" />
      </Tabs>

      {tab === 0 && (
        <Grid container spacing={2}>
          <Grid item xs={12} md={6}>
            <Card>
              <CardContent>
                <Typography variant="h6" gutterBottom>Heart Rate Trends</Typography>
                <Typography variant="body2" color="text.secondary">
                  View patient heart rate data over time with alerts for abnormal readings
                </Typography>
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={12} md={6}>
            <Card>
              <CardContent>
                <Typography variant="h6" gutterBottom>Activity Levels</Typography>
                <Typography variant="body2" color="text.secondary">
                  Monitor daily step counts and activity patterns
                </Typography>
              </CardContent>
            </Card>
          </Grid>
        </Grid>
      )}

      {tab === 1 && (
        <Card>
          <CardContent>
            <Typography variant="h6" gutterBottom>Questionnaire Responses</Typography>
            <Typography variant="body2" color="text.secondary">
              Review patient-reported outcomes and assessment responses with trend analysis
            </Typography>
          </CardContent>
        </Card>
      )}
    </Container>
  );
}
