/**
 * Module dependencies.
 */
import * as debugModule from 'debug';
const debug = debugModule('chat:client');
import cli from '../cli';
import { writeFile } from 'fs';
import * as crypto from 'crypto';
import { signSecurity } from '../browser/security';
import * as colors from 'ansi-colors';
import { SocketClientSide } from '../comm/interface';
import { isMsg, isMsgX, Msg, MsgOpts, Payloads } from '../comm/proto3';
import { ClientChannelManager } from '../chan/client';
import { ClientCommandManagerIn, ClientCommandManagerOut } from '../cmd/client';
import { EventEmitter } from 'events';
import { SocketioSocketClientSide } from '../comm/impl/socketio/client';
import { sha1 } from 'object-hash';
import { RockPaperScissors } from '../browser/games/rock-paper-scissors';
import { TicTacToe } from '../browser/games/TicTacToe';
import { WhisperManager } from '../browser/WhisperManager';
import { CaptureTheFlag } from '../browser/games/CaptureTheFlag';

/**
 * ChatClient class.
 * 
 * 
 */
export class ChatClient extends EventEmitter{

    nick; // String
    id: string; // String, we probably want to have a random id here eventually since socket.io will give us a new socket id on every connect
    
    cli; // cli object, this object will handle the cli
    myChannels: Map<string, string|undefined>; //this map contains all the channels that this Chatclient is joined to with as value the encryption key if there is one, otherwise the channel name itself.

    socket:SocketClientSide | undefined = undefined; // socket.io-client Socket object
    public_key: string|undefined; // The public key used in verification of a client
    private_key: string|undefined; // The private key used to sign a verification message
    keys = new Set<Object>();

    // Map collecting the hash_nicks (key) and public keys (value) from all added friends
    public_keys_friends; 

    // Map collecting the nicknames (key) and hash_nicks (value) from all added friends
    friends; 

    // A combination of the hash and nick, unique to every client
    hash_nick: string;

    // Map collecting the channelnames (key) and key pair giving access to the corresponding channel
    keys_secret_channels; 

    // Data from last user who requested access to one of the secret channels of this client
    user_to_add: {text: string, nick:string, channel:string, socketId:string, id:string} | undefined;

    //store the commands in a command wrapper
    outgoingcmd: ClientCommandManagerOut;
    incommingcmd: ClientCommandManagerIn;
    chan: ClientChannelManager;

    browserClient: boolean; //if true: client is browserClient, else is cli client
    gotVerificationConfirmation: boolean; // True iff this client has been verified by the server

    // All worlds by name
    currentWorlds?:string[]; //list containing all world names
    currentPrivateWorlds?: string[]; //list containing all private world names
    // eslint-disable-next-line no-undef
    worldSizes?: number[]; //list containing the amount of players in each world (same ordering as in currentWorlds)
    inLobby : boolean = false; //if true: client is in lobby
    currWorld? : string; //name of the current world the client is in (undifined when client in lobby)

    clientPositions: Map<string, {x: number, y: number, skin: string}> //hashnick -> {x en y grid coordinates of tile and skin off the character}
    worldBinary: number[][]; // used for detection off special blocks
    world: string[][]; // the logic off the current world
    game: RockPaperScissors | TicTacToe | undefined;
    CTFGame: CaptureTheFlag | undefined;
    whisperManager: WhisperManager | undefined;
    isAllowed : boolean = false; //client is allowed in private CaveWorld or not (init not)
    lobbyLogic : string[][]|undefined;
    botsInWorld : number[]; // the bots in world for each world
    isMoving: boolean = false; //client is moving or not
    isMovingIce : boolean = false // client is moving in ice world

    speed: number = 1; //client's speed (1=slow, 2=medium, 3=fast) (init 1)
    skin: string = 'basic'; // the skin off this client
    coins: string[] = []; // a list off al collected coins from each world
    skinDirection : string = 'front'; // the direction off the skin off the current player
    inDeadScreen : boolean = false; // is the player in a death screen?

    scores = new Map<string, Array<number>>();
    

