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
  language = 'javascript'; // Default language

  @Input()
  value = ''; // Default content

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

  }
  ngAfterViewInit(): void {
    this.resizeEditor();
  }

  private resizeEditor(): void {
    //TODO: fix this resizeable
    if (this.editorComponent) {
      // this.editorComponent._editorContainer.nativeElement.style.width = 100 + '%';
      // this.editorComponent.insideNg = true;
      // this.cd.detectChanges();
    }
  }

  getTextColor(): string {
    return this.settingService.getCurrentThemeTextColor() === 'black' ? 'vs-light' : 'vs-dark';
  }

  emitValue(value: string) {
    this.valueChange.emit(value);
    this.onValueChange.emit();
  }
}
