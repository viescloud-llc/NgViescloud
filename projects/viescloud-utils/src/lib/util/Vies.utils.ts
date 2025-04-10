import { MatOption } from "../model/Mat.model";
import { DataUtils } from "./Data.utils";

export class ViesUtils {
    static  enumValuesToMatOptions<V>(Enum: any, noneLabel?: string | number, noneValue?: V) {
        let matOptions: MatOption<V>[] = [];
        let enumArray = DataUtils.getEnumValues(Enum);
        if(noneLabel) {
            matOptions.push({
                value: noneValue!,
                valueLabel: noneLabel.toString()
            })
        }
        enumArray.forEach(option => {
            matOptions.push({
                value: option as V,
                valueLabel: option.toString()
            })
        })
        return matOptions;
    }
}