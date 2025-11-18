import { jsPDF } from 'jspdf';
import { ConsentDocument } from '@/types';
import firebaseService from './firebase';
import { logger } from '@/utils/logger';
import { auditService } from '@/utils/audit';
import { toFHIRDateTime } from '@/utils/helpers';

class ConsentService {
  // Generate PDF from consent document
  async generateConsentPDF(
    consent: ConsentDocument,
    consentText: string
  ): Promise<Blob> {
    try {
      const doc = new jsPDF();
      const pageWidth = doc.internal.pageSize.getWidth();
      const pageHeight = doc.internal.pageSize.getHeight();
      const margin = 20;
      const maxWidth = pageWidth - 2 * margin;
      let y = margin;

      // Title
      doc.setFontSize(18);
      doc.setFont('helvetica', 'bold');
      doc.text(consent.title, margin, y);
      y += 15;

      // Version and date
      doc.setFontSize(10);
      doc.setFont('helvetica', 'normal');
      doc.text(`Version: ${consent.version}`, margin, y);
      y += 7;
      doc.text(`Date: ${new Date(consent.consentedAt).toLocaleDateString()}`, margin, y);
      y += 15;

      // Consent text
      doc.setFontSize(11);
      const lines = doc.splitTextToSize(consentText, maxWidth);

      for (const line of lines) {
        if (y > pageHeight - margin) {
          doc.addPage();
          y = margin;
        }
        doc.text(line, margin, y);
        y += 7;
      }

      // Add signature section
      y += 20;
      if (y > pageHeight - 80) {
        doc.addPage();
        y = margin;
      }

      // Signature line
      doc.setFont('helvetica', 'bold');
      doc.text('Participant Signature:', margin, y);
      y += 10;

      // Add signature image
      if (consent.signature) {
        try {
          doc.addImage(consent.signature, 'PNG', margin, y, 100, 40);
          y += 45;
        } catch (error) {
          logger.error('Failed to add signature to PDF', error);
          doc.text('[Signature not available]', margin, y);
          y += 10;
        }
      }

      // Signature date
      doc.setFont('helvetica', 'normal');
      doc.text(
        `Signed on: ${new Date(consent.consentedAt).toLocaleString()}`,
        margin,
        y
      );
      y += 10;

      // User ID (de-identified)
      doc.text(`Participant ID: ${consent.userId.substring(0, 8)}...`, margin, y);
      y += 10;

      // IP Address (if available)
      if (consent.ipAddress) {
        doc.text(`IP Address: ${consent.ipAddress}`, margin, y);
        y += 10;
      }

      // Document ID
      doc.setFontSize(8);
      doc.setTextColor(128, 128, 128);
      doc.text(
        `Document ID: ${consent.id}`,
        margin,
        pageHeight - 10
      );

      return doc.output('blob');
    } catch (error) {
      logger.error('Failed to generate consent PDF', error);
      throw error;
    }
  }

  // Save consent document and PDF to Firebase
  async saveConsent(
    userId: string,
    consentText: string,
    signature: string,
    version: string = '1.0'
  ): Promise<ConsentDocument> {
    try {
      const consentDocument: ConsentDocument = {
        id: `consent_${Date.now()}`,
        userId,
        version,
        title: 'Informed Consent for Research Participation',
        content: consentText,
        consentedAt: new Date(),
        signature,
        ipAddress: await this.getClientIP(),
        userAgent: navigator.userAgent,
      };

      // Generate PDF
      const pdfBlob = await this.generateConsentPDF(consentDocument, consentText);

      // Upload PDF to Firebase Storage
      const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
      const path = `users/${userId}/consent/${timestamp}.pdf`;
      const pdfURL = await firebaseService.uploadFile(path, pdfBlob, {
        contentType: 'application/pdf',
      });

      consentDocument.pdfURL = pdfURL;

      // Save consent document to Firestore
      await firebaseService.setDocument(
        `users/${userId}`,
        'consent',
        consentDocument
      );

      // Audit log
      await auditService.logConsent(userId, consentDocument.id, {
        version,
        timestamp: consentDocument.consentedAt,
      });

      logger.info('Consent saved successfully', { userId, consentId: consentDocument.id });

      return consentDocument;
    } catch (error) {
      logger.error('Failed to save consent', error);
      throw error;
    }
  }

  // Retrieve consent document
  async getConsent(userId: string): Promise<ConsentDocument | null> {
    try {
      const consent = await firebaseService.getDocument<ConsentDocument>(
        `users/${userId}`,
        'consent'
      );

      if (consent) {
        await auditService.logDataAccess(userId, 'consent', consent.id);
      }

      return consent;
    } catch (error) {
      logger.error('Failed to retrieve consent', error);
      return null;
    }
  }

  // Check if user has consented
  async hasConsented(userId: string): Promise<boolean> {
    const consent = await this.getConsent(userId);
    return consent !== null;
  }

  // Get client IP (this would typically come from server)
  private async getClientIP(): Promise<string | undefined> {
    try {
      // In a real application, get this from your backend
      // Client-side IP detection is not reliable
      const response = await fetch('https://api.ipify.org?format=json');
      const data = await response.json();
      return data.ip;
    } catch {
      return undefined;
    }
  }

  // Revoke consent
  async revokeConsent(userId: string): Promise<void> {
    try {
      const consent = await this.getConsent(userId);

      if (consent) {
        // Delete from Firestore
        await firebaseService.deleteDocument(`users/${userId}`, 'consent');

        // Delete PDF from Storage
        if (consent.pdfURL) {
          const path = `users/${userId}/consent/${consent.id}.pdf`;
          await firebaseService.deleteFile(path);
        }

        // Audit log
        await auditService.log(
          userId,
          'delete',
          'consent',
          consent.id,
          { reason: 'User revoked consent' }
        );

        logger.info('Consent revoked', { userId, consentId: consent.id });
      }
    } catch (error) {
      logger.error('Failed to revoke consent', error);
      throw error;
    }
  }
}

export const consentService = new ConsentService();
export default consentService;
