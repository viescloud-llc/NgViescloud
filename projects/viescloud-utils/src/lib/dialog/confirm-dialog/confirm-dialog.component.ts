import { Component, Inject, OnInit } from '@angular/core';
import { MAT_DIALOG_DATA } from '@angular/material/dialog';
import { SettingService } from '../../service/setting.service';

@Component({
  selector: 'app-confirm-dialog',
  templateUrl: './confirm-dialog.component.html',
  styleUrls: ['./confirm-dialog.component.scss']
})
export class ConfirmDialog implements OnInit {

  borderTop: string = '';
  borderBottom: string = '';
  borderSides: string[] = [];
  messageLines: string[] = [];

  yes: string = 'Yes';
  no: string = 'No';
  message: string = '';

  constructor(
    @Inject(MAT_DIALOG_DATA) public data: {title: string, message: string, yes?: string, no?: string},
    private settingsService: SettingService
    ) { 
      this.message = data.message.replace(/\t/g, ' '.repeat(4));
      this.messageLines = this.message.split('\n');
    }

  ngOnInit() 
  {
    if(this.data.yes)
      this.yes = this.data.yes;

    if(this.data.no || this.data.no === '')
      this.no = this.data.no;
    
    // Find the maximum length of the message lines
    let maxLineLength = Math.max(...this.messageLines.map(line => line.length));
    let borderLength = maxLineLength + 2; // Add space for the ' | ' characters

    this.borderTop = ' ' + '-'.repeat(borderLength) + ' ';
    this.borderBottom = ' ' + '-'.repeat(borderLength) + ' ';
    
    // Create border sides for each line
    this.borderSides = this.messageLines.map(line => {
      let space = ' '.repeat(maxLineLength - line.length).length;
      return '| ' + line + ' '.repeat(space) + ' |';
    });
  }

  isMultipleLine(): boolean {
    return this.message.includes('\n');
  }

  getNgStyleTextColor() {
    return {
      color: this.settingsService.getCurrentThemeTextColor()
    }
  }

}
