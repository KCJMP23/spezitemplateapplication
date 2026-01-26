import { useState } from 'react';
import {
  Card,
  CardContent,
  Typography,
  Button,
  Box,
  Checkbox,
  FormControlLabel,
  Paper,
  Alert,
  CircularProgress,
} from '@mui/material';
import { useAuth } from '@/hooks/useAuth';
import SignatureCanvas from '@/components/SignatureCanvas';
import consentService from '@/services/consent';
import { logger } from '@/utils/logger';

interface ConsentStepProps {
  onNext: () => void;
  onBack: () => void;
}

const CONSENT_TEXT = `# Informed Consent for Research Participation

## Study Title: Digital Health Research Platform

### Purpose of the Study
You are invited to participate in a research study using the Spezi Health platform. The purpose of this study is to collect and analyze health data to advance medical research and improve healthcare outcomes.

### Procedures
If you agree to participate, you will be asked to:
- Complete questionnaires about your health and well-being
- Allow collection of health data from wearable devices (optional)
- Participate in follow-up assessments as scheduled

### Duration
Your participation in this study is expected to last for the duration specified by your research coordinator, typically 6-12 months.

### Risks and Discomforts
The risks associated with this study are minimal. You may experience:
- Mild discomfort when answering personal health questions
- Time commitment for completing questionnaires and assessments
- Potential technical issues with the application

### Benefits
While you may not directly benefit from participation, your contribution will help advance medical research and may benefit others in the future.

### Confidentiality
All information collected will be kept strictly confidential. Your data will be:
- Encrypted and stored securely in HIPAA-compliant systems
- Accessible only to authorized research personnel
- De-identified when used for research analysis
- Protected in accordance with applicable privacy laws

### Voluntary Participation
Your participation is completely voluntary. You may:
- Refuse to participate without penalty
- Withdraw from the study at any time
- Skip any questions you don't wish to answer

### Contact Information
If you have questions about this study, please contact your research coordinator.

### Data Rights
You have the right to:
- Access your data at any time
- Request corrections to your data
- Request deletion of your data
- Export your data in a standard format

### Consent
By signing below, you acknowledge that:
- You have read and understood this consent form
- You have had the opportunity to ask questions
- You voluntarily agree to participate in this study
- You are at least 18 years of age

---

**Please review this consent form carefully. If you agree to participate, please check the box below and provide your signature.**
`;

export default function ConsentStep({ onNext, onBack }: ConsentStepProps): JSX.Element {
  const { user, updateUser } = useAuth();
  const [agreed, setAgreed] = useState(false);
  const [signature, setSignature] = useState<string>('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string>('');

  const handleSignature = (sig: string): void => {
    setSignature(sig);
    setError('');
  };

  const handleSubmit = async (): Promise<void> => {
    if (!agreed) {
      setError('Please check the box to agree to the consent form');
      return;
    }

    if (!signature) {
      setError('Please provide your signature');
      return;
    }

    if (!user) {
      setError('User not authenticated');
      return;
    }

    setLoading(true);
    setError('');

    try {
      // Save consent
      const consent = await consentService.saveConsent(
        user.id,
        CONSENT_TEXT,
        signature,
        '1.0'
      );

      // Update user profile
      await updateUser({
        consentedAt: consent.consentedAt,
        consentVersion: consent.version,
      });

      logger.info('Consent completed successfully');
      onNext();
    } catch (err: any) {
      logger.error('Failed to save consent', err);
      setError(err.message || 'Failed to save consent. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card>
      <CardContent sx={{ p: 4 }}>
        <Typography variant="h4" gutterBottom fontWeight="bold" textAlign="center">
          Informed Consent
        </Typography>

        <Typography variant="body2" color="text.secondary" paragraph textAlign="center" sx={{ mb: 4 }}>
          Please read the consent form carefully before proceeding
        </Typography>

        <Paper
          variant="outlined"
          sx={{
            p: 3,
            mb: 3,
            maxHeight: 400,
            overflow: 'auto',
            backgroundColor: '#fafafa',
          }}
        >
          <Typography
            variant="body2"
            component="div"
            sx={{
              whiteSpace: 'pre-wrap',
              lineHeight: 1.8,
              '& h1': { fontSize: '1.5rem', fontWeight: 'bold', mt: 2, mb: 1 },
              '& h2': { fontSize: '1.25rem', fontWeight: 'bold', mt: 2, mb: 1 },
              '& h3': { fontSize: '1.1rem', fontWeight: 'bold', mt: 1.5, mb: 0.5 },
            }}
          >
            {CONSENT_TEXT.split('\n').map((line, index) => {
              if (line.startsWith('# ')) {
                return <h1 key={index}>{line.substring(2)}</h1>;
              } else if (line.startsWith('## ')) {
                return <h2 key={index}>{line.substring(3)}</h2>;
              } else if (line.startsWith('### ')) {
                return <h3 key={index}>{line.substring(4)}</h3>;
              } else if (line.startsWith('**')) {
                return (
                  <Typography key={index} variant="body2" fontWeight="bold" paragraph>
                    {line.replace(/\*\*/g, '')}
                  </Typography>
                );
              } else if (line.trim()) {
                return (
                  <Typography key={index} variant="body2" paragraph>
                    {line}
                  </Typography>
                );
              }
              return null;
            })}
          </Typography>
        </Paper>

        <FormControlLabel
          control={
            <Checkbox
              checked={agreed}
              onChange={(e) => setAgreed(e.target.checked)}
            />
          }
          label={
            <Typography variant="body2">
              I have read and understood the informed consent form and agree to participate in this research study
            </Typography>
          }
          sx={{ mb: 3 }}
        />

        <Box sx={{ mb: 3 }}>
          <Typography variant="subtitle2" gutterBottom fontWeight="bold">
            Please sign below:
          </Typography>
          <SignatureCanvas onSave={handleSignature} value={signature} />
        </Box>

        {error && (
          <Alert severity="error" sx={{ mb: 3 }}>
            {error}
          </Alert>
        )}

        <Box sx={{ display: 'flex', gap: 2, justifyContent: 'center' }}>
          <Button onClick={onBack} variant="outlined" disabled={loading}>
            Back
          </Button>
          <Button
            onClick={handleSubmit}
            variant="contained"
            disabled={loading || !agreed || !signature}
          >
            {loading ? <CircularProgress size={24} /> : 'I Agree & Continue'}
          </Button>
        </Box>
      </CardContent>
    </Card>
  );
}
