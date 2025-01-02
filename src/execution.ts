import {AsyncIteratorController} from '@otakustay/async-iterator';

export enum ExecutionType {
    Request,
    Response,
    Error,
    Notice,
}

export interface ExecutionRequest {
    namespace?: string;
    taskId: string;
    executionId: string;
    executionType: ExecutionType.Request;
    action: string;
    payload?: any;
}

export interface ExectuionResponse {
    taskId: string;
    executionId: string;
    executionType: ExecutionType.Response;
    chunkIndex: number;
    data: any;
    done: boolean;
}

export interface ExecutionError {
    taskId: string;
    executionId: string;
    executionType: ExecutionType.Error;
    chunkIndex: number;
    reason: string;
}

export interface ExecutionNotice {
    taskId: string;
    executionId: string;
    executionType: ExecutionType.Notice;
    action: string;
    payload?: any;
}

export type ExecutionMessage = ExecutionRequest | ExectuionResponse | ExecutionError | ExecutionNotice;

/**
 * Manages multiple executions by key, controls the data and state of them.
 */
export class ExecutionManager {
    private readonly tasks = new Map<string, AsyncIteratorController>();

    /**
     * Start an execution.
     *
     * @param key The key of execution
     * @returns An `AsyncIterable` object bound to exeuction.
     */
    start<T>(key: string): AsyncIterable<T> {
        const task: AsyncIteratorController<T> = this.tasks.get(key) ?? new AsyncIteratorController();
        this.tasks.set(key, task);
        return task.toIterable();
    }

    /**
     * Put a chunk into execution.
     *
     * @param key The key of execution
     * @param index The chunk index
     * @param value The chunk data
     */
    put(key: string, index: number, data: any) {
        const task = this.tasks.get(key);
        task?.putAt(index, data);
    }

    /**
     * Mark execution to an error state.
     *
     * @param key The key of execution
     * @param index The chunk index
     * @param reason The error reason
     */
    error(key: string, index: number, reason: string) {
        const task = this.tasks.get(key);
        task?.errorAt(index, reason);
        this.tasks.delete(key);
    }

    /**
     * Mark execution to a complete state and delete it from manager.
     *
     * @param key The key of execution
     */
    complete(key: string) {
        const task = this.tasks.get(key);
        task?.complete();
        this.tasks.delete(key);
    }
}

export function isExecutionMessage(input: any): input is ExecutionMessage {
    if (!input || typeof input !== 'object') {
        return false;
    }

    /* eslint-disable @typescript-eslint/no-unsafe-member-access */
    if (typeof input.taskId !== 'string' || typeof input.executionId !== 'string') {
        return false;
    }

    return (
        input.executionType === ExecutionType.Request
        || input.executionType === ExecutionType.Response
        || input.executionType === ExecutionType.Error
        || input.executionType === ExecutionType.Notice
    );
    /* eslint-enable @typescript-eslint/no-unsafe-member-access */
}

export function isExecutionRequest(input: any): input is ExecutionRequest {
    return isExecutionMessage(input) && input.executionType === ExecutionType.Request;
}

export function isExecutionResponse(input: any): input is ExectuionResponse {
    return isExecutionMessage(input) && input.executionType === ExecutionType.Response;
}

export function isExecutionError(input: any): input is ExecutionError {
    return isExecutionMessage(input) && input.executionType === ExecutionType.Error;
}

export function isExecutionNotice(input: any): input is ExecutionNotice {
    return isExecutionMessage(input) && input.executionType === ExecutionType.Notice;
}
