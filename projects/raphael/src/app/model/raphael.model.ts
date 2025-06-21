import { GeneralSetting } from "projects/viescloud-utils/src/lib/model/setting.model";
import { ReflectionUtils } from "projects/viescloud-utils/src/lib/util/Reflection.utils";

export class RaphaelSetting extends GeneralSetting {
    
    constructor() {
        super();
        ReflectionUtils.copyAllParentPrototype(this, 2);
    }
}

export type TTS = {
    text: string,
    voice?: string,
    model?: string
}