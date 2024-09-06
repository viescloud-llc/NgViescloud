import { Pipe, PipeTransform } from '@angular/core';

@Pipe({
  name: 'filterNameReverse'
})
export class FilterNameReversePipe implements PipeTransform {

  transform(str: string | number, length: number, replaceWith?: string): string
  {
    let string = str.toString();

    if(string.length <= length)
      return string;

    let lastString = string.substring(string.length - length);

    let result = '';

    for(let i = 0; i < string.length - length; i ++)
    {
      if(replaceWith)
        result += replaceWith;
      else
        result += '.'
    }

    return result + lastString;
  }

}
