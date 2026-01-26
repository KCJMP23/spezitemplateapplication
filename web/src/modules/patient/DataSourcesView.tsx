/**
 * INTELLIC Health - Data Sources Management View
 *
 * Allows users to:
 * - Connect/disconnect health data sources
 * - View sync status
 * - Manually trigger syncs
 * - Configure auto-sync settings
 */

import { useState, useEffect } from 'react';
import {
  Container,
  Typography,
  Box,
  Card,
  CardContent,
  CardActions,
  Button,
  Switch,
  FormControlLabel,
  Alert,
  CircularProgress,
  Chip,
  Divider,
  List,
  ListItem,
  ListItemText,
  ListItemSecondaryAction,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogContentText,
  DialogActions,
} from '@mui/material';
import {
  Sync as SyncIcon,
  CheckCircle as CheckCircleIcon,
  Error as ErrorIcon,
  WatchLater as WatchIcon,
  Refresh as RefreshIcon,
  Settings as SettingsIcon,
  Delete as DeleteIcon,
} from '@mui/icons-material';
import { useAuth } from '@/hooks/useAuth';
import dataSyncService, { type DataSource, type SyncResult } from '@/services/dataSync';
import { logger } from '@/utils/logger';

export default function DataSourcesView() {
  const { user } = useAuth();
  const [sources, setSources] = useState<DataSource[]>([]);
  const [syncing, setSyncing] = useState(false);
  const [syncResults, setSyncResults] = useState<SyncResult[]>([]);
  const [lastSyncTime, setLastSyncTime] = useState<Date | null>(null);
  const [error, setError] = useState<string>('');
  const [disconnectDialog, setDisconnectDialog] = useState<string | null>(null);

  useEffect(() => {
    loadDataSources();
  }, []);

  const loadDataSources = () => {
    const status = dataSyncService.getStatus();
    setSources(status.sources);
    setLastSyncTime(status.lastSyncTime);
  };

  const handleConnect = async (sourceId: string) => {
    setError('');
    try {
      logger.info(`Connecting to ${sourceId}`);
      const connected = await dataSyncService.connectSource(sourceId);

      if (connected) {
        loadDataSources();
      } else {
        setError(`${sourceId} connection initiated. Complete the authorization in the popup window.`);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Connection failed');
      logger.error('Connection error:', err);
    }
  };

  const handleDisconnect = async (sourceId: string) => {
    setError('');
    try {
      await dataSyncService.disconnectSource(sourceId);
      loadDataSources();
      setDisconnectDialog(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Disconnection failed');
      logger.error('Disconnection error:', err);
    }
  };

  const handleSync = async (sourceId?: string) => {
    if (!user) return;

    setSyncing(true);
    setError('');
    setSyncResults([]);

    try {
      let results: SyncResult[];

      if (sourceId) {
        const result = await dataSyncService.syncSource(sourceId, user.id);
        results = [result];
      } else {
        results = await dataSyncService.syncAll(user.id);
      }

      setSyncResults(results);
      loadDataSources();

      // Show errors if any
      const errors = results.filter((r) => !r.success);
      if (errors.length > 0) {
        setError(`Sync completed with ${errors.length} error(s). Check the results below.`);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Sync failed');
      logger.error('Sync error:', err);
    } finally {
      setSyncing(false);
    }
  };

  const getSourceIcon = (sourceId: string) => {
    switch (sourceId) {
      case 'healthkit':
        return '🍎';
      case 'withings':
        return '⚖️';
      case 'epic':
        return '🏥';
      case 'manual':
        return '✏️';
      default:
        return '📊';
    }
  };

  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
      <Box sx={{ mb: 4 }}>
        <Typography variant="h4" gutterBottom>
          Health Data Sources
        </Typography>
        <Typography variant="body1" color="text.secondary">
          Connect your devices and health records to stream data automatically
        </Typography>
      </Box>

      {error && (
        <Alert severity="error" sx={{ mb: 3 }} onClose={() => setError('')}>
          {error}
        </Alert>
      )}

      {lastSyncTime && (
        <Alert severity="info" sx={{ mb: 3 }}>
          Last sync: {lastSyncTime.toLocaleString()}
        </Alert>
      )}

      {syncResults.length > 0 && (
        <Card sx={{ mb: 3 }}>
          <CardContent>
            <Typography variant="h6" gutterBottom>
              Sync Results
            </Typography>
            <List>
              {syncResults.map((result, index) => (
                <ListItem key={index}>
                  {result.success ? (
                    <CheckCircleIcon color="success" sx={{ mr: 2 }} />
                  ) : (
                    <ErrorIcon color="error" sx={{ mr: 2 }} />
                  )}
                  <ListItemText
                    primary={result.source}
                    secondary={
                      result.success
                        ? `Added ${result.dataPointsAdded} data points in ${result.duration}ms`
                        : `Error: ${result.error}`
                    }
                  />
                </ListItem>
              ))}
            </List>
          </CardContent>
        </Card>
      )}

      <Box sx={{ mb: 3, display: 'flex', gap: 2 }}>
        <Button
          variant="contained"
          startIcon={syncing ? <CircularProgress size={20} /> : <SyncIcon />}
          onClick={() => handleSync()}
          disabled={syncing || sources.filter((s) => s.connected).length === 0}
          fullWidth
        >
          {syncing ? 'Syncing...' : 'Sync All Sources'}
        </Button>
      </Box>

      <Box sx={{ display: 'grid', gap: 3, gridTemplateColumns: { xs: '1fr', md: '1fr 1fr' } }}>
        {sources.map((source) => (
          <Card key={source.id} sx={{ display: 'flex', flexDirection: 'column' }}>
            <CardContent sx={{ flex: 1 }}>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                <Typography variant="h2" sx={{ mr: 2 }}>
                  {getSourceIcon(source.id)}
                </Typography>
                <Box sx={{ flex: 1 }}>
                  <Typography variant="h6">{source.name}</Typography>
                  <Box sx={{ display: 'flex', gap: 1, mt: 0.5 }}>
                    {source.connected ? (
                      <Chip
                        label="Connected"
                        color="success"
                        size="small"
                        icon={<CheckCircleIcon />}
                      />
                    ) : (
                      <Chip label="Not Connected" size="small" />
                    )}
                    {source.autoSync && source.connected && (
                      <Chip
                        label={`Auto-sync: ${source.syncInterval}min`}
                        size="small"
                        icon={<WatchIcon />}
                      />
                    )}
                  </Box>
                </Box>
              </Box>

              {source.lastSync && (
                <Typography variant="body2" color="text.secondary">
                  Last synced: {source.lastSync.toLocaleString()}
                </Typography>
              )}

              {source.id === 'healthkit' && (
                <Typography variant="caption" display="block" sx={{ mt: 1 }}>
                  Syncs: Heart rate, blood pressure, steps, activity, SpO2, weight
                </Typography>
              )}

              {source.id === 'withings' && (
                <Typography variant="caption" display="block" sx={{ mt: 1 }}>
                  Syncs: Weight, blood pressure, heart rate, body temperature
                </Typography>
              )}

              {source.id === 'epic' && (
                <Typography variant="caption" display="block" sx={{ mt: 1 }}>
                  Syncs: Vitals, labs, diagnoses, medications, allergies
                </Typography>
              )}
            </CardContent>

            <Divider />

            <CardActions sx={{ justifyContent: 'space-between', px: 2 }}>
              {source.connected ? (
                <>
                  <Button
                    size="small"
                    startIcon={<RefreshIcon />}
                    onClick={() => handleSync(source.id)}
                    disabled={syncing || !source.enabled}
                  >
                    Sync Now
                  </Button>
                  <IconButton
                    size="small"
                    color="error"
                    onClick={() => setDisconnectDialog(source.id)}
                    disabled={!source.enabled}
                  >
                    <DeleteIcon />
                  </IconButton>
                </>
              ) : (
                <Button
                  size="small"
                  variant="outlined"
                  onClick={() => handleConnect(source.id)}
                  disabled={!source.enabled}
                  fullWidth
                >
                  Connect
                </Button>
              )}
            </CardActions>
          </Card>
        ))}
      </Box>

      <Card sx={{ mt: 3 }}>
        <CardContent>
          <Typography variant="h6" gutterBottom>
            Setup Instructions
          </Typography>

          <Typography variant="subtitle2" sx={{ mt: 2, mb: 1 }}>
            🍎 Apple Health / Apple Watch
          </Typography>
          <Typography variant="body2" color="text.secondary" paragraph>
            1. Click "Connect" above<br />
            2. Grant permissions for health data access<br />
            3. Data will sync automatically every 15 minutes<br />
            4. Requires iOS device with Health app
          </Typography>

          <Typography variant="subtitle2" sx={{ mt: 2, mb: 1 }}>
            ⚖️ Withings Devices
          </Typography>
          <Typography variant="body2" color="text.secondary" paragraph>
            1. Click "Connect" above<br />
            2. Log in with your Withings account<br />
            3. Authorize INTELLIC Health to access your data<br />
            4. Data syncs automatically every 30 minutes
          </Typography>

          <Typography variant="subtitle2" sx={{ mt: 2, mb: 1 }}>
            🏥 Epic MyChart
          </Typography>
          <Typography variant="body2" color="text.secondary" paragraph>
            1. Your healthcare provider must use Epic EHR<br />
            2. Click "Connect" and log in to MyChart<br />
            3. Authorize access to your health records<br />
            4. Manually sync to pull latest data (respects API limits)
          </Typography>
        </CardContent>
      </Card>

      {/* Disconnect Confirmation Dialog */}
      <Dialog
        open={!!disconnectDialog}
        onClose={() => setDisconnectDialog(null)}
      >
        <DialogTitle>Disconnect Data Source?</DialogTitle>
        <DialogContent>
          <DialogContentText>
            Are you sure you want to disconnect this data source? Your existing data will not be
            deleted, but automatic syncing will stop.
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDisconnectDialog(null)}>Cancel</Button>
          <Button
            onClick={() => disconnectDialog && handleDisconnect(disconnectDialog)}
            color="error"
            autoFocus
          >
            Disconnect
          </Button>
        </DialogActions>
      </Dialog>
    </Container>
  );
}
