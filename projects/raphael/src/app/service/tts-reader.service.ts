import { Injectable } from '@angular/core';
import { NgxExtendedPdfViewerService, TextLayerRenderedEvent } from 'ngx-extended-pdf-viewer';
import { UtilsService } from 'projects/viescloud-utils/src/lib/service/utils.service';
import { TTSService } from './tts.service';
import { firstValueFrom } from 'rxjs';

// Data Models
export interface SentenceLocation {
  page: number;
  row: number;
  elementIndex: number;
}

export interface Sentence {
  id: string;
  text: string;
  location: SentenceLocation;
  elements: HTMLElement[];
  scrollTop?: number;
  ttsId?: number;
  audioUrl?: string;
  isPreloaded: boolean;
}

export interface DocumentMap {
  [page: number]: Sentence[];
}

export interface PlaybackState {
  isPlaying: boolean;
  currentSentence: Sentence | null;
  autoAdvance: boolean;
  speed: number;
}

export interface ScanOptions {
  excludeElements: string[];
  sentenceRegex?: RegExp;
  textReplacements: { [key: string]: string };
}

export interface PreloadOptions {
  maxPreloadCount: number;
  maxQueueSize: number;
  preloadDirection: 'forward' | 'backward' | 'both';
}

// Document Scanner - Handles PDF text extraction and sentence mapping
class DocumentScanner {
  private readonly defaultSentenceRegex = /(?=[^])(?:\P{Sentence_Terminal}|\p{Sentence_Terminal}(?!['"`\p{Close_Punctuation}\p{Final_Punctuation}\s]))*(?:\p{Sentence_Terminal}+['"`\p{Close_Punctuation}\p{Final_Punctuation}]*|$)/guy;
  
  private readonly defaultOptions: ScanOptions = {
    excludeElements: ['a'],
    textReplacements: {
      '&': 'and',
      '=': 'equal'
    }
  };

  constructor(private options: ScanOptions = this.defaultOptions) {
    // this.options = { ...this.defaultOptions, ...this.options };
  }

  scanTextLayer(event: TextLayerRenderedEvent): DocumentMap {
    const documentMap: DocumentMap = {};
    const div = event.source.div;
    const pageNumber = parseInt(div.getAttribute('data-page-number') || '0');
    
    const textLayerDiv = div.getElementsByClassName('textLayer')[0] as HTMLDivElement;
    const spans = textLayerDiv.getElementsByTagName('span');
    
    let currentSentence = '';
    let sentenceElements: HTMLElement[] = [];
    let rowIndex = 0;
    let elementIndex = 0;
    
    documentMap[pageNumber] = [];

    for (let i = 0; i < spans.length; i++) {
      const span = spans[i] as HTMLSpanElement;
      
      if (!this.isValidSpan(span)) continue;
      
      const cleanText = this.cleanText(span.innerText);
      if (!cleanText.trim()) continue;
      
      const sentences = this.splitIntoSentences(cleanText);
      
      for (const sentenceText of sentences) {
        if (this.shouldStartNewSentence(currentSentence, sentenceText)) {
          if (currentSentence.trim()) {
            this.addSentenceToMap(documentMap, pageNumber, currentSentence, rowIndex, sentenceElements);
            rowIndex++;
          }
          currentSentence = sentenceText;
          sentenceElements = [];
          elementIndex = 0;
        } else {
          currentSentence += ' ' + sentenceText;
        }
        
        const element = this.createSentenceElement(sentenceText, span, pageNumber, rowIndex, elementIndex);
        sentenceElements.push(element);
        elementIndex++;
      }
    }
    
    // Add the last sentence if exists
    if (currentSentence.trim()) {
      this.addSentenceToMap(documentMap, pageNumber, currentSentence, rowIndex, sentenceElements);
    }
    
    this.calculateScrollPositions(documentMap[pageNumber]);
    
    return documentMap;
  }

  private isValidSpan(span: HTMLSpanElement): boolean {
    if (span.dir !== 'ltr') return false;
    
    for (const excludeElement of this.options.excludeElements) {
      if (span.getElementsByTagName(excludeElement).length > 0) return false;
    }
    
    return true;
  }
  
  private cleanText(text: string): string {
    let cleaned = text.trim();
    
    for (const [from, to] of Object.entries(this.options.textReplacements)) {
      cleaned = cleaned.replaceAll(from, to);
    }
    
    return cleaned.replaceAll('"', '').replaceAll('?', '');
  }
  
  private splitIntoSentences(text: string): string[] {
    const regex = this.options.sentenceRegex || this.defaultSentenceRegex;
    return text.match(regex) || [text];
  }
  
  private shouldStartNewSentence(currentSentence: string, newText: string): boolean {
    if (!currentSentence) return true;
    
    const firstChar = newText.charAt(0);
    return firstChar === firstChar.toUpperCase() && /[A-Z]/.test(firstChar);
  }
  
  private addSentenceToMap(
    documentMap: DocumentMap, 
    pageNumber: number, 
    text: string, 
    rowIndex: number, 
    elements: HTMLElement[]
  ): void {
    const sentence: Sentence = {
      id: `page-${pageNumber}-row-${rowIndex}`,
      text: text.trim(),
      location: { page: pageNumber, row: rowIndex, elementIndex: 0 },
      elements: elements,
      isPreloaded: false
    };
    
    documentMap[pageNumber].push(sentence);
  }
  
  private createSentenceElement(
    text: string, 
    originalSpan: HTMLSpanElement, 
    page: number, 
    row: number, 
    elementIndex: number
  ): HTMLElement {
    const element = document.createElement('span');
    element.innerText = text;
    element.style.cssText = originalSpan.style.cssText;
    element.dataset['page'] = page.toString();
    element.dataset['row'] = row.toString();
    element.dataset['elementIndex'] = elementIndex.toString();
    
    originalSpan.appendChild(element);
    return element;
  }
  
  private calculateScrollPositions(sentences: Sentence[]): void {
    const totalRows = sentences.length;
    const rowHeight = 100 / totalRows;
    
    sentences.forEach((sentence, index) => {
      sentence.scrollTop = (index + 1) * rowHeight;
    });
  }
}

// TTS Manager - Handles text-to-speech preloading and caching
class TTSManager {
  private preloadCache = new Map<string, Promise<void>>();
  
  constructor(
    private ttsService: TTSService,
    private options: PreloadOptions
  ) {}

  async preloadSentence(sentence: Sentence): Promise<void> {
    if (sentence.isPreloaded || this.preloadCache.has(sentence.id)) {
      return this.preloadCache.get(sentence.id) || Promise.resolve();
    }
    
    const preloadPromise = this.doPreload(sentence);
    this.preloadCache.set(sentence.id, preloadPromise);
    
    return preloadPromise;
  }
  
  private async doPreload(sentence: Sentence): Promise<void> {
    // try {
    //   if (!sentence.ttsId) {
    //     const response = await firstValueFrom(
    //       this.ttsService.preloadWav({ text: sentence.text })
    //     );
    //     sentence.ttsId = response.id;
    //   }
      
    //   if (!sentence.audioUrl) {
    //     const wav = await this.ttsService.getWavById(sentence.ttsId);
    //     sentence.audioUrl = URL.createObjectURL(wav.body!);
    //   }
      
    //   sentence.isPreloaded = true;
    // } catch (error) {
    //   console.error('Failed to preload sentence:', sentence.id, error);
    //   this.preloadCache.delete(sentence.id);
    // }
  }
  
  async preloadRange(
    sentences: Sentence[], 
    startIndex: number, 
    direction: 'forward' | 'backward' | 'both' = 'both'
  ): Promise<void> {
    const preloadPromises: Promise<void>[] = [];
    const maxCount = this.options.maxPreloadCount;
    
    if (direction === 'forward' || direction === 'both') {
      for (let i = 0; i < maxCount && startIndex + i < sentences.length; i++) {
        preloadPromises.push(this.preloadSentence(sentences[startIndex + i]));
      }
    }
    
    if (direction === 'backward' || direction === 'both') {
      for (let i = 1; i <= maxCount && startIndex - i >= 0; i++) {
        preloadPromises.push(this.preloadSentence(sentences[startIndex - i]));
      }
    }
    
    await Promise.allSettled(preloadPromises);
  }
  
  clearCache(): void {
    this.preloadCache.clear();
  }
  
  revokeSentenceAudio(sentence: Sentence): void {
    if (sentence.audioUrl) {
      URL.revokeObjectURL(sentence.audioUrl);
      sentence.audioUrl = undefined;
      sentence.isPreloaded = false;
    }
  }
}

// Audio Player - Handles audio playback
class AudioPlayer {
  private audio = new Audio();
  private currentPlayback: Promise<void> | null = null;
  
  constructor() {
    this.audio.preload = 'auto';
  }
  
  async playSentence(sentence: Sentence, speed: number = 1): Promise<void> {
    if (!sentence.audioUrl && !sentence.ttsId) {
      throw new Error('No audio available for sentence');
    }
    
    return new Promise((resolve, reject) => {
      this.audio.onended = () => resolve();
      this.audio.onerror = () => reject(new Error('Audio playback failed'));
      
      this.audio.src = sentence.audioUrl || 
        `${window.location.origin}/api/tts/wav/${sentence.ttsId}`;
      this.audio.playbackRate = speed;
      
      this.audio.play().catch(reject);
    });
  }
  
  pause(): void {
    this.audio.pause();
  }
  
  stop(): void {
    this.audio.pause();
    this.audio.currentTime = 0;
  }
  
  get isPlaying(): boolean {
    return !this.audio.paused;
  }
}

// Navigation Helper - Handles document navigation
class DocumentNavigator {
  constructor(private documentMap: DocumentMap) {}
  
  findSentence(page: number, row: number): Sentence | null {
    const pageData = this.documentMap[page];
    return pageData?.[row] || null;
  }
  
  getNextSentence(current: Sentence): Sentence | null {
    const { page, row } = current.location;
    const pageData = this.documentMap[page];
    
    // Try next row in same page
    if (pageData && row + 1 < pageData.length) {
      return pageData[row + 1];
    }
    
    // Try first row of next page
    const nextPageData = this.documentMap[page + 1];
    return nextPageData?.[0] || null;
  }
  
  getPreviousSentence(current: Sentence): Sentence | null {
    const { page, row } = current.location;
    
    // Try previous row in same page
    if (row > 0) {
      const pageData = this.documentMap[page];
      return pageData?.[row - 1] || null;
    }
    
    // Try last row of previous page
    const prevPageData = this.documentMap[page - 1];
    if (prevPageData && prevPageData.length > 0) {
      return prevPageData[prevPageData.length - 1];
    }
    
    return null;
  }
  
  getAllSentences(): Sentence[] {
    const allSentences: Sentence[] = [];
    
    Object.keys(this.documentMap)
      .sort((a, b) => parseInt(a) - parseInt(b))
      .forEach(page => {
        allSentences.push(...this.documentMap[parseInt(page)]);
      });
    
    return allSentences;
  }
}

// Main Service
@Injectable({
  providedIn: 'root'
})
export class TtsReaderService {
  // Core components
  private scanner!: DocumentScanner;
  private ttsManager!: TTSManager;
  private audioPlayer!: AudioPlayer;
  private navigator!: DocumentNavigator;
  
  // State
  private documentMap: DocumentMap = {};
  private playbackState: PlaybackState = {
    isPlaying: false,
    currentSentence: null,
    autoAdvance: true,
    speed: 1
  };
  
  // Configuration
  private readonly defaultPreloadOptions: PreloadOptions = {
    maxPreloadCount: 10,
    maxQueueSize: 5,
    preloadDirection: 'both'
  };
  
  // UI State
  public showToolBar = true;
  public mouseOverColor = 'green';
  public selectedColor = 'blue';
  
  constructor(
    public pdfViewerService: NgxExtendedPdfViewerService,
    private raphaelTTSService: TTSService
  ) {
    this.initializeComponents();
  }
  
  private initializeComponents(): void {
    this.scanner = new DocumentScanner();
    this.ttsManager = new TTSManager(this.raphaelTTSService, this.defaultPreloadOptions);
    this.audioPlayer = new AudioPlayer();
  }
  
  // Public API
  
  /**
   * Scan the document and build sentence map
   */
  onTextLayerRendered(event: TextLayerRenderedEvent): void {
    const pageMap = this.scanner.scanTextLayer(event);
    this.documentMap = { ...this.documentMap, ...pageMap };
    this.navigator = new DocumentNavigator(this.documentMap);
    this.attachEventListeners(pageMap);
  }
  
  /**
   * Get the document sentence map
   */
  getDocumentMap(): DocumentMap {
    return this.documentMap;
  }
  
  /**
   * Start playback from a specific sentence
   */
  async startPlayback(sentence: Sentence): Promise<void> {
    await this.selectSentence(sentence);
    this.playbackState.isPlaying = true;
    await this.playCurrentSentence();
  }
  
  /**
   * Toggle playback
   */
  async togglePlayback(): Promise<void> {
    if (this.playbackState.isPlaying) {
      this.pausePlayback();
    } else {
      await this.resumePlayback();
    }
  }
  
  /**
   * Pause playback
   */
  pausePlayback(): void {
    this.playbackState.isPlaying = false;
    this.audioPlayer.pause();
  }
  
  /**
   * Resume playback
   */
  async resumePlayback(): Promise<void> {
    if (this.playbackState.currentSentence) {
      this.playbackState.isPlaying = true;
      await this.playCurrentSentence();
    }
  }
  
  /**
   * Navigate to next sentence
   */
  async nextSentence(): Promise<void> {
    if (!this.playbackState.currentSentence) return;
    
    const next = this.navigator.getNextSentence(this.playbackState.currentSentence);
    if (next) {
      await this.selectSentence(next);
      if (this.playbackState.isPlaying) {
        await this.playCurrentSentence();
      }
    }
  }
  
  /**
   * Navigate to previous sentence
   */
  async previousSentence(): Promise<void> {
    if (!this.playbackState.currentSentence) return;
    
    const previous = this.navigator.getPreviousSentence(this.playbackState.currentSentence);
    if (previous) {
      await this.selectSentence(previous);
      if (this.playbackState.isPlaying) {
        await this.playCurrentSentence();
      }
    }
  }
  
  /**
   * Set playback speed
   */
  setPlaybackSpeed(speed: number): void {
    this.playbackState.speed = Math.max(0.1, Math.min(3.0, speed));
  }
  
  /**
   * Get current playback state
   */
  getPlaybackState(): PlaybackState {
    return { ...this.playbackState };
  }
  
  /**
   * Preload sentences around current position
   */
  async preloadAroundCurrent(): Promise<void> {
    if (!this.playbackState.currentSentence) return;
    
    const allSentences = this.navigator.getAllSentences();
    const currentIndex = allSentences.findIndex(s => s.id === this.playbackState.currentSentence!.id);
    
    if (currentIndex >= 0) {
      await this.ttsManager.preloadRange(allSentences, currentIndex);
    }
  }
  
  // Private methods
  
  private async selectSentence(sentence: Sentence): Promise<void> {
    // Clear previous selection
    if (this.playbackState.currentSentence) {
      this.highlightSentence(this.playbackState.currentSentence, '');
    }
    
    // Set new selection
    this.playbackState.currentSentence = sentence;
    this.highlightSentence(sentence, this.selectedColor);
    
    // Scroll to sentence
    this.scrollToSentence(sentence);
    
    // Preload surrounding sentences
    await this.preloadAroundCurrent();
  }
  
  private async playCurrentSentence(): Promise<void> {
    if (!this.playbackState.currentSentence || !this.playbackState.isPlaying) {
      return;
    }
    
    const sentence = this.playbackState.currentSentence;
    
    // Ensure sentence is preloaded
    await this.ttsManager.preloadSentence(sentence);
    
    try {
      await this.audioPlayer.playSentence(sentence, this.playbackState.speed);
      
      // Auto-advance if enabled and still playing
      if (this.playbackState.isPlaying && this.playbackState.autoAdvance) {
        await this.nextSentence();
      }
    } catch (error) {
      console.error('Playback failed:', error);
      this.playbackState.isPlaying = false;
    }
  }
  
  private highlightSentence(sentence: Sentence, color: string): void {
    sentence.elements.forEach(element => {
      element.style.backgroundColor = color;
    });
  }
  
  private scrollToSentence(sentence: Sentence): void {
    if (sentence.scrollTop) {
      this.pdfViewerService.scrollPageIntoView(
        sentence.location.page, 
        { top: `${sentence.scrollTop}%` }
      );
    }
  }
  
  private attachEventListeners(pageMap: DocumentMap): void {
    Object.values(pageMap).forEach(sentences => {
      sentences.forEach((sentence: any) => {
        sentence.elements.forEach((element: any) => {
          element.addEventListener('mouseover', () => {
            this.highlightSentence(sentence, this.mouseOverColor);
          });
          
          element.addEventListener('mouseleave', () => {
            if (sentence !== this.playbackState.currentSentence) {
              this.highlightSentence(sentence, '');
            }
          });
          
          element.addEventListener('click', async () => {
            await this.startPlayback(sentence);
          });
        });
      });
    });
  }
  
  // Legacy compatibility methods
  
  onPageChange(pageNumber: number): void {
    // Handle page change events
  }
  
  async exportAsText(): Promise<string> {
    const text = await this.pdfViewerService.getPageAsText(1);
    return text || '';
  }
  
  async exportAsLines(): Promise<string[]> {
    const currentPage = this.pdfViewerService.getCurrentlyVisiblePageNumbers()[0];
    const lines = await this.pdfViewerService.getPageAsLines(currentPage);
    return lines.map(line => line.text);
  }
  
  // Cleanup
  dispose(): void {
    this.audioPlayer.stop();
    this.ttsManager.clearCache();
    
    // Revoke all object URLs
    Object.values(this.documentMap).forEach(sentences => {
      sentences.forEach((sentence: any) => {
        this.ttsManager.revokeSentenceAudio(sentence);
      });
    });
  }
}