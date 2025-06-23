import { Injectable } from "@angular/core";
import { TTSService } from "./tts.service";
import { TextLayerRenderedEvent } from "ngx-extended-pdf-viewer";
import { BehaviorSubject, firstValueFrom, retry } from "rxjs";
import { HttpClient } from "@angular/common/http";
import { TTS } from "../model/raphael.model";
import { RxJSUtils } from "projects/viescloud-utils/src/lib/util/RxJS.utils";

export type Sentence = {
    text: string,
    pageNumber: number[],
    index: number,
    elements: HTMLElement[],
    hightLightColor: BehaviorSubject<string>,
    hightLightColorMain: BehaviorSubject<string>,
    hightLightColorHover: BehaviorSubject<string>,
    hightLightOpacity: BehaviorSubject<number>,
    hightLightExitColorHover: BehaviorSubject<string | null>,
    onClick: BehaviorSubject<HTMLElement | null>,
    onHover: BehaviorSubject<HTMLElement | null>,
    onExitHover: BehaviorSubject<HTMLElement | null>
}

@Injectable({
    providedIn: 'root'
})
export class TtsReaderService extends TTSService {

    documentManager!: DocumentManager;
    audioPlayer = new AudioPlayer();
    globalHightLightColorMain = new BehaviorSubject<string>('red');
    globalHightLightColorHover = new BehaviorSubject<string>('blue');
    globalHhightLightOpacity = new BehaviorSubject<number>(30);
    onSentenceClick = new BehaviorSubject<Sentence | null>(null);
    selectedSentence = new BehaviorSubject<Sentence | null>(null);
    onUploadingFile: BehaviorSubject<string> = new BehaviorSubject<string>('../../../assets/pdf-test.pdf');

    constructor(httpClient: HttpClient, private rxjsUtils: RxJSUtils) {
        super(httpClient);
        this.documentManager = new DocumentManager(this.globalHightLightColorMain, this.globalHightLightColorHover, this.globalHhightLightOpacity, this.onSentenceClick);

        this.onSentenceClick.subscribe({
            next: sentence => {
                if (sentence?.hightLightColor.value === sentence?.hightLightColorMain.value) {
                    sentence?.hightLightColor.next('');
                    this.selectedSentence.next(null);
                }
                else {
                    sentence?.hightLightColor.next(sentence.hightLightColorMain.value);

                    if (this.selectedSentence.value) {
                        this.selectedSentence.value.hightLightColor.next('');
                    }

                    this.selectedSentence.next(sentence);
                }
            }
        });
    }

    switchHightLightColor(sentence: Sentence) {
        if (sentence.hightLightColor.value === sentence.hightLightColorMain.value) {
            sentence.hightLightColor.next('');
        }
        else {
            sentence.hightLightColor.next(sentence.hightLightColorMain.value);
        }
    }

    onTextLayerRendered(event: TextLayerRenderedEvent): void {
        this.documentManager.addTextLayerFromEvent(event);
    }

    async playSentence(sentence: Sentence) {
        let tts: TTS = {
            text: sentence.text,
            model: this.selectedModel,
            voice: this.selectedVoice
        }

        let metadata = await firstValueFrom(this.generateWavMetadata(tts).pipe(
            this.rxjsUtils.waitLoadingSnackBar('Generating audio...'),
            retry(10)
        )).catch(err => null);

        if (metadata?.temporaryAccessLink) {
            return this.audioPlayer.play(metadata.temporaryAccessLink);
        }
    }

    async preloadSentence(sentence: Sentence) {
        return firstValueFrom(this.preloadWav({
            text: sentence.text,
            model: this.selectedModel,
            voice: this.selectedVoice
        }));
    }

    async preloadForwardFromSentence(sentence: Sentence, count: number) {
        let currentSentence: Sentence | undefined = this.documentManager.getNextSentence(sentence);
        for (let i = 0; i < count; i++) {
            if (currentSentence) {
                await this.preloadSentence(currentSentence);
                currentSentence = this.documentManager.getNextSentence(currentSentence);
            }
        }
    }

