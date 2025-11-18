import { useState } from 'react';
import {
  Card,
  CardContent,
  Typography,
  Button,
  Box,
  Switch,
  FormControlLabel,
  Paper,
  Alert,
} from '@mui/material';
import {
  Notifications,
  MonitorHeart,
  CheckCircle,
} from '@mui/icons-material';

interface PermissionsStepProps {
  onNext: () => void;
  onBack: () => void;
}

export default function PermissionsStep({ onNext, onBack }: PermissionsStepProps): JSX.Element {
  const [notificationsEnabled, setNotificationsEnabled] = useState(false);
  const [healthDataEnabled, setHealthDataEnabled] = useState(false);

  const handleRequestNotifications = async (): Promise<void> => {
    if ('Notification' in window) {
      const permission = await Notification.requestPermission();
      setNotificationsEnabled(permission === 'granted');
    }
  };

  const handleRequestHealthData = async (): Promise<void> => {
    // This would integrate with Web APIs for health data
    // For now, just enable the toggle
    setHealthDataEnabled(true);
  };

  const handleComplete = (): void => {
    onNext();
  };

  return (
    <Card>
      <CardContent sx={{ p: 4 }}>
        <Typography variant="h4" gutterBottom fontWeight="bold" textAlign="center">
          Permissions
        </Typography>

        <Typography variant="body2" color="text.secondary" paragraph textAlign="center" sx={{ mb: 4 }}>
          Grant permissions to enhance your experience
        </Typography>

        <Paper
          variant="outlined"
          sx={{ p: 3, mb: 3 }}
        >
          <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 2 }}>
            <Notifications sx={{ color: 'primary.main', fontSize: 32 }} />
            <Box sx={{ flex: 1 }}>
              <Typography variant="h6" gutterBottom>
                Notifications
              </Typography>
              <Typography variant="body2" color="text.secondary" paragraph>
                Receive reminders for questionnaires, appointments, and important updates.
                You can customize notification preferences later in settings.
              </Typography>
              <FormControlLabel
                control={
                  <Switch
                    checked={notificationsEnabled}
                    onChange={(e) => {
                      if (e.target.checked) {
                        handleRequestNotifications();
                      } else {
                        setNotificationsEnabled(false);
                      }
                    }}
                  />
                }
                label={notificationsEnabled ? 'Enabled' : 'Disabled'}
              />
            </Box>
            {notificationsEnabled && (
              <CheckCircle sx={{ color: 'success.main' }} />
            )}
          </Box>
        </Paper>

        <Paper
          variant="outlined"
          sx={{ p: 3, mb: 3 }}
        >
          <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 2 }}>
            <MonitorHeart sx={{ color: 'primary.main', fontSize: 32 }} />
            <Box sx={{ flex: 1 }}>
              <Typography variant="h6" gutterBottom>
                Health Data
              </Typography>
              <Typography variant="body2" color="text.secondary" paragraph>
                Allow the app to collect health data from compatible wearable devices
                and health tracking apps. This data is encrypted and used only for
                research purposes.
              </Typography>
              <FormControlLabel
                control={
                  <Switch
                    checked={healthDataEnabled}
                    onChange={(e) => {
                      if (e.target.checked) {
                        handleRequestHealthData();
                      } else {
                        setHealthDataEnabled(false);
                      }
                    }}
                  />
                }
                label={healthDataEnabled ? 'Enabled' : 'Disabled'}
              />
            </Box>
            {healthDataEnabled && (
              <CheckCircle sx={{ color: 'success.main' }} />
            )}
          </Box>
        </Paper>

        <Alert severity="info" sx={{ mb: 3 }}>
          <Typography variant="body2">
            You can change these permissions at any time in the app settings.
            Both permissions are optional and won't affect your ability to use the app.
          </Typography>
        </Alert>

        <Box sx={{ display: 'flex', gap: 2, justifyContent: 'center' }}>
          <Button onClick={onBack} variant="outlined">
            Back
          </Button>
          <Button onClick={handleComplete} variant="contained">
            Complete Setup
          </Button>
        </Box>
      </CardContent>
    </Card>
  );
}
