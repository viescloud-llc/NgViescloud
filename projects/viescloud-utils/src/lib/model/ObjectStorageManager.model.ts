import { SharedUser } from "./Mat.model";

export interface Metadata {
    ownerUserId?:      number;
    sharedUsers?:      SharedUser[];
    id?:               number;
    originalFilename?: string;
    contentType?:      string;
    size?:             number;
    path?:             string;
    publicity?:        boolean;
}
