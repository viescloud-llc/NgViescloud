import { Component, OnInit } from '@angular/core';
import { Field, SPRINGBOOT_CLASS_V01 } from './spring-boot-v01.model';

@Component({
  selector: 'app-Spring-boot-snippet-v01',
  templateUrl: './Spring-boot-snippet-v01.component.html',
  styleUrls: ['./Spring-boot-snippet-v01.component.scss']
})
export class SpringBootSnippetV01Component implements OnInit {

  col = 150;
  row = 60;
  packageName: string = "";
  entityName: string = "";
  detectMethod: string = "auto";
  fields: Field[] = [];
  numberOfField: number = 0;
  inputText: string = "";

  upperCaseEntityName = '';
  lowerCaseEntityName = '';
  idFieldDataType = '';
  idFieldDataNameUpperCase = '';
  idFieldDataNameLowerCase = '';

  generatedFile: string = "";
  entityFile: string = "";
  daoFile: string = '';
  serviceFile: string = '';
  controllerFile: string = '';

  constructor() { }

  ngOnInit() {

  }

  updateFieds(): void {
    while (this.fields.length > this.numberOfField)
      this.fields.pop();

    while (this.fields.length < this.numberOfField) {
      let field: Field = { dataType: "String", name: "name" + this.fields.length }
      this.fields.push(field);
    }
  }

  extractField(): void {
    let newFields: Field[] = [];
    let splits = this.inputText.split(" ");
    for (let i = 0; i < splits.length; i++) {
      let value = splits[i].trim();
      if (value === "private" || value === "public") {
        let dataType = splits[i + 1].trim();
        let name = splits[i + 2].trim().replace(";", "");
        let field: Field = { dataType: dataType, name: name };
        newFields.push(field);
      }
    }

    this.fields = [...newFields];
    this.numberOfField = this.fields.length;
    this.detectMethod = "manual";
  }

  capitalizeFirstLetter(str: string): string {
    return str.charAt(0).toUpperCase() + str.slice(1);
  }

  lowerCaseFirstLetter(str: string): string {
    return str.charAt(0).toLowerCase() + str.slice(1);
  }


  generatedAll(): void {
    this.generatedFile = "dao";

    this.upperCaseEntityName = this.capitalizeFirstLetter(this.entityName);
    this.lowerCaseEntityName = this.lowerCaseFirstLetter(this.entityName);
    this.idFieldDataType = this.fields[0].dataType!;
    this.idFieldDataNameUpperCase = this.capitalizeFirstLetter(this.fields[0].name!);
    this.idFieldDataNameLowerCase = this.lowerCaseFirstLetter(this.fields[0].name!);

    this.generateEntity();
    this.generateDAO();
    this.generateService();
    this.generateController();
  }

  generateEntity(): void {
    this.entityFile = SPRINGBOOT_CLASS_V01.ENTITY;

    if (this.fields.length < 1)
      return;

    this.entityFile = this.replaceStandardVariable(this.entityFile);

    let method = "";
    if (this.fields.length > 1) {
      for (let i = 1; i < this.fields.length; i++) {
        let field = this.fields[i];
        let lowerCaseName = this.lowerCaseFirstLetter(field.name!);

        method += `\t@Column;\n`
        method += `\tprivate ${field.dataType} ${lowerCaseName};\n\n`
      }
    }

    this.entityFile = this.entityFile.replaceAll("{6}", method);
  }

  generateDAO(): void {
    this.daoFile = SPRINGBOOT_CLASS_V01.DAO;

    if (this.fields.length < 1)
      return;

    this.daoFile = this.replaceStandardVariable(this.daoFile);
    
    let method = this.generateDaoMethod();

    this.daoFile = this.daoFile.replaceAll("{7}", method);

    let fieldIdType = this.idFieldDataType;

    switch (fieldIdType) {
      case "int":
        fieldIdType = "Integer";
        break;
      case "float":
        fieldIdType = "Float";
        break;
      case "double":
        fieldIdType = "Double";
        break;
      case "boolean":
        fieldIdType = "Boolean";
        break;
      default:
        break;
    }

    this.daoFile = this.daoFile.replaceAll("{6}", fieldIdType);
  }