    /**
     * @param {String} server_url   the server URL including protocol, host, port and namespace to connect to
     *                              e.g.: https://crzy.server.net:8889/admin-ns/
     * @param {String} nick         nick name to use in chat
     */
    constructor(socket: SocketioSocketClientSide, nick: string, CLI:boolean, publicKey?: string, privateKey?: string) {
        super();
        this.socket = socket;
        this.nick = nick;
        this.id = this.socket.getId();
        this.myChannels = new Map();
        this.public_keys_friends = new Map<string, string>();
        this.friends = new Map<string, string>();
        this.keys_secret_channels = new Map<string, {publicKey:string, privateKey:string}>();
        this.user_to_add = undefined;
        this.worldBinary = [];
        this.game = undefined;
        this.CTFGame = undefined;
        this.whisperManager = undefined;
        this.world = [];
        this.botsInWorld = [];
        
        
        this.outgoingcmd = new ClientCommandManagerOut(this);
        this.incommingcmd = new ClientCommandManagerIn(this);
        this.chan = new ClientChannelManager(this);

        this.browserClient = true;
        this.clientPositions = new Map();
        if(CLI){
            this.browserClient = false;
            const { publicKey, privateKey } = crypto.generateKeyPairSync('rsa', {modulusLength: 2048});
            writeFile('./keys/publicKey.pem', publicKey.export({format:'pem',type:'pkcs1'}), (err) => {
                if (err) return console.log(err);});
            writeFile('./keys/privateKey.pem', privateKey.export({format:'pem',type:'pkcs1'}), (err) => {
                if (err) return console.log(err);});
            this.public_key = publicKey.export({format:'pem',type:'pkcs1'}).toString();
            this.private_key = privateKey.export({format:'pem',type:'pkcs1'}).toString();
        }else{
            this.public_key = publicKey;
            this.private_key = privateKey;
        }
        const hash_key = sha1(this.public_key);
        this.hash_nick = hash_key + ':' + nick;
        this.gotVerificationConfirmation = false;
        
        debug(`Constructed new ChatClient '${nick}'`);
        
        this.connectCommand();

        if(CLI){
            this.cli = new cli(this);
            // all calls to stderr to write are handled by printMessage
            // such that debug calls in other libraries are shown correctly
            process.stderr.write = this.cli.printMessage;

            this.cli.registerCommands(this.commands);

            this.cli.start(CLI);
        }
    }

    /**
     * Handle this message if its format is valid.
     * 
     * @param msg The given message that isn't necessarily of type ServerMessage
     */
    onRawMessage(msg: unknown) {
        if (isMsgX(msg)){
            this.onMessage(msg);
        } else{
            debug('wrong type off message on: ', msg);
        }
    }

    onSocketMessage(msg: Msg) {
        this.emit(msg.command, msg);
    }


    /**
     * When starting a client, a 'connection-attempt' command is sent to the server.
     * This message contains the public key and nickname of this client.
     * 
     * The server processes this event in connectionAttemptCommand in command.ts
     * 
     * The server should send a 'prompt-verification' message back.
     * This message contains a challenge (= verification_data) this client has to sign.
     * The signing is done in ChatClient.onPromptVerification.
     * The signature is sent to the server in a 'submit-verification' command.
     * 
     * The server processes this even in submitVerificationCommand in command.ts
     * The server gives this client full access to all commands after successful verification.
     */
    onConnect() {
        debug(`${this}: Established connection to server ${this.socket}`);
        this.emit('connect');

        const prev_id = this.id;
        debug(`Socket connect, prev_id=${prev_id}, new id=${this.id}`);

        this.send('connectionAttempt', {public_key: this.public_key!, nick:this.nick, isBrowserClient: this.browserClient});
    }

    connectCommand() {
        this.setEventHandlers();
        this.setIncommingCommandHandlers();
    }

