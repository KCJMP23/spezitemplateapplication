import { useState, useEffect } from 'react';
import {
  Container,
  Typography,
  Box,
  Card,
  CardContent,
  Button,
  Grid,
  Tab,
  Tabs,
  Alert,
  CircularProgress,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  MenuItem,
  IconButton,
} from '@mui/material';
import {
  MonitorHeart,
  DirectionsWalk,
  FitnessCenter,
  LocalHospital,
  Add,
  Download,
  Refresh,
  TrendingUp,
  TrendingDown,
} from '@mui/icons-material';
import { useAuth } from '@/hooks/useAuth';
import { HealthData, HealthDataType } from '@/types';
import healthDataService from '@/services/healthData';
import { formatDateTime, formatNumber, downloadFile } from '@/utils/helpers';

const DATA_TYPES: { value: HealthDataType; label: string; unit: string; icon: JSX.Element }[] = [
  { value: 'steps', label: 'Steps', unit: 'count', icon: <DirectionsWalk /> },
  { value: 'heart_rate', label: 'Heart Rate', unit: 'bpm', icon: <MonitorHeart /> },
  { value: 'weight', label: 'Weight', unit: 'kg', icon: <FitnessCenter /> },
  { value: 'blood_pressure', label: 'Blood Pressure', unit: 'mmHg', icon: <LocalHospital /> },
];

