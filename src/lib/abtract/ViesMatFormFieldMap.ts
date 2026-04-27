import { MatFormFieldInput, MatFormFieldInputKeys, MatFormFieldOutput, MatFormFieldOutputKeys, MatFormFields, MatFormFieldTypeMap } from "../model/mat.model";
import { StringUtils } from "../util/String.utils";

export abstract class ViesMatFormFieldMap {
    protected readonly MatFormFieldInput = MatFormFieldInput;
    protected readonly inputKeys = MatFormFieldInputKeys;
    protected readonly MatFormFieldOutput = MatFormFieldOutput;
    protected readonly outputKeys = MatFormFieldOutputKeys;
    protected map = new Map<String, MatFormFields>();

    field(name?: string) {
        if(name && this.map.has(name))  {
            return this.map.get(name)!;
        }
        
        let fields = MatFormFields.new();
        this.map.set(name ?? StringUtils.generateUUID(), fields);
        return fields;
    }

    inputField(name?: string) {
        return this.field(name).addInputDefault();
    }

    outputField(name?: string) {
        return this.field(name).addOutputDefault();
    }

    setFieldInputValue<K extends keyof MatFormFieldTypeMap>(name: string, key: K, value: MatFormFieldTypeMap[K]) {
        this.map.get(name)?.set(key, value);
    }
}