    setIncommingCommandHandlers(){
        this.incommingcmd.registerCommand('allWorlds', msg => {
            if(isMsg('allWorlds', msg))
                this.onAllWorlds(msg);
        });
        this.incommingcmd.registerCommand('ChatMessage', msg => {
            if(isMsg('ChatMessage', msg)){
                this.onChatMessage(msg);
            }
        });
        this.incommingcmd.registerCommand('promptVerification', msg => {
            if(isMsg('promptVerification', msg))
                this.onPromptVerification(msg);
        });
        this.incommingcmd.registerCommand('givePublicKey', msg => {
            if(isMsg('givePublicKey', msg))
                this.saveFriend(msg.payload.hash_nick, msg.payload.public_key, msg.payload.nick);
        });
        this.incommingcmd.registerCommand('myHashNick', msg => {
            if(isMsg('myHashNick', msg))
                this.onMyHashNick(msg);
        });
        this.incommingcmd.registerCommand('encMessage', msg => {
            if(isMsg('encMessage', msg))
                this.onEncMessage(msg);
        });
        this.incommingcmd.registerCommand('mutualFriend', msg => {
            if(isMsg('mutualFriend', msg))
                this.saveMutualFriend(msg.payload.hash_nick, msg.payload.public_key, msg.payload.nick);
        });
        this.incommingcmd.registerCommand('activePlugins', msg => {
            if(isMsg('activePlugins', msg))
                console.log('[PLUGIN]:', msg.payload.channelPlugins);
        });
        this.incommingcmd.registerCommand('Error', msg => {
            if(isMsg('Error', msg))
                printError(msg.payload.msg);
        });
        this.incommingcmd.registerCommand('Info', msg => {
            if(isMsg('Info', msg))
                printInfo(msg.payload.msg);
        });
        this.incommingcmd.registerCommand('Succes', msg => {
            if(isMsg('Succes', msg))
                printSuccess(msg.payload.msg);
        });
        this.incommingcmd.registerCommand('Connected', msg => {
            if(isMsg('Connected', msg)) {
                printInfo(`You connected to the server. [SERVER]: ${msg.payload.msg}`);
            }
        });
        this.incommingcmd.registerCommand('TicTacToeMsg', msg => {
            if (isMsg('TicTacToeMsg', msg)) {
                if (this.game instanceof TicTacToe && (this.game as TicTacToe).acceptingMsgs) {
                    (this.game as TicTacToe).handleMessage(msg);
                }
            }
        });
        this.incommingcmd.registerCommand('CTFMsg', msg => {
            if (isMsg('CTFMsg', msg)) {
                if (this.CTFGame !== undefined && msg.payload.type == 'error') {
                    this.CTFGame.handleMessage(msg);
                }
                else if (msg.payload.type == 'startGame'
                    && this.currWorld == msg.payload.world) {
                    this.CTFGame!.running = true;
                }
                else if (this.CTFGame !== undefined && this.CTFGame.running && this.currWorld == msg.payload.world) {
                    this.CTFGame.handleMessage(msg);
                }
            }
        });
        this.incommingcmd.registerCommand('worldSize', msg => {
            if(isMsg('worldSize', msg))
                this.onWorldSize(msg.payload.worlds);
        });
        this.incommingcmd.registerCommand('allPrivateWorlds', msg => {
            if(isMsg('allPrivateWorlds', msg))
                this.onAllPrivateWorlds(msg.payload.worlds);
        });
        this.incommingcmd.registerCommand('joinWorld', msg => {
            if(isMsg('joinWorld', msg))
                this.onJoinWorld(msg.payload.world_name);
        });
        this.incommingcmd.registerCommand('worldSizeUpdate', msg => {
            if(isMsg('worldSizeUpdate', msg))
                this.onWorldSizeUpdate(msg);
        });
    }

    onWorldSizeUpdate(msg : Msg<'worldSizeUpdate'>){
        this.updateLobby(msg.payload.world1, msg.payload.action1);
        if(msg.payload.world2 != ''){
            this.updateLobby(msg.payload.world2!, msg.payload.action2!);
        }
    }

