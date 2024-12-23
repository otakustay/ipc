import {test, expect} from 'vitest';
import {
    ExecutionManager,
    isExecutionMessage,
    isExecutionRequest,
    isExecutionResponse,
    isExecutionError,
    isExecutionNotice,
    ExecutionMessage,
    ExecutionType,
} from '../execution.js';

test('put and consume', async () => {
    const manager = new ExecutionManager();
    const task = manager.start('key');
    manager.put('key', 0, 1);
    manager.put('key', 1, 2);
    manager.put('key', 2, 3);
    manager.complete('key');
    const iterator = task[Symbol.asyncIterator]();
    expect(await iterator.next()).toEqual({done: false, value: 1});
    expect(await iterator.next()).toEqual({done: false, value: 2});
    expect(await iterator.next()).toEqual({done: false, value: 3});
    expect(await iterator.next()).toEqual({done: true, value: undefined});
});

test('consume before put', async () => {
    const manager = new ExecutionManager();
    const task = manager.start('key');
    const iterator = task[Symbol.asyncIterator]();
    const pendingValue = iterator.next();
    manager.put('key', 0, 1);
    manager.complete('key');
    expect(await pendingValue).toEqual({done: false, value: 1});
    expect(await iterator.next()).toEqual({done: true, value: undefined});
});

test('multiple iteration', async () => {
    const manager = new ExecutionManager();
    const task = manager.start('key');
    const first = task[Symbol.asyncIterator]();
    const second = task[Symbol.asyncIterator]();
    const firstPendingValue = first.next();
    const secondPendingValue = second.next();
    manager.put('key', 0, 1);
    manager.complete('key');
    expect(await firstPendingValue).toEqual({done: false, value: 1});
    expect(await secondPendingValue).toEqual({done: false, value: 1});
    expect(await first.next()).toEqual({done: true, value: undefined});
    expect(await second.next()).toEqual({done: true, value: undefined});
});

test('put after done', async () => {
    const manager = new ExecutionManager();
    const task = manager.start('key');
    manager.put('key', 0, 1);
    manager.complete('key');
    manager.put('key', 1, 2);
    const iterator = task[Symbol.asyncIterator]();
    expect(await iterator.next()).toEqual({done: false, value: 1});
    expect(await iterator.next()).toEqual({done: true, value: undefined});
});

test('error first', async () => {
    const manager = new ExecutionManager();
    const task = manager.start('key');
    manager.error('key', 0, 'Error');
    const iterator = task[Symbol.asyncIterator]();
    await expect(iterator.next()).rejects.toThrow('Error');
});

test('consume before error', async () => {
    const manager = new ExecutionManager();
    const task = manager.start('key');
    const iterator = task[Symbol.asyncIterator]();
    const pendingValue = iterator.next();
    manager.error('key', 0, 'Error');
    await expect(pendingValue).rejects.toThrow('Error');
});

test('is message', () => {
    const messate: ExecutionMessage = {
        taskId: 'test',
        executionId: 'test',
        executionType: ExecutionType.Request,
        action: 'test',
        payload: 1,
    };
    expect(isExecutionMessage(messate)).toBe(true);
});

test('null not message', () => {
    expect(isExecutionMessage(null)).toBe(false);
});

test('not message without taskId', () => {
    const message = {
        name: 'test',
    };
    expect(isExecutionMessage(message)).toBe(false);
});

test('not message with incorrect type', () => {
    const message = {
        taskId: 'test',
        executionId: 'test',
        executionType: 'request',
        action: 'test',
    };
    expect(isExecutionMessage(message)).toBe(false);
});

test('is request', () => {
    const request: ExecutionMessage = {
        taskId: 'test',
        executionId: 'test',
        executionType: ExecutionType.Request,
        action: 'test',
        payload: 1,
    };
    expect(isExecutionRequest(request)).toBe(true);
});

test('is response', () => {
    const message: ExecutionMessage = {
        taskId: 'test',
        executionId: 'test',
        executionType: ExecutionType.Response,
        data: 1,
        chunkIndex: 0,
        done: false,
    };
    expect(isExecutionResponse(message)).toBe(true);
});

test('is notice', () => {
    const notice: ExecutionMessage = {
        taskId: 'test',
        executionId: 'test',
        executionType: ExecutionType.Notice,
        action: 'test',
        payload: 1,
    };
    expect(isExecutionNotice(notice)).toBe(true);
});

test('is error', () => {
    const error: ExecutionMessage = {
        taskId: 'test',
        executionId: 'test',
        executionType: ExecutionType.Error,
        reason: 'test',
        chunkIndex: 0,
    };
    expect(isExecutionError(error)).toBe(true);
});
