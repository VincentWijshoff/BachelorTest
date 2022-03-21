/**
 * Module dependencies.
 */
import Channel from '../channel';
import * as debugModule from 'debug';
const debug = debugModule('chat:server');
import * as io from 'socket.io';
import { strict as assert } from 'assert';
import { createPublicKey, verify } from 'crypto';
import { Msg, MsgOpts, Payloads, isMsgX } from '../comm/proto3';
import { SocketServer, SocketServerSide } from '../comm/interface';
import { getTime } from './client';
import { hashFromPublicKey, splitHashAndNick } from './types';
import { EventEmitter } from 'events';
import { ServerChannelManager } from '../chan/server';
import { verifyHash, hashMessage} from './client';
import Command from '../command';
import { TicTacToeManager } from '../browser/games/TicTacToeManager';
import { CTFManager } from '../browser/games/CTFManager';

export type SocketUserInfo = {
    hash: string;
    nick: string;
}

export type UserInfo = {
    pubkey: string;
    timestamp: number;
    sockets: Set<SocketServerSide>;
}

/**
 * ChatServer class.
 *
 * This will start a socket.io server for the default namespace '/'.
 *
 */
export class ChatServer extends EventEmitter{

   
    server:SocketServer; // socket.io server
    socket_data; // Map from every active hash_nick (key) to user hash and additional data
    public_keys; // Map with the public key (value) for the hash_nick of this public key (key)
    delay: number;  // the delay (in ms) after which a public key is removed
    // (if there hasn't been a reconnect of the corresponding nick)
    socketToUser = new Map<SocketServerSide, SocketUserInfo>();
    users = new Map<string, UserInfo>()
    prev_server_socketid:undefined|string = undefined;
    cmd: ServerChannelManager;
    command:Command;
    channels = new Map<string, Channel>();
    managerTicTacToe: TicTacToeManager;
    managersCTF: Map<string, CTFManager>;
    disconnect_data;

    worlds: any; //the json of all the worlds

    paths = new Map<string, unknown>();

    clientsInLobby:string[] = []; //List containing the hash_nick of all clients in lobby
    cliClients : string[] = [] //List containing the hash_nick of all cli clients
    
    scores = new Map<string, Array<number>>(); // hashnick --> [score RPS, score TTT, score CTF]
    
    /**
     * 
     * @param listenport the internal port where this server will be listening on
     * @param adress_0_server the external adress where the 0th server is listening
     * @param externalport the external port for the this server
     * @param external_ip the external ip for this server
     * @param options 
     */
    constructor(server:SocketServer, adress_0_server:string|undefined, externalport:number, external_ip:string|undefined, options?: io.ServerOptions) {
        super();
        this.worlds = require('../../worlds.json');
        this.server = server;
        this.cmd = new ServerChannelManager(this);
        this.command = new Command(this, this.cmd);
        this.socket_data = new Map<string, {hash_nick: string, isVerified: boolean, verification_data: string, public_key:string, isBrowserClient: boolean}>();
        this.public_keys = new Map<string, string>();
        this.delay = 300_000;
        this.disconnect_data = new Map<string, {hash_nick: string, explicit:string, channels:Array<string>|undefined, verification_data:string}>();
        this.managerTicTacToe = new TicTacToeManager(this);
        this.managersCTF = new Map();
        this.initManagersCTF();

        this.scores.set('Player3', [1, 1, 1]);
        this.scores.set('Player1', [5, 5, 5]);
        this.scores.set('Player2', [6, 3, 2]);
        this.scores.set('Player4', [20, 9, 2]);
        this.scores.set('Player5', [3, 7, 2]);
        debug(`Constructing server at port ${this.server.getPort()} with options=%o`, options);

        // start socket.io server, will throw EADDRINUSE when port is already in use...
        this.server.on('connect', (socket:SocketServerSide) => this.onSocketConnect(socket));
        this.server.on('error', (err: unknown) => this.onServerError(err));
        this.on('ChatMessage', (socket: SocketServerSide, msg: Msg<'ChatMessage'>) => this.onChatMessage(socket, msg));

    }