    updateLobby(world: string, action : string){
        let index = this.currentWorlds?.indexOf(world);
        if(index != -1){ //world is a valid world name -> update 
            if(action == 'left_client'){
                this.worldSizes![index!] -= 1;
            }else if (action == 'joined_client'){
                this.worldSizes![index!] += 1;
            }else if (action == 'left_bot'){
                this.botsInWorld![index!] -= 1;
            }else if (action == 'joined_bot'){
                this.botsInWorld![index!] += 1;
            }
        }
    }

    onWorldSize(sizes : number[]){
        if(this!.worldSizes != sizes){
            this!.worldSizes = sizes;
        }
    }

    onAllPrivateWorlds(sizes : string[]){
        this.currentPrivateWorlds = sizes;
    }

    onJoinWorld(name : string){
        this!.clientPositions = new Map();
        this!.currWorld = name;
    }

    
    /**
     * Set event handlers for the socket of this client. 
     * 
     */
    setEventHandlers() {
        if (this.socket == undefined)
            return;

        // Handle events from the connection
        this.socket.on('connect', () => this.onConnect());
        this.socket.on('disconnect', (reason: string) => this.onSocketDisconnect(reason));
        this.socket.on('error', (err: unknown) => this.onSocketError(err));
        this.socket.on('reconnect_attempt', 
            (attemptNumber: number) => this.onSocketReconnectAttempt(attemptNumber));
        this.socket.on('message', (msg: unknown) => this.onRawMessage(msg));
    }

    /**
     * 
     * @param  hash_nick_prefix
     *         The prefix that uniquele determines the hash_nick
     *         of the friend. The server will identify the right
     *         hash_nick using the prefix by itself to be more
     *         user-friendly.
     * @effect Sends the command to the server.
     *       | this.send(msg)
     */
    addFriend(hash_nick_prefix: string) {
        this.send('requestPublicKey', {hash_nick_prefix: hash_nick_prefix}, {hash_nick: this.hash_nick || ''});
    }

    /**
     * 
     * @param  hash_nick
     *         The hash-nick from the friend to save.
     * @param  public_key
     *         The public key from the friend to save.
     * @param  nick
     *         The local nick for the friend to save.
     * @effect Save the public key of the friend.
     *       | this.public_keys_friends.set(hash_nick, public_key)
     * @effect Save the hash_nick of the friend.
     *       | this.friends.set(nick, hash_nick)
     */
    saveFriend(hash_nick: string, public_key:string, nick: string | undefined) {
        this.public_keys_friends.set(hash_nick, public_key);

        let localnick = nick;
        if (localnick == undefined || this.friends.has(localnick))
            localnick = 'Nick' + this.friends.size;
            
        this.friends.set(localnick, hash_nick);

        this.send('mutualFriend', {to: hash_nick, hash_nick: this.hash_nick!, public_key:'', nick: this.nick}, {hash_nick: this.hash_nick|| ''});

        printSuccess('Added friend with local nick: ' + localnick);
    } 

    /**
     * 
     * @param  hash_nick
     *         The hash-nick from the friend to save.
     * @param  public_key
     *         The public key from the friend to save.
     * @param  nick
     *         The local nick for the friend to save.
     * @effect Save the public key of the friend.
     *       | this.public_keys_friends.set(hash_nick, public_key)
     * @effect Save the hash_nick of the friend.
     *       | this.friends.set(nick, hash_nick)
     */
    saveMutualFriend(hash_nick: string, public_key:string, nick: string | undefined) {
        this.public_keys_friends.set(hash_nick, public_key);

        let localnick = nick;
        if (localnick == undefined || this.friends.has(localnick))
            localnick = 'Nick' + this.friends.size;
            
        this.friends.set(localnick, hash_nick);
        printSuccess('Added friend with local nick: ' + localnick);
    } 
   
    onDisconnect(reason: unknown) {
        debug(`Socket disconnect, we had id=${this.id}, reason=${reason}`);
        printInfo('Disconnected from the server, trying to reconnect');
    }

