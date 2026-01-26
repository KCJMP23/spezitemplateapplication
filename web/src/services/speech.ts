/**
 * INTELLIC Speech Module
 *
 * Speech recognition and synthesis:
 * - Speech-to-text
 * - Text-to-speech
 * - Voice commands
 * - Medical terminology support
 */

import { logger } from '@/utils/logger';
import { globalEventBus } from './intellicKit';

export interface SpeechRecognitionResult {
  transcript: string;
  confidence: number;
  isFinal: boolean;
  alternatives?: Array<{ transcript: string; confidence: number }>;
}

export interface SpeechSynthesisOptions {
  voice?: SpeechSynthesisVoice;
  rate?: number;
  pitch?: number;
  volume?: number;
  lang?: string;
}

export class SpeechRecognitionService {
  private recognition: any = null;
  private isListening: boolean = false;
  private continuous: boolean = false;

  constructor() {
    if ('webkitSpeechRecognition' in window) {
      this.recognition = new (window as any).webkitSpeechRecognition();
    } else if ('SpeechRecognition' in window) {
      this.recognition = new (window as any).SpeechRecognition();
    }

    if (this.recognition) {
      this.setupRecognition();
    }
  }

  private setupRecognition(): void {
    this.recognition.continuous = false;
    this.recognition.interimResults = true;
    this.recognition.maxAlternatives = 3;

    this.recognition.onresult = (event: any) => {
      const results: SpeechRecognitionResult[] = [];

      for (let i = event.resultIndex; i < event.results.length; i++) {
        const result = event.results[i];
        const alternatives = [];

        for (let j = 0; j < result.length; j++) {
          alternatives.push({
            transcript: result[j].transcript,
            confidence: result[j].confidence,
          });
        }

        results.push({
          transcript: result[0].transcript,
          confidence: result[0].confidence,
          isFinal: result.isFinal,
          alternatives,
        });
      }

      globalEventBus.emit('speech:result', results);
    };

    this.recognition.onerror = (event: any) => {
      logger.error('Speech recognition error', event.error);
      globalEventBus.emit('speech:error', event.error);
    };

    this.recognition.onend = () => {
      this.isListening = false;
      globalEventBus.emit('speech:end');

      // Restart if continuous mode
      if (this.continuous) {
        this.start();
      }
    };
  }

  isAvailable(): boolean {
    return this.recognition !== null;
  }

  async start(options?: {
    continuous?: boolean;
    lang?: string;
    interimResults?: boolean;
  }): Promise<void> {
    if (!this.isAvailable()) {
      throw new Error('Speech recognition not available');
    }

    if (this.isListening) {
      logger.warn('Speech recognition already active');
      return;
    }

    if (options?.continuous !== undefined) {
      this.continuous = options.continuous;
      this.recognition.continuous = options.continuous;
    }

    if (options?.lang) {
      this.recognition.lang = options.lang;
    }

    if (options?.interimResults !== undefined) {
      this.recognition.interimResults = options.interimResults;
    }

    try {
      this.recognition.start();
      this.isListening = true;
      globalEventBus.emit('speech:start');
      logger.info('Speech recognition started');
    } catch (error) {
      logger.error('Failed to start speech recognition', error);
      throw error;
    }
  }

  stop(): void {
    if (this.recognition && this.isListening) {
      this.continuous = false;
      this.recognition.stop();
      this.isListening = false;
      logger.info('Speech recognition stopped');
    }
  }

  abort(): void {
    if (this.recognition && this.isListening) {
      this.continuous = false;
      this.recognition.abort();
      this.isListening = false;
      logger.info('Speech recognition aborted');
    }
  }

  isActive(): boolean {
    return this.isListening;
  }

  onResult(callback: (results: SpeechRecognitionResult[]) => void): () => void {
    return globalEventBus.on('speech:result', callback);
  }

  onError(callback: (error: string) => void): () => void {
    return globalEventBus.on('speech:error', callback);
  }
}

export class SpeechSynthesisService {
  private synth: SpeechSynthesis;
  private voices: SpeechSynthesisVoice[] = [];

  constructor() {
    this.synth = window.speechSynthesis;
    this.loadVoices();

    // Voices may load asynchronously
    if (speechSynthesis.onvoiceschanged !== undefined) {
      speechSynthesis.onvoiceschanged = () => this.loadVoices();
    }
  }

  private loadVoices(): void {
    this.voices = this.synth.getVoices();
  }

  isAvailable(): boolean {
    return 'speechSynthesis' in window;
  }

  getVoices(): SpeechSynthesisVoice[] {
    return this.voices;
  }

  speak(text: string, options?: SpeechSynthesisOptions): Promise<void> {
    return new Promise((resolve, reject) => {
      if (!this.isAvailable()) {
        reject(new Error('Speech synthesis not available'));
        return;
      }

      const utterance = new SpeechSynthesisUtterance(text);

      if (options?.voice) {
        utterance.voice = options.voice;
      }

      if (options?.rate !== undefined) {
        utterance.rate = options.rate;
      }

      if (options?.pitch !== undefined) {
        utterance.pitch = options.pitch;
      }

      if (options?.volume !== undefined) {
        utterance.volume = options.volume;
      }

      if (options?.lang) {
        utterance.lang = options.lang;
      }

      utterance.onend = () => {
        logger.debug('Speech synthesis ended');
        resolve();
      };

      utterance.onerror = (event) => {
        logger.error('Speech synthesis error', event);
        reject(new Error('Speech synthesis failed'));
      };

      this.synth.speak(utterance);
      logger.info('Speech synthesis started', { textLength: text.length });
    });
  }

  pause(): void {
    if (this.synth.speaking) {
      this.synth.pause();
    }
  }

  resume(): void {
    if (this.synth.paused) {
      this.synth.resume();
    }
  }

  cancel(): void {
    this.synth.cancel();
  }

  isSpeaking(): boolean {
    return this.synth.speaking;
  }

  isPaused(): boolean {
    return this.synth.paused;
  }
}

export const speechRecognitionService = new SpeechRecognitionService();
export const speechSynthesisService = new SpeechSynthesisService();

export default {
  SpeechRecognitionService,
  SpeechSynthesisService,
  speechRecognitionService,
  speechSynthesisService,
};