    /**
     * return a list containing all private world names
     */
    getAllPrivateWorlds(): string[] {
        let list : string[] = [];
        
        for(let cnl of this.channels.values()){
            if(cnl.isPrivate){
                list.push(cnl.name.substring(1));
            }
        }
        debug('sending as private worlds: ', list);
        return list;
    }

    /**
     * return a list containing all world names
     */
    getAllWorlds(): string[] {
        let list : string[] = [];
        for(let key in this.worlds){
            list.push(key);
        }
        return list;
    }

    getAllBotSizes(): number[]{
        let list : number[] = [];
        
        for(let cnl of this.channels.values()){
            list.push(cnl.botsInChannel);
        }
        debug('sending as allBotSizes: ', list);
        return list;
    }

    getLobbyLogic(){
        let lobbylogic = require('../../lobby.json');
        for(let key in lobbylogic){
            return lobbylogic[key];
        }

    }


    /**
     * Initialize a CTFManager for capture-the-flag games in every world
     */
    initManagersCTF() {
        for(let key in this.worlds){
            this.managersCTF.set(key, new CTFManager(this, key));
        }
    }

    handleCTFMsg(msg: Msg<'CTFMsg'>) {
        this.managersCTF.get(msg.payload.world)!.handleMessage(msg);
    }


    CTFonDisconnect(hash_nick: string, world: string) {
        if (this.managersCTF.get(world) !== undefined && this.managersCTF.get(world)!.running) {
            this.managersCTF.get(world)!.removeParticipant(hash_nick);
        }
    }


    registerUser(socket: SocketServerSide, pubkey: string, nick: string) {
        const hash: string = hashFromPublicKey(pubkey);
        const hash_nick = hash+':'+nick;
        assert(hash !== '');
        const existingUser = this.users.has(hash_nick);
        // hashToSockets returns an empty Set if we didn't have sockets yet for this hash
        const sockets: Set<SocketServerSide> = this.hashOrHashAndNickToSockets(hash);
        sockets.add(socket);
        // Add the socket to our lookup table socket => hash_nick
        this.socketToUser.set(socket, { hash: hash, nick: nick });
        this.users.set(hash_nick, { pubkey: pubkey, timestamp: Date.now(), sockets: sockets });

        debug(`Verified connection${ existingUser ? ' from existing user' : ''} ${socket}:${hash}:${nick}`);

        // send Connected message to user
        this.send(socket, 'Connected', { msg: 'Welcome' });
    }

    onServerError(err: unknown) {
        debug('ERROR: %o', err);
    }


    onSocketMessage(socket: SocketServerSide, msg: Msg, refire: boolean = false) {
        // at this point we are certain the Msg is valid
        assert(isMsgX(msg)); // if this fails something is very wrong in our code...

        
        debug(`Received ${refire ? 'refired ' : ''}command '${msg.command}' from ${socket} with msg=%o`, msg);

        // At this point only verified connections are allowed
        // Protection against failure of authenticator logic:
        assert(this.isVerified(msg.hash_nick));

        // Notify all listeners (modules and plugins):
        this.emit(msg.command, socket, msg);
    }

    onSocketConnect(socket: SocketServerSide) {
        debug(`New connection ${socket.getId()}`);
        socket.on('disconnect', (reason: string) => this.onSocketDisconnect(socket, reason));
        socket.on('error', (err: unknown) => this.onSocketError(socket, err));
        socket.on('message', (msg:unknown) => this.onRawMessage(msg, socket));
        this.emit('connect', socket);
    }

    onSocketError(socket: SocketServerSide, err: unknown): void {
        debug(`ERROR: ${socket}: %o`, err);
    }

    onChatMessage(socket: SocketServerSide, msg: Msg<'ChatMessage'>) {
        debug('received ChatMessage');
        if (msg.to && msg.from && msg.to.startsWith('#')) {
            if (!this.channels.has(msg.to)){
                this.send(socket, 'Error', {msg: `There is no channel named ${msg.to}`});
            } else {
                this.channels.get(msg.to)?.send(socket, msg.hash_nick, msg);
            }
        } else if (msg.to){
            this.sendUser(msg.to, 'ChatMessage', msg.payload, {to: msg.to, from: msg.from, hash_nick:msg.hash_nick});
        } else {
            Array.from(this.users.keys()).forEach(hash_nick => {
                this.sendUser(hash_nick, 'ChatMessage', msg.payload, {from: msg.from, hash_nick:msg.hash_nick});
            });
        }
    }

