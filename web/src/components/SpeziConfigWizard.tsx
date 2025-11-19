/**
 * Spezi Module Configuration Wizard
 *
 * An interactive wizard that helps users select and configure Spezi modules
 * based on their healthcare application requirements.
 */

import React, { useState } from 'react';
import {
  Box,
  Button,
  Card,
  CardContent,
  Checkbox,
  Chip,
  FormControl,
  FormControlLabel,
  FormGroup,
  FormLabel,
  Radio,
  RadioGroup,
  Step,
  StepContent,
  StepLabel,
  Stepper,
  TextField,
  Typography,
  Alert,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
} from '@mui/material';
import {
  CheckCircle as CheckCircleIcon,
  Warning as WarningIcon,
  Info as InfoIcon,
} from '@mui/icons-material';

export interface ModuleConfig {
  id: string;
  name: string;
  enabled: boolean;
  config?: Record<string, any>;
}

export interface WizardConfig {
  appType: 'clinical_trial' | 'patient_monitoring' | 'data_collection' | 'custom';
  userRoles: ('patient' | 'provider' | 'researcher')[];
  features: {
    scheduling: boolean;
    questionnaires: boolean;
    wearables: boolean;
    messaging: boolean;
    consent: boolean;
    dataExport: boolean;
    llm: boolean;
    location: boolean;
  };
  compliance: {
    hipaa: boolean;
    gdpr: boolean;
    fhir: boolean;
  };
  modules: ModuleConfig[];
}

interface SpeziConfigWizardProps {
  onComplete: (config: WizardConfig) => void;
  onCancel?: () => void;
}

const APP_TYPES = [
  {
    id: 'clinical_trial' as const,
    name: 'Clinical Trial / Research Study',
    description: 'Recruit participants, collect data, manage study protocols',
    recommendedModules: ['scheduler', 'questionnaire', 'consent', 'study', 'dataExport'],
  },
  {
    id: 'patient_monitoring' as const,
    name: 'Patient Monitoring',
    description: 'Track patient health data, vitals, medications',
    recommendedModules: ['scheduler', 'healthData', 'medication', 'wearables', 'notifications'],
  },
  {
    id: 'data_collection' as const,
    name: 'Health Data Collection',
    description: 'Gather health metrics from wearables and manual entry',
    recommendedModules: ['healthData', 'wearables', 'storage', 'dataExport'],
  },
  {
    id: 'custom' as const,
    name: 'Custom Application',
    description: 'Build a custom healthcare solution',
    recommendedModules: [],
  },
];

const AVAILABLE_MODULES = [
  {
    id: 'scheduler',
    name: 'Scheduler',
    description: 'Task scheduling and reminders',
    requiredFor: ['scheduling'],
    category: 'core',
  },
  {
    id: 'questionnaire',
    name: 'Questionnaire',
    description: 'FHIR questionnaires and responses',
    requiredFor: ['questionnaires'],
    category: 'data',
  },
  {
    id: 'healthData',
    name: 'Health Data',
    description: 'Store and manage health observations',
    requiredFor: ['wearables'],
    category: 'data',
  },
  {
    id: 'wearables',
    name: 'Wearable Integration',
    description: 'Connect to health devices via Bluetooth',
    requiredFor: ['wearables'],
    category: 'integration',
    dependencies: ['healthData'],
  },
  {
    id: 'consent',
    name: 'Consent Management',
    description: 'Digital consent with e-signatures',
    requiredFor: ['consent'],
    category: 'compliance',
  },
  {
    id: 'chat',
    name: 'Secure Messaging',
    description: 'HIPAA-compliant chat',
    requiredFor: ['messaging'],
    category: 'communication',
  },
  {
    id: 'notifications',
    name: 'Notifications',
    description: 'Push and local notifications',
    requiredFor: ['scheduling'],
    category: 'core',
  },
  {
    id: 'study',
    name: 'Study Management',
    description: 'Research study coordination',
    requiredFor: [],
    category: 'research',
  },
  {
    id: 'dataExport',
    name: 'Data Export',
    description: 'Export to CSV, FHIR, etc.',
    requiredFor: ['dataExport'],
    category: 'data',
  },
  {
    id: 'medication',
    name: 'Medication Tracking',
    description: 'Medication adherence monitoring',
    requiredFor: [],
    category: 'clinical',
  },
  {
    id: 'llm',
    name: 'AI Assistant',
    description: 'LLM integration for health insights',
    requiredFor: ['llm'],
    category: 'ai',
  },
  {
    id: 'location',
    name: 'Location Services',
    description: 'Geolocation and geofencing',
    requiredFor: ['location'],
    category: 'tracking',
  },
  {
    id: 'storage',
    name: 'Storage',
    description: 'Encrypted local storage',
    requiredFor: [],
    category: 'core',
  },
];

