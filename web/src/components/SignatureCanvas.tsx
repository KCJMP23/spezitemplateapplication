import { useRef, useEffect } from 'react';
import { Box, Button, Paper } from '@mui/material';
import SignaturePad from 'react-signature-canvas';

interface SignatureCanvasProps {
  onSave: (signature: string) => void;
  value?: string;
}

export default function SignatureCanvas({ onSave, value }: SignatureCanvasProps): JSX.Element {
  const sigPadRef = useRef<SignaturePad>(null);

  useEffect(() => {
    if (value && sigPadRef.current) {
      sigPadRef.current.fromDataURL(value);
    }
  }, [value]);

  const handleClear = (): void => {
    sigPadRef.current?.clear();
  };

  const handleSave = (): void => {
    if (sigPadRef.current) {
      const dataURL = sigPadRef.current.toDataURL();
      onSave(dataURL);
    }
  };

  return (
    <Box>
      <Paper
        variant="outlined"
        sx={{
          width: '100%',
          height: 200,
          mb: 2,
          backgroundColor: '#fafafa',
          borderRadius: 1,
          overflow: 'hidden',
        }}
      >
        <SignaturePad
          ref={sigPadRef}
          canvasProps={{
            style: {
              width: '100%',
              height: '100%',
            },
          }}
          backgroundColor="#fafafa"
        />
      </Paper>

      <Box sx={{ display: 'flex', gap: 2 }}>
        <Button onClick={handleClear} variant="outlined" size="small">
          Clear
        </Button>
        <Button onClick={handleSave} variant="contained" size="small">
          Save Signature
        </Button>
      </Box>
    </Box>
  );
}
