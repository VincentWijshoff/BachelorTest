import * as debugModule from 'debug';
import ChatServer from './app/server';
import { SocketServerSide } from './comm';
import { isMsg, Msg } from './comm/proto3';
import { MazeBuilder } from './mazeGenerator';
import { sleep } from './world/world';
const debug = debugModule('chat:channel');


/**
 * Channel class.
 */
class Channel {

    name: string; // Name of the channel
    users = new Map(); // Users of the channel
    admin = new Map();
    server: ChatServer; // server for this channel 
    // eslint-disable-next-line no-undef
    timeout: NodeJS.Timeout|undefined; // Timeout value before a channel is removed due to inactivity 
    key: string|undefined; // Key that is used for the encryption for this chanel 
    historyLimit: number; // Number of messages to remember
    history = new Map();  // Map with history of messages
    historyCounter = 0;  // Index of message to replace in history map
    externalMessages: boolean; // Allow messages of non-members
    secret: boolean;
    password: string | undefined;
    admin_id: string;
    activeplugins: string[];
    botsInChannel: number;
    bots = new Map();

    clientPositions: Map<string, {x:number, y:number, skin: string}>;

    isPrivate: boolean = false; //world is private yes or no
    psw: string|undefined; //password of the cave World
    adminOfWorld: string|undefined; //admin of the world (hashnick)
    worldLogic: string[][]; // the maze for psych world || grassworld || iceworld

    constructor(name: string, server: ChatServer, admin_socket: SocketServerSide|undefined, password: string|undefined, admin_id:string, key?: string, historyLimit=5, externalMessages=false, secret=false) {
        
        this.server = server;
        this.name = name;
        this.admin_id = admin_id;
        // eslint-disable-next-line no-unused-vars
        const hash = '';
        const nick = '';
        this.botsInChannel = 0;
        if(admin_socket){
            // eslint-disable-next-line no-unused-vars
            const { hash, nick } = this.server.socketToUserInfo(admin_socket) || {};
        }
        this.admin.set(this.admin_id, nick);
        this.historyLimit = historyLimit;
        this.externalMessages = externalMessages;
        this.key = key;
        this.users.set(this.admin_id, this.server.users.get(this.admin_id));
        this.secret = secret;
        this.password = password;
        this.activeplugins = [];
        this.clientPositions = new Map();
        this.worldLogic = [];
        let worlds = require('../worlds.json');
        this.worldLogic = worlds[name.substring(1)];
        if(name == '#LavaWorld' || name == '#DesertWorld' || name == '#OceanWorld' || name == '#CaveWorld'){
            this.setCoin();
        }
        if(name == '#PsychedelicWorld'){
            this.makeMaze();
        }else if (name == '#GrassWorld'){
            this.startGrassLoop();
        }else if (name == '#IceWorld'){
            this.startIceLoop();
        }
    }

    setCoin(){
        let xCoin:number;
        let yCoin:number;
        do{
            xCoin = Math.round( Math.random() * 29);
            yCoin = Math.round( Math.random() * 19);
        }while(this.worldLogic[yCoin][xCoin] != 'tile');
        this.worldLogic[yCoin][xCoin] = 'coin';
    }

    async startIceLoop(){
        this.startBearHorizontal(5, 14, 'bearfrontleftwalking', 'bearbackleftwalking', 0, 12);
        await sleep(500);
        this.startBearHorizontal(7, 4, 'bearfrontrightwalking', 'bearbackrightwalking', 4, 19);
        await sleep(500);
        this.startBearVertical(24, 2, 'bearfrontdownwalking', 'bearbackdownwalking', 0, 11);
        await sleep(500);
        this.startBearVertical(21, 15, 'bearfrontupwalking', 'bearbackupwalking', 6, 17);

    }

