export class NodeError extends Error {
    constructor(public message: string) {
        super(message);
        this.name = 'NodeError';
        this.message = message;
        this.stack = (<any>new Error()).stack;
    }
}