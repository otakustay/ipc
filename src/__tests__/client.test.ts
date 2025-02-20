import {test, expect} from 'vitest';
import {Client} from '../client.js';
import {TestPort, TestServer, Protocol} from './mock.js';
import {ExecutionNotice, ExecutionType} from '../execution.js';

test('call promise', async () => {
    const port = new TestPort();
    const server = new TestServer();
    await server.connect(port);
    const client = new Client<Protocol>(port);
    const result = await client.call('test', 'greeting', 'user');
    expect(result).toBe('Hello user');
});

test('call streaming', async () => {
    const result: number[] = [];
    const port = new TestPort();
    const server = new TestServer();
    await server.connect(port);
    const client = new Client<Protocol>(port);
    for await (const value of client.callStreaming('test', 'add', 1)) {
        result.push(value);
    }
    expect(result).toEqual([2, 3, 4]);
});

test('void return', async () => {
    const port = new TestPort();
    const server = new TestServer();
    await server.connect(port);
    const client = new Client<Protocol>(port);
    const result = await client.call('test', 'initialize');
    expect(result).toBeUndefined();
});

test('throw on error', async () => {
    const port = new TestPort();
    const server = new TestServer();
    await server.connect(port);
    const client = new Client<Protocol>(port);
    try {
        for await (const value of client.callStreaming('test', 'fail')) {
            expect(value).toBe('Hello World');
        }
        expect.fail('Should throw error');
    }
    catch (ex) {
        expect(ex instanceof Error && ex.message).toBe('Error');
    }
});

test('handle notice', async () => {
    const results: ExecutionNotice[] = [];
    class TestClient extends Client<Protocol> {
        protected handleNotice(notice: ExecutionNotice): void {
            results.push(notice);
        }
    }
    const port = new TestPort();
    const server = new TestServer();
    await server.connect(port);
    const client = new TestClient(port);
    await client.call('test', 'initialize');
    expect(results.length).toBe(1);
    const notice = results[0];
    expect(notice.taskId).toEqual('test');
    expect(notice.executionType).toBe(ExecutionType.Notice);
    expect(notice.action).toBe('initializing');
    expect(notice.payload).toEqual({from: 'handler'});
});

test('namespace match', async () => {
    const port = new TestPort();
    const server = new TestServer({namespace: 'test'});
    await server.connect(port);
    const client = new Client<Protocol>(port, {namespace: 'test'});
    const message = await client.call('test', 'greeting', 'user');
    expect(message).toBe('Hello user');
});

test('bind task id', async () => {
    const port = new TestPort();
    const server = new TestServer();
    await server.connect(port);
    const client = new Client<Protocol>(port).forTask('test');
    const result = await client.call('greeting', 'user');
    expect(result).toBe('Hello user');
    const values: number[] = [];
    for await (const value of client.callStreaming('add', 1)) {
        values.push(value);
    }
    expect(values).toEqual([2, 3, 4]);
});
