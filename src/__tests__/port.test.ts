import path from 'node:path';
import url from 'node:url';
import childProcess from 'node:child_process';
import defer from 'p-defer';
import {test, expect, vi} from 'vitest';
import {DirectPort, ProcessPort} from '../port.js';
import {ExecutionMessage, ExecutionType} from '../execution.js';

const echoScript = path.resolve(url.fileURLToPath(import.meta.url), '..', 'echo.js');

test('direct port', async () => {
    const port = new DirectPort();
    const fn = vi.fn();
    port.listen(fn);
    const message: ExecutionMessage = {
        taskId: 'test',
        executionId: 'test',
        executionType: ExecutionType.Request,
        action: 'test',
        payload: 1,
    };
    port.send(message);
    await Promise.resolve();
    expect(fn).toBeCalledWith(message);
});

test('process port', async () => {
    const process = childProcess.fork(echoScript);
    const port = new ProcessPort(process);
    const deferred = defer<ExecutionMessage>();
    port.listen(deferred.resolve);
    const message: ExecutionMessage = {
        taskId: 'test',
        executionId: 'test',
        executionType: ExecutionType.Request,
        action: 'test',
        payload: 1,
    };
    port.send(message);
    const result = await deferred.promise;
    expect(result.executionType === ExecutionType.Response && result.data).toEqual(2);
});
