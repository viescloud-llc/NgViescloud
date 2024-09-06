export interface Metadata {
    ownerUserId:      number;
    sharedUserIds:    number[];
    id:               number;
    originalFilename: string;
    contentType:      string;
    size:             number;
    path:             string;
    publicity:        boolean;
}
