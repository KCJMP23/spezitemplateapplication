import { Container, Typography, Box, Alert, Card, CardContent, Grid, Button, Chip } from '@mui/material';
import { Science } from '@mui/icons-material';

export default function StudyManagementView(): JSX.Element {
  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 3 }}>
        <Box>
          <Typography variant="h4" gutterBottom>Study Management</Typography>
          <Typography variant="body2" color="text.secondary">
            Manage research studies and participant enrollment
          </Typography>
        </Box>
        <Button variant="contained" startIcon={<Science />}>
          New Study
        </Button>
      </Box>

      <Alert severity="info" sx={{ mb: 3 }}>
        <Typography variant="body2">
          <strong>Demo Mode:</strong> Study management tools for researchers.
          Create studies, enroll participants, and manage research protocols.
        </Typography>
      </Alert>

      <Grid container spacing={3}>
        <Grid item xs={12} md={4}>
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 2 }}>
                <Typography variant="h6">Active Studies</Typography>
                <Chip label="3" color="primary" />
              </Box>
              <Typography variant="body2" color="text.secondary">
                Currently running research studies
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} md={6}>
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 2 }}>
                <Typography variant="h6">Total Participants</Typography>
                <Chip label="127" color="success" />
              </Box>
              <Typography variant="body2" color="text.secondary">
                Enrolled across all studies
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} md={4}>
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 2 }}>
                <Typography variant="h6">Data Points</Typography>
                <Chip label="45.2K" color="info" />
              </Box>
              <Typography variant="body2" color="text.secondary">
                Collected data points
              </Typography>
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    </Container>
  );
}
