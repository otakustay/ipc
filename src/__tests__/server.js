import {ProcessPort} from '../port.js';

const port = new ProcessPort();
port.listen(
    ({taskId, executionId, action, payload}) => {
        const response = {
            taskId,
            executionId,
            executionType: 1,
            chunkIndex: 0,
            done: true,
            action,
            data: payload,
        };
        port.send(response);
        process.exit();
    }
);
