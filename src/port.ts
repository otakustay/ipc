import {ChildProcess} from 'node:child_process';
import {ExecutionMessage} from './execution.js';

/**
 * A port simulates a communication channel, which can send and receive messages.
 */
export interface Port {
    /**
     * Sends a message to the port.
     */
    send(message: ExecutionMessage): void;

    /**
     * Registers a callback to be called when messages are received from the port.
     */
    listen(callback: (message: ExecutionMessage) => void): void;
}

/**
 * A port that simulates message communication in a single process.
 */
export class DirectPort implements Port {
    private readonly listeners = new Set<(message: any) => void>();

    send(message: ExecutionMessage) {
        void this.fireOnNextTick(message);
    }

    listen(callback: (message: ExecutionMessage) => void): void {
        this.listeners.add(callback);
    }

    private async fireOnNextTick(message: ExecutionMessage) {
        for (const listener of this.listeners) {
            listener(message);
        }

        return Promise.resolve();
    }
}

/**
 * Wraps a child process to a port.
 */
export class ChildProcessPort implements Port {
    private readonly process: ChildProcess;

    constructor(process: ChildProcess) {
        this.process = process;
    }

    send(message: ExecutionMessage) {
        this.process.send(message);
    }

    listen(callback: (message: ExecutionMessage) => void): void {
        this.process.on('message', callback);
    }
}

// We already have a test case for this, but it runs in a child process, so ignore coverage here.
/* v8 ignore start */
export class ProcessPort implements Port {
    constructor() {
        if (!process.send) {
            throw new Error('Current process is not spawned with IPC channel');
        }
    }

    send(message: ExecutionMessage): void {
        process.send?.(message);
    }

    listen(callback: (message: ExecutionMessage) => void): void {
        process.on('message', callback);
    }
}
/* v8 ignore stop */