export default function HealthDataView(): JSX.Element {
  const { user } = useAuth();
  const [tab, setTab] = useState(0);
  const [selectedType, setSelectedType] = useState<HealthDataType>('steps');
  const [healthData, setHealthData] = useState<HealthData[]>([]);
  const [statistics, setStatistics] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string>('');
  const [manualEntryOpen, setManualEntryOpen] = useState(false);

  // Manual entry form
  const [manualType, setManualType] = useState<HealthDataType>('steps');
  const [manualValue, setManualValue] = useState('');
  const [manualDate, setManualDate] = useState(new Date().toISOString().split('T')[0]);

  useEffect(() => {
    if (user) {
      loadData();
    }
  }, [user, selectedType]);

  const loadData = async (): Promise<void> => {
    if (!user) return;

    setLoading(true);
    setError('');

    try {
      const [data, stats] = await Promise.all([
        healthDataService.getUserHealthData(user.id, selectedType),
        healthDataService.getStatistics(user.id, selectedType),
      ]);

      setHealthData(data);
      setStatistics(stats);
    } catch (err: any) {
      setError(err.message || 'Failed to load health data');
    } finally {
      setLoading(false);
    }
  };

  const handleManualEntry = async (): Promise<void> => {
    if (!user) return;

    if (!manualValue || parseFloat(manualValue) <= 0) {
      setError('Please enter a valid value');
      return;
    }

    try {
      const typeConfig = DATA_TYPES.find((t) => t.value === manualType);
      await healthDataService.recordManualEntry(
        user.id,
        manualType,
        parseFloat(manualValue),
        typeConfig?.unit || '',
        new Date(manualDate)
      );

      setManualEntryOpen(false);
      setManualValue('');
      await loadData();
    } catch (err: any) {
      setError(err.message || 'Failed to save health data');
    }
  };

  const handleSimulateData = async (type: HealthDataType): Promise<void> => {
    if (!user) return;

    try {
      if (type === 'steps') {
        await healthDataService.collectStepCount(user.id);
      } else if (type === 'heart_rate') {
        await healthDataService.collectHeartRate(user.id);
      }

      await loadData();
    } catch (err: any) {
      setError(err.message || 'Failed to collect data');
    }
  };

  const handleExport = async (): Promise<void> => {
    if (!user) return;

    try {
      const bundle = await healthDataService.exportAsFHIRBundle(user.id);
      const json = JSON.stringify(bundle, null, 2);
      downloadFile(json, `health-data-${new Date().toISOString()}.json`, 'application/json');
    } catch (err: any) {
      setError(err.message || 'Failed to export data');
    }
  };

  const typeConfig = DATA_TYPES.find((t) => t.value === selectedType);

  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Box>
          <Typography variant="h4" gutterBottom>
            Health Data
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Track and monitor your health metrics
          </Typography>
        </Box>
        <Box sx={{ display: 'flex', gap: 1 }}>
          <IconButton onClick={loadData} disabled={loading}>
            <Refresh />
          </IconButton>
          <IconButton onClick={handleExport}>
            <Download />
          </IconButton>
          <Button
            variant="contained"
            startIcon={<Add />}
            onClick={() => setManualEntryOpen(true)}
          >
            Add Entry
          </Button>
        </Box>
      </Box>

      {error && (
        <Alert severity="error" sx={{ mb: 3 }} onClose={() => setError('')}>
          {error}
        </Alert>
      )}

      {/* Data Type Tabs */}
      <Box sx={{ borderBottom: 1, borderColor: 'divider', mb: 3 }}>
        <Tabs value={tab} onChange={(_, newValue) => setTab(newValue)}>
          {DATA_TYPES.map((type, index) => (
            <Tab
              key={type.value}
              label={type.label}
              icon={type.icon}
              iconPosition="start"
              onClick={() => setSelectedType(type.value)}
            />
          ))}
        </Tabs>
      </Box>

      {loading ? (
        <Box sx={{ textAlign: 'center', py: 8 }}>
          <CircularProgress />
        </Box>
      ) : (
        <>
          {/* Statistics Cards */}
          <Grid container spacing={3} sx={{ mb: 4 }}>
            <Grid item xs={12} sm={6} md={3}>
              <Card>
                <CardContent>
                  <Typography variant="caption" color="text.secondary" gutterBottom>
                    Latest
                  </Typography>
                  <Typography variant="h4">
                    {statistics?.latest !== null ? formatNumber(statistics.latest, 1) : 'N/A'}
                  </Typography>
                  <Typography variant="caption" color="text.secondary">
                    {typeConfig?.unit}
                  </Typography>
                </CardContent>
              </Card>
            </Grid>

            <Grid item xs={12} sm={6} md={3}>
              <Card>
                <CardContent>
                  <Typography variant="caption" color="text.secondary" gutterBottom>
                    Average
                  </Typography>
                  <Typography variant="h4">
                    {statistics ? formatNumber(statistics.average, 1) : 'N/A'}
                  </Typography>
                  <Typography variant="caption" color="text.secondary">
                    {typeConfig?.unit}
                  </Typography>
                </CardContent>
              </Card>
            </Grid>

            <Grid item xs={12} sm={6} md={3}>
              <Card>
                <CardContent>
                  <Typography variant="caption" color="text.secondary" gutterBottom>
                    Minimum
                  </Typography>
                  <Typography variant="h4">
                    {statistics ? formatNumber(statistics.min, 1) : 'N/A'}
                  </Typography>
                  <Typography variant="caption" color="text.secondary">
                    {typeConfig?.unit}
                  </Typography>
                </CardContent>
              </Card>
            </Grid>

            <Grid item xs={12} sm={6} md={3}>
              <Card>
                <CardContent>
                  <Typography variant="caption" color="text.secondary" gutterBottom>
                    Maximum
                  </Typography>
                  <Typography variant="h4">
                    {statistics ? formatNumber(statistics.max, 1) : 'N/A'}
                  </Typography>
                  <Typography variant="caption" color="text.secondary">
                    {typeConfig?.unit}
                  </Typography>
                </CardContent>
              </Card>
            </Grid>
          </Grid>

          {/* Demo Integration Buttons */}
          <Alert severity="info" sx={{ mb: 3 }}>
            <Typography variant="body2" gutterBottom>
              <strong>Demo Mode:</strong> Wearable integration is simulated. In production, this would
              connect to Google Fit, Apple HealthKit, Fitbit, etc.
            </Typography>
            <Box sx={{ mt: 2, display: 'flex', gap: 2 }}>
              <Button
                size="small"
                variant="outlined"
                onClick={() => handleSimulateData('steps')}
              >
                Simulate Step Count
              </Button>
              <Button
                size="small"
                variant="outlined"
                onClick={() => handleSimulateData('heart_rate')}
              >
                Simulate Heart Rate
              </Button>
            </Box>
          </Alert>

          {/* Data List */}
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Recent Entries ({healthData.length})
              </Typography>

              {healthData.length === 0 ? (
                <Box sx={{ textAlign: 'center', py: 6 }}>
                  <Typography variant="body1" color="text.secondary">
                    No data recorded yet
                  </Typography>
                  <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                    Add your first entry to get started
                  </Typography>
                </Box>
              ) : (
                <Box>
                  {healthData.slice(0, 20).map((data) => (
                    <Box
                      key={data.id}
                      sx={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        py: 2,
                        borderBottom: '1px solid',
                        borderColor: 'divider',
                        '&:last-child': { borderBottom: 'none' },
                      }}
                    >
                      <Box>
                        <Typography variant="h6">
                          {formatNumber(data.value, 1)} {data.unit}
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
                          {formatDateTime(data.recordedAt)}
                        </Typography>
                        {data.sourceDevice && (
                          <Typography variant="caption" color="text.secondary" sx={{ ml: 2 }}>
                            • {data.sourceDevice}
                          </Typography>
                        )}
                      </Box>
                      <Box>
                        {/* Trend indicator (simplified) */}
                        {data.value > (statistics?.average || 0) ? (
                          <TrendingUp color="success" />
                        ) : (
                          <TrendingDown color="error" />
                        )}
                      </Box>
                    </Box>
                  ))}
                </Box>
              )}
            </CardContent>
          </Card>
        </>
      )}

      {/* Manual Entry Dialog */}
      <Dialog open={manualEntryOpen} onClose={() => setManualEntryOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Add Health Data</DialogTitle>
        <DialogContent>
          <Box sx={{ pt: 2 }}>
            <TextField
              fullWidth
              select
              label="Data Type"
              value={manualType}
              onChange={(e) => setManualType(e.target.value as HealthDataType)}
              sx={{ mb: 2 }}
            >
              {DATA_TYPES.map((type) => (
                <MenuItem key={type.value} value={type.value}>
                  {type.label} ({type.unit})
                </MenuItem>
              ))}
            </TextField>

            <TextField
              fullWidth
              type="number"
              label="Value"
              value={manualValue}
              onChange={(e) => setManualValue(e.target.value)}
              sx={{ mb: 2 }}
            />

            <TextField
              fullWidth
              type="date"
              label="Date"
              value={manualDate}
              onChange={(e) => setManualDate(e.target.value)}
              InputLabelProps={{ shrink: true }}
            />
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setManualEntryOpen(false)}>Cancel</Button>
          <Button onClick={handleManualEntry} variant="contained">
            Save
          </Button>
        </DialogActions>
      </Dialog>
    </Container>
  );
}
