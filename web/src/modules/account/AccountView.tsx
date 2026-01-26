import { useState } from 'react';
import {
  Container,
  Typography,
  Button,
  Box,
  Card,
  CardContent,
  Grid,
  Divider,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  ListItemButton,
} from '@mui/material';
import {
  Person,
  Email,
  Badge,
  Description,
  Logout,
  Security,
  Info,
  ChevronRight,
} from '@mui/icons-material';
import { useAuth } from '@/hooks/useAuth';
import { useNavigate } from 'react-router-dom';
import LicenseInfo from '@/components/LicenseInfo';

export default function AccountView(): JSX.Element {
  const { user, signOut } = useAuth();
  const navigate = useNavigate();
  const [licenseOpen, setLicenseOpen] = useState(false);

  const handleSignOut = async (): Promise<void> => {
    await signOut();
    navigate('/login');
  };

  return (
    <Container maxWidth="md" sx={{ py: 4 }}>
      <Typography variant="h4" gutterBottom>
        Account Settings
      </Typography>

      {/* User Information */}
      <Card sx={{ mt: 3, mb: 3 }}>
        <CardContent>
          <Typography variant="h6" gutterBottom>
            Profile Information
          </Typography>
          <Grid container spacing={2} sx={{ mt: 1 }}>
            <Grid item xs={12}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                <Person color="primary" />
                <Box>
                  <Typography variant="caption" color="text.secondary">
                    Name
                  </Typography>
                  <Typography variant="body1">{user?.displayName || 'Not set'}</Typography>
                </Box>
              </Box>
            </Grid>
            <Grid item xs={12}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                <Email color="primary" />
                <Box>
                  <Typography variant="caption" color="text.secondary">
                    Email
                  </Typography>
                  <Typography variant="body1">{user?.email || 'Not set'}</Typography>
                </Box>
              </Box>
            </Grid>
            <Grid item xs={12}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                <Badge color="primary" />
                <Box>
                  <Typography variant="caption" color="text.secondary">
                    Primary Role
                  </Typography>
                  <Typography variant="body1" sx={{ textTransform: 'capitalize' }}>
                    {user?.primaryRole || 'Not set'}
                  </Typography>
                </Box>
              </Box>
            </Grid>
          </Grid>
        </CardContent>
      </Card>

      {/* Settings & Information */}
      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Typography variant="h6" gutterBottom>
            Settings & Information
          </Typography>
          <List disablePadding>
            <ListItemButton onClick={() => setLicenseOpen(true)}>
              <ListItemIcon>
                <Description />
              </ListItemIcon>
              <ListItemText
                primary="License & Acknowledgements"
                secondary="View open source licenses and contributors"
              />
              <ChevronRight />
            </ListItemButton>

            <Divider />

            <ListItem>
              <ListItemIcon>
                <Security />
              </ListItemIcon>
              <ListItemText
                primary="Privacy & Security"
                secondary="HIPAA compliant • Data encrypted • Audit logged"
              />
            </ListItem>

            <Divider />

            <ListItem>
              <ListItemIcon>
                <Info />
              </ListItemIcon>
              <ListItemText
                primary="Application Version"
                secondary="v1.0.0 (React PWA)"
              />
            </ListItem>
          </List>
        </CardContent>
      </Card>

      {/* Sign Out */}
      <Button
        variant="contained"
        color="error"
        fullWidth
        size="large"
        startIcon={<Logout />}
        onClick={handleSignOut}
      >
        Sign Out
      </Button>

      {/* License Dialog */}
      <LicenseInfo open={licenseOpen} onClose={() => setLicenseOpen(false)} />
    </Container>
  );
}
