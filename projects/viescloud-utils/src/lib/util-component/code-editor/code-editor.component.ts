import { Component, ElementRef, Input, AfterViewInit, Output, EventEmitter, ViewChild, ChangeDetectorRef, OnDestroy, HostListener } from '@angular/core';
import { EditorComponent } from 'ngx-monaco-editor-v2';
import { SettingService } from '../../service/Setting.service';
import { KeyCaptureEvent, KeyCaptureService } from '../../service/KeyCapture.service';

@Component({
  selector: 'app-code-editor',
  templateUrl: './code-editor.component.html',
  styleUrls: ['./code-editor.component.scss']
})
export class CodeEditorComponent implements AfterViewInit, OnDestroy {
  @Input()
  language = 'javascript';

  @Input()
  value = '';

  @Output()
  valueChange = new EventEmitter<string>();

  @Input()
  styleWidth = '100%';

  @Input()
  styleHeight = '500px';

  @ViewChild(EditorComponent)
  editorComponent!: EditorComponent;

  @Output()
  onValueChange = new EventEmitter<void>();

  @Output()
  onKeyCaptureEvent = new EventEmitter<KeyCaptureEvent>();

  @Output()
  onCrtlSKeyCaptureEvent = new EventEmitter<KeyCaptureEvent>();

  onToggleDisplayDrawerSubscription: any = null;
  onKeyCaptureSubscription: any = null;

  constructor(
    private cd: ChangeDetectorRef,
    private settingService: SettingService,
    private keycaptureService?: KeyCaptureService,
  ) {

    if(!this.onToggleDisplayDrawerSubscription) {
      settingService.onToggleDisplayDrawer$.subscribe({
        next: state => {
          this.resizeEditor();
        }
      });
    }

    if(!this.onKeyCaptureSubscription && this.keycaptureService) {
      this.onKeyCaptureSubscription = this.keycaptureService.keyEvents$.subscribe({
        next: event => {
          this.onKeyCaptureEvent.emit(event);

          if(KeyCaptureService.isKeyCombination(event, ['Ctrl', 's'])) {
            this.onCrtlSKeyCaptureEvent.emit(event);
          }
        }
      })
    }

  }
  ngOnDestroy(): void {
    if(this.onToggleDisplayDrawerSubscription)
      this.onToggleDisplayDrawerSubscription.unsubscribe();

    if(this.onKeyCaptureSubscription) {
      this.onKeyCaptureSubscription.unsubscribe();
    }
  }

  ngAfterViewInit(): void {
    this.resizeEditor();
  }

  resizeEditor(): void {
    // const containerWidth = (document.querySelector('.resizable-container') as HTMLElement).offsetWidth;
    if (this.editorComponent) {
      // this.editorComponent._editorContainer.nativeElement.style.width.ch = containerWidth + 'px';
      // this.editorComponent.insideNg = true;
      // this.cd.detectChanges();

      //this work
      this.editorComponent.insideNg = !this.editorComponent.insideNg;
      this.editorComponent.insideNg = !this.editorComponent.insideNg;
    }
  }

  getVsCodeThemeColor(): string {
    return this.settingService.getCurrentThemeTextColor() === 'black' ? 'vs-light' : 'vs-dark';
  }

  getThemeTextColor() {
    return this.settingService.getCurrentThemeTextColor();
  }

  emitValue(value: string) {
    this.valueChange.emit(value);
    this.onValueChange.emit();
  }

  @HostListener('document:keydown', ['$event'])
  handleKeyboardEvent(event: KeyboardEvent) {
    if (event.ctrlKey && event.key === 's') {
      event.preventDefault(); // This prevents the default 'Save' behavior
    }
    else if(event.ctrlKey && event.key === 'r') {
      event.preventDefault(); // This prevents the default 'reload page' behavior
    }
  }
}
