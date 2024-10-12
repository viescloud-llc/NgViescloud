export class TaskUtils {
    private constructor() { }

    static reTryIfFail(fn: () => any, timeout?: number) {
        try {
            fn();
        }
        catch (error) {
            setTimeout(() => {
                this.reTryIfFail(fn, timeout);
            }, timeout ?? 1000);
        }
    }
}