  generateDaoMethod() {
    let method = '';

    for (let i = 1; i < this.fields.length; i++) {
      let field = this.fields[i];

      if (!this.isPrimitive(field.dataType!))
        continue;

      let lowerCaseName = this.lowerCaseFirstLetter(field.name!);
      let upperCaseName = this.capitalizeFirstLetter(field.name!);
      let upperCaseEntityName = this.capitalizeFirstLetter(this.entityName);

      method += `\tpublic ${upperCaseEntityName} findBy${upperCaseName}(${field.dataType} ${lowerCaseName});\n`
      method += `\tpublic List<${upperCaseEntityName}> findAllBy${upperCaseName}(${field.dataType} ${lowerCaseName});\n\n`
    }

    let upperCaseEntityName = this.capitalizeFirstLetter(this.entityName);
    let lowerCaseEntityName = this.lowerCaseFirstLetter(this.entityName);
    let query = `\t@Query(value = "select * from {0} as {1} where {2}", nativeQuery = true)\n`;
    let method2 = `\tpublic List<{0}> getAllByMatchAll({1});\n\n`;
    let method3 = `\tpublic List<{0}> getAllByMatchAny({1});\n\n`;

    query = query.replaceAll("{0}", upperCaseEntityName);
    query = query.replaceAll("{1}", lowerCaseEntityName);

    method2 = method2.replaceAll("{0}", upperCaseEntityName);
    method3 = method3.replaceAll("{0}", upperCaseEntityName);

    let queryParameter = "";
    let queryParameter2 = "";
    let parameter = "";

    for (let i = 1; i < this.fields.length; i++) {
      let field = this.fields[i];
      let lowerCaseName = this.lowerCaseFirstLetter(field.name!);
      let dataType = field.dataType!;

      if (!this.isPrimitive(dataType))
        continue;

      queryParameter += `${lowerCaseEntityName}.${lowerCaseName} = :${lowerCaseName} and `;
      queryParameter2 += `${lowerCaseEntityName}.${lowerCaseName} = :${lowerCaseName} or `;
      parameter += `@Param("${lowerCaseName}") ${dataType} ${lowerCaseName}, `
    }

    queryParameter = queryParameter.substring(0, queryParameter.length - " and ".length);
    queryParameter2 = queryParameter2.substring(0, queryParameter2.length - " or ".length);
    parameter = parameter.substring(0, parameter.length - ", ".length);

    let queryT1 = query.replaceAll("{2}", queryParameter);
    let queryT2 = query.replaceAll("{2}", queryParameter2);
    method2 = method2.replaceAll("{1}", parameter);
    method3 = method3.replaceAll("{1}", parameter);

    method += queryT1 + method2 + queryT2 + method3;

    return method.trim();
  }

  generateService(): void {
    this.serviceFile = SPRINGBOOT_CLASS_V01.SERVICE;

    if (this.fields.length < 1)
      return;

    this.serviceFile = this.replaceStandardVariable(this.serviceFile);
  }

  generateController(): void {
    this.controllerFile = SPRINGBOOT_CLASS_V01.CONTROLLER;

    if (this.fields.length < 1)
      return;

    this.controllerFile = this.replaceStandardVariable(this.controllerFile);
  }

  /**
   * {0} package name
   * {1} uppercase entity name
   * {2} lowercase entity name
   * {3} id field data type
   * {4} id field name lowercase
   * {5} id field name uppercase
   */
  replaceStandardVariable(file: string) {
    file = file.replaceAll('{0}', this.packageName);
    file = file.replaceAll('{1}', this.upperCaseEntityName);
    file = file.replaceAll('{2}', this.lowerCaseEntityName);
    file = file.replaceAll('{3}', this.idFieldDataType);
    file = file.replaceAll('{4}', this.idFieldDataNameLowerCase);
    file = file.replaceAll('{5}', this.idFieldDataNameUpperCase);

    return file;
  }

  private validFieldDataType(dataType: string): boolean {
    switch (dataType) {
      case "float":
      case "Float":
      case "double":
      case "Double":
      case "int":
      case "Integer":
      case "Int":
        return false;
      default:
        return true;
    }
  }

  private isPrimitive(dataType: string): boolean {
    switch (dataType) {
      case "float":
      case "Float":
      case "double":
      case "Double":
      case "int":
      case "Integer":
      case "Int":
      case "String":
      case "char":
      case "Char":
      case "boolean":
        return true;
      default:
        return false;
    }
  }
}
