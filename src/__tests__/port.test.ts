import fs from 'node:fs';
import path from 'node:path';
import url from 'node:url';
import childProcess from 'node:child_process';
import defer from 'p-defer';
import {findUp} from 'find-up';
import {test, expect, vi} from 'vitest';
import {DirectPort, ChildProcessPort} from '../port.js';
import {ExectuionResponse, ExecutionMessage, ExecutionType} from '../execution.js';

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

test('child process port', async () => {
    const process = childProcess.fork(echoScript);
    const port = new ChildProcessPort(process);
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

test('child process port', async () => {
    const process = childProcess.fork(echoScript);
    const port = new ChildProcessPort(process);
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

test('process port', async () => {
    const projectRoot = await findUp(
        v => (fs.existsSync(path.join(v, 'package.json')) ? v : undefined),
        {type: 'directory'}
    );
    // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
    const serverScript = path.resolve(projectRoot!, 'src', '__tests__', 'server.js');
    const child = childProcess.fork(
        serverScript,
        {
            execArgv: ['--import', '@swc-node/register/esm-register'],
            // stdio: 'ipc',
        }
    );
    const output: ExectuionResponse[] = [];
    // eslint-disable-next-line @typescript-eslint/no-unsafe-argument
    child.stdout?.on('data', chunk => output.push(chunk));
    const message: ExecutionMessage = {
        taskId: 'test',
        executionId: 'test',
        executionType: ExecutionType.Request,
        action: 'test',
        payload: 'test',
    };
    child.on('message', v => output.push(v as ExectuionResponse));
    child.send(message);
    await new Promise(resolve => child.on('exit', resolve));
    expect(output.at(0)?.data).toEqual('test');
});