    sendUser<C extends keyof Payloads>(hash_nick: string, command: C, payload: Payloads[C], opts: MsgOpts = {hash_nick: ''}){
        let user = this.users.get(hash_nick);
        if(user){
            user.sockets.forEach(userSocket => this.send(userSocket, command, payload, opts));
        }
    }

    hashOrHashAndNickToSockets(hashOrHashAndNick: string): Set<SocketServerSide> {
        // Returns empty Set if hash is not in `users`
        const [ hash, nick ] = splitHashAndNick(hashOrHashAndNick); // we allow a nick specification in the hash
        const hash_nick = hash+':'+nick;
        const sockets = this.users.get(hash_nick)?.sockets ?? new Set<SocketServerSide>();
        if(nick) {
            for(const socket of sockets) {
                if(this.socketToUser.get(socket)?.nick === nick) return new Set<SocketServerSide>([socket]);
            }
        }
        return sockets;
    }

    /**
     * Handle this message if its format is valid.
     * 
     * @param msg The given message that isn't necessarily of type ClientMessage
     */
    onRawMessage(msg: unknown, socket: SocketServerSide) {
        if(isMsgX(msg)){
            this.doCommand(msg, socket);
        }else{
            debug('wrong type of message received on: ', msg);
        }
    }


    socketToHash(socket: SocketServerSide): string | undefined {
        // Unverified sockets will return undefined as they are not in here
        return this.socketToUser.get(socket)?.hash;
    }

    onSocketDisconnect(socket:SocketServerSide, reason:unknown) {
        debug(`Lost socket with id ${socket.getId()}, reason: ${reason}`);
        const hash = this.socketToUser.get(socket)?.hash;
        const nick = this.socketToUser.get(socket)?.nick;
        const hash_nick = hash+':'+nick;
        // We need to delete this hash_nick
        if (this.socket_data.has(hash_nick)) {
            debug('removing hash_nick= ', hash_nick);
            this.public_keys.delete(hash_nick);
            this.socket_data.delete(hash_nick);
        }
        
        for(let chnl of this.channels.keys()){
            if(this.channels.get(chnl)!.adminOfWorld == hash_nick){ //client is admin of a world -> world is not private anymore
                this.channels.get(chnl)!.adminOfWorld = undefined;
                this.channels.get(chnl)!.isPrivate = false;
                this.channels.get(chnl)!.psw = undefined;
                this.command.sendWorldAdminUpdate(this.channels.get(chnl)!, '');
                this.command.sendPrivateWorldsUpdate();
            }
        }

        let world = '';

        if(this.clientsInLobby.indexOf(hash_nick) != -1 && this.cliClients.indexOf(hash_nick) == -1){
            this.clientsInLobby.splice(this.clientsInLobby.indexOf(hash_nick), 1);
        } else {
            if(this.cliClients.indexOf(hash_nick) != -1)
                this.cliClients.splice(this.cliClients.indexOf(hash_nick), 1);
            debug('client was not in lobby');
            Array.from(this.channels.values()).forEach(channel => {
                if(channel!.getUsers().has(hash_nick)){
                    channel!.removeUser(hash_nick);
                    world = channel.name.substring(1);
                    this.command.sendWorldSizeUpdate(world, 'left_client');
                }
            });
        }
        
        this.managerTicTacToe.handleDisconnect(hash_nick);
        this.CTFonDisconnect(hash_nick, world);
    }


    onSocketDisconnecting(socket:SocketServerSide, reason:unknown) {
        debug(`Disconnecting: Lost socket with id ${socket.getId}, reason: ${reason}`);
    }

