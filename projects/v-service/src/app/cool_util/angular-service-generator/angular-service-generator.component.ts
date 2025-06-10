import { Component, OnInit } from '@angular/core';
import { ANGULAR_MODEL } from './angular-service-generator.model';

@Component({
  selector: 'app-angular-service-generator',
  templateUrl: './angular-service-generator.component.html',
  styleUrls: ['./angular-service-generator.component.scss']
})
export class AngularServiceGeneratorComponent implements OnInit {

  domainOptionKey: string  = 'domainOptions';

  entityName: string = '';
  schema: string = 'http';
  domain: string = '';
  URL: string = '';

  additionalPathLength: number = 0;
  additionalPaths: {value: string}[] = [];
  generateHttpUtils: boolean = false;

  angularFile: string = '';
  httpUtils: string = '';

  domainOptions: string[] = [];

  constructor() { }

  ngOnInit() {
    let domainOptions = localStorage.getItem(this.domainOptionKey);
    if(domainOptions)
      this.domainOptions = JSON.parse(domainOptions);
  }

  updatePaths(): void {
    while (this.additionalPaths.length > this.additionalPathLength)
      this.additionalPaths.pop();

    while (this.additionalPaths.length < this.additionalPathLength) {
      this.additionalPaths.push({value: ''});
    }
  }

  updateURL() {
    let schema = this.schema ? this.schema + '://' : this.schema;
    this.URL = `${schema}${this.domain}`
    if(this.additionalPaths) {
      this.additionalPaths.forEach(e => this.URL += `/${e.value}`);
    }
  }

  capitalizeFirstLetter(str: string): string {
    return str.charAt(0).toUpperCase() + str.slice(1);
  }

  lowerCaseFirstLetter(str: string): string {
    return str.charAt(0).toLowerCase() + str.slice(1);
  }

  /**
 * {0} prefix path
 * {1} entity name uppercase
 * {2} entity name lowercase
 */
  generateFunction() {
    this.angularFile = ANGULAR_MODEL.ANGULAR;
    
    let upperCaseEntityName = this.capitalizeFirstLetter(this.entityName);
    let lowerCaseEntityName = this.lowerCaseFirstLetter(this.entityName);

    this.angularFile = this.angularFile.replaceAll('{0}', this.URL);
    this.angularFile = this.angularFile.replaceAll('{1}', upperCaseEntityName);
    this.angularFile = this.angularFile.replaceAll('{2}', lowerCaseEntityName);

    if(this.generateHttpUtils)
      this.httpUtils = ANGULAR_MODEL.HTTP_UTILS;
    
    if(!this.domainOptions.includes(this.domain))
      this.domainOptions.push(this.domain);
    localStorage.setItem(this.domainOptionKey, JSON.stringify(this.domainOptions));
  }
}