    onSocketDisconnect(reason: string) {
        debug(`${this}: Connection to server lost ${this.socket}: ${reason}`);
        this.emit('disconnect', reason);
        this.send('Info', { msg: 'Hello closed socket' }, {hash_nick: this.hash_nick|| ''});
    }

    onError(err: unknown) {
        debug('Socket error, we have id=${this.id}, err=%o', err);
    }

    onSocketError(err: unknown) {
        debug(`${this}: Error ${this.socket}: %o`, err);
        this.emit('error', err);
    }

    onReconnectAttempt(attemptNumber: number) {
        debug(`Reconnect attempt ${attemptNumber}`);
    }

    onSocketReconnectAttempt(attemptNumber: number) {
        this.emit('reconnect_attempt', attemptNumber);
    }
 
    disconnect() {
        this.socket!.close();   
    }

    /**
     * Disconnects a public key from te server given its hash
     * 
     *  - it deregistrates the public key, after signature verification
     *  - if explicit, deregistrates the public key hash from all channels
     *  - if it was the last public key of this socket, it disconnects the
     *    socket
     *  - if it was the last socket of this client, it disconnects the
     *    client after a time out
     */
    disconnectAttempt(hash_nick:string, explicit:string) {

        this.send('disconnectAttempt', {hash_nick: hash_nick, explicit: explicit, channels: Array.from(this.myChannels.keys())}, {hash_nick: this.hash_nick|| ''});
    }

    /**
     * Send `command` with arguments `args` to the chat server.
     */
    send<C extends keyof Payloads>(command: C, payload: Payloads[C], opts: MsgOpts = {hash_nick: this.hash_nick|| ''})
    {
        let msg: Msg<C> = { command: command, payload: payload, timestamp: getTime(), ...opts };
        if(!msg.from && !isMsg('sendEnc', msg)){
            msg.from = this.nick;
        }
        msg = hashMessage(msg);      
        
        this.socket?.send(msg);
    }
    
    
    /**
     * This is called when we receive a message from the server.
     *
     * @param {Object} msg
     */
    onMessage(msg: Msg): Msg
    {   
        if(verifyHash(msg)){
            this.incommingcmd.execute(msg.command, msg);   
        } else {
            debug('could not verify hash so message will not be processed');
        }     
        return msg;
    }

    onChatMessage(msg:Msg<'ChatMessage'>){
        debug('received chatmessage');
        if (msg.to && msg.to.startsWith('#')){
            console.log(colors.cyanBright('[ '+msg.from+' -> '+ msg.to.substring(1) +' : '+msg.timestamp+' ]: '+ msg.payload.text));
        } else if (msg.to){
            debug('direct messages are not yet supported');
        } else {
            console.log(colors.magentaBright('[ '+msg.from+' -> all : '+ msg.timestamp+' ]: '+ msg.payload.text));
        }
    }

    /**
     * What to do when this client receives its hash-nick.
     * 
     * @param  msg
     *         The message containing the hash-nick.
     * @post   The hash-nick of this client is equal to the hash-nick from
     *         the given message.
     *       | this.hash_nick == msg.data.hash_nick
     */
    onMyHashNick(msg:Msg<'myHashNick'>) {

        this.hash_nick = msg.payload.hash_nick;
        printInfo('Hash-nick requested from server: ' + this.hash_nick);

        this.gotVerificationConfirmation = true;
    }
    
    /**
     * 
     * @param  msg
     *         The encrypted message received.
     * @effect If the message is signed with a private key, try to decrypt
     *         with a public key from one of our friends.
     *       | this.send(message)
     *       |   where message.command == 'send-enc-message'
     */
    onEncMessage(msg:Msg<'encMessage'>) {
        // for testing
        this.testMsgReceived += 1;
        
        if (msg.payload.signed == 'true') {
            let message = this.decryptSignedMessage(msg.payload.text, msg.timestamp);
            this.testMsgMsg = message;

            if (message != undefined){
                let lastpart = message.substring(message.indexOf(':'));//cut off the [+nick
                message = '[ ' + msg.from + ' -> ' + this.nick + lastpart;
                console.log(colors.yellow(message));
            }else {
                this.testFrom = msg.from;
                printInfo('[ ' + msg.timestamp + ' ]: ' + 'A signed message was sent.');}
        } else {
            let message = this.decryptEncryptedMessage(msg.payload.text, msg.timestamp, msg.from);
            // for testing
            this.testMsgMsg = message;
            this.testFrom = msg.from;
            if (message != undefined){
                let lastpart = message.substring(message.indexOf(':'));
                message = '[ ' + msg.from + ' -> ' + this.nick + lastpart;
                console.log(colors.yellow(message));
            }else 
                printInfo('A secret message was sent.');
        }
    }