    /**
     * Return a boolean reflecting whether the given socket has been verified.
     * @param socket The given socket
     */
    isVerified(id: string): boolean | undefined {
        return this.socket_data.get(id) && this.socket_data.get(id)!.isVerified == true;
    }

    /**
     * Verify a signature using the crypto module
     */
    verifyServer(pubkey: string, signature: ArrayBuffer, data: string, isBrowserClient: boolean): boolean {
        if (isBrowserClient) {
            try {
                return verify(
                    undefined,
                    Buffer.from(data),
                    { key: createPublicKey({key: pubkey, type: 'spki'}) },
                    Buffer.from(signature)
                );
            } catch {
                debug('Exception in crypto.verify, could not verify signature. Caused by crypto.subtle compatibility issue?');
                return false;
            }
        }
        else {
            return verify(
                'sha256',
                Buffer.from(data),
                { key: createPublicKey({key: pubkey, format:'pem', type: 'pkcs1'}) },
                Buffer.from(signature)
            );
        }
    }

    /**
     * Handlers for our chat application.
     */
    doCommand(msg: Msg, socket:SocketServerSide) {
        debug('Server received command', msg);
        if(!(msg.command == 'ChannelCreate')){
            if (!verifyHash(msg)) {
                // return;
                debug('problem with hash of message:', msg);
            }

            // The client is either
            // 1)   verified, he can execute whichever command he wants
            // 2)   not yet verified, he can only execute
            //      the following commands: 'connection-attempt' and 'submit-verification'
            if (msg.command != 'connectionAttempt' && msg.command != 'submitVerification') {
                // if a client wants send a message, join a channel ...
                // he first needs to verify his identity
                if (!this.isVerified(msg.hash_nick)) {
                    // This client has not yet verified himself
                    // As such, we abort the execution of this command
                    debug('the client was not verified, so the messages will not be processed');
                    return;
                }
            }
        }
        this.emit(msg.command, socket, msg);
    }

    createMsg<C extends keyof Payloads>(command: C, payload: Payloads[C], opts: MsgOpts = {hash_nick:''}): Msg {
        const msg: Msg<C> = { command: command, payload: payload, timestamp: (new Date()).toUTCString(), ...opts };
        return msg;
    }

    send<C extends keyof Payloads>(socket: SocketServerSide, command: C, payload: Payloads[C], opts: MsgOpts = {hash_nick: ''}) {
        const msg: Msg<C> = { command: command, payload: payload, timestamp: getTime(), ...opts };
        socket.send(hashMessage(msg)); 
    }

    socketToUserInfo(socket: SocketServerSide): SocketUserInfo | undefined {
        // Unverified sockets will return undefined as they are not in here
        return this.socketToUser.get(socket);
    }

    updateScore(id: string, game: string, win: boolean){
        // maybe better to make these variables attributes of the server? 
        let winRPSscore = 3;
        let lossRPSscore = 1;

        let winTTTscore = 3;
        let lossTTTscore = 1;

        let winCTFscore = 3;
        let lossCTFscore = 1; // not really needed since you can not 'lose' in CTF.
        /////

        if (!this.scores.has(id)){
            this.scores.set(id, [0, 0, 0]);
        }

        let scoresOfClient = this.scores.get(id); // array with scores of client for every minigame -> [RPS, TTT, CTF]

        if (game == 'RPS'){
            if (win){
                scoresOfClient![0] += winRPSscore;
            }
            else{
                scoresOfClient![0] -= lossRPSscore;
                if (scoresOfClient![0] < 0){
                    scoresOfClient![0] = 0;
                }
            }
        }
        if (game == 'TTT'){
            if (win){
                scoresOfClient![1] += winTTTscore;
            }
            else{
                scoresOfClient![1] -= lossTTTscore;
                if (scoresOfClient![1] < 0){
                    scoresOfClient![1] = 0;
                }
            }
        }
        if (game == 'CTF'){
            if (win){
                scoresOfClient![2] += winCTFscore;
            }
            else{
                scoresOfClient![2] -= lossCTFscore;
                if (scoresOfClient![2] < 0){
                    scoresOfClient![2] = 0;
                }
            }
        }
    }
}

export default ChatServer;
