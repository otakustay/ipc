import {test, expect} from 'vitest';
import {RequestHandler} from '../handler.js';
import {ExecutionMessage, ExecutionType} from '../execution.js';
import {FailHandler, TestPort} from './mock.js';

class TestHandler extends RequestHandler<number, number> {
    async *handleRequest(start: number) {
        yield start + 1;
        await Promise.resolve();
        yield start + 2;
        this.notify('LOG', 'Hello');
        yield start + 3;
    }
}

class TaskIdHandler extends RequestHandler<void, string> {
    async *handleRequest() {
        yield this.getTaskId();
    }
}

class DangerousErrorHandler extends RequestHandler<void, string> {
    async *handleRequest() {
        yield 'fatal';
        await Promise.resolve();
        // eslint-disable-next-line @typescript-eslint/only-throw-error
        throw ['Error', 'Fatal'];
    }
}

test('get task id', async () => {
    const port = new TestPort();
    const request: ExecutionMessage = {
        taskId: 'test',
        executionId: 'test',
        executionType: ExecutionType.Request,
        action: 'test',
        payload: 1,
    };
    const handler = new TaskIdHandler(port, request, null);
    await handler.execute();
    expect(port.getResponseChunkValues()).toEqual(['test']);
});

test('respond chunk', async () => {
    const port = new TestPort();
    const request: ExecutionMessage = {
        taskId: 'test',
        executionId: 'test',
        executionType: ExecutionType.Request,
        action: 'test',
        payload: 1,
    };
    const handler = new TestHandler(port, request, null);
    await handler.execute();
    expect(port.getResponseChunkValues()).toEqual([2, 3, 4]);
});

test('notice', async () => {
    const port = new TestPort();
    const request: ExecutionMessage = {
        taskId: 'test',
        executionId: 'test',
        executionType: ExecutionType.Request,
        action: 'test',
        payload: 1,
    };
    const handler = new TestHandler(port, request, null);
    await handler.execute();
    const notices = port.getNoticeMessages();
    expect(notices.length).toBe(1);
    expect(notices.at(0)?.action).toBe('LOG');
    expect(notices.at(0)?.payload).toBe('Hello');
});

test('error', async () => {
    const port = new TestPort();
    const request: ExecutionMessage = {
        taskId: 'test',
        executionId: 'test',
        executionType: ExecutionType.Request,
        action: 'FAIL',
    };
    const handler = new FailHandler(port, request, null);
    await handler.execute();
    const errors = port.getErrorMessages();
    expect(errors.length).toBe(1);
    expect(errors.at(0)?.reason).toBe('Error');
});

test('primitive error', async () => {
    const port = new TestPort();
    const request: ExecutionMessage = {
        taskId: 'test',
        executionId: 'test',
        executionType: ExecutionType.Request,
        action: 'FAIL',
    };
    const handler = new DangerousErrorHandler(port, request, null);
    await handler.execute();
    const errors = port.getErrorMessages();
    expect(errors.length).toBe(1);
    expect(errors.at(0)?.reason).toBe('Error,Fatal');
});
