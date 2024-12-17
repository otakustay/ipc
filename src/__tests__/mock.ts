import defer, {DeferredPromise} from 'p-defer';
import {
    ExectuionResponse,
    ExecutionError,
    ExecutionMessage,
    ExecutionNotice,
    ExecutionType,
} from '../execution.js';
import {ProtocolOf, RequestHandler} from '../handler.js';
import {DirectPort} from '../port.js';
import {Server} from '../server.js';

function isCompleted(message: ExecutionMessage) {
    if (message.executionType === ExecutionType.Error) {
        return true;
    }
    return message.executionType === ExecutionType.Response && message.done;
}

export class TestPort extends DirectPort {
    private readonly messages: ExecutionMessage[] = [];

    private readonly observers = new Map<string, DeferredPromise<unknown>>();

    constructor() {
        super();

        const callback = (message: ExecutionMessage) => {
            this.messages.push(message);
            if (isCompleted(message)) {
                this.observers.get(message.taskId)?.resolve();
            }
        };
        this.listen(callback);
    }

    async sendWait(message: ExecutionMessage) {
        this.send(message);
        await Promise.resolve();
    }

    async sendRequestWaitResponse(message: ExecutionMessage) {
        const deferred = defer();
        this.observers.set(message.taskId, deferred);
        this.send(message);
        return deferred.promise;
    }

    getMessages(): ExecutionMessage[] {
        return this.messages;
    }

    getResponseMessages(): ExectuionResponse[] {
        const isResponse = (value: ExecutionMessage): value is ExectuionResponse => {
            return value.executionType === ExecutionType.Response;
        };
        return this.messages.filter(isResponse).filter(v => !v.done);
    }

    getResponseChunkValues(): any[] {
        // eslint-disable-next-line @typescript-eslint/no-unsafe-return
        return this.getResponseMessages().map(v => v.data);
    }

    getNoticeMessages(): ExecutionNotice[] {
        const isNotice = (value: ExecutionMessage): value is ExecutionNotice => {
            return value.executionType === ExecutionType.Notice;
        };
        return this.messages.filter(isNotice);
    }

    getErrorMessages(): ExecutionError[] {
        const isError = (value: ExecutionMessage): value is ExecutionError => {
            return value.executionType === ExecutionType.Error;
        };
        return this.messages.filter(isError);
    }
}

export class InitializeHandler extends RequestHandler<void, void> {
    static action = 'initialize' as const;

    // eslint-disable-next-line require-yield
    async *handleRequest() {
        this.notify('initializing', {from: 'handler'});
    }
}

export class AddHandler extends RequestHandler<number, number> {
    static action = 'add' as const;

    async *handleRequest(start: number) {
        yield start + 1;
        await Promise.resolve();
        yield start + 2;
        await Promise.resolve();
        yield start + 3;
    }
}

export class SubtractHandler extends RequestHandler<number, number> {
    static action = 'subtract' as const;

    async *handleRequest(start: number) {
        yield start - 1;
        await Promise.resolve();
        yield start - 2;
        await Promise.resolve();
        yield start - 3;
    }
}

export class FailHandler extends RequestHandler<void, string> {
    static action = 'fail' as const;

    async *handleRequest() {
        yield 'Hello World';
        await Promise.resolve();
        throw new Error('Error');
    }
}

export class GreetingHandler extends RequestHandler<string, string> {
    static action = 'greeting' as const;

    async *handleRequest(name: string) {
        await Promise.resolve();
        yield `Hello ${name}`;
    }
}

export type Protocol = ProtocolOf<
    | typeof InitializeHandler
    | typeof AddHandler
    | typeof SubtractHandler
    | typeof FailHandler
    | typeof GreetingHandler
>;

export class TestServer extends Server<Protocol> {
    protected initializeHandlers(): void {
        this.registerHandler(InitializeHandler);
        this.registerHandler(AddHandler);
        this.registerHandler(SubtractHandler);
        this.registerHandler(FailHandler);
        this.registerHandler(GreetingHandler);
    }

    protected async createContext() {
        return null;
    }
}
