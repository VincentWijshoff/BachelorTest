import { EventEmitter } from 'events';
import { SocketServer, SocketServerSide } from '../../interface';
import { Msg, isMsgX, isWithCommandProperty } from '../../proto3';
import * as socketio from 'socket.io';
import * as http from 'http';
// import * as https from 'https';
import * as express from 'express';
import * as debugModule from 'debug';
const debug = debugModule('chat:socketio:server');


// For socketio over http and ws. All plain text can be intercepted and read.
export class SocketioHttpServer extends EventEmitter implements SocketServer {

    // TCP port number [0, 65535] the server will be listening on, probably
    // should be > 1023 as <= 1023 are reserved port numbers
    port: number;
    socketioServer: socketio.Server;
    httpServer: http.Server; // underlying http server used by socketioServer

    constructor(port: number, options?: socketio.ServerOptions) {
        super();
        this.port = port;
        const expressApp = express();
        expressApp.use(express.static('public'));
        this.httpServer = http.createServer(expressApp);
        this.httpServer.on('error', (err: unknown) => this.emit('error', err));
        this.socketioServer = new socketio.Server(this.httpServer, options);
        this.socketioServer.on('error', (err: unknown) => this.emit('error', err));
        this.socketioServer.on('connect', (socket: socketio.Socket) =>
            this.emit('connect', new SocketioSocketServerSide(socket))
        );
        // httpServer will throw EADDRINUSE when port is already in use...
        this.httpServer.listen(this.port);
        this.httpServer.on('listening', () =>
            debug('Listening on %o', this.httpServer.address())
        );
    }

    getPort(): number {
        return this.port;
    }

    close(): void{
        this.socketioServer.close();
    }

    sendEveryone(args:Msg){
        this.socketioServer.emit('message', args);
    }
    
}

export class SocketioSocketServerSide extends EventEmitter implements SocketServerSide {

    socket: socketio.Socket;

    constructor(socket: socketio.Socket) {
        super();
        this.socket = socket;
        this.socket.on('disconnect', (reason: string) => this.onDisconnect(reason));
        this.socket.on('error', (err: unknown) => this.onError(err));
        this.socket.on('message', (msg: unknown) => this.onMessage(msg));
    }

    send(msg: Msg) {
        this.socket.emit('message', msg);
        debug('sending message: %o', msg);
    }

    connected(): boolean {
        return this.socket.connected;
    }

    onDisconnect(reason: string) {
        this.emit('disconnect', reason);
    }

    onError(err: unknown) {
        this.emit('error', err);
    }

    onMessage(msg: unknown) {
        debug('%s: received %o', this, msg);
        if(isWithCommandProperty(msg) && isMsgX(msg)) {
            
            this.emit('message', msg);
        } else {
            debug('ERROR: received invalid message: %o', msg);
        }
    }

    close() {
        // see: https://socket.io/docs/v3/server-api/index.html#socket-disconnect-close
        this.socket.disconnect(true);
    }

    toString(): string {
        return `[socketio:${this.socket.conn.remoteAddress}:${this.socket.id}]`;
    }

    getId(): string {
        return this.socket.id;
    }

    send_target(msg:Msg, target:string){
        this.socket.to(target).emit('message', msg);
    }

    sendEveryone(args:Msg){
        this.socket.emit('message', args);
    }
}

