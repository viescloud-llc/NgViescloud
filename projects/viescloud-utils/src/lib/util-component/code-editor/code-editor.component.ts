import { Component, ElementRef, Input, AfterViewInit, Output, EventEmitter, ViewChild, ChangeDetectorRef } from '@angular/core';
import { EditorComponent } from 'ngx-monaco-editor-v2';
import { SettingService } from '../../service/Setting.service';

@Component({
  selector: 'app-code-editor',
  templateUrl: './code-editor.component.html',
  styleUrls: ['./code-editor.component.scss']
})
export class CodeEditorComponent implements AfterViewInit {
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

  constructor(
    private cd: ChangeDetectorRef,
    private settingService: SettingService
  ) {
    settingService.onToggleDisplayDrawer$.subscribe({
      next: state => {
        this.resizeEditor();
      }
    });
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
}
