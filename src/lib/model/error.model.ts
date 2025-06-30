export class NotAuthenticatedError extends Error {
    constructor(message: string = "User is not logged in. Request aborted") {
        super(message);
        this.name = 'NotAuthenticatedError';
        Object.setPrototypeOf(this, NotAuthenticatedError.prototype);
    }
}

export class ViesErrorResponse {
  time: string = '';
  status: ViesErrorStatus = new ViesErrorStatus();
  message: string = '';
  detailMessageCode: string = '';
  reason: string = '';
  localizedMessage: string = '';
}

export class ViesErrorStatus {
  value: number = 0;
  informational: boolean = false;
  successful: boolean = false;
  redirection: boolean = false;
  clientError: boolean = false;
  serverError: boolean = false;
  error: boolean = false;
}
