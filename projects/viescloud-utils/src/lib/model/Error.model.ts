export class NotAuthenticatedError extends Error {
    constructor(message: string = "User is not logged in. Request aborted") {
        super(message);
        this.name = 'NotAuthenticatedError';
        Object.setPrototypeOf(this, NotAuthenticatedError.prototype);
    }
}