    async startBearVertical(posX: number, posY: number, tileFront: string, tileBack: string, boundTop: number, boundDown: number) {
        const normalTile = 'tile';
        let direction: number; //-1: up , +1: down
        if(tileFront.includes('down')){
            direction = -1;
        }else{
            direction = 1;
        }
        // eslint-disable-next-line no-constant-condition
        while(true){
            await sleep(100);
            await sleep(this.joinTimer);
            if(posY - direction >= boundTop && posY - direction <= boundDown){
                for(let i = 0; i<4; i++){
                    this.sendWorldUpdate([{y: posX, x: posY, tile: tileFront + i}, {y: posX, x: posY + direction, tile: tileBack + i}]);
                    this.worldLogic[posY][posX] = tileFront + i;
                    this.worldLogic[posY + direction][posX] = tileBack + i;
                    await sleep(200);
                    await sleep(this.joinTimer);
                }
                for(let i = 4; i<6; i++){
                    this.sendWorldUpdate([{y: posX, x: posY - direction, tile: tileFront + i}, {y: posX, x: posY, tile: tileBack + i}, {y: posX, x: posY + direction, tile: normalTile}]);
                    this.worldLogic[posY - direction][posX] = tileFront + i;
                    this.worldLogic[posY][posX] = tileBack + i;
                    this.worldLogic[posY + direction][posX] = normalTile;
                    await sleep(100);
                    await sleep(this.joinTimer);
                }
                this.worldLogic[posY - direction][posX] = tileFront + '0';
                this.worldLogic[posY][posX] = tileBack + '0';
                this.sendWorldUpdate([{y: posX, x: posY - direction, tile: tileFront + '0'}, {y: posX, x: posY, tile: tileBack + '0'}]); 
            }else{
                await sleep(this.joinTimer);
                await sleep(1000);
                direction *= -1;
                if(tileFront.includes('up')){
                    tileFront = 'bearfrontdownwalking';
                    tileBack = 'bearbackdownwalking';
                }else{
                    tileFront = 'bearfrontupwalking';
                    tileBack = 'bearbackupwalking';
                }
            }
            posY -= direction;
        }
    }

    async startBearHorizontal(posX: number, posY: number, tileFront: string, tileBack: string, boundLeft: number, boundRight: number) {
        const normalTile = 'tile';
        let direction: number; //+1: left , -1: right
        if(tileFront.includes('left')){
            direction = 1;
        }else{
            direction = -1;
        }
        // eslint-disable-next-line no-constant-condition
        while(true){
            await sleep(100);
            await sleep(this.joinTimer);
            if(posX - direction >= boundLeft && posX - direction <= boundRight){
                for(let i = 0; i<4; i++){
                    this.sendWorldUpdate([{y: posX, x: posY, tile: tileFront + i}, {y: posX + direction, x: posY, tile: tileBack + i}]);
                    this.worldLogic[posY][posX] = tileFront + i;
                    this.worldLogic[posY][posX + direction] = tileBack + i;
                    await sleep(100);
                    await sleep(this.joinTimer);
                }
                for(let i = 4; i<6; i++){
                    this.sendWorldUpdate([{y: posX - direction, x: posY, tile: tileFront + i}, {y: posX, x: posY, tile: tileBack + i}, {y: posX + direction, x: posY, tile: normalTile}]);
                    this.worldLogic[posY][posX - direction] = tileFront + i;
                    this.worldLogic[posY][posX] = tileBack + i;
                    this.worldLogic[posY][posX + direction] = normalTile;
                    await sleep(100);
                    await sleep(this.joinTimer);
                }

                this.worldLogic[posY][posX - direction] = tileFront + '0';
                this.worldLogic[posY][posX] = tileBack + '0';
                //this.worldLogic[posY][posX + direction] = normalTile;
                this.sendWorldUpdate([{y: posX - direction, x: posY, tile: tileFront + '0'}, {y: posX, x: posY, tile: tileBack + '0'}/*, {y: posX + direction, x: posY, tile: normalTile}*/]); 
            }else{
                await sleep(this.joinTimer);
                await sleep(1000);
                direction *= -1;
                if(tileFront.includes('left')){
                    tileFront = 'bearfrontrightwalking';
                    tileBack = 'bearbackrightwalking';
                }else{
                    tileFront = 'bearfrontleftwalking';
                    tileBack = 'bearbackleftwalking';
                }
            }
            posX -= direction;
        }
    }

    joinTimer = 0;

