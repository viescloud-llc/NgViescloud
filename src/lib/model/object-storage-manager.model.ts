import { ReflectionUtils } from "../util/Reflection.utils";
import { SharedUser, UserAccess } from "./authenticator.model";
import { ViesDateTime } from "./vies.model";

export class Metadata extends UserAccess {
    id?:                    number = 0;
    fileName?:              string = '';
    contentType?:           string = '';
    size?:                  number = 0;
    path?:                  string = '';
    temporaryAccessLink:    string = '';
    createdAt?:             ViesDateTime = new ViesDateTime();
    updatedAt?:             ViesDateTime = new ViesDateTime();

    constructor() {
        super();
        ReflectionUtils.copyAllParentPrototype(this, 10);
    }
}
