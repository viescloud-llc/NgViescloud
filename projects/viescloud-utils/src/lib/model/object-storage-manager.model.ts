import { ReflectionUtils } from "../util/Reflection.utils";
import { SharedUser, UserAccess } from "./authenticator.model";
import { DateTime } from "./vies.model";

export class Metadata extends UserAccess {
    id?:                    number = 0;
    fileName?:              string = '';
    contentType?:           string = '';
    size?:                  number = 0;
    path?:                  string = '';
    temporaryAccessLink:    string = '';
    createdAt?:             DateTime = new DateTime();
    updatedAt?:             DateTime = new DateTime();

    constructor() {
        super();
        ReflectionUtils.copyAllParentPrototype(this, 10);
    }
}