    async startGrassLoop(){
        let bridgePosX: number = 22; //middle position of bridge (3 tiles wide)
        const bridgePosY: number = 9;
        let bridgeTileFront = 'boatfrontleft';//this.worldLogic[bridgePosY][bridgePosX];
        let bridgeTileMiddle = 'boatmiddleleft';//this.worldLogic[bridgePosY][bridgePosX];
        let bridgeTileBack = 'boatbackleft';//this.worldLogic[bridgePosY][bridgePosX];

        const waterTile = 'Dwatertile'; //this.worldLogic[bridgePosY][bridgePosX - 2];
        let direction: number = 1; //+1: left , -1: right
        const leftPos: number = 5;
        const rightPos: number = 24;
        // eslint-disable-next-line no-constant-condition
        while (true){
            //await sleep(100);
            if(bridgePosX+2*direction <= rightPos && bridgePosX+2*direction >= leftPos){
                for(let i = 0; i<2; i++){
                    this.worldLogic[bridgePosY][bridgePosX + 2*direction] = bridgeTileBack + i;
                    this.worldLogic[bridgePosY][bridgePosX] = bridgeTileFront + i;
                    this.worldLogic[bridgePosY][bridgePosX + direction] = bridgeTileMiddle + i;
                    this.sendWorldUpdate([{y: bridgePosX+2*direction, x: bridgePosY, tile: bridgeTileBack + i}, {y: bridgePosX, x: bridgePosY, tile: bridgeTileFront + i}, {y: bridgePosX + direction, x: bridgePosY, tile: bridgeTileMiddle + i}]);
                    await sleep(200);
                }

                for(let i = 2; i<4; i++){
                    this.worldLogic[bridgePosY][bridgePosX+2*direction] = waterTile;
                    this.worldLogic[bridgePosY][bridgePosX-direction] = bridgeTileFront + i;
                    this.worldLogic[bridgePosY][bridgePosX] = bridgeTileMiddle + i;
                    this.worldLogic[bridgePosY][bridgePosX+direction] = bridgeTileBack + i;
                    this.sendWorldUpdate([{y: bridgePosX+2*direction, x: bridgePosY, tile: waterTile}, {y: bridgePosX-direction, x: bridgePosY, tile: bridgeTileFront + i}, {y: bridgePosX, x: bridgePosY, tile: bridgeTileMiddle + i}, {y: bridgePosX+direction, x: bridgePosY, tile: bridgeTileBack + i}]);    
                    await sleep(200);
                }
                
            }
            bridgePosX -= direction;
            if(bridgePosX == leftPos || bridgePosX == rightPos){
                await sleep(3000);
                direction *= -1;
                if(bridgeTileFront.includes('left')){
                    bridgeTileFront = 'boatfront';
                    bridgeTileMiddle = 'boatmiddle';
                    bridgeTileBack = 'boatback';
                }else{
                    bridgeTileFront = 'boatfrontleft';
                    bridgeTileMiddle = 'boatmiddleleft';
                    bridgeTileBack = 'boatbackleft';
                }
            }
        }
    }

    sendWorldUpdate(updatedTiles: {x: number, y: number, tile: string}[]){
        for(let key of this.clientPositions.keys()){
            this.server.sendUser(key, 'updateWorldTiles', {updatedTiles: updatedTiles});
        }
    }

    makeMaze(){
        let maze = new MazeBuilder(30, 20);
        this.worldLogic = maze.toString();
    }

    sendAllPositions(socket: SocketServerSide, world_name: string, hashNick: string, coordinates: {x:number, y:number, skin: string}){
        //inform already joined clients about the new client
        for(let key of this.clientPositions.keys()){
            this.server.sendUser(key, 'updatePosition', {hashnick: hashNick, x: coordinates.x, y: coordinates.y, skin: coordinates.skin ,direction: ''});
        }
        this.clientPositions.set(hashNick, coordinates);
        //send new joined client all positions of already joined clients
        for(let key of this.clientPositions.keys()){
            this.server.send(socket, 'updatePosition', {hashnick: key, x: this.clientPositions.get(key)!.x, y: this.clientPositions.get(key)!.y, skin: this.clientPositions.get(key)!.skin, direction: ''});
        }
    }

    updatePosition(msg : Msg<'updatePosition'>){
        if(!this.clientPositions.has(msg.hash_nick)){
            this.joinTimer = 1000;
            setTimeout(() => {
                this.joinTimer = 0;
            }, 1000);
        }
        if(this.users.has(msg.hash_nick)){
            Array.from(this.users.keys()).forEach(id => {
                this.server.sendUser(id, 'updatePosition', msg.payload);
            });
            this.clientPositions.set(msg.hash_nick, {x: msg.payload.x, y: msg.payload.y, skin: msg.payload.skin});

            // Notify CTF manager
            const manager = this.server.managersCTF.get(this.name.substring(1));
            if (manager !== undefined) {
                if (manager!.running) manager!.positionUpdate(this.clientPositions);
            }
        }else if(this.bots.has(msg.hash_nick)){
            Array.from(this.bots.keys()).forEach(id => {
                this.server.sendUser(id, 'updatePosition', msg.payload);
            });
            this.clientPositions.set(msg.hash_nick, {x: msg.payload.x, y: msg.payload.y, skin: msg.payload.skin});
        }
    }

    updateSkin(msg: Msg<'updateSkin'>) {
        if(this.clientPositions.has(msg.hash_nick)){
            Array.from(this.users.keys()).forEach(id => {
                this.server.sendUser(id, 'updateSkin', msg.payload);
            });
            let pos = this.clientPositions.get(msg.hash_nick)!;
            pos.skin = msg.payload.skin;
            this.clientPositions.set(msg.hash_nick, pos);
        }else if(this.bots.has(msg.hash_nick)){
            Array.from(this.bots.keys()).forEach(id => {
                this.server.sendUser(id, 'updateSkin', msg.payload);
            });
            let pos = this.clientPositions.get(msg.hash_nick)!;
            pos.skin = msg.payload.skin;
            this.clientPositions.set(msg.hash_nick, pos);
        }
    }

