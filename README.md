# IPC

This is the inter-process communication infrastructure for this project, aimed to abstract message sending, receiving, and routing between processes and even within the same process.

## Usage

Here we are going to implement a random number and string generator, first we create a handler using `RequestHandler` class.

```ts
import {RequestHandler} from '@otakustay/ipc';

class RandomNumberHandler extends RequestHandler<number, number> {
    static action = 'randomNumber' as const;

    async *handleRequest(count: number) {
        for (let i = 0; i < count; ++i) {
            yield Math.round(Math.random() * 10000);
        }
    }
}

class RandomStringHandler extends RequestHandler<number, string> {
    static action = 'randomString' as const;

    async *handleRequest(count: string) {
        for (let i = 0; i < count.length; ++i) {
            yield Math.random().toString(36).slice(-5);
        }
    }
}
```

Then we create a server using `Server` class, you don't need to take care of `createContext` method, we'll dive into it later.

```ts
import {Server, ProtocolOf} from '@otakustay/ipc';
import {RandomNumberHandler, RandomStringHandler} from './handlers';

export type Protocol = ProtocolOf<typeof RandomNumberHandler | typeof RandomStringHandler>;

class RandomServer extends Server<Protocol> {
    protected initializeHandlers(): void {
        this.registerHandler(RandomNumberHandler);
        this.registerHandler(RandomStringHandler);
    }

    protected async createContext() {
        return null;
    }
}
```

By now this server can accept requests with an `action` of `randomNumber` and `randomString` (see `action` static property in handler classes), we are going to illustrate how to invoke the server.

We need a communication channel between the client and server, this is abstracted by a `Port` class, suppose that server is running in a separate process, inside that standalone process we use a `ProcessPort` object for communication.

```ts
// In child process
import {ProcessPort} from '@otakustay/ipc';

const port = new ProcessPort();
const server = new RandomServer();
await server.connect(port);
```

On the client side, we have a reference to the `childProcess` variable, so we use `ChildProcessPort` to communicate with the server.

```ts
// In main process
import childProcess from 'node:child_process';
import {ChildProcessPort} from '@otakustay/ipc';
import {Protocol} from './server';

const process = childProcess.fork(echoScript);
const port = new ChildProcessPort(process);
const client = new Client<Protocol>(port);
```

The `client` object then have a `callStream` function yielding its handler results from server.

```ts
for await (const value of client.callStream('randomNumber', 10)) {
    console.log(value); // log 10 random numbers
}
```

If you only care the first value and want to treat the function call as a promise, use `call` function.

```ts
const result = await client.call('randomString', 10);
console.log(result); // 1 random string
```

This library also provides a `DirectPort` to communicate between server and client in the same process.

```ts
import {DirectPort} from '@otakustay/ipc';

const port = new DirectPort();
const server = new RandomServer();
await server.connect(port);
const client = new Client<Protocol>(port);

for await (const value of client.callStream('randomString', 10)) {
    console.log(value); // log 10 random strings
}
```

## Architecture

### Port

A port is a very simple abstraction on a message channel. A common message channel provides a `postMessage` method and a `message` event. The `Port` interface further abstracts them into 2 methods:

- `send` to post a message through the port to the destination.
- `listen` to receive a message and trigger the specified callback.

This package provides 2 built-in implementations of the `Port` interface:

