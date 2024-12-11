import {test, expect} from 'vitest';
import {ExecutionMessage, ExecutionType} from '../execution.js';
import {ProtocolOf, RequestHandler} from '../handler.js';
import {Server} from '../server.js';
import {TestPort, TestServer} from './mock.js';

test('call handler', async () => {
    const port = new TestPort();
    const server = new TestServer();
    await server.connect(port);
    const request: ExecutionMessage = {
        taskId: 'test',
        executionId: 'test',
        executionType: ExecutionType.Request,
        action: 'subtract',
        payload: 5,
    };
    await port.sendRequestWaitResponse(request);
    expect(port.getResponseChunkValues()).toEqual([4, 3, 2]);
});

test('no handler', async () => {
    const port = new TestPort();
    const server = new TestServer();
    await server.connect(port);
    const request: ExecutionMessage = {
        taskId: 'test',
        executionId: 'test',
        executionType: ExecutionType.Request,
        action: 'multiply',
        payload: 1,
    };
    await port.sendWait(request);
    expect(port.getResponseMessages().length).toBe(0);
});

test('handle only request', async () => {
    const port = new TestPort();
    const server = new TestServer();
    await server.connect(port);
    const response: ExecutionMessage = {
        taskId: 'test',
        executionId: 'test',
        executionType: ExecutionType.Response,
        chunkIndex: 0,
        done: true,
        data: 1,
    };
    await port.sendWait(response);
    expect(port.getResponseMessages().length).toBe(0);
    const message: ExecutionMessage = {
        taskId: 'test',
        executionId: 'test',
        executionType: ExecutionType.Notice,
        action: 'log',
        payload: 2,
    };
    await port.sendWait(message);
    expect(port.getResponseChunkValues().length).toBe(0);
});

test('multiple connect', async () => {
    const port = new TestPort();
    const server = new TestServer();
    await server.connect(port);
    await expect(() => server.connect(port)).rejects.toThrow();
});

test('error', async () => {
    const port = new TestPort();
    const server = new TestServer();
    await server.connect(port);
    const message: ExecutionMessage = {
        taskId: 'test',
        executionId: 'test',
        executionType: ExecutionType.Request,
        action: 'fail',
    };
    await port.sendRequestWaitResponse(message);
    const errors = port.getErrorMessages();
    expect(errors.length).toBe(1);
    expect(errors.at(0)?.reason).toBe('Error');
});

test('context', async () => {
    class AddHandler extends RequestHandler<string, number, {radix: number}> {
        static action = 'add' as const;

        async *handleRequest(payload: string): AsyncIterable<number> {
            yield parseInt(payload, this.context.radix) + 1;
        }
    }

    class CalculatorServer extends Server<ProtocolOf<typeof AddHandler>, {radix: number}> {
        private readonly radix: number;

        constructor(radix: number) {
            super();
            this.radix = radix;
        }

        protected initializeHandlers(): void {
            this.registerHandler(AddHandler);
        }

        protected createContext(): Promise<{radix: number}> {
            return Promise.resolve({radix: this.radix});
        }
    }

    const port = new TestPort();
    const server = new CalculatorServer(16);
    await server.connect(port);
    const request: ExecutionMessage = {
        taskId: 'test',
        executionId: 'test',
        executionType: ExecutionType.Request,
        action: 'add',
        payload: 'ff',
    };
    await port.sendRequestWaitResponse(request);
    expect(port.getResponseChunkValues()).toEqual([256]);
});
