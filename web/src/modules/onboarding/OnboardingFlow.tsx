import { useState } from 'react';
import { Box, Stepper, Step, StepLabel, Container } from '@mui/material';
import { useAuth } from '@/hooks/useAuth';
import { useNavigate } from 'react-router-dom';
import Welcome from './Welcome';
import InterestingModules from './InterestingModules';
import ConsentStep from './ConsentStep';
import AccountSetup from './AccountSetup';
import PermissionsStep from './PermissionsStep';

const steps = [
  'Welcome',
  'Interesting Modules',
  'Consent',
  'Account Setup',
  'Permissions',
];

export default function OnboardingFlow(): JSX.Element {
  const [activeStep, setActiveStep] = useState(0);
  const { updateUser } = useAuth();
  const navigate = useNavigate();

  const handleNext = (): void => {
    if (activeStep === steps.length - 1) {
      // Onboarding complete
      navigate('/');
    } else {
      setActiveStep((prev) => prev + 1);
    }
  };

  const handleBack = (): void => {
    setActiveStep((prev) => prev - 1);
  };

  const handleComplete = async (): Promise<void> => {
    // Mark onboarding as complete
    await updateUser({
      updatedAt: new Date(),
    });
    navigate('/');
  };

  const renderStep = (): JSX.Element => {
    switch (activeStep) {
      case 0:
        return <Welcome onNext={handleNext} />;
      case 1:
        return <InterestingModules onNext={handleNext} onBack={handleBack} />;
      case 2:
        return <ConsentStep onNext={handleNext} onBack={handleBack} />;
      case 3:
        return <AccountSetup onNext={handleNext} onBack={handleBack} />;
      case 4:
        return <PermissionsStep onNext={handleComplete} onBack={handleBack} />;
      default:
        return <Welcome onNext={handleNext} />;
    }
  };

  return (
    <Box sx={{ minHeight: '100vh', py: 4, backgroundColor: 'background.default' }}>
      <Container maxWidth="md">
        <Stepper activeStep={activeStep} sx={{ mb: 4 }}>
          {steps.map((label) => (
            <Step key={label}>
              <StepLabel>{label}</StepLabel>
            </Step>
          ))}
        </Stepper>
        {renderStep()}
      </Container>
    </Box>
  );
}