- `DirectPort` simulates a message channel inside a single process. It triggers all callbacks registered via `listen` methods **asynchronously** when the `send` method is called.
- `ProcessPort` may be the more widely used one. It wraps a `ChildProcess` object to a `Port` implementation. The wrapped process must be a `node` process and must [have `ipc` enabled on its `stdio`](https://nodejs.org/api/child_process.html#optionsstdio). Usually, an object from the `fork` method of the `child_process` module satisfies this requirement.

### Execution

`Execution` may be the most underlying element of IPC architecture. Since we want IPC to work like simple function calls, it plays an important role in managing a series of messages and composing them into an `AsyncIterable` object.

You cannot directly use `Execution` objects. It is exposed from the `ExecutionManager` class, which manages all executions by a string key.

With a `ExecutionManager` instance, you can start an execution, put chunks into it, or transition it into an errored or completed state.

```ts
const manager = new ExecutionManager();
const execution = manager.start('key');

// Put chunk data
execution.put(1);
execution.put(2);
execution.put(3);

// Mark as complete
execution.complete();
```

A returned `Execution` object behaves like an `AsyncIterable`. Use `for await ... of` to consume the data:

```ts
// Logs 1, 2, 3
for await (const data of execution) {
    console.log(data);
}
```

### Client

After a port establishes a message channel, we now have 2 sides: one to initiate a function call and one to handle and respond to this call.

A `Client` object is used to initiate function calls. Here we will have a `Protocol` interface generated by server component, this interface defines the `action` and `payload` relationship to indicate the invocation target, **by using a `Protocol` interface you will not able to pass incorrect types to a certain `action`**. It also requires a `taskId` to identify the task to which this call belongs.

```ts
import {Protocol} from './server';

const client = new Client<Protocol>(port);
const result = await client.call('someTaskId', 'greeting', {name: 'user'});
console.log(result); // 'Hello user'
```

You can also use `callStreaming` to get an `AsyncIterable` object to consume the response data:

```ts
const client = new Client(port);
for await (const message of client.callStreaming('someTaskId', 'greeting', {names: ['user', 'admin']})) {
    // Hello user
    // Hello admin
    console.log(message);
}
```

Errors thrown from the server side are caught on the client side. Everything works just like a simple function.

### Request Handler

On the implementation side, we define a `RequestHandler` object to handle a specific action. You provide the implementation by extending the `RequestHandler` class and:

1. Define a static `action` property as const.
2. Implement the `handleRequest` method.

Be aware that the `handleRequest` method is a generator function. You can yield data but **don't use `return` statement**.

```ts
class GreetingRequestHandler extends RequestHandler<{name: string}, string> {
    static action = 'greeting' as const;

    async *handleRequest(payload: {name: string}) {
        yield `Hello ${payload.name}`;
    }
}
```

Thrown errors from the `handleRequest` method will be automatically caught and sent back to the client side, resulting in an exception in `Client` calls.

When you want to send some messages back to the client without influencing the function progress, such as doing some logging, the `notify` method is for you.

```ts
class GreetingRequestHandler extends RequestHandler<{name: string}, string> {
    static action = 'greeting' as const;

    async *handleRequest(payload: {name: string}) {
        this.notify('log', {level: 'verbose', message: `Received greeting from ${payload.name}`});
        yield `Hello ${payload.name}`;
    }
}
```

### Server

With a `Server` object connected to a port, all incoming messages are listened to and dispatched to registered `RequestHandler` classes based on their `action` static property.

Usually, we create a server by subclassing the `Server` base class, implementing the `initializeHandlers` method, and using `registerHandler` to associate an action with a handler class.

```ts
class CalculatorServer extends Server {
    initializeHandlers() {
        this.registerHandler(AddRequestHandler);
        this.registerHandler(SubtractRequestHandler);
        this.registerHandler(MultiplyRequestHandler);
        this.registerHandler(DivideRequestHandler);
    }
}
```

This `initializeHandlers` method registers 4 different request handlers, using their `action` static property like `"add"`, `"subtract"`, etc...

We can also generate a `Protocol` interface from all request handlers using the `ProtocolOf` generic type:

```ts
export type Protocol = ProtocolOf<
    | typeof AddRequestHandler
    | typeof SubtractRequestHandler
    | typeof MultiplyRequestHandler
    | typeof DivideRequestHandler
>;
```

This results an interface like:

```ts
interface Protocol {
    add: (x: number) => AsyncIterable<number>;
    subtract: (x: number) => AsyncIterable<number>;
    multiply: (x: number) => AsyncIterable<number>;
    divide: (x: number) => AsyncIterable<number>;
}
```

This interface can be used as the type of a `Client` instance, so a client instance knows each method's type and will have a good TypeScript experience.

After a server is created, connect it to a port using the `connect` method, and it will start listening to messages.

```ts
const server = new CalculatorServer();
await server.connect(port);
```

You are also able to define a `context` type in `RequestHandler`, then use it in `handleRequest` method.

```ts
class GreetingRequestHandler extends RequestHandler<{name: string}, string, {prefix: string}> {
    static action = 'greeting' as const;

    async *handleRequest(payload: {name: string}) {
        yield `${this.context.prefix} ${payload.name}`;
    }
}
```

In this case the `Server` class must implement `createContext` to satisfy all its request handler types.

```ts
type Protocol = ProtocolOf<typeof GreetingRequestHandler>;

class HelloServer extends Server<Protocol, {prefix: string}> {
    initializeHandlers() {
        this.registerHandler(GreetingRequestHandler);
    }

    createContext(): {prefix: string} {
        return {prefix: 'Hello'};
    }
}
```

## Example

### Using LSP

LSP (Language Server Protocol) is a protocol for IDEs but it also provides a very robust commnuication mechanism, to utilize it, we can simply create a `LanguageServerPort`.

```ts
import {Readable, Writable} from 'node:stream';
import {Port, ExecutionMessage} from '@otakustay/ipc';
import {
    createConnection,
    Connection,
    StreamMessageReader,
    StreamMessageWriter,
} from 'vscode-languageserver/node';

const LANGUAGE_SERVER_GENERIC_METHOD = 'genericExec';

export class LanguageServerPort implements Port {
    private readonly connection: Connection;

    private readonly listeners = new Set<(message: any) => void>();

    constructor(readable: Readable, writable: Writable) {
        this.connection = createConnection(
            new StreamMessageReader(readable),
            new StreamMessageWriter(writable)
        );
        this.connection.onRequest(
            LANGUAGE_SERVER_GENERIC_METHOD,
            (message: ExecutionMessage) => {
                for (const listener of this.listeners) {
                    listener(message);
                }
            }
        );
        this.connection.listen();
    }

    send(message: ExecutionMessage) {
        this.connection.sendRequest(LANGUAGE_SERVER_GENERIC_METHOD, message).catch(() => {});
    }

    listen(callback: (message: ExecutionMessage) => void): void {
        this.listeners.add(callback);
    }
}
```

This also works when developing an IDE extension already using LSP as its infrastructure.
