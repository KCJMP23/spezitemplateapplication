import { Contact } from '@/types';
import firebaseService from './firebase';
import { logger } from '@/utils/logger';

// Default contacts for the application
const DEFAULT_CONTACTS: Contact[] = [
  {
    id: 'stanford-spezi',
    name: 'Stanford Spezi Team',
    title: 'Research Coordinators',
    organization: 'Stanford University',
    description: 'Contact the Spezi research team for questions about the study or technical support.',
    address: {
      line1: 'Stanford University',
      line2: 'Department of Biomedical Data Science',
      city: 'Stanford',
      state: 'CA',
      postalCode: '94305',
      country: 'USA',
    },
    phone: [
      {
        system: 'phone',
        value: '(650) 723-2300',
        use: 'work',
      },
    ],
    email: [
      {
        system: 'email',
        value: 'spezi-support@stanford.edu',
        use: 'work',
      },
    ],
    website: 'https://spezi.stanford.edu',
  },
  {
    id: 'study-coordinator',
    name: 'Dr. Sarah Johnson',
    title: 'Principal Investigator',
    organization: 'Stanford Medical Center',
    description: 'Principal investigator for the digital health research study.',
    phone: [
      {
        system: 'phone',
        value: '(650) 723-5000',
        use: 'work',
      },
    ],
    email: [
      {
        system: 'email',
        value: 'sarah.johnson@stanford.edu',
        use: 'work',
      },
    ],
  },
  {
    id: 'technical-support',
    name: 'Technical Support',
    organization: 'Spezi Health',
    description: 'For technical issues with the application, data sync, or account problems.',
    phone: [
      {
        system: 'phone',
        value: '1-800-SPEZI-HELP',
        use: 'work',
      },
    ],
    email: [
      {
        system: 'email',
        value: 'support@spezihealth.com',
        use: 'work',
      },
    ],
    website: 'https://support.spezihealth.com',
  },
  {
    id: 'emergency',
    name: 'Emergency Services',
    organization: 'Emergency Medical Services',
    description: 'For medical emergencies, please call 911 immediately.',
    phone: [
      {
        system: 'phone',
        value: '911',
        use: 'home',
      },
    ],
  },
];

class ContactService {
  // Get all contacts
  async getContacts(): Promise<Contact[]> {
    try {
      // In a production app, this might load from Firestore
      // For now, return default contacts
      return DEFAULT_CONTACTS;
    } catch (error) {
      logger.error('Failed to get contacts', error);
      return DEFAULT_CONTACTS;
    }
  }

  // Get contact by ID
  async getContact(id: string): Promise<Contact | null> {
    try {
      const contacts = await this.getContacts();
      return contacts.find((c) => c.id === id) || null;
    } catch (error) {
      logger.error('Failed to get contact', error);
      return null;
    }
  }

  // Add custom contact (for admins)
  async addContact(contact: Contact): Promise<Contact> {
    try {
      await firebaseService.setDocument('contacts', contact.id, contact);
      logger.info('Contact added', { contactId: contact.id });
      return contact;
    } catch (error) {
      logger.error('Failed to add contact', error);
      throw error;
    }
  }

  // Update contact
  async updateContact(id: string, updates: Partial<Contact>): Promise<void> {
    try {
      await firebaseService.updateDocument('contacts', id, updates);
      logger.info('Contact updated', { contactId: id });
    } catch (error) {
      logger.error('Failed to update contact', error);
      throw error;
    }
  }

  // Delete contact
  async deleteContact(id: string): Promise<void> {
    try {
      await firebaseService.deleteDocument('contacts', id);
      logger.info('Contact deleted', { contactId: id });
    } catch (error) {
      logger.error('Failed to delete contact', error);
      throw error;
    }
  }

  // Format phone number for display
  formatPhoneNumber(phone: string): string {
    // Simple formatting - could be enhanced
    const cleaned = phone.replace(/\D/g, '');
    if (cleaned.length === 10) {
      return `(${cleaned.slice(0, 3)}) ${cleaned.slice(3, 6)}-${cleaned.slice(6)}`;
    }
    return phone;
  }

  // Format address for display
  formatAddress(address: Contact['address']): string {
    if (!address) return '';

    const parts = [
      address.line1,
      address.line2,
      `${address.city}, ${address.state} ${address.postalCode}`,
      address.country,
    ].filter(Boolean);

    return parts.join('\n');
  }
}

export const contactService = new ContactService();
export default contactService;
