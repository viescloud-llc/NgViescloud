import { Component, ElementRef, Input, AfterViewInit, Output, EventEmitter } from '@angular/core';

@Component({
  selector: 'app-code-editor',
  templateUrl: './code-editor.component.html',
  styleUrls: ['./code-editor.component.scss']
})
export class CodeEditorComponent {
  @Input() language = 'javascript'; // Default language
  @Input() value = ''; // Default content
  @Output() valueChange = new EventEmitter<string>();

  constructor(private el: ElementRef) {}
}