    async preloadBackwardFromSentence(sentence: Sentence, count: number) {
        let currentSentence: Sentence | undefined = this.documentManager.getPrevSentence(sentence);
        for (let i = 0; i < count; i++) {
            if (currentSentence) {
                await this.preloadSentence(currentSentence);
                currentSentence = this.documentManager.getPrevSentence(currentSentence);
            }
        }
    }
}

class SentenceBuilder {
    colorBoxs: {
        span: HTMLSpanElement,
        highlights: { text: string; color: BehaviorSubject<string>; hoverColor: BehaviorSubject<string>; opacity: BehaviorSubject<number>; onClick: BehaviorSubject<HTMLElement | null>; onHover: BehaviorSubject<HTMLElement | null>; onExitHover: BehaviorSubject<HTMLElement | null> }[]
    }[] = [];
    sentences: Sentence[] = [];
    currentSentence?: Sentence;

    constructor(
        private hightLightColorMain = new BehaviorSubject<string>('red'),
        private hightLightColorHover = new BehaviorSubject<string>('blue'),
        private hightLightOpacity = new BehaviorSubject<number>(30)
    ) { }

    addSegment(text: string | null, page: number, element: HTMLElement) {
        if (!text) {
            if (this.currentSentence) {
                this.currentSentence = undefined;
            }
            return;
        }

        if (!this.currentSentence || !this.currentSentence.text) {
            this.currentSentence = {
                text: text,
                pageNumber: [page],
                index: this.sentences.length,
                elements: [element],
                hightLightColor: new BehaviorSubject<string>(''),
                hightLightColorMain: this.hightLightColorMain,
                hightLightColorHover: this.hightLightColorHover,
                hightLightOpacity: this.hightLightOpacity,
                hightLightExitColorHover: new BehaviorSubject<string | null>(null),
                onClick: new BehaviorSubject<HTMLElement | null>(null),
                onHover: new BehaviorSubject<HTMLElement | null>(null),
                onExitHover: new BehaviorSubject<HTMLElement | null>(null)
            }
            this.sentences.push(this.currentSentence);
        }
        else {
            this.currentSentence.text += text;
            this.currentSentence.pageNumber.push(page);
            this.currentSentence.elements.push(element);
        }

        this.addColorBox(text, this.currentSentence, element);
    }

    addColorBox(text: string, sentence: Sentence, element: HTMLElement) {
        let index = this.colorBoxs.findIndex((colorBox) => colorBox.span === element);
        if (index >= 0) {
            this.colorBoxs[index].highlights.push({
                text: text,
                color: sentence.hightLightColor,
                hoverColor: sentence.hightLightColorHover,
                opacity: sentence.hightLightOpacity,
                onClick: sentence.onClick,
                onHover: sentence.onHover,
                onExitHover: sentence.onExitHover
            })
        }
        else {
            this.colorBoxs.push({
                span: element,
                highlights: [{
                    text: text,
                    color: sentence.hightLightColor,
                    hoverColor: sentence.hightLightColorHover,
                    opacity: sentence.hightLightOpacity,
                    onClick: sentence.onClick,
                    onHover: sentence.onHover,
                    onExitHover: sentence.onExitHover
                }]
            })
        }
    }
}

