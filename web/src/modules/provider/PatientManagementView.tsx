import { useState, useEffect } from 'react';
import {
  Container,
  Typography,
  Box,
  Card,
  CardContent,
  Grid,
  Avatar,
  Chip,
  Button,
  TextField,
  InputAdornment,
  Alert,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
} from '@mui/material';
import {
  Search,
  Person,
  TrendingUp,
  CheckCircle,
  Warning,
  MonitorHeart,
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';

// Demo patient data
interface DemoPatient {
  id: string;
  name: string;
  age: number;
  gender: string;
  lastVisit: string;
  status: 'active' | 'inactive' | 'at-risk';
  completedQuestionnaires: number;
  pendingQuestionnaires: number;
  healthDataPoints: number;
  averageHeartRate?: number;
  averageSteps?: number;
}

const DEMO_PATIENTS: DemoPatient[] = [
  {
    id: '1',
    name: 'John Smith',
    age: 45,
    gender: 'Male',
    lastVisit: '2025-11-15',
    status: 'active',
    completedQuestionnaires: 12,
    pendingQuestionnaires: 1,
    healthDataPoints: 847,
    averageHeartRate: 72,
    averageSteps: 8500,
  },
  {
    id: '2',
    name: 'Sarah Johnson',
    age: 38,
    gender: 'Female',
    lastVisit: '2025-11-17',
    status: 'active',
    completedQuestionnaires: 15,
    pendingQuestionnaires: 0,
    healthDataPoints: 1024,
    averageHeartRate: 68,
    averageSteps: 10200,
  },
  {
    id: '3',
    name: 'Michael Chen',
    age: 52,
    gender: 'Male',
    lastVisit: '2025-10-28',
    status: 'at-risk',
    completedQuestionnaires: 8,
    pendingQuestionnaires: 3,
    healthDataPoints: 156,
    averageHeartRate: 88,
    averageSteps: 3200,
  },
  {
    id: '4',
    name: 'Emily Davis',
    age: 29,
    gender: 'Female',
    lastVisit: '2025-11-18',
    status: 'active',
    completedQuestionnaires: 10,
    pendingQuestionnaires: 1,
    healthDataPoints: 592,
    averageHeartRate: 65,
    averageSteps: 12000,
  },
  {
    id: '5',
    name: 'Robert Martinez',
    age: 61,
    gender: 'Male',
    lastVisit: '2025-09-15',
    status: 'inactive',
    completedQuestionnaires: 3,
    pendingQuestionnaires: 5,
    healthDataPoints: 42,
    averageHeartRate: 75,
    averageSteps: 2100,
  },
];

export default function PatientManagementView(): JSX.Element {
  const navigate = useNavigate();
  const [patients, setPatients] = useState<DemoPatient[]>(DEMO_PATIENTS);
  const [searchQuery, setSearchQuery] = useState('');
  const [filteredPatients, setFilteredPatients] = useState<DemoPatient[]>(DEMO_PATIENTS);

  useEffect(() => {
    if (searchQuery.trim()) {
      const filtered = patients.filter((patient) =>
        patient.name.toLowerCase().includes(searchQuery.toLowerCase())
      );
      setFilteredPatients(filtered);
    } else {
      setFilteredPatients(patients);
    }
  }, [searchQuery, patients]);

  const getStatusColor = (status: DemoPatient['status']): 'success' | 'default' | 'warning' => {
    switch (status) {
      case 'active':
        return 'success';
      case 'at-risk':
        return 'warning';
      default:
        return 'default';
    }
  };

  const getStatusIcon = (status: DemoPatient['status']): JSX.Element => {
    switch (status) {
      case 'active':
        return <CheckCircle />;
      case 'at-risk':
        return <Warning />;
      default:
        return <MonitorHeart />;
    }
  };

  const activeCount = patients.filter((p) => p.status === 'active').length;
  const atRiskCount = patients.filter((p) => p.status === 'at-risk').length;
  const totalQuestionnaires = patients.reduce((sum, p) => sum + p.completedQuestionnaires, 0);

  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
      <Box sx={{ mb: 4 }}>
        <Typography variant="h4" gutterBottom>
          Patient Management
        </Typography>
        <Typography variant="body2" color="text.secondary">
          Monitor and manage your patient roster
        </Typography>
      </Box>

      {/* Demo Notice */}
      <Alert severity="info" sx={{ mb: 3 }}>
        <Typography variant="body2">
          <strong>Demo Mode:</strong> This is sample patient data for demonstration.
          In production, this would display real patient data with proper authorization and HIPAA compliance.
        </Typography>
      </Alert>

      {/* Statistics */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Typography variant="caption" color="text.secondary" gutterBottom>
                Total Patients
              </Typography>
              <Typography variant="h3">{patients.length}</Typography>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Typography variant="caption" color="text.secondary" gutterBottom>
                Active
              </Typography>
              <Typography variant="h3" color="success.main">
                {activeCount}
              </Typography>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Typography variant="caption" color="text.secondary" gutterBottom>
                At Risk
              </Typography>
              <Typography variant="h3" color="warning.main">
                {atRiskCount}
              </Typography>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Typography variant="caption" color="text.secondary" gutterBottom>
                Questionnaires
              </Typography>
              <Typography variant="h3">{totalQuestionnaires}</Typography>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Search */}
      <TextField
        fullWidth
        placeholder="Search patients by name..."
        value={searchQuery}
        onChange={(e) => setSearchQuery(e.target.value)}
        InputProps={{
          startAdornment: (
            <InputAdornment position="start">
              <Search />
            </InputAdornment>
          ),
        }}
        sx={{ mb: 3 }}
      />

      {/* Patient List */}
      <TableContainer component={Paper}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>Patient</TableCell>
              <TableCell>Status</TableCell>
              <TableCell align="right">Age</TableCell>
              <TableCell>Last Visit</TableCell>
              <TableCell align="right">Questionnaires</TableCell>
              <TableCell align="right">Health Data</TableCell>
              <TableCell align="right">Avg Heart Rate</TableCell>
              <TableCell align="right">Avg Steps</TableCell>
              <TableCell>Actions</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {filteredPatients.map((patient) => (
              <TableRow key={patient.id} hover>
                <TableCell>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                    <Avatar>
                      <Person />
                    </Avatar>
                    <Box>
                      <Typography variant="body2" fontWeight="bold">
                        {patient.name}
                      </Typography>
                      <Typography variant="caption" color="text.secondary">
                        {patient.gender}
                      </Typography>
                    </Box>
                  </Box>
                </TableCell>
                <TableCell>
                  <Chip
                    icon={getStatusIcon(patient.status)}
                    label={patient.status}
                    color={getStatusColor(patient.status)}
                    size="small"
                  />
                </TableCell>
                <TableCell align="right">{patient.age}</TableCell>
                <TableCell>{patient.lastVisit}</TableCell>
                <TableCell align="right">
                  <Typography variant="body2">
                    {patient.completedQuestionnaires}{' '}
                    {patient.pendingQuestionnaires > 0 && (
                      <Chip
                        label={`${patient.pendingQuestionnaires} pending`}
                        size="small"
                        color="warning"
                        sx={{ ml: 1 }}
                      />
                    )}
                  </Typography>
                </TableCell>
                <TableCell align="right">{patient.healthDataPoints}</TableCell>
                <TableCell align="right">
                  {patient.averageHeartRate ? `${patient.averageHeartRate} bpm` : 'N/A'}
                </TableCell>
                <TableCell align="right">
                  {patient.averageSteps ? patient.averageSteps.toLocaleString() : 'N/A'}
                </TableCell>
                <TableCell>
                  <Button
                    size="small"
                    variant="outlined"
                    onClick={() => navigate(`/review?patientId=${patient.id}`)}
                  >
                    View Details
                  </Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>

      {filteredPatients.length === 0 && (
        <Box sx={{ textAlign: 'center', py: 6 }}>
          <Typography variant="body1" color="text.secondary">
            No patients found matching "{searchQuery}"
          </Typography>
        </Box>
      )}
    </Container>
  );
}
