export class ObjectUtils {
    static hasOwn(obj: any, prop: any) {
        return Object.prototype.hasOwnProperty.call(obj, prop);
    }
}