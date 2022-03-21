/* eslint-disable no-unused-vars */
import { Msg } from './proto3'; // work around (https://github.com/microsoft/TypeScript/issues/15300)

// This file models a stable client server interface over sockets which
// automatically reconnects and resends messages for the client.

// See https://stackoverflow.com/a/61609010 for how to type possible event names
// and signatures of the methods handling those.

export interface SocketEventsClientSide {
    'connect': () => void;
    'disconnect': (reason: string) => void;
    'error': (err: unknown) => void;
    'message': (msg: Msg) => void;
    'reconnect_attempt': (number: number) => void;
}

export interface SocketClientSide {
    on<E extends keyof SocketEventsClientSide>(
        eventName: E,
        listener: SocketEventsClientSide[E]
    ): this;
    emit<E extends keyof SocketEventsClientSide>(
        eventName: E,
        ...args: Parameters<SocketEventsClientSide[E]>
    ): boolean;
    send(msg: Msg): void;
    connected(): boolean;
    close(): void;
    toString(): string;
    getId(): string;
    getServerURL(): string;
}

export interface SocketEventsServerSide {
    'disconnect': (reason: string) => void;
    'error': (err: unknown) => void;
    'message': (msg: Msg) => void;
    'disconnecting': (reason: unknown) => void;
    'command': (msg: Msg) => void;
}

export interface SocketServerSide {
    on<E extends keyof SocketEventsServerSide>(
        eventName: E,
        listener: SocketEventsServerSide[E]
    ): this;
    emit<E extends keyof SocketEventsServerSide>(
        eventName: E,
        ...args: Parameters<SocketEventsServerSide[E]>
    ): boolean;
    send(msg: Msg): void;
    connected(): boolean;
    close(): void;
    toString(): string;
    getId(): string;
}

export interface SocketServerEvents {
    'connect': (socket: SocketServerSide) => void;
    'error': (err: unknown) => void;
}

export interface SocketServer {
    on<E extends keyof SocketServerEvents>(
        eventName: E,
        listener: SocketServerEvents[E]
    ): this;
    emit<E extends keyof SocketServerEvents>(
        eventName: E,
        ...args: Parameters<SocketServerEvents[E]>
    ): boolean;
    getPort(): number;
    close():void;
    sendEveryone(args:Msg):void;
}


