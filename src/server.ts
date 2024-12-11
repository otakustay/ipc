import {ExecutionMessage, ExecutionRequest, ExecutionType} from './execution.js';
import {AnyHandle, RequestHandler, RequestHandlerClass} from './handler.js';
import {Port} from './port.js';

/**
 * A server maps message from a port to request handlers.
 */
export abstract class Server<P extends Record<keyof P, AnyHandle>, C = null> {
    protected port: Port | null = null;

    protected readonly handlers = new Map<string, RequestHandlerClass<AnyHandle, C>>();

    constructor() {
        this.initializeHandlers();
    }

    /**
     * Connect to a port, listening on incoming requests and send responses from handlers back.
     *
     * @param port The port server will connect to.
     */
    async connect(port: Port): Promise<void> {
        if (this.port) {
            throw new Error('Server already connected to a port');
        }

        this.port = port;
        this.port.listen(message => void this.handleRequest(message));
        return Promise.resolve();
    }

    protected registerHandler(handler: RequestHandlerClass<AnyHandle, C>) {
        this.handlers.set(handler.action, handler);
    }

    protected async createHandlerInstance(request: ExecutionRequest): Promise<RequestHandler<any, any, C> | null> {
        /* c8 ignore start */
        if (!this.port) {
            return null;
        }
        /* c8 ignore stop */

        const Handler = this.handlers.get(request.action);

        if (!Handler) {
            return null;
        }

        const context = await this.createContext(request);
        return new Handler(this.port, request, context);
    }

    private async handleRequest(request: ExecutionMessage) {
        if (request.executionType !== ExecutionType.Request) {
            return;
        }

        const handler = await this.createHandlerInstance(request);

        if (handler) {
            await handler.execute().catch(() => {});
        }
    }

    protected abstract createContext(request: ExecutionRequest): Promise<C>;

    protected abstract initializeHandlers(): void;
}
