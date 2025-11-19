/**
 * Module Setup View
 *
 * Interactive module configuration page using the Spezi Configuration Wizard
 */

import React, { useState, useEffect } from 'react';
import {
  Box,
  Container,
  Paper,
  Typography,
  Alert,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  CircularProgress,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  IconButton,
  Tooltip,
  Snackbar,
} from '@mui/material';
import {
  CheckCircle as CheckCircleIcon,
  Error as ErrorIcon,
  Download as DownloadIcon,
  Upload as UploadIcon,
  Code as CodeIcon,
  Refresh as RefreshIcon,
} from '@mui/icons-material';
import SpeziConfigWizard, { WizardConfig } from '@/components/SpeziConfigWizard';
import moduleConfiguratorService, { InitializedModule } from '@/services/moduleConfigurator';
import { logger } from '@/utils/logger';

export const ModuleSetupView: React.FC = () => {
  const [showWizard, setShowWizard] = useState(true);
  const [isInitializing, setIsInitializing] = useState(false);
  const [initResults, setInitResults] = useState<InitializedModule[]>([]);
  const [currentConfig, setCurrentConfig] = useState<WizardConfig | null>(null);
  const [showCodeDialog, setShowCodeDialog] = useState(false);
  const [generatedCode, setGeneratedCode] = useState('');
  const [snackbar, setSnackbar] = useState<{ open: boolean; message: string; severity: 'success' | 'error' }>({
    open: false,
    message: '',
    severity: 'success',
  });

  // Load existing configuration on mount
  useEffect(() => {
    loadExistingConfig();
  }, []);

  const loadExistingConfig = async () => {
    const config = await moduleConfiguratorService.loadConfiguration();
    if (config) {
      setCurrentConfig(config);
      setShowWizard(false);

      // Check if already initialized
      if (moduleConfiguratorService.isInitialized()) {
        // Generate mock results for display
        const results: InitializedModule[] = config.modules
          .filter((m) => m.enabled)
          .map((m) => ({
            id: m.id,
            name: m.name,
            status: 'initialized' as const,
          }));
        setInitResults(results);
      }
    }
  };

  const handleWizardComplete = async (config: WizardConfig) => {
    setShowWizard(false);
    setCurrentConfig(config);
    setIsInitializing(true);

    try {
      const results = await moduleConfiguratorService.initializeFromConfig(config);
      setInitResults(results);

      const successCount = results.filter((r) => r.status === 'initialized').length;
      const failCount = results.filter((r) => r.status === 'failed').length;

      if (failCount === 0) {
        setSnackbar({
          open: true,
          message: `Successfully initialized ${successCount} modules!`,
          severity: 'success',
        });
      } else {
        setSnackbar({
          open: true,
          message: `Initialized ${successCount} modules, ${failCount} failed`,
          severity: 'error',
        });
      }
    } catch (error) {
      logger.error('Failed to initialize modules', error);
      setSnackbar({
        open: true,
        message: 'Failed to initialize modules',
        severity: 'error',
      });
    } finally {
      setIsInitializing(false);
    }
  };

  const handleExportConfig = () => {
    if (!currentConfig) return;

    const json = moduleConfiguratorService.exportConfiguration(currentConfig);
    const blob = new Blob([json], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'spezi-config.json';
    a.click();
    URL.revokeObjectURL(url);

    setSnackbar({
      open: true,
      message: 'Configuration exported successfully',
      severity: 'success',
    });
  };

  const handleImportConfig = () => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = 'application/json';
    input.onchange = async (e) => {
      const file = (e.target as HTMLInputElement).files?.[0];
      if (!file) return;

      try {
        const json = await file.text();
        const config = moduleConfiguratorService.importConfiguration(json);
        setCurrentConfig(config);
        setShowWizard(false);

        setSnackbar({
          open: true,
          message: 'Configuration imported successfully',
          severity: 'success',
        });
      } catch (error) {
        setSnackbar({
          open: true,
          message: 'Failed to import configuration',
          severity: 'error',
        });
      }
    };
    input.click();
  };

  const handleShowCode = () => {
    if (!currentConfig) return;
    const code = moduleConfiguratorService.generateConfigCode(currentConfig);
    setGeneratedCode(code);
    setShowCodeDialog(true);
  };

  const handleCopyCode = () => {
    navigator.clipboard.writeText(generatedCode);
    setSnackbar({
      open: true,
      message: 'Code copied to clipboard',
      severity: 'success',
    });
  };

  const handleReconfigure = () => {
    setShowWizard(true);
    setInitResults([]);
  };

  if (showWizard) {
    return (
      <SpeziConfigWizard
        onComplete={handleWizardComplete}
        onCancel={() => {
          if (currentConfig) {
            setShowWizard(false);
          }
        }}
      />
    );
  }

  return (
    <Container maxWidth="md" sx={{ py: 4 }}>
      <Paper elevation={3} sx={{ p: 4 }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
          <Typography variant="h4">Module Configuration</Typography>
          <Box>
            <Tooltip title="Reconfigure">
              <IconButton onClick={handleReconfigure} color="primary">
                <RefreshIcon />
              </IconButton>
            </Tooltip>
            <Tooltip title="Export Configuration">
              <IconButton onClick={handleExportConfig} color="primary">
                <DownloadIcon />
              </IconButton>
            </Tooltip>
            <Tooltip title="Import Configuration">
              <IconButton onClick={handleImportConfig} color="primary">
                <UploadIcon />
              </IconButton>
            </Tooltip>
            <Tooltip title="Show Code">
              <IconButton onClick={handleShowCode} color="primary">
                <CodeIcon />
              </IconButton>
            </Tooltip>
          </Box>
        </Box>

        {currentConfig && (
          <Alert severity="info" sx={{ mb: 3 }}>
            <Typography variant="body2">
              <strong>Application Type:</strong>{' '}
              {currentConfig.appType.replace(/_/g, ' ').replace(/\b\w/g, (l) => l.toUpperCase())}
            </Typography>
            <Typography variant="body2">
              <strong>Modules:</strong> {currentConfig.modules.filter((m) => m.enabled).length}{' '}
              enabled
            </Typography>
          </Alert>
        )}

        {isInitializing && (
          <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', py: 4 }}>
            <CircularProgress />
            <Typography variant="body1" sx={{ ml: 2 }}>
              Initializing modules...
            </Typography>
          </Box>
        )}

        {!isInitializing && initResults.length > 0 && (
          <Box>
            <Typography variant="h6" sx={{ mb: 2 }}>
              Initialization Results
            </Typography>
            <List>
              {initResults.map((result) => (
                <ListItem key={result.id}>
                  <ListItemIcon>
                    {result.status === 'initialized' ? (
                      <CheckCircleIcon color="success" />
                    ) : (
                      <ErrorIcon color="error" />
                    )}
                  </ListItemIcon>
                  <ListItemText
                    primary={result.name}
                    secondary={
                      result.status === 'failed'
                        ? `Failed: ${result.error}`
                        : result.version
                          ? `Version ${result.version}`
                          : 'Initialized successfully'
                    }
                    secondaryTypographyProps={{
                      color: result.status === 'failed' ? 'error' : 'text.secondary',
                    }}
                  />
                </ListItem>
              ))}
            </List>

            <Alert
              severity={
                initResults.every((r) => r.status === 'initialized') ? 'success' : 'warning'
              }
              sx={{ mt: 2 }}
            >
              {initResults.every((r) => r.status === 'initialized') ? (
                <Typography variant="body2">
                  All modules initialized successfully! Your application is ready to use.
                </Typography>
              ) : (
                <Typography variant="body2">
                  Some modules failed to initialize. Check the logs for more details. Note: Only
                  the Scheduler module is currently implemented in the Spezi compatibility layer.
                  Other modules will use the direct service layer until their Spezi wrappers are
                  created.
                </Typography>
              )}
            </Alert>

            <Box sx={{ mt: 3, display: 'flex', gap: 2 }}>
              <Button variant="outlined" onClick={handleReconfigure} startIcon={<RefreshIcon />}>
                Reconfigure Modules
              </Button>
              <Button variant="outlined" onClick={handleShowCode} startIcon={<CodeIcon />}>
                View Generated Code
              </Button>
            </Box>
          </Box>
        )}

        {!isInitializing && initResults.length === 0 && currentConfig && (
          <Box sx={{ textAlign: 'center', py: 4 }}>
            <Typography variant="body1" color="text.secondary" sx={{ mb: 2 }}>
              Configuration loaded. Click below to initialize modules.
            </Typography>
            <Button
              variant="contained"
              size="large"
              onClick={() => handleWizardComplete(currentConfig)}
            >
              Initialize Modules
            </Button>
          </Box>
        )}
      </Paper>

      {/* Code Dialog */}
      <Dialog
        open={showCodeDialog}
        onClose={() => setShowCodeDialog(false)}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle>Generated Configuration Code</DialogTitle>
        <DialogContent>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
            Copy this code to manually initialize your Spezi modules:
          </Typography>
          <Paper
            elevation={0}
            sx={{
              p: 2,
              bgcolor: 'grey.100',
              fontFamily: 'monospace',
              fontSize: '0.875rem',
              overflow: 'auto',
              maxHeight: 400,
            }}
          >
            <pre style={{ margin: 0 }}>{generatedCode}</pre>
          </Paper>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setShowCodeDialog(false)}>Close</Button>
          <Button onClick={handleCopyCode} variant="contained">
            Copy Code
          </Button>
        </DialogActions>
      </Dialog>

      {/* Snackbar */}
      <Snackbar
        open={snackbar.open}
        autoHideDuration={6000}
        onClose={() => setSnackbar({ ...snackbar, open: false })}
        message={snackbar.message}
      />
    </Container>
  );
};

export default ModuleSetupView;
