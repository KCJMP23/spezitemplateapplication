import { useState, useEffect } from 'react';
import {
  Container,
  Typography,
  Box,
  Card,
  CardContent,
  Button,
  Tab,
  Tabs,
  Chip,
  Grid,
  Alert,
  CircularProgress,
} from '@mui/material';
import { Assignment, CheckCircle, Schedule } from '@mui/icons-material';
import { useAuth } from '@/hooks/useAuth';
import { FHIRQuestionnaire } from '@/types/fhir';
import { ScheduledTask } from '@/types';
import questionnaireService from '@/services/questionnaire';
import QuestionnaireRenderer from '@/components/QuestionnaireRenderer';
import { formatDateTime, formatRelativeTime } from '@/utils/helpers';

export default function QuestionnairesView(): JSX.Element {
  const { user } = useAuth();
  const [tab, setTab] = useState(0);
  const [scheduledTasks, setScheduledTasks] = useState<ScheduledTask[]>([]);
  const [availableQuestionnaires, setAvailableQuestionnaires] = useState<FHIRQuestionnaire[]>([]);
  const [selectedQuestionnaire, setSelectedQuestionnaire] = useState<FHIRQuestionnaire | null>(null);
  const [selectedTask, setSelectedTask] = useState<ScheduledTask | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string>('');

  useEffect(() => {
    loadData();
  }, [user]);

  const loadData = async (): Promise<void> => {
    if (!user) return;

    setLoading(true);
    setError('');

    try {
      const [tasks, questionnaires] = await Promise.all([
        questionnaireService.getScheduledQuestionnaires(user.id),
        questionnaireService.getAvailableQuestionnaires(),
      ]);

      setScheduledTasks(tasks);
      setAvailableQuestionnaires(questionnaires);
    } catch (err: any) {
      setError(err.message || 'Failed to load questionnaires');
    } finally {
      setLoading(false);
    }
  };

  const handleStartQuestionnaire = async (questionnaire: FHIRQuestionnaire, task?: ScheduledTask): Promise<void> => {
    try {
      setSelectedQuestionnaire(questionnaire);
      setSelectedTask(task || null);
    } catch (err: any) {
      setError(err.message || 'Failed to load questionnaire');
    }
  };

  const handleSubmitQuestionnaire = async (answers: Record<string, any>): Promise<void> => {
    if (!user || !selectedQuestionnaire) return;

    try {
      await questionnaireService.saveResponse(
        user.id,
        selectedQuestionnaire.id || '',
        answers,
        'completed'
      );

      // Mark task as completed if this was a scheduled task
      if (selectedTask) {
        await questionnaireService.completeTask(user.id, selectedTask.id);
      }

      // Clear selection and reload
      setSelectedQuestionnaire(null);
      setSelectedTask(null);
      await loadData();
    } catch (err: any) {
      throw err; // Let renderer handle the error
    }
  };

  const handleCancel = (): void => {
    setSelectedQuestionnaire(null);
    setSelectedTask(null);
  };

  if (loading) {
    return (
      <Container maxWidth="lg" sx={{ py: 4, textAlign: 'center' }}>
        <CircularProgress />
      </Container>
    );
  }

  // If questionnaire is selected, show renderer
  if (selectedQuestionnaire) {
    return (
      <Container maxWidth="md" sx={{ py: 4 }}>
        <Button onClick={handleCancel} sx={{ mb: 2 }}>
          ← Back to Questionnaires
        </Button>
        <QuestionnaireRenderer
          questionnaire={selectedQuestionnaire}
          onSubmit={handleSubmitQuestionnaire}
          onCancel={handleCancel}
        />
      </Container>
    );
  }

  const pendingTasks = scheduledTasks.filter((t) => t.status === 'pending');
  const completedTasks = scheduledTasks.filter((t) => t.status === 'completed');

  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
      <Typography variant="h4" gutterBottom>
        Questionnaires
      </Typography>

      <Typography variant="body2" color="text.secondary" paragraph>
        Complete your scheduled questionnaires and assessments
      </Typography>

      {error && (
        <Alert severity="error" sx={{ mb: 3 }} onClose={() => setError('')}>
          {error}
        </Alert>
      )}

      <Box sx={{ borderBottom: 1, borderColor: 'divider', mb: 3 }}>
        <Tabs value={tab} onChange={(_, newValue) => setTab(newValue)}>
          <Tab
            label={
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                Schedule
                {pendingTasks.length > 0 && (
                  <Chip label={pendingTasks.length} size="small" color="primary" />
                )}
              </Box>
            }
          />
          <Tab label="Available" />
          <Tab label="Completed" />
        </Tabs>
      </Box>

      {/* Scheduled Tab */}
      {tab === 0 && (
        <Box>
          {pendingTasks.length === 0 ? (
            <Card variant="outlined">
              <CardContent sx={{ textAlign: 'center', py: 6 }}>
                <CheckCircle sx={{ fontSize: 64, color: 'text.disabled', mb: 2 }} />
                <Typography variant="h6" color="text.secondary">
                  No pending questionnaires
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  You're all caught up! Check back later for new questionnaires.
                </Typography>
              </CardContent>
            </Card>
          ) : (
            <Grid container spacing={2}>
              {pendingTasks.map((task) => (
                <Grid item xs={12} key={task.id}>
                  <Card>
                    <CardContent>
                      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                        <Box sx={{ flex: 1 }}>
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                            <Assignment />
                            <Typography variant="h6">{task.title}</Typography>
                            <Chip label="Pending" size="small" color="warning" />
                          </Box>
                          <Typography variant="body2" color="text.secondary" paragraph>
                            {task.description}
                          </Typography>
                          <Box sx={{ display: 'flex', gap: 2, alignItems: 'center' }}>
                            <Typography variant="caption" color="text.secondary">
                              <Schedule sx={{ fontSize: 16, verticalAlign: 'middle', mr: 0.5 }} />
                              Due: {formatDateTime(task.scheduledFor)}
                            </Typography>
                            <Typography variant="caption" color="text.secondary">
                              ({formatRelativeTime(task.scheduledFor)})
                            </Typography>
                          </Box>
                        </Box>
                        <Button
                          variant="contained"
                          onClick={async () => {
                            const questionnaire = await questionnaireService.loadQuestionnaire(
                              task.questionnaireId || 'SocialSupportQuestionnaire'
                            );
                            handleStartQuestionnaire(questionnaire, task);
                          }}
                        >
                          Start
                        </Button>
                      </Box>
                    </CardContent>
                  </Card>
                </Grid>
              ))}
            </Grid>
          )}
        </Box>
      )}

      {/* Available Tab */}
      {tab === 1 && (
        <Grid container spacing={2}>
          {availableQuestionnaires.map((questionnaire) => (
            <Grid item xs={12} md={6} key={questionnaire.id}>
              <Card>
                <CardContent>
                  <Typography variant="h6" gutterBottom>
                    {questionnaire.title}
                  </Typography>
                  <Typography variant="body2" color="text.secondary" paragraph>
                    {questionnaire.description}
                  </Typography>
                  <Box sx={{ display: 'flex', gap: 1, mb: 2 }}>
                    <Chip label={`${questionnaire.item?.length || 0} questions`} size="small" />
                    {questionnaire.publisher && (
                      <Chip label={questionnaire.publisher} size="small" variant="outlined" />
                    )}
                  </Box>
                  <Button
                    variant="outlined"
                    fullWidth
                    onClick={() => handleStartQuestionnaire(questionnaire)}
                  >
                    Start Questionnaire
                  </Button>
                </CardContent>
              </Card>
            </Grid>
          ))}
        </Grid>
      )}

      {/* Completed Tab */}
      {tab === 2 && (
        <Box>
          {completedTasks.length === 0 ? (
            <Card variant="outlined">
              <CardContent sx={{ textAlign: 'center', py: 6 }}>
                <Assignment sx={{ fontSize: 64, color: 'text.disabled', mb: 2 }} />
                <Typography variant="h6" color="text.secondary">
                  No completed questionnaires
                </Typography>
              </CardContent>
            </Card>
          ) : (
            <Grid container spacing={2}>
              {completedTasks.map((task) => (
                <Grid item xs={12} key={task.id}>
                  <Card variant="outlined">
                    <CardContent>
                      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <Box>
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                            <CheckCircle color="success" />
                            <Typography variant="h6">{task.title}</Typography>
                          </Box>
                          <Typography variant="caption" color="text.secondary">
                            Completed: {task.completedAt ? formatDateTime(task.completedAt) : 'N/A'}
                          </Typography>
                        </Box>
                        <Chip label="Completed" size="small" color="success" />
                      </Box>
                    </CardContent>
                  </Card>
                </Grid>
              ))}
            </Grid>
          )}
        </Box>
      )}
    </Container>
  );
}