    removeUser(hash_nick: string){
        if(this.users.has(hash_nick)){
            this.users.delete(hash_nick);
            this.clientPositions.delete(hash_nick);
            Array.from(this.users.keys()).forEach(id => {
                this.server.sendUser(id, 'deleteClient', {hash_nick: hash_nick});
            });
        }else if(this.bots.has(hash_nick)){
            this.bots.delete(hash_nick);
            this.clientPositions.delete(hash_nick);
            Array.from(this.bots.keys()).forEach(id => {
                this.server.sendUser(id, 'deleteClient', {hash_nick: hash_nick});
            });
        }
    }

    deleteFromWorld(id : string){
        this.removeUser(id);
        if(this.name == '#PsychedelicWorld' && this.users.size == 1){
            // when psychedelic world is empty, regenerate the maze
            this.makeMaze();
        }
    }

    /**
     * add a user to a channel
     * 
     * @param {SocketServerSide} socket - socket of the user we want to add
     * @param {string} nick - nick of the user we want to add
     * @param {string} hashnick - id of the user we want to add
     * 
     * @return {void}
     */
    addUser(socket: SocketServerSide, nick: string|undefined, hashnick: string) {
        this.joinTimer = 1000;
        setTimeout(() => {
            this.joinTimer = 0;
        }, 1000);
        this.users.set(hashnick, this.server.users.get(hashnick));
        this.server.send(socket, 'Info', {msg: `${nick} joined the channel`});
        if (this.timeout !== undefined) {
            clearTimeout(this.timeout);
        }
    }

    addBot(socket: SocketServerSide, nick: string|undefined, hashnick: string) {
        this.botsInChannel += 1;
        this.bots.set(hashnick, this.server.users.get(hashnick));
        debug('Added bot to channel:', this.name);
        this.server.send(socket, 'Info', {msg: `${nick} [BOT] joined the channel`});
        if (this.timeout !== undefined) {
            clearTimeout(this.timeout);
        }
    }
    
    /**
     * get all the users of a channel 
     * @retun {map} users - the users of this channel 
     */
    getUsers() {
        return this.users;
    }

    /**
     * send a message to the channel 
     * @param {string} senderId - client ID of the client who sends the message 
     * @param {sting} message - the message that has to be send
     * @return {void}
     */
    send(socket:SocketServerSide, senderId:string, msg:Msg<'ChatMessage'> | Msg<'audio'>) {
        if(isMsg('ChatMessage', msg)){
            let message = msg.payload.text;
            if  (!this.users.has(senderId) && !this.externalMessages && !this.bots.has(senderId)) {
                this.server.send(socket, 'Error', {msg: `You are not joined to the channel ${this.name}`});
            } else {
                if(this.historyLimit != 0) {
                    this.history.set(this.historyCounter, [this.users.get(senderId), message]);
                    this.historyCounter = (this.historyCounter + 1) % this.historyLimit; // Keep the the size of the history map smaller or equal than 'historyLimit' by looping via modulo
                }
                Array.from(this.users.keys()).forEach(id => {
                    this.server.sendUser(id, 'ChatMessage', msg.payload, {from:msg.from, to:this.name, hash_nick: msg.hash_nick});
                });
                Array.from(this.bots.keys()).forEach(id => {
                    this.server.sendUser(id, 'ChatMessage', msg.payload, {from:msg.from, to:this.name, hash_nick: msg.hash_nick});
                });
            }
            debug(`Emitted message to ${this.name}`);
        } else {
            // audio message
            this.sendAudio(socket, senderId, msg);
        }
    }

    sendAudio(socket:SocketServerSide, senderId:string, msg: Msg<'audio'>){
        if(this.users.has(senderId)){
            Array.from(this.users.keys()).forEach(id => {
                this.server.sendUser(id, 'audio', msg.payload, {from:msg.from, to:this.name, hash_nick: msg.hash_nick});
            });
        }
        if(this.bots.has(senderId)){
            Array.from(this.bots.keys()).forEach(id => {
                this.server.sendUser(id, 'audio', msg.payload, {from:msg.from, to:this.name, hash_nick: msg.hash_nick});
            });
        }
    }

    /**
     * @static
     * check if the suggested name is a valid channel name
     * @param {string} name - suggested channel name 
     * @return {boolean} - True if the name is valid, False if the name is not valid 
     */
    static isValidName(name:string) {
        if (name.charAt(0) == '#' && (name.match(/#/g)||[]).length == 1) {
            return name.indexOf(' ') < 0;
        }
        return false;
    }
}



/**
 * Module exports.
 */
export default Channel;
