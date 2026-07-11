import { UserAccess } from "../../../lib/model/authenticator.model";
import { MatInputHide, MatTableHide } from "../../../lib/model/mat.model";
import { ViesDateTime } from "../../../lib/model/vies.model";
import { ReflectionUtils } from "../../../lib/util/Reflection.utils";

export class TrackedTimeStamp {
    @MatInputHide()
    @MatTableHide()
    createdAt?: ViesDateTime = new ViesDateTime();

    @MatInputHide()
    @MatTableHide()
    updatedAt?: ViesDateTime = new ViesDateTime();

    constructor() {
        ReflectionUtils.copyAllParentPrototype(this, 10);
    }
}

export class TrackedTimeStampUserAccess extends UserAccess {
    @MatInputHide()
    @MatTableHide()
    inputUserId: string = '';

    @MatInputHide()
    @MatTableHide()
    createdAt?: ViesDateTime = new ViesDateTime();

    @MatInputHide()
    @MatTableHide()
    updatedAt?: ViesDateTime = new ViesDateTime();
}
