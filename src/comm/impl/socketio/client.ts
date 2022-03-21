/* eslint-disable no-undef */
import { EventEmitter } from 'events';
import { SocketClientSide } from '../../interface';
import { Msg, isMsgX, isWithCommandProperty } from '../../proto3';
import * as socketioclient from 'socket.io-client';

import * as debugModule from 'debug';
const debug = debugModule('chat:socketio:client');

export class SocketioSocketClientSide extends EventEmitter implements SocketClientSide {

    socket: socketioclient.Socket;
    displayForm: string = '[socketioclient][NOT CONNECTED YET]';
    server_url: string;

    constructor(uri: string) {
        super();
        this.server_url = uri;
        const secure = uri.substr(0, 5) === 'https' || uri.substr(0, 3) === 'wss';
        this.socket = socketioclient.io(uri, {
            secure: secure,
            rejectUnauthorized: false
        });
        
        // See ClientSideSocketEvents in comm.ts, we can directly snoop the
        // following events from the SocketIOClient.Socket:
        this.socket.on('connect', () => this.onConnect());
        this.socket.on('disconnect', (reason: string) => this.onDisconnect(reason));
        this.socket.on('error', (err: unknown) => this.emit('error', err));
        this.socket.on('message', (msg: unknown) => this.onMessage(msg));
        this.socket.on('reconnect attempt', (attemptNumber: number) => this.onReconnectAttempt(attemptNumber));
    }

    send(msg: Msg) { // FIXME
        // Note: messages get queued for later delivery by socketio if the
        // socket was disconnected
        debug('sending %o', msg);
        this.socket.emit('message', msg);
    }

    onConnect() {
        this.displayForm = `[socketioclient:${(this.socket.io as any).uri}:${this.socket.id}]`;
        this.emit('connect');
    }

    connected(): boolean {
        return this.socket.connected;
    }

    onDisconnect(reason: string) {
        this.displayForm = `${this.displayForm}[DISCONNECTED]`;
        this.emit('disconnect', reason);
    }

    onMessage(msg: unknown) {
        if(isWithCommandProperty(msg) && isMsgX(msg)) {
            this.emit('message', msg);
        } else {
            debug('ERROR: received invalid message: %o', msg);
        }
    }

    onReconnectAttempt(attemptNumber: number) {
        debug(`Reconnect attempt ${attemptNumber}`);
    }


    close() {
        this.socket.disconnect();
    }

    toString(): string {
        return this.displayForm;
    }

    getId(): string {
        return this.socket.id;
    }

    getServerURL(): string {
        return this.server_url;
    }
}

