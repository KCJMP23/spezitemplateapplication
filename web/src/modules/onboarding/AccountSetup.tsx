import { useState } from 'react';
import {
  Card,
  CardContent,
  Typography,
  Button,
  Box,
  TextField,
  MenuItem,
  Alert,
  CircularProgress,
} from '@mui/material';
import { useAuth } from '@/hooks/useAuth';
import { UserRole } from '@/types';

interface AccountSetupProps {
  onNext: () => void;
  onBack: () => void;
}

const genderOptions = [
  { value: 'male', label: 'Male' },
  { value: 'female', label: 'Female' },
  { value: 'non-binary', label: 'Non-binary' },
  { value: 'prefer-not-to-say', label: 'Prefer not to say' },
  { value: 'other', label: 'Other' },
];

const roleOptions: { value: UserRole; label: string; description: string }[] = [
  {
    value: 'patient',
    label: 'Patient/Participant',
    description: 'Track your health data and participate in research studies',
  },
  {
    value: 'provider',
    label: 'Healthcare Provider',
    description: 'Monitor patient data and coordinate care',
  },
  {
    value: 'researcher',
    label: 'Researcher',
    description: 'Manage studies and analyze research data',
  },
];

export default function AccountSetup({ onNext, onBack }: AccountSetupProps): JSX.Element {
  const { user, updateUser } = useAuth();
  const [displayName, setDisplayName] = useState(user?.displayName || '');
  const [dateOfBirth, setDateOfBirth] = useState('');
  const [genderIdentity, setGenderIdentity] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [primaryRole, setPrimaryRole] = useState<UserRole>('patient');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string>('');

  const handleSubmit = async (e: React.FormEvent): Promise<void> => {
    e.preventDefault();

    if (!displayName.trim()) {
      setError('Please enter your name');
      return;
    }

    setLoading(true);
    setError('');

    try {
      await updateUser({
        displayName: displayName.trim(),
        dateOfBirth: dateOfBirth ? new Date(dateOfBirth) : undefined,
        genderIdentity: genderIdentity || undefined,
        phoneNumber: phoneNumber || undefined,
        primaryRole,
        roles: [primaryRole],
      });

      onNext();
    } catch (err: any) {
      setError(err.message || 'Failed to update profile. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card>
      <CardContent sx={{ p: 4 }}>
        <Typography variant="h4" gutterBottom fontWeight="bold" textAlign="center">
          Account Setup
        </Typography>

        <Typography variant="body2" color="text.secondary" paragraph textAlign="center" sx={{ mb: 4 }}>
          Please provide some basic information about yourself
        </Typography>

        <Box component="form" onSubmit={handleSubmit}>
          <TextField
            fullWidth
            label="Full Name"
            value={displayName}
            onChange={(e) => setDisplayName(e.target.value)}
            required
            margin="normal"
          />

          <TextField
            fullWidth
            label="Date of Birth"
            type="date"
            value={dateOfBirth}
            onChange={(e) => setDateOfBirth(e.target.value)}
            InputLabelProps={{ shrink: true }}
            margin="normal"
            helperText="Optional - helps personalize your experience"
          />

          <TextField
            fullWidth
            select
            label="Gender Identity"
            value={genderIdentity}
            onChange={(e) => setGenderIdentity(e.target.value)}
            margin="normal"
            helperText="Optional"
          >
            {genderOptions.map((option) => (
              <MenuItem key={option.value} value={option.value}>
                {option.label}
              </MenuItem>
            ))}
          </TextField>

          <TextField
            fullWidth
            label="Phone Number"
            type="tel"
            value={phoneNumber}
            onChange={(e) => setPhoneNumber(e.target.value)}
            margin="normal"
            placeholder="(555) 555-5555"
            helperText="Optional - for appointment reminders and notifications"
          />

          <Typography variant="subtitle1" sx={{ mt: 3, mb: 1, fontWeight: 'bold' }}>
            Primary Role
          </Typography>

          <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
            Select your primary role in the platform
          </Typography>

          {roleOptions.map((option) => (
            <Card
              key={option.value}
              variant="outlined"
              sx={{
                mb: 2,
                cursor: 'pointer',
                border: primaryRole === option.value ? 2 : 1,
                borderColor: primaryRole === option.value ? 'primary.main' : 'divider',
                '&:hover': {
                  borderColor: 'primary.main',
                  boxShadow: 1,
                },
              }}
              onClick={() => setPrimaryRole(option.value)}
            >
              <CardContent>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                  <Box
                    sx={{
                      width: 20,
                      height: 20,
                      borderRadius: '50%',
                      border: 2,
                      borderColor: primaryRole === option.value ? 'primary.main' : 'divider',
                      backgroundColor: primaryRole === option.value ? 'primary.main' : 'transparent',
                    }}
                  />
                  <Box>
                    <Typography variant="subtitle1" fontWeight="bold">
                      {option.label}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      {option.description}
                    </Typography>
                  </Box>
                </Box>
              </CardContent>
            </Card>
          ))}

          {error && (
            <Alert severity="error" sx={{ mt: 2 }}>
              {error}
            </Alert>
          )}

          <Box sx={{ display: 'flex', gap: 2, justifyContent: 'center', mt: 4 }}>
            <Button onClick={onBack} variant="outlined" disabled={loading}>
              Back
            </Button>
            <Button type="submit" variant="contained" disabled={loading}>
              {loading ? <CircularProgress size={24} /> : 'Continue'}
            </Button>
          </Box>
        </Box>
      </CardContent>
    </Card>
  );
}
