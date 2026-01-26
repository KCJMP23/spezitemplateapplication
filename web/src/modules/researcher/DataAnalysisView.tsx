import { Container, Typography, Box, Alert, Card, CardContent, Grid, Button, Tab, Tabs } from '@mui/material';
import { useState } from 'react';
import { Analytics, Download, QueryStats } from '@mui/icons-material';

export default function DataAnalysisView(): JSX.Element {
  const [tab, setTab] = useState(0);

  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 3 }}>
        <Box>
          <Typography variant="h4" gutterBottom>Data Analysis</Typography>
          <Typography variant="body2" color="text.secondary">
            Analyze aggregate and de-identified research data
          </Typography>
        </Box>
        <Button variant="contained" startIcon={<Download />}>
          Export Data
        </Button>
      </Box>

      <Alert severity="info" sx={{ mb: 3 }}>
        <Typography variant="body2">
          <strong>Demo Mode:</strong> Data analysis tools with FHIR export capabilities.
          All data is de-identified and aggregated per HIPAA requirements.
        </Typography>
      </Alert>

      <Tabs value={tab} onChange={(_, v) => setTab(v)} sx={{ mb: 3 }}>
        <Tab label="Aggregate Stats" icon={<QueryStats />} iconPosition="start" />
        <Tab label="Trends" icon={<Analytics />} iconPosition="start" />
      </Tabs>

      {tab === 0 && (
        <Grid container spacing={2}>
          <Grid item xs={12} md={6}>
            <Card>
              <CardContent>
                <Typography variant="h6" gutterBottom>Average Compliance</Typography>
                <Typography variant="h3" color="success.main">87%</Typography>
                <Typography variant="body2" color="text.secondary">
                  Questionnaire completion rate
                </Typography>
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={12} md={6}>
            <Card>
              <CardContent>
                <Typography variant="h6" gutterBottom>Data Quality</Typography>
                <Typography variant="h3" color="primary.main">94%</Typography>
                <Typography variant="body2" color="text.secondary">
                  Valid data points
                </Typography>
              </CardContent>
            </Card>
          </Grid>
        </Grid>
      )}

      {tab === 1 && (
        <Card>
          <CardContent>
            <Typography variant="h6" gutterBottom>Trend Analysis</Typography>
            <Typography variant="body2" color="text.secondary">
              Visualize trends in health metrics and patient-reported outcomes over time
            </Typography>
          </CardContent>
        </Card>
      )}
    </Container>
  );
}
