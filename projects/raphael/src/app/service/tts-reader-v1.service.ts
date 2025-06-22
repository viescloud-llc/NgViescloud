import { Injectable } from '@angular/core';
import { NgxExtendedPdfViewerService, TextLayerRenderedEvent } from 'ngx-extended-pdf-viewer';
import { UtilsService } from 'projects/viescloud-utils/src/lib/service/utils.service';
import { TTSService } from './tts.service';
import { firstValueFrom } from 'rxjs';

// Data Models
export interface SentenceLocationV1 {
  page: number;
  row: number;
  elementIndex: number;
}

export interface SentenceV1 {
  id: string;
  text: string;
  location: SentenceLocationV1;
  elements: HTMLElement[];
  scrollTop?: number;
  ttsId?: number;
  audioUrl?: string;
  isPreloaded: boolean;
}

export interface DocumentMapV1 {
  [page: number]: SentenceV1[];
}

export interface PlaybackStateV1 {
  isPlaying: boolean;
  currentSentence: SentenceV1 | null;
  autoAdvance: boolean;
  speed: number;
}

export interface ScanOptionsV1 {
  excludeElements: string[];
  sentenceRegex?: RegExp;
  textReplacements: { [key: string]: string };
}

export interface PreloadOptionsV1 {
  maxPreloadCount: number;
  maxQueueSize: number;
  preloadDirection: 'forward' | 'backward' | 'both';
}

// Document Scanner - Handles PDF text extraction and sentence mapping
class DocumentScannerV1 {
  private readonly defaultSentenceRegex = /(?=[^])(?:\P{Sentence_Terminal}|\p{Sentence_Terminal}(?!['"`\p{Close_Punctuation}\p{Final_Punctuation}\s]))*(?:\p{Sentence_Terminal}+['"`\p{Close_Punctuation}\p{Final_Punctuation}]*|$)/guy;
  
  private readonly defaultOptions: ScanOptionsV1 = {
    excludeElements: ['a'],
    textReplacements: {
      '&': 'and',
      '=': 'equal'
    }
  };

  options!: ScanOptionsV1;

  constructor(private o?: ScanOptionsV1) {
    if (!o) 
      this.options = this.defaultOptions;
    else {
      this.options = { ...this.defaultOptions, ...o };
    }
  }

  scanTextLayer(event: TextLayerRenderedEvent): DocumentMapV1 {
    const documentMap: DocumentMapV1 = {};
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
    documentMap: DocumentMapV1, 
    pageNumber: number, 
    text: string, 
    rowIndex: number, 
    elements: HTMLElement[]
  ): void {
    const sentence: SentenceV1 = {
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
  
  private calculateScrollPositions(sentences: SentenceV1[]): void {
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
    private options: PreloadOptionsV1
  ) {}

  async preloadSentence(sentence: SentenceV1): Promise<void> {
    if (sentence.isPreloaded || this.preloadCache.has(sentence.id)) {
      return this.preloadCache.get(sentence.id) || Promise.resolve();
    }
    
    const preloadPromise = this.doPreload(sentence);
    this.preloadCache.set(sentence.id, preloadPromise);
    
    return preloadPromise;
  }
  
  private async doPreload(sentence: SentenceV1): Promise<void> {
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
    sentences: SentenceV1[], 
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
  
  revokeSentenceAudio(sentence: SentenceV1): void {
    if (sentence.audioUrl) {
      URL.revokeObjectURL(sentence.audioUrl);
      sentence.audioUrl = undefined;
      sentence.isPreloaded = false;
    }
  }
}

// Audio Player - Handles audio playback
class AudioPlayerV1 {
  private audio = new Audio();
  private currentPlayback: Promise<void> | null = null;
  
  constructor() {
    this.audio.preload = 'auto';
  }
  
  async playSentence(sentence: SentenceV1, speed: number = 1): Promise<void> {
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
class DocumentNavigatorV1 {
  constructor(private documentMap: DocumentMapV1) {}
  
  findSentence(page: number, row: number): SentenceV1 | null {
    const pageData = this.documentMap[page];
    return pageData?.[row] || null;
  }
  
  getNextSentence(current: SentenceV1): SentenceV1 | null {
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
  
  getPreviousSentence(current: SentenceV1): SentenceV1 | null {
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
  
  getAllSentences(): SentenceV1[] {
    const allSentences: SentenceV1[] = [];
    
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
export class TtsReaderServiceV1 {
  // Core components
  private scanner!: DocumentScannerV1;
  private ttsManager!: TTSManager;
  private audioPlayer!: AudioPlayerV1;
  private navigator!: DocumentNavigatorV1;
  
  // State
  private documentMap: DocumentMapV1 = {};
  private playbackState: PlaybackStateV1 = {
    isPlaying: false,
    currentSentence: null,
    autoAdvance: true,
    speed: 1
  };
  
  // Configuration
  private readonly defaultPreloadOptions: PreloadOptionsV1 = {
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
    this.scanner = new DocumentScannerV1();
    this.ttsManager = new TTSManager(this.raphaelTTSService, this.defaultPreloadOptions);
    this.audioPlayer = new AudioPlayerV1();
  }
  
  // Public API
  
  /**
   * Scan the document and build sentence map
   */
  onTextLayerRendered(event: TextLayerRenderedEvent): void {
    const pageMap = this.scanner.scanTextLayer(event);
    this.documentMap = { ...this.documentMap, ...pageMap };
    this.navigator = new DocumentNavigatorV1(this.documentMap);
    this.attachEventListeners(pageMap);
  }
  
  /**
   * Get the document sentence map
   */
  getDocumentMap(): DocumentMapV1 {
    return this.documentMap;
  }
  
  /**
   * Start playback from a specific sentence
   */
  async startPlayback(sentence: SentenceV1): Promise<void> {
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
  getPlaybackState(): PlaybackStateV1 {
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
  
  private async selectSentence(sentence: SentenceV1): Promise<void> {
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
  
  private highlightSentence(sentence: SentenceV1, color: string): void {
    sentence.elements.forEach(element => {
      element.style.backgroundColor = color;
    });
  }
  
  private scrollToSentence(sentence: SentenceV1): void {
    if (sentence.scrollTop) {
      this.pdfViewerService.scrollPageIntoView(
        sentence.location.page, 
        { top: `${sentence.scrollTop}%` }
      );
    }
  }
  
  private attachEventListeners(pageMap: DocumentMapV1): void {
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