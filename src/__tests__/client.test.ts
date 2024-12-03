import {test, expect} from 'vitest';
import {Client} from '../client.js';
import {TestPort, TestServer, Protocol} from './mock.js';

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