export const SpeziConfigWizard: React.FC<SpeziConfigWizardProps> = ({ onComplete, onCancel }) => {
  const [activeStep, setActiveStep] = useState(0);
  const [config, setConfig] = useState<Partial<WizardConfig>>({
    appType: 'custom',
    userRoles: [],
    features: {
      scheduling: false,
      questionnaires: false,
      wearables: false,
      messaging: false,
      consent: false,
      dataExport: false,
      llm: false,
      location: false,
    },
    compliance: {
      hipaa: true,
      gdpr: false,
      fhir: true,
    },
    modules: [],
  });

  const handleNext = () => {
    setActiveStep((prevActiveStep) => prevActiveStep + 1);
  };

  const handleBack = () => {
    setActiveStep((prevActiveStep) => prevActiveStep - 1);
  };

  const handleAppTypeChange = (appType: WizardConfig['appType']) => {
    const selectedType = APP_TYPES.find((t) => t.id === appType);

    setConfig((prev) => ({
      ...prev,
      appType,
      // Auto-enable recommended modules for this app type
      modules: selectedType?.recommendedModules.map((id) => ({
        id,
        name: AVAILABLE_MODULES.find((m) => m.id === id)?.name || id,
        enabled: true,
      })) || [],
    }));
  };

  const handleFeatureToggle = (feature: keyof WizardConfig['features']) => {
    setConfig((prev) => ({
      ...prev,
      features: {
        ...prev.features!,
        [feature]: !prev.features![feature],
      },
    }));
  };

  const handleModuleToggle = (moduleId: string) => {
    setConfig((prev) => {
      const modules = prev.modules || [];
      const existingIndex = modules.findIndex((m) => m.id === moduleId);

      let updatedModules: ModuleConfig[];
      if (existingIndex >= 0) {
        // Toggle existing module
        updatedModules = modules.map((m, i) =>
          i === existingIndex ? { ...m, enabled: !m.enabled } : m
        );
      } else {
        // Add new module
        const moduleInfo = AVAILABLE_MODULES.find((m) => m.id === moduleId);
        updatedModules = [
          ...modules,
          {
            id: moduleId,
            name: moduleInfo?.name || moduleId,
            enabled: true,
          },
        ];
      }

      // Auto-enable dependencies
      const enabledModuleIds = updatedModules.filter((m) => m.enabled).map((m) => m.id);
      const modulesToCheck = [...enabledModuleIds];
      const resolvedModules = new Set(enabledModuleIds);

      while (modulesToCheck.length > 0) {
        const currentModule = modulesToCheck.pop()!;
        const moduleInfo = AVAILABLE_MODULES.find((m) => m.id === currentModule);

        if (moduleInfo?.dependencies) {
          moduleInfo.dependencies.forEach((dep) => {
            if (!resolvedModules.has(dep)) {
              resolvedModules.add(dep);
              modulesToCheck.push(dep);

              // Add to modules list if not present
              if (!updatedModules.find((m) => m.id === dep)) {
                const depInfo = AVAILABLE_MODULES.find((m) => m.id === dep);
                updatedModules.push({
                  id: dep,
                  name: depInfo?.name || dep,
                  enabled: true,
                });
              } else {
                // Enable if present but disabled
                const index = updatedModules.findIndex((m) => m.id === dep);
                updatedModules[index].enabled = true;
              }
            }
          });
        }
      }

      return {
        ...prev,
        modules: updatedModules,
      };
    });
  };

  const getRecommendedModules = (): string[] => {
    const recommended = new Set<string>();

    // Based on app type
    const appType = APP_TYPES.find((t) => t.id === config.appType);
    appType?.recommendedModules.forEach((m) => recommended.add(m));

    // Based on features
    Object.entries(config.features || {}).forEach(([feature, enabled]) => {
      if (enabled) {
        AVAILABLE_MODULES.forEach((module) => {
          if (module.requiredFor.includes(feature)) {
            recommended.add(module.id);
          }
        });
      }
    });

    // Based on compliance requirements
    if (config.compliance?.hipaa) {
      recommended.add('consent');
      recommended.add('storage'); // For encrypted storage
    }

    if (config.compliance?.fhir) {
      recommended.add('healthData');
      recommended.add('questionnaire');
    }

    return Array.from(recommended);
  };

  const handleComplete = () => {
    // Ensure all recommended modules are in the list
    const recommended = getRecommendedModules();
    const finalModules = [...(config.modules || [])];

    recommended.forEach((moduleId) => {
      if (!finalModules.find((m) => m.id === moduleId)) {
        const moduleInfo = AVAILABLE_MODULES.find((m) => m.id === moduleId);
        finalModules.push({
          id: moduleId,
          name: moduleInfo?.name || moduleId,
          enabled: true,
        });
      }
    });

    onComplete({
      ...config,
      modules: finalModules,
    } as WizardConfig);
  };

  const steps = [
    {
      label: 'Application Type',
      content: (
        <Box>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
            What type of healthcare application are you building?
          </Typography>
          <FormControl component="fieldset" fullWidth>
            <RadioGroup
              value={config.appType}
              onChange={(e) => handleAppTypeChange(e.target.value as WizardConfig['appType'])}
            >
              {APP_TYPES.map((type) => (
                <Card key={type.id} sx={{ mb: 2 }}>
                  <CardContent>
                    <FormControlLabel
                      value={type.id}
                      control={<Radio />}
                      label={
                        <Box>
                          <Typography variant="subtitle1">{type.name}</Typography>
                          <Typography variant="body2" color="text.secondary">
                            {type.description}
                          </Typography>
                          {type.recommendedModules.length > 0 && (
                            <Box sx={{ mt: 1 }}>
                              {type.recommendedModules.map((moduleId) => (
                                <Chip
                                  key={moduleId}
                                  label={AVAILABLE_MODULES.find((m) => m.id === moduleId)?.name}
                                  size="small"
                                  sx={{ mr: 0.5, mt: 0.5 }}
                                />
                              ))}
                            </Box>
                          )}
                        </Box>
                      }
                    />
                  </CardContent>
                </Card>
              ))}
            </RadioGroup>
          </FormControl>
        </Box>
      ),
    },
    {
      label: 'User Roles',
      content: (
        <Box>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
            Which user roles will your application support?
          </Typography>
          <FormGroup>
            {['patient', 'provider', 'researcher'].map((role) => (
              <FormControlLabel
                key={role}
                control={
                  <Checkbox
                    checked={config.userRoles?.includes(role as any) || false}
                    onChange={() => {
                      const roles = config.userRoles || [];
                      setConfig({
                        ...config,
                        userRoles: roles.includes(role as any)
                          ? roles.filter((r) => r !== role)
                          : [...roles, role as any],
                      });
                    }}
                  />
                }
                label={role.charAt(0).toUpperCase() + role.slice(1)}
              />
            ))}
          </FormGroup>
        </Box>
      ),
    },
    {
      label: 'Features',
      content: (
        <Box>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
            What features do you need?
          </Typography>
          <FormGroup>
            {Object.keys(config.features || {}).map((feature) => (
              <FormControlLabel
                key={feature}
                control={
                  <Checkbox
                    checked={config.features![feature as keyof WizardConfig['features']]}
                    onChange={() => handleFeatureToggle(feature as keyof WizardConfig['features'])}
                  />
                }
                label={
                  feature.charAt(0).toUpperCase() +
                  feature.slice(1).replace(/([A-Z])/g, ' $1')
                }
              />
            ))}
          </FormGroup>
        </Box>
      ),
    },
    {
      label: 'Compliance',
      content: (
        <Box>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
            What compliance standards do you need to meet?
          </Typography>
          <FormGroup>
            <FormControlLabel
              control={
                <Checkbox
                  checked={config.compliance?.hipaa || false}
                  onChange={() =>
                    setConfig({
                      ...config,
                      compliance: {
                        ...config.compliance!,
                        hipaa: !config.compliance?.hipaa,
                      },
                    })
                  }
                />
              }
              label="HIPAA (Healthcare Insurance Portability and Accountability Act)"
            />
            <FormControlLabel
              control={
                <Checkbox
                  checked={config.compliance?.gdpr || false}
                  onChange={() =>
                    setConfig({
                      ...config,
                      compliance: {
                        ...config.compliance!,
                        gdpr: !config.compliance?.gdpr,
                      },
                    })
                  }
                />
              }
              label="GDPR (General Data Protection Regulation)"
            />
            <FormControlLabel
              control={
                <Checkbox
                  checked={config.compliance?.fhir || false}
                  onChange={() =>
                    setConfig({
                      ...config,
                      compliance: {
                        ...config.compliance!,
                        fhir: !config.compliance?.fhir,
                      },
                    })
                  }
                />
              }
              label="FHIR R4 (HL7 Fast Healthcare Interoperability Resources)"
            />
          </FormGroup>
        </Box>
      ),
    },
    {
      label: 'Module Selection',
      content: (
        <Box>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
            Select the Spezi modules to include in your application:
          </Typography>

          {getRecommendedModules().length > 0 && (
            <Alert severity="info" sx={{ mb: 2 }}>
              <Typography variant="body2">
                Based on your selections, we recommend the following modules:
              </Typography>
              <Box sx={{ mt: 1 }}>
                {getRecommendedModules().map((moduleId) => (
                  <Chip
                    key={moduleId}
                    label={AVAILABLE_MODULES.find((m) => m.id === moduleId)?.name}
                    size="small"
                    color="primary"
                    sx={{ mr: 0.5, mt: 0.5 }}
                  />
                ))}
              </Box>
            </Alert>
          )}

          {['core', 'data', 'clinical', 'research', 'communication', 'integration', 'compliance', 'ai', 'tracking'].map(
            (category) => {
              const categoryModules = AVAILABLE_MODULES.filter((m) => m.category === category);
              if (categoryModules.length === 0) return null;

              return (
                <Box key={category} sx={{ mb: 3 }}>
                  <Typography variant="subtitle2" sx={{ mb: 1, textTransform: 'capitalize' }}>
                    {category} Modules
                  </Typography>
                  <FormGroup>
                    {categoryModules.map((module) => {
                      const isEnabled =
                        config.modules?.find((m) => m.id === module.id)?.enabled || false;
                      const isRecommended = getRecommendedModules().includes(module.id);
                      const hasDependencies = module.dependencies && module.dependencies.length > 0;

                      return (
                        <FormControlLabel
                          key={module.id}
                          control={
                            <Checkbox
                              checked={isEnabled}
                              onChange={() => handleModuleToggle(module.id)}
                            />
                          }
                          label={
                            <Box>
                              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                <Typography variant="body1">{module.name}</Typography>
                                {isRecommended && (
                                  <Chip label="Recommended" size="small" color="primary" />
                                )}
                              </Box>
                              <Typography variant="body2" color="text.secondary">
                                {module.description}
                              </Typography>
                              {hasDependencies && (
                                <Typography variant="caption" color="text.secondary">
                                  Requires:{' '}
                                  {module.dependencies
                                    .map(
                                      (dep) => AVAILABLE_MODULES.find((m) => m.id === dep)?.name
                                    )
                                    .join(', ')}
                                </Typography>
                              )}
                            </Box>
                          }
                        />
                      );
                    })}
                  </FormGroup>
                </Box>
              );
            }
          )}
        </Box>
      ),
    },
    {
      label: 'Review',
      content: (
        <Box>
          <Typography variant="h6" sx={{ mb: 2 }}>
            Configuration Summary
          </Typography>

          <List>
            <ListItem>
              <ListItemIcon>
                <InfoIcon color="primary" />
              </ListItemIcon>
              <ListItemText
                primary="Application Type"
                secondary={APP_TYPES.find((t) => t.id === config.appType)?.name}
              />
            </ListItem>

            <ListItem>
              <ListItemIcon>
                <InfoIcon color="primary" />
              </ListItemIcon>
              <ListItemText
                primary="User Roles"
                secondary={config.userRoles?.join(', ') || 'None selected'}
              />
            </ListItem>

            <ListItem>
              <ListItemIcon>
                <CheckCircleIcon color="success" />
              </ListItemIcon>
              <ListItemText
                primary="Enabled Features"
                secondary={
                  Object.entries(config.features || {})
                    .filter(([_, enabled]) => enabled)
                    .map(([feature]) => feature)
                    .join(', ') || 'None'
                }
              />
            </ListItem>

            <ListItem>
              <ListItemIcon>
                <WarningIcon color="warning" />
              </ListItemIcon>
              <ListItemText
                primary="Compliance Requirements"
                secondary={
                  Object.entries(config.compliance || {})
                    .filter(([_, enabled]) => enabled)
                    .map(([standard]) => standard.toUpperCase())
                    .join(', ') || 'None'
                }
              />
            </ListItem>

            <ListItem>
              <ListItemIcon>
                <CheckCircleIcon color="primary" />
              </ListItemIcon>
              <ListItemText
                primary={`Selected Modules (${config.modules?.filter((m) => m.enabled).length || 0})`}
                secondary={
                  <Box sx={{ mt: 1 }}>
                    {config.modules
                      ?.filter((m) => m.enabled)
                      .map((module) => (
                        <Chip
                          key={module.id}
                          label={module.name}
                          size="small"
                          sx={{ mr: 0.5, mt: 0.5 }}
                        />
                      ))}
                  </Box>
                }
              />
            </ListItem>
          </List>

          <Alert severity="success" sx={{ mt: 2 }}>
            Your configuration is ready! Click "Complete" to initialize your Spezi modules.
          </Alert>
        </Box>
      ),
    },
  ];

  return (
    <Box sx={{ maxWidth: 800, mx: 'auto', p: 3 }}>
      <Typography variant="h4" sx={{ mb: 1 }}>
        Spezi Module Configuration
      </Typography>
      <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
        Answer a few questions to configure your healthcare application
      </Typography>

      <Stepper activeStep={activeStep} orientation="vertical">
        {steps.map((step, index) => (
          <Step key={step.label}>
            <StepLabel>{step.label}</StepLabel>
            <StepContent>
              {step.content}
              <Box sx={{ mb: 2, mt: 3 }}>
                <Button
                  variant="contained"
                  onClick={index === steps.length - 1 ? handleComplete : handleNext}
                  sx={{ mt: 1, mr: 1 }}
                >
                  {index === steps.length - 1 ? 'Complete' : 'Continue'}
                </Button>
                <Button disabled={index === 0} onClick={handleBack} sx={{ mt: 1, mr: 1 }}>
                  Back
                </Button>
                {onCancel && (
                  <Button onClick={onCancel} sx={{ mt: 1 }}>
                    Cancel
                  </Button>
                )}
              </Box>
            </StepContent>
          </Step>
        ))}
      </Stepper>
    </Box>
  );
};

export default SpeziConfigWizard;