    /**
     * 
     * @param  text
     *         The message to the decrypt.
     * @param  timestamp
     *         The time at which the message was sent.
     */
    decryptSignedMessage(text: Buffer, timestamp: string):string | undefined {
        let message = undefined;
        for (let [nickname, hash] of this.friends) {
            try {
                let test = crypto.publicDecrypt(this.public_keys_friends.get(hash)!, text).toString('utf-8');
                // If succesful decryption:
                message = '[ ' + nickname + ' : ' + timestamp + ' : signed ]: ' +  test;  
                //for testing
                this.testFrom = nickname;
                break;
            }
            catch (error) {debug(error);} 
        }
        return message;
    }

    /**
     * Decrypt encrypted message.
     * 
     * @param  text
     *         The message to the decrypt.
     * @param  timestamp
     *         The time at which the message was sent.
     * @param  from
     *         The sender of the message.
     */
    decryptEncryptedMessage(text: Buffer, timestamp: string, from: String | undefined) {
        let message = undefined;
        try {
            message = (from != undefined)
                ? '[ ' + from + ' : ' + timestamp + ' ]: ' + 'test'
                : '[ ' + timestamp + ' ]: ' + 'test';    
        } catch (error) {debug(error);}
        return message;
    }

    /**
     * Sign the given data using this client's private key.
     * 
     * @param data The string of data to sign
     */
    async signClient(data: string): Promise<ArrayBuffer> {
        if (this.browserClient) {
            try{
                return await signSecurity(this.private_key!, data);
            }catch(e){
                return new ArrayBuffer(0);
            }
        } else {
            return crypto.sign('sha256', Buffer.from(data), {
                key: this.private_key!
            });
        }
    }
    /**
     * Send a signature to the server to verify this socket connection.
     * 
     * The server will send a prompt-verification message upon a connection-attempt.
     * This message from the server contains data, which we sign and send back to the server.
     * 
     * See docs of ChatClient.onConnect for a complete description of the verification process.
     */
    async onPromptVerification(msg: Msg<'promptVerification'>) {
        const signature = await this.signClient(msg.payload.verification_data);
        this.send('submitVerification', {signature: signature, browser: this.browserClient});
    }

    /**
     * Setter of currentWorlds
     * 
     * 
     * allWorlds will be sent once when a client connects to the server
     */
    onAllWorlds(msg: Msg<'allWorlds'> ){
        debug('setting all worlds as: ', msg.payload.worlds);
        this.currentWorlds = msg.payload.worlds;
    }


    /**
     * Shout to all clients connect to the server.
     * 
     * @effect Sends a command to shout-to-all to the server.
     *       | this.send(msg)
     *       |   where msg.command == 'shout-to-all'
     */
    shoutToAll(nick: string, message: string) {
        this.send('ChatMessage', {text:message}, {from:nick, hash_nick: this.hash_nick|| ''});
    }

    printMyFriends() {
        console.log('Your friends \n');
        this.friends.forEach( (value, key) => {
            console.log(key + ' : ' + value);
        });
    }

    updateScore(game: string, win: boolean){
        this.send('updateScore', {id: this.hash_nick, game: game, win: win});
    }

