import { Pipe, PipeTransform } from '@angular/core';

@Pipe({
  name: 'filterName',
  standalone: false
})
export class FilterNamePipe implements PipeTransform {

  transform(str: string, length: number): string
  {

    if(!str)
      return str;

    if(str.length <= length)
      return str;

    if(str.length > 3)
      return str.substring(0, length - 3) + '...';
    else
      return str.substring(0, length);
  }
}
