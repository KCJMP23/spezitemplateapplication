import { useState, useEffect } from 'react';
import {
  Container,
  Typography,
  Box,
  Card,
  CardContent,
  Grid,
  IconButton,
  Chip,
  Alert,
  CircularProgress,
  Button,
} from '@mui/material';
import {
  Phone,
  Email,
  Language,
  LocationOn,
  Person,
  LocalHospital,
} from '@mui/icons-material';
import { Contact } from '@/types';
import contactService from '@/services/contact';

export default function ContactsView(): JSX.Element {
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string>('');

  useEffect(() => {
    loadContacts();
  }, []);

  const loadContacts = async (): Promise<void> => {
    setLoading(true);
    setError('');

    try {
      const data = await contactService.getContacts();
      setContacts(data);
    } catch (err: any) {
      setError(err.message || 'Failed to load contacts');
    } finally {
      setLoading(false);
    }
  };

  const handleCall = (phoneNumber: string): void => {
    window.location.href = `tel:${phoneNumber.replace(/\D/g, '')}`;
  };

  const handleEmail = (email: string): void => {
    window.location.href = `mailto:${email}`;
  };

  const handleWebsite = (url: string): void => {
    window.open(url, '_blank', 'noopener,noreferrer');
  };

  const handleDirections = (address: Contact['address']): void => {
    if (!address) return;
    const query = encodeURIComponent(
      `${address.line1}, ${address.city}, ${address.state} ${address.postalCode}`
    );
    window.open(`https://www.google.com/maps/search/?api=1&query=${query}`, '_blank');
  };

  if (loading) {
    return (
      <Container maxWidth="lg" sx={{ py: 4, textAlign: 'center' }}>
        <CircularProgress />
      </Container>
    );
  }

  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
      <Typography variant="h4" gutterBottom>
        Contacts
      </Typography>

      <Typography variant="body2" color="text.secondary" paragraph>
        Get in touch with study coordinators, technical support, and emergency services
      </Typography>

      {error && (
        <Alert severity="error" sx={{ mb: 3 }} onClose={() => setError('')}>
          {error}
        </Alert>
      )}

      <Grid container spacing={3}>
        {contacts.map((contact) => (
          <Grid item xs={12} md={6} key={contact.id}>
            <Card>
              <CardContent>
                {/* Header */}
                <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 2, mb: 2 }}>
                  <Box
                    sx={{
                      width: 48,
                      height: 48,
                      borderRadius: '50%',
                      backgroundColor: 'primary.main',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      color: 'white',
                    }}
                  >
                    {contact.id === 'emergency' ? (
                      <LocalHospital />
                    ) : (
                      <Person />
                    )}
                  </Box>
                  <Box sx={{ flex: 1 }}>
                    <Typography variant="h6" gutterBottom>
                      {contact.name}
                    </Typography>
                    {contact.title && (
                      <Typography variant="body2" color="text.secondary">
                        {contact.title}
                      </Typography>
                    )}
                    <Chip
                      label={contact.organization}
                      size="small"
                      sx={{ mt: 1 }}
                    />
                  </Box>
                </Box>

                {/* Description */}
                {contact.description && (
                  <Typography variant="body2" color="text.secondary" paragraph>
                    {contact.description}
                  </Typography>
                )}

                {/* Contact Methods */}
                <Box sx={{ mt: 2 }}>
                  {/* Phone Numbers */}
                  {contact.phone && contact.phone.length > 0 && (
                    <Box sx={{ mb: 1 }}>
                      {contact.phone.map((phone, index) => (
                        <Box
                          key={index}
                          sx={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: 1,
                            mb: 1,
                          }}
                        >
                          <IconButton
                            size="small"
                            color="primary"
                            onClick={() => handleCall(phone.value)}
                          >
                            <Phone />
                          </IconButton>
                          <Typography variant="body2">
                            {contactService.formatPhoneNumber(phone.value)}
                            {phone.use && (
                              <Chip
                                label={phone.use}
                                size="small"
                                sx={{ ml: 1, height: 20 }}
                              />
                            )}
                          </Typography>
                        </Box>
                      ))}
                    </Box>
                  )}

                  {/* Email Addresses */}
                  {contact.email && contact.email.length > 0 && (
                    <Box sx={{ mb: 1 }}>
                      {contact.email.map((email, index) => (
                        <Box
                          key={index}
                          sx={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: 1,
                            mb: 1,
                          }}
                        >
                          <IconButton
                            size="small"
                            color="primary"
                            onClick={() => handleEmail(email.value)}
                          >
                            <Email />
                          </IconButton>
                          <Typography variant="body2">
                            {email.value}
                            {email.use && (
                              <Chip
                                label={email.use}
                                size="small"
                                sx={{ ml: 1, height: 20 }}
                              />
                            )}
                          </Typography>
                        </Box>
                      ))}
                    </Box>
                  )}

                  {/* Website */}
                  {contact.website && (
                    <Box sx={{ mb: 1 }}>
                      <Box
                        sx={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: 1,
                        }}
                      >
                        <IconButton
                          size="small"
                          color="primary"
                          onClick={() => handleWebsite(contact.website!)}
                        >
                          <Language />
                        </IconButton>
                        <Typography variant="body2">
                          {contact.website.replace(/^https?:\/\//, '')}
                        </Typography>
                      </Box>
                    </Box>
                  )}

                  {/* Address */}
                  {contact.address && (
                    <Box sx={{ mt: 2 }}>
                      <Box
                        sx={{
                          display: 'flex',
                          alignItems: 'flex-start',
                          gap: 1,
                        }}
                      >
                        <IconButton
                          size="small"
                          color="primary"
                          onClick={() => handleDirections(contact.address)}
                        >
                          <LocationOn />
                        </IconButton>
                        <Typography variant="body2" sx={{ whiteSpace: 'pre-line' }}>
                          {contactService.formatAddress(contact.address)}
                        </Typography>
                      </Box>
                      <Button
                        size="small"
                        variant="outlined"
                        startIcon={<LocationOn />}
                        onClick={() => handleDirections(contact.address)}
                        sx={{ ml: 5, mt: 1 }}
                      >
                        Get Directions
                      </Button>
                    </Box>
                  )}
                </Box>
              </CardContent>
            </Card>
          </Grid>
        ))}
      </Grid>

      {/* Emergency Notice */}
      <Alert severity="warning" sx={{ mt: 4 }}>
        <Typography variant="body2">
          <strong>Important:</strong> This app is not for medical emergencies.
          If you're experiencing a medical emergency, call 911 immediately or go to
          your nearest emergency room.
        </Typography>
      </Alert>
    </Container>
  );
}
