import { useState } from 'react';
import {
  Box,
  Typography,
  Radio,
  RadioGroup,
  FormControlLabel,
  FormControl,
  FormLabel,
  TextField,
  Button,
  Paper,
  Alert,
  CircularProgress,
} from '@mui/material';
import { FHIRQuestionnaire, QuestionnaireItem } from '@/types/fhir';

interface QuestionnaireRendererProps {
  questionnaire: FHIRQuestionnaire;
  onSubmit: (answers: Record<string, any>) => Promise<void>;
  onCancel?: () => void;
  initialAnswers?: Record<string, any>;
}

export default function QuestionnaireRenderer({
  questionnaire,
  onSubmit,
  onCancel,
  initialAnswers = {},
}: QuestionnaireRendererProps): JSX.Element {
  const [answers, setAnswers] = useState<Record<string, any>>(initialAnswers);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string>('');

  const handleAnswerChange = (linkId: string, value: any): void => {
    setAnswers((prev) => ({
      ...prev,
      [linkId]: value,
    }));
    // Clear error for this question
    setErrors((prev) => {
      const newErrors = { ...prev };
      delete newErrors[linkId];
      return newErrors;
    });
  };

  const validateRequired = (): boolean => {
    const newErrors: Record<string, string> = {};
    let isValid = true;

    questionnaire.item?.forEach((item) => {
      if (item.required && !answers[item.linkId]) {
        newErrors[item.linkId] = 'This question is required';
        isValid = false;
      }
    });

    setErrors(newErrors);
    return isValid;
  };

  const handleSubmit = async (): Promise<void> => {
    if (!validateRequired()) {
      setSubmitError('Please answer all required questions');
      return;
    }

    setSubmitting(true);
    setSubmitError('');

    try {
      await onSubmit(answers);
    } catch (error: any) {
      setSubmitError(error.message || 'Failed to submit questionnaire');
    } finally {
      setSubmitting(false);
    }
  };

  const renderQuestion = (item: QuestionnaireItem): JSX.Element => {
    const error = errors[item.linkId];

    // Check if question should be shown based on enableWhen
    if (item.enableWhen && item.enableWhen.length > 0) {
      const shouldShow = item.enableWhen.some((condition) => {
        const answer = answers[condition.question];
        if (condition.answerCoding) {
          return answer?.code === condition.answerCoding.code;
        }
        return false;
      });

      if (!shouldShow) {
        return <Box key={item.linkId} />;
      }
    }

    switch (item.type) {
      case 'choice':
        return (
          <FormControl key={item.linkId} component="fieldset" fullWidth sx={{ mb: 3 }} error={!!error}>
            <FormLabel component="legend">
              {item.text}
              {item.required && <span style={{ color: 'red' }}> *</span>}
            </FormLabel>
            <RadioGroup
              value={answers[item.linkId]?.code || ''}
              onChange={(e) => {
                const selectedOption = item.answerOption?.find(
                  (opt) => opt.valueCoding?.code === e.target.value
                );
                if (selectedOption?.valueCoding) {
                  handleAnswerChange(item.linkId, selectedOption.valueCoding);
                }
              }}
            >
              {item.answerOption?.map((option) => (
                <FormControlLabel
                  key={option.valueCoding?.code || option.valueCoding?.display}
                  value={option.valueCoding?.code || ''}
                  control={<Radio />}
                  label={option.valueCoding?.display || ''}
                />
              ))}
            </RadioGroup>
            {error && (
              <Typography variant="caption" color="error" sx={{ mt: 1 }}>
                {error}
              </Typography>
            )}
          </FormControl>
        );

      case 'string':
      case 'text':
        return (
          <TextField
            key={item.linkId}
            fullWidth
            label={item.text}
            value={answers[item.linkId] || ''}
            onChange={(e) => handleAnswerChange(item.linkId, e.target.value)}
            required={item.required}
            multiline={item.type === 'text'}
            rows={item.type === 'text' ? 4 : 1}
            error={!!error}
            helperText={error}
            sx={{ mb: 3 }}
            inputProps={{
              maxLength: item.maxLength,
            }}
          />
        );

      case 'integer':
        return (
          <TextField
            key={item.linkId}
            fullWidth
            type="number"
            label={item.text}
            value={answers[item.linkId] || ''}
            onChange={(e) => handleAnswerChange(item.linkId, parseInt(e.target.value, 10))}
            required={item.required}
            error={!!error}
            helperText={error}
            sx={{ mb: 3 }}
            inputProps={{
              // min/max would come from FHIR extensions if available
            }}
          />
        );

      case 'display':
        return (
          <Box key={item.linkId} sx={{ mb: 3 }}>
            <Typography variant="body1" color="primary" fontWeight="bold">
              {item.text}
            </Typography>
          </Box>
        );

      default:
        return (
          <Box key={item.linkId} sx={{ mb: 3 }}>
            <Typography variant="body2" color="text.secondary">
              Question type "{item.type}" not yet implemented
            </Typography>
          </Box>
        );
    }
  };

  return (
    <Paper sx={{ p: 4 }}>
      <Typography variant="h5" gutterBottom fontWeight="bold">
        {questionnaire.title}
      </Typography>

      {questionnaire.description && (
        <Typography variant="body2" color="text.secondary" paragraph>
          {questionnaire.description}
        </Typography>
      )}

      <Box sx={{ mt: 4 }}>
        {questionnaire.item?.map((item) => renderQuestion(item))}
      </Box>

      {submitError && (
        <Alert severity="error" sx={{ mb: 3 }}>
          {submitError}
        </Alert>
      )}

      <Box sx={{ display: 'flex', gap: 2, justifyContent: 'flex-end', mt: 4 }}>
        {onCancel && (
          <Button onClick={onCancel} disabled={submitting}>
            Cancel
          </Button>
        )}
        <Button
          onClick={handleSubmit}
          variant="contained"
          disabled={submitting}
        >
          {submitting ? <CircularProgress size={24} /> : 'Submit'}
        </Button>
      </Box>
    </Paper>
  );
}
