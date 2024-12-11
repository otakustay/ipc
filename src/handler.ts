import {ExecutionType, ExecutionMessage, ExecutionRequest} from './execution.js';
import {Port} from './port.js';

/**
 * Handle a type of request when message arrives, it should execute as a iterator and yield response chunks.
 */
export abstract class RequestHandler<I, O, C = null> {
    protected context: C;

    private readonly port: Port;

    private readonly request: ExecutionRequest;

    private currentChunkIndex = 0;

    constructor(port: Port, request: ExecutionRequest, context: C) {
        this.port = port;
        this.request = request;
        this.context = context;
    }

    /**
     * Execute incapsulated request,] and yield response chunks.
     */
    async execute() {
        try {
            // eslint-disable-next-line @typescript-eslint/no-unsafe-argument
            for await (const chunk of this.handleRequest(this.request.payload)) {
                this.respondChunk(chunk, false);
            }

            this.respondChunk(undefined, true);
        }
        catch (ex) {
            const reason = ex instanceof Error ? ex.message : `${ex}`;
            this.respondError(reason);
        }
    }

    protected getTaskId() {
        return this.request.taskId;
    }

    /**
     * Respond a chunk to client, will result in a `yield` value on client side.
     *
     * @param chunk Response chunk data
     * @param done Wether this is the last chunk
     */
    protected respondChunk(data: any, done: boolean) {
        const message: ExecutionMessage = {
            taskId: this.request.taskId,
            executionId: this.request.executionId,
            executionType: ExecutionType.Response,
            chunkIndex: this.currentChunkIndex,
            data,
            done,
        };
        this.currentChunkIndex++;
        this.port.send(message);
    }

    /**
     * Respond an error message to client, will result a `throw` on client side.
     *
     * @param reason The reason strinz describing error
     */
    protected respondError(reason: string) {
        const message: ExecutionMessage = {
            taskId: this.request.taskId,
            executionId: this.request.executionId,
            executionType: ExecutionType.Error,
            chunkIndex: this.currentChunkIndex,
            reason,
        };
        this.currentChunkIndex++;
        this.port.send(message);
    }

    /**
     * Send a notice message back to client without influencing response progress.
     *
     * @param action Notice action type
     * @param value Payload value of message
     */
    protected notify(action: string, payload?: any) {
        const message: ExecutionMessage = {
            taskId: this.request.taskId,
            executionId: this.request.executionId,
            executionType: ExecutionType.Notice,
            action,
            payload,
        };
        this.port.send(message);
    }

    /**
     * The implementation logic of request handler.
     *
     * @param payload Received argument of current request
     */
    abstract handleRequest(payload: I): AsyncIterable<O>;
}

export type AnyHandle = (input: any) => AsyncIterable<any>;

type Iteratee<T> = T extends AsyncIterable<infer U> ? U : never;

type HandleIn<F extends AnyHandle> = Parameters<F>[0];

type HandleOut<F extends AnyHandle> = Iteratee<ReturnType<F>>;

export interface RequestHandlerClass<F extends AnyHandle, C = null> {
    action: string;

    new(port: Port, request: ExecutionRequest, context: C): RequestHandler<HandleIn<F>, HandleOut<F>, C>;
}

type Handle<H extends RequestHandlerClass<AnyHandle>> = InstanceType<H>['handleRequest'];

type In<H extends RequestHandlerClass<AnyHandle>> = Parameters<Handle<H>>[0];

type Out<H extends RequestHandlerClass<AnyHandle>> = AsyncIterable<Iteratee<ReturnType<Handle<H>>>>;

export type ProtocolOf<H extends RequestHandlerClass<AnyHandle, any>> = {
    [K in H['action']]: H extends {action: K} ? (In<H>['length'] extends 0 ? () => Out<H>
            : (input: In<H>) => Out<H>)
        : never;
};
