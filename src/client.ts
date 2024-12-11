import {nanoid} from 'nanoid';
import {ExecutionManager, ExecutionMessage, ExecutionType} from './execution.js';
import {Port} from './port.js';
import {AnyHandle} from './handler.js';

type Key<P extends Record<keyof P, AnyHandle>> = Exclude<keyof P, symbol | number>;

type In<P extends Record<keyof P, AnyHandle>, K extends Key<P>> = Parameters<P[K]>[0];

type Iteratee<T> = T extends AsyncIterable<infer I> ? I : never;

// As constrained by `AnyHandle`, the out type must be an `AsyncIterable`
type Out<P extends Record<keyof P, AnyHandle>, K extends Key<P>> = ReturnType<P[K]>;

/**
 * A client is an initiator of a function call via a port.
 */
export class Client<P extends Record<keyof P, AnyHandle>> {
    private readonly port: Port;

    private readonly executions = new ExecutionManager();

    constructor(port: Port) {
        this.port = port;
        this.port.listen(message => this.receiveMessage(message));
    }

    /**
     * Call an action as a simple function.
     *
     * @param taskId Identifier of the task
     * @param action Name of the action to execute
     * @param payload Payload to send
     * @returns The first chunk of the response
     */
    // @ts-expect-error We can't enforce the iterable to yield at least one value
    async call<K extends Key<P>>(taskId: string, action: K, payload?: In<P, K>): Promise<Iteratee<Out<P, K>>> {
        const iterator = this.callStreaming<K>(taskId, action, payload);
        for await (const value of iterator) {
            // eslint-disable-next-line @typescript-eslint/no-unsafe-return
            return value;
        }
    }

    /**
     * Call an action as generator function.
     *
     * @param taskId Identifier of the task
     * @param action Name of the action to execute
     * @param payload Payload to send
     * @returns An async iterator over the chunks of the response
     */
    // @ts-expect-error We believe `Out<P, K>` is an `AsyncIterable` already.
    async *callStreaming<K extends Key<P>>(taskId: string, action: K, payload?: In<P, K>): Out<P, K> {
        const executionId = nanoid();
        const request: ExecutionMessage = {
            taskId,
            executionId,
            executionType: ExecutionType.Request,
            action,
            payload,
        };
        this.port.send(request);

        yield* this.executions.start<Out<P, K>>(executionId);
    }

    private receiveMessage(message: ExecutionMessage) {
        if (message.executionType === ExecutionType.Error) {
            this.executions.error(message.executionId, message.chunkIndex, message.reason);
        }
        else if (message.executionType === ExecutionType.Response) {
            if (message.done) {
                this.executions.complete(message.executionId);
            }
            else {
                this.executions.put(message.executionId, message.chunkIndex, message.data);
            }
        }
    }
}
