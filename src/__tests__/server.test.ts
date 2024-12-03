import {test, expect} from 'vitest';
import {ExecutionMessage, ExecutionType} from '../execution.js';
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