import { Directive } from '@angular/core';

@Directive({
  selector: '[appTrackByIndex]',
  standalone: false
})
export class TrackByIndex {

  constructor() { }

  trackByIndex(index: number, obj: any): any {
    return index;
  }

}
