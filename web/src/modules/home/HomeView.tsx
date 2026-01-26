import { Container, Typography, Box, Grid, Card, CardContent, CardActionArea } from '@mui/material';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import {
  MonitorHeart,
  Assignment,
  People,
  Analytics,
  Science,
  ContactPhone,
} from '@mui/icons-material';

export default function HomeView(): JSX.Element {
  const navigate = useNavigate();
  const { user } = useAuth();

  const modules = [
    { title: 'Health Data', icon: <MonitorHeart />, path: '/health-data', roles: ['patient'] },
    { title: 'Questionnaires', icon: <Assignment />, path: '/questionnaires', roles: ['patient'] },
    { title: 'Patients', icon: <People />, path: '/patients', roles: ['provider'] },
    { title: 'Data Review', icon: <Analytics />, path: '/review', roles: ['provider'] },
    { title: 'Studies', icon: <Science />, path: '/studies', roles: ['researcher'] },
    { title: 'Analysis', icon: <Analytics />, path: '/analysis', roles: ['researcher'] },
    { title: 'Contacts', icon: <ContactPhone />, path: '/contacts', roles: ['patient', 'provider', 'researcher'] },
  ];

  const availableModules = modules.filter(module =>
    user?.roles.some(role => module.roles.includes(role))
  );

  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
      <Box sx={{ mb: 4 }}>
        <Typography variant="h4" gutterBottom>
          Welcome, {user?.displayName}
        </Typography>
        <Typography variant="body1" color="text.secondary">
          Role: {user?.primaryRole}
        </Typography>
      </Box>

      <Grid container spacing={3}>
        {availableModules.map((module) => (
          <Grid item xs={12} sm={6} md={4} key={module.path}>
            <Card>
              <CardActionArea onClick={() => navigate(module.path)} sx={{ p: 3 }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                  {module.icon}
                  <Typography variant="h6">{module.title}</Typography>
                </Box>
              </CardActionArea>
            </Card>
          </Grid>
        ))}
      </Grid>
    </Container>
  );
}
