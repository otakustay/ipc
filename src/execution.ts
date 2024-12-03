import {AsyncIteratorController} from '@otakustay/async-iterator';

export enum ExecutionType {
    Request,
    Response,
    Error,
    Notice,
}

export interface ExecutionRequest {
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

        if (task) {
            task.putAt(index, data);
        }
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

        if (task) {
            task.errorAt(index, reason);
        }
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
