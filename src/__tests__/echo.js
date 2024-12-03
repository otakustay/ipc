process.on(
    'message',
    ({taskId, executionId, action, payload}) => {
        const message = {
            taskId,
            executionId,
            executionType: 1,
            chunkIndex: 0,
            done: true,
            action,
            // eslint-disable-next-line @typescript-eslint/restrict-plus-operands
            data: payload + 1,
        };
        process.send(message);
    }
);
