import {ExecutionMessage, ExecutionType} from './execution.js';
import {AnyHandle, RequestHandlerClass} from './handler.js';
import {Port} from './port.js';

/**
 * A server maps message from a port to request handlers.
 */
export abstract class Server<P extends Record<keyof P, AnyHandle>> {
    private port: Port | null = null;

    private readonly handlers = new Map<string, RequestHandlerClass<AnyHandle>>();

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

    protected registerHandler(handler: RequestHandlerClass<AnyHandle>) {
        this.handlers.set(handler.action, handler);
    }

    private async handleRequest(request: ExecutionMessage) {
        if (!this.port || request.executionType !== ExecutionType.Request) {
            return;
        }

        const Handler = this.handlers.get(request.action);

        if (!Handler) {
            return;
        }

        const handler = new Handler(this.port, request);
        await handler.execute().catch(() => {});
    }

    protected abstract initializeHandlers(): void;
}
