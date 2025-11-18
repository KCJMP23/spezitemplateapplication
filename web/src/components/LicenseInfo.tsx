/**
 * SpeziLicense React Migration
 *
 * Migrates iOS SpeziLicense functionality to React/Web:
 * - License information display
 * - Open source attribution
 * - Contributor list
 * - Repository links
 */

import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Typography,
  Box,
  Link,
  Divider,
  List,
  ListItem,
  ListItemText,
  Chip,
} from '@mui/material';
import { Code, GitHub, Description } from '@mui/icons-material';

interface LicenseInfoProps {
  open: boolean;
  onClose: () => void;
}

interface Repository {
  name: string;
  url: string;
  license: string;
  description?: string;
}

const PRIMARY_REPOSITORY: Repository = {
  name: 'Spezi Template Application',
  url: 'https://github.com/StanfordSpezi/SpeziTemplateApplication',
  license: 'MIT',
  description: 'A template application built using the Stanford Spezi framework',
};

const DEPENDENCIES: Repository[] = [
  {
    name: 'Spezi',
    url: 'https://github.com/StanfordSpezi/Spezi',
    license: 'MIT',
    description: 'Stanford Spezi - Open-source framework for healthcare applications',
  },
  {
    name: 'React',
    url: 'https://github.com/facebook/react',
    license: 'MIT',
    description: 'A JavaScript library for building user interfaces',
  },
  {
    name: 'Material-UI',
    url: 'https://github.com/mui/material-ui',
    license: 'MIT',
    description: 'React components for faster and easier web development',
  },
  {
    name: 'Firebase',
    url: 'https://github.com/firebase/firebase-js-sdk',
    license: 'Apache-2.0',
    description: 'Firebase JavaScript SDK for web applications',
  },
  {
    name: 'Capacitor',
    url: 'https://github.com/ionic-team/capacitor',
    license: 'MIT',
    description: 'Build cross-platform Native Progressive Web Apps',
  },
  {
    name: 'LocalForage',
    url: 'https://github.com/localForage/localForage',
    license: 'Apache-2.0',
    description: 'Offline storage library for JavaScript',
  },
  {
    name: 'FHIR.js',
    url: 'https://github.com/FHIR/fhir.js',
    license: 'MIT',
    description: 'FHIR client library for JavaScript',
  },
];

const MIT_LICENSE_TEXT = `MIT License

Copyright (c) 2023 Stanford University

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
SOFTWARE.`;

export default function LicenseInfo({ open, onClose }: LicenseInfoProps): JSX.Element {
  return (
    <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth scroll="paper">
      <DialogTitle>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <Description />
          <Typography variant="h6">License & Acknowledgements</Typography>
        </Box>
      </DialogTitle>

      <DialogContent dividers>
        {/* Primary Project */}
        <Box sx={{ mb: 4 }}>
          <Typography variant="h6" gutterBottom>
            Project
          </Typography>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
            <Code />
            <Link
              href={PRIMARY_REPOSITORY.url}
              target="_blank"
              rel="noopener noreferrer"
              variant="body1"
              sx={{ fontWeight: 600 }}
            >
              {PRIMARY_REPOSITORY.name}
            </Link>
            <Chip label={PRIMARY_REPOSITORY.license} size="small" color="primary" />
          </Box>
          {PRIMARY_REPOSITORY.description && (
            <Typography variant="body2" color="text.secondary" paragraph>
              {PRIMARY_REPOSITORY.description}
            </Typography>
          )}
        </Box>

        <Divider sx={{ my: 3 }} />

        {/* Open Source Dependencies */}
        <Box sx={{ mb: 4 }}>
          <Typography variant="h6" gutterBottom>
            Open Source Dependencies
          </Typography>
          <Typography variant="body2" color="text.secondary" paragraph>
            This application is built on top of the following open-source projects:
          </Typography>

          <List>
            {DEPENDENCIES.map((dep) => (
              <ListItem
                key={dep.name}
                sx={{
                  flexDirection: 'column',
                  alignItems: 'flex-start',
                  borderBottom: '1px solid',
                  borderColor: 'divider',
                  '&:last-child': { borderBottom: 'none' },
                }}
              >
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 0.5 }}>
                  <GitHub sx={{ fontSize: 20 }} />
                  <Link
                    href={dep.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    variant="body1"
                    sx={{ fontWeight: 500 }}
                  >
                    {dep.name}
                  </Link>
                  <Chip label={dep.license} size="small" variant="outlined" />
                </Box>
                {dep.description && (
                  <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
                    {dep.description}
                  </Typography>
                )}
              </ListItem>
            ))}
          </List>
        </Box>

        <Divider sx={{ my: 3 }} />

        {/* MIT License Text */}
        <Box>
          <Typography variant="h6" gutterBottom>
            MIT License
          </Typography>
          <Box
            sx={{
              backgroundColor: 'grey.100',
              p: 2,
              borderRadius: 1,
              fontFamily: 'monospace',
              fontSize: '0.875rem',
              maxHeight: 300,
              overflow: 'auto',
            }}
          >
            <pre style={{ margin: 0, whiteSpace: 'pre-wrap' }}>{MIT_LICENSE_TEXT}</pre>
          </Box>
        </Box>

        <Divider sx={{ my: 3 }} />

        {/* Acknowledgements */}
        <Box>
          <Typography variant="h6" gutterBottom>
            Acknowledgements
          </Typography>
          <Typography variant="body2" color="text.secondary" paragraph>
            This application was developed using the Stanford Spezi framework, created by the
            Stanford Biodesign Digital Health group. Special thanks to the open-source community
            for their contributions to the libraries and tools that make this application possible.
          </Typography>
          <Typography variant="body2" color="text.secondary">
            For questions or contributions, please visit our{' '}
            <Link
              href={PRIMARY_REPOSITORY.url}
              target="_blank"
              rel="noopener noreferrer"
            >
              GitHub repository
            </Link>
            .
          </Typography>
        </Box>
      </DialogContent>

      <DialogActions>
        <Button onClick={onClose}>Close</Button>
        <Button
          variant="contained"
          startIcon={<GitHub />}
          onClick={() => window.open(PRIMARY_REPOSITORY.url, '_blank')}
        >
          View on GitHub
        </Button>
      </DialogActions>
    </Dialog>
  );
}