    /**
     * 
     *  * Methods with large bodies have been implemented separately.
     *  * Single-line methods or methods sending a client message only have been implemented in callback.
     */
    commands = [
        {
            name: 'shout-to-all',
            helpText: 'Send a message to all clients connected to the server',
            parameters: [
                { name: 'nick', defaultValue: () => { return this.nick; } },
                { name: 'message', isMainParameter: true }
            ],
            callback: (nick: string, message: string) => {this.shoutToAll(nick, message);}
        },

        {
            name: 'create-channel',
            helpText: 'Create a channel on the server',
            parameters: [
                { name: 'channelName', isMainParameter:true},
                { name: 'key', defaultValue: () => { return undefined; } },
                { name: 'historyLimit', defaultValue: () => { return undefined; }  },
                { name: 'externalMessages', defaultValue: () => { return undefined; } },
                { name: 'secret', defaultValue: () => { return 'false'; } }
            ],
            callback: (channelName:string, key?:string, historyLimit?:number, externalMessages?:boolean, secret?:string) => {
                this.outgoingcmd.execute('createChannel', {channelName:channelName, key:key, historyLimit:historyLimit
                    , externalMessages:externalMessages, secret:secret});
            }
        },

        {
            name: 'join-channel',
            helpText: 'Join a channel on the server',
            parameters: [
                { name: 'channelName', isMainParameter:true},
                { name: 'password', defaultValue: () => {return undefined;}}
            ],
            callback: (channelName: string, password: string|undefined) => {
                this.outgoingcmd.execute('joinChannel', {channelName: channelName, password: password});
            }
        },

        {
            name: 'leave-channel',
            helpText: 'Leave a channel on the server',
            parameters: [
                { name: 'channelName', isMainParameter: true}
            ],
            callback: (channelName: string) => {
                this.outgoingcmd.execute('leaveChannel', channelName);
            }
        },

        {
            name: 'send-channel',
            helpText: 'Send a message to all clients connected to the channel',
            parameters: [
                { name: 'channelName'},
                { name: 'message', isMainParameter: true }
            ],
            callback: (channelName: string, message: string) => {
                this.outgoingcmd.execute('sendChannel', {channelName, message});
            }
        },

        {
            name: 'print-all-channels',
            helpText: 'Send a message to all clients connected to the server',
            parameters: [],
            callback: () => {
                this.outgoingcmd.execute('printAllChannels', '');
            }
        },
        
        {
            name: 'my-channels',
            helpText: 'Print the channels the client is joined to.',
            parameters: [],
            callback: () => {
                if(this.myChannels.size == 0){
                    console.log('You have not joined a channel yet!');
                }else{
                    for(let chn of this.myChannels.keys()){
                        console.log('[channelName]: #' + chn);
                    }
                }
            }
        },

        {
            name: 'my-hash-nick',
            helpText: 'Print my hash-nick',
            parameters: [],
            callback: () => {console.log('Your hash-nick is: ' + this.hash_nick!);}
        },
    ];
    // variables used for testing
    testFrom: string | undefined;
    testMsgReceived = 0;
    testMsgMsg: string | undefined;
}

function hashMessage<C extends keyof Payloads>(msg: Msg<C>): Msg<C> {
    if(isMsg('audio', msg)){
        msg.hash = '';
        return msg;
    }
    msg.hash = sha1(msg.payload);
    return msg;
}

function verifyHash<C extends keyof Payloads>(msg: Msg<C>): boolean{
    if(isMsg('audio', msg))
        return true;
    if(isMsg('requestLeaderboard', msg))
        return true;  
    if (!msg.hash) {
        debug('This message doesn\'t have a hash', msg);
        return false;
    }
    return sha1(msg.payload) == msg.hash;
}

function printError(message = '') {
    console.log(colors.bold.red('Error: ' + message));
}

function printSuccess(message = ''){
    console.log(colors.bold.greenBright('Success: ' + message));
}

function printInfo(message = '') {
    console.log(colors.bold.blueBright('INFO: ' + message));
}

function getTime():string{
    let time = (new Date()).toUTCString();
    return time;
}

/**
 * Module exports.
 */
export default ChatClient;
export {printError, printInfo, printSuccess, getTime, verifyHash, hashMessage};