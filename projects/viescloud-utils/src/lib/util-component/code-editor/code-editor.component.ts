import { Component, ElementRef, Input, AfterViewInit, Output, EventEmitter, ViewChild, ChangeDetectorRef, OnDestroy, HostListener } from '@angular/core';
import { SettingService } from '../../service/setting.service';
import { KeyCaptureEvent, KeyCaptureService } from '../../service/key-capture.service';
import { MonacoLanguage } from '../../model/monaco-editor.model';

@Component({
  selector: 'app-code-editor',
  templateUrl: './code-editor.component.html',
  styleUrls: ['./code-editor.component.scss'],
  standalone: false
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

  @Output()
  onValueChange = new EventEmitter<void>();

  @Output()
  onKeyCaptureEvent = new EventEmitter<KeyCaptureEvent>();

  onToggleDisplayDrawerSubscription: any = null;
  onKeyCaptureSubscription: any = null;

  constructor(
    private cd: ChangeDetectorRef,
    private settingService: SettingService<any>,
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
    // // const containerWidth = (document.querySelector('.resizable-container') as HTMLElement).offsetWidth;
    // if (this.editorComponent) {
    //   // this.editorComponent._editorContainer.nativeElement.style.width.ch = containerWidth + 'px';
    //   // this.editorComponent.insideNg = true;
    //   // this.cd.detectChanges();

    //   //this work
    //   this.editorComponent.insideNg = !this.editorComponent.insideNg;
    //   this.editorComponent.insideNg = !this.editorComponent.insideNg;
    // }
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

  getTabSize() {
    return MonacoLanguage.getTabSizeForLanguage(this.language);
  }
}