class DocumentManager {
    private readonly defaultSentenceRegex = /(?=[^])(?:\P{Sentence_Terminal}|\p{Sentence_Terminal}(?!['"`\p{Close_Punctuation}\p{Final_Punctuation}\s]))*(?:\p{Sentence_Terminal}+['"`\p{Close_Punctuation}\p{Final_Punctuation}]*|$)/guy;

    private documentMap = new Map<number, TextLayerRenderedEvent>();
    private sentenceMap = new Map<number, Sentence[]>();


    constructor(
        private hightLightColorMain = new BehaviorSubject<string>('red'),
        private hightLightColorHover = new BehaviorSubject<string>('blue'),
        private hightLightOpacity = new BehaviorSubject<number>(30),
        private onSentenceClick = new BehaviorSubject<Sentence | null>(null)
    ) { }

    getSentence(pageNumber: number, index: number) {
        return this.sentenceMap.get(pageNumber)?.[index];
    }

    getNextSentence(sentence: Sentence) {
        let pageNumber = sentence.pageNumber[sentence.pageNumber.length - 1];
        let index = sentence.index + 1;

        return this.getSentence(pageNumber, index) ?? this.getSentence(pageNumber + 1, 0);
    }

    getPrevSentence(sentence: Sentence) {
        let pageNumber = sentence.pageNumber[sentence.pageNumber.length - 1];
        let index = sentence.index - 1;

        return this.getSentence(pageNumber, index) ?? this.getSentence(pageNumber - 1, 0);
    }

    addTextLayerFromEvent(event: TextLayerRenderedEvent) {
        this.documentMap.set(event.pageNumber, event);
        this.renderSentence(event);
    }

    renderSentence(event: TextLayerRenderedEvent) {
        let textLayer = event.source?.textLayer;
        let pageNumber = event.pageNumber;

        this.sentenceMap.get(pageNumber)?.forEach(sentence => {
            sentence.onClick.unsubscribe();
            sentence.onHover.unsubscribe();
            sentence.onExitHover.unsubscribe();
        })

        if (textLayer) {
            let sentences: Sentence[] = [];
            let textContentStrs = textLayer.textContentItemsStr;
            let textContentElements = textLayer.textDivs;
            let rowIndex = 0;
            let sentenceBuilder = new SentenceBuilder(this.hightLightColorMain, this.hightLightColorHover, this.hightLightOpacity);

            while (rowIndex < textContentStrs.length) {
                let line = textContentStrs[rowIndex];
                let span = textContentElements[rowIndex];
                let splitLine: string[] = line.match(this.defaultSentenceRegex) || [line];

                splitLine.forEach(splitText => {
                    sentenceBuilder.addSegment(splitText, pageNumber, span);

                    if (splitText.endsWith('.') || splitText.endsWith('!') || splitText.endsWith('?') || splitText.endsWith(':')) {
                        sentenceBuilder.addSegment(null, pageNumber, span);
                    }
                });

                rowIndex++;
            }

            sentenceBuilder.addSegment(null, pageNumber, textContentElements[rowIndex - 1]);

            sentences = sentenceBuilder.sentences;

            sentenceBuilder.colorBoxs.forEach(colorBox => {
                this.addColorBoxes(colorBox.span, colorBox.highlights);
            });

            this.sentenceMap.set(pageNumber, sentences);

            sentences.forEach(sentence => {
                sentence.onClick.subscribe({
                    next: (element) => {
                        if (element) {
                            this.onSentenceClick.next(sentence);
                        }
                    }
                })

                sentence.onHover.subscribe({
                    next: (element) => {
                        if (element && sentence.hightLightColor.value !== sentence.hightLightColorMain.value) {
                            sentence.hightLightColor.next(sentence.hightLightColorHover.value);
                        }
                    }
                })

                sentence.onExitHover.subscribe({
                    next: (element) => {
                        if (element && sentence.hightLightColor.value !== sentence.hightLightColorMain.value) {
                            sentence.hightLightColor.next('');
                        }
                    }
                })
            })
        }
    }

    addColorBoxes(
        span: HTMLSpanElement,
        highlights: { text: string; color: BehaviorSubject<string>; hoverColor: BehaviorSubject<string>; opacity: BehaviorSubject<number>; onClick: BehaviorSubject<HTMLElement | null>; onHover: BehaviorSubject<HTMLElement | null>; onExitHover: BehaviorSubject<HTMLElement | null> }[]
    ) {
        // Remove any existing highlight boxes
        const existingBoxes = span.querySelectorAll('.highlight-box');
        existingBoxes.forEach(box => box.remove());

        if (!highlights.length) return;

        const spanText = span.textContent || '';
        const spanRect = span.getBoundingClientRect();
        const spanStyle = window.getComputedStyle(span);

        // Get font properties for accurate text measurement
        const fontSize = spanStyle.fontSize;
        const fontFamily = spanStyle.fontFamily;
        const fontWeight = spanStyle.fontWeight;
        const letterSpacing = spanStyle.letterSpacing;
        const lineHeight = spanStyle.lineHeight;

        // Create a temporary canvas for text measurement
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d')!;
        ctx.font = `${fontWeight} ${fontSize} ${fontFamily}`;

        // Set span to relative positioning if not already positioned
        const originalPosition = spanStyle.position;
        if (originalPosition === 'static') {
            span.style.position = 'relative';
        }

        highlights.forEach(({ text, color, hoverColor, opacity, onClick, onHover, onExitHover }) => {
            if (!text || !spanText.includes(text)) return;

            let searchStartIndex = 0;
            let matchIndex;

            // Handle multiple occurrences of the same text
            while ((matchIndex = spanText.indexOf(text, searchStartIndex)) !== -1) {
                // Measure text before the highlight
                const textBefore = spanText.substring(0, matchIndex);
                const textBeforeWidth = ctx.measureText(textBefore).width;

                // Measure the highlight text
                const highlightWidth = ctx.measureText(text).width;

                // Calculate position relative to span
                const leftOffset = textBeforeWidth;

                // Create highlight box
                const highlightBox = document.createElement('div');
                highlightBox.className = 'highlight-box';
                highlightBox.style.cssText = `
                    position: absolute;
                    left: ${leftOffset}px;
                    top: 0;
                    width: ${highlightWidth}px;
                    height: 100%;
                    background-color: ${color.value};
                    opacity: ${opacity.value};
                    pointer-events: none;
                    z-index: 999;
                    border-radius: 2px;
                `;

                highlightBox.style.pointerEvents = 'auto';

                color.subscribe((color) => {
                    highlightBox.style.backgroundColor = color;
                });

                opacity.subscribe((opacity) => {
                    highlightBox.style.opacity = opacity.toString();
                });

                highlightBox.addEventListener('click', (event) => {
                    event.stopPropagation();
                    onClick.next(highlightBox)
                });
                highlightBox.addEventListener('mouseenter', () => {
                    onHover.next(highlightBox);
                });
                highlightBox.addEventListener('mouseleave', () => {
                    onExitHover.next(highlightBox);
                });

                span.appendChild(highlightBox);

                // Move search start to after current match
                searchStartIndex = matchIndex + text.length;
            }
        });

        // Clean up
        canvas.remove();
    }
}

class AudioPlayer {
    private audio = new Audio();
    audioPlayerState: BehaviorSubject<'playing' | 'paused' | 'idle'> = new BehaviorSubject<'playing' | 'paused' | 'idle'>('idle');
    speed: BehaviorSubject<number> = new BehaviorSubject<number>(1);

    constructor() {
        this.audio.preload = 'auto';

        this.speed.subscribe((speed) => {
            this.audio.playbackRate = speed;
        });
    }

    async play(autdioUrl: string): Promise<void> {
        this.stop();
        return new Promise((resolve, reject) => {
            this.audio.onended = () => resolve();
            this.audio.onerror = () => reject(new Error('Audio playback failed'));

            this.audio.src = autdioUrl;
            this.audio.playbackRate = this.speed.value;

            this.audio.play().then(() => this.audioPlayerState.next('playing')).catch(err => {
                this.audioPlayerState.next('idle');
                reject(err);
            });
        });
    }

    pause(): void {
        this.audio.pause();
        this.audioPlayerState.next('paused');
    }

    stop(): void {
        this.audio.pause();
        this.audio.currentTime = 0;
        this.audioPlayerState.next('idle');
    }

    isPlaying(): boolean {
        this.audioPlayerState.next(this.audio.paused ? 'paused' : 'playing');
        return !this.audio.paused;
    }
}