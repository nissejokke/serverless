export class HttpError extends Error {
    status: number;

    error?: Error;
    
    constructor(message: string, status?: number, error?: Error) {
        super(message);
        this.status = status || 500;
        this.error = error;
    }
}
