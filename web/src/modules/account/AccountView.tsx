import { Container, Typography, Button, Box } from '@mui/material';
import { useAuth } from '@/hooks/useAuth';
import { useNavigate } from 'react-router-dom';

export default function AccountView(): JSX.Element {
  const { user, signOut } = useAuth();
  const navigate = useNavigate();

  const handleSignOut = async (): Promise<void> => {
    await signOut();
    navigate('/login');
  };

  return (
    <Container maxWidth="md" sx={{ py: 4 }}>
      <Typography variant="h4" gutterBottom>Account Settings</Typography>
      <Box sx={{ mt: 4 }}>
        <Typography variant="body1"><strong>Name:</strong> {user?.displayName}</Typography>
        <Typography variant="body1"><strong>Email:</strong> {user?.email}</Typography>
        <Typography variant="body1"><strong>Role:</strong> {user?.primaryRole}</Typography>
        <Button variant="contained" color="error" onClick={handleSignOut} sx={{ mt: 4 }}>
          Sign Out
        </Button>
      </Box>
    </Container>
  );
}
