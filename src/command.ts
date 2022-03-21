import * as debugModule from 'debug';
import ChatServer from './app/server';
const debug = debugModule('chat:command');
import { strict as assert } from 'assert';
import { getTime, hashMessage } from './app/client';
import { isMsg, Msg} from './comm/proto3';
import { ServerChannelManager } from './chan/server';
import { SocketServerSide } from './comm/interface';
import { sha1 } from 'object-hash';
import Channel from './channel';

/**
 * A class implementing a constructor, getImplemntedCommands, error and
 * success method.
 */
class Command {
    server: ChatServer;
    channelManager: ServerChannelManager;
    /**
     * Initialize this command with the given server as server.
     * 
     * @param server 
     *        The given server.
     */
    constructor(server: ChatServer, channelManager: ServerChannelManager) {
        this.server = server;
        server.on('updatePosition', (socket: SocketServerSide, msg: Msg<'updatePosition'>) => this.onUpdatePosition(socket, msg));
        server.on('TicTacToeMsg', (socket: SocketServerSide, msg: Msg<'TicTacToeMsg'>) => this.onTicTacToeMsg(socket, msg));
        server.on('CTFMsg', (socket: SocketServerSide, msg: Msg<'CTFMsg'>) => this.onCTFMsg(socket, msg));
        server.on('connectionAttempt', (socket: SocketServerSide, msg: Msg<'connectionAttempt'>) => this.onConnectionAttempt(socket, msg));
        server.on('submitVerification', (socket: SocketServerSide, msg: Msg<'submitVerification'>) => this.onSubmitVerification(socket, msg));
        server.on('requestPublicKey', (socket: SocketServerSide, msg: Msg<'requestPublicKey'>) => this.onRequestPublicKey(socket, msg));
        server.on('disconnectAttempt', (socket: SocketServerSide, msg: Msg<'disconnectAttempt'>) => this.onDisconnectAttempt(socket, msg));
        server.on('disconnectCommit', (socket: SocketServerSide, msg: Msg<'disconnectCommit'>) => this.onCommitDisconnect(socket, msg));
        server.on('joinWorld', (socket: SocketServerSide, msg: Msg<'joinWorld'>) => this.onJoinWorld(socket, msg));
        server.on('tryPassword', (socket: SocketServerSide, msg: Msg<'tryPassword'>) => this.onTryPassword(socket, msg));
        server.on('setAdmin', (socket: SocketServerSide, msg: Msg<'setAdmin'>) => this.onSetAdmin(socket, msg));
        server.on('audio', (socket: SocketServerSide, msg: Msg<'audio'>) => this.onAudio(socket, msg));
        server.on('updateSkin', (socket: SocketServerSide, msg: Msg<'updateSkin'>) => this.onUpdateSkin(socket, msg));    
        server.on('requestLeaderboard', (socket: SocketServerSide, msg: Msg<'requestLeaderboard'>) => this.onRequestLeaderboard(socket, msg));
        server.on('updateScore', (socket: SocketServerSide, msg: Msg<'updateScore'>) => this.onUpdateScore(socket, msg));
        // server.on('sendPath', (socket: SocketServerSide, msg: Msg<'sendPath'>) => this.onSendPath(socket, msg));
        this.channelManager = channelManager;
    }

    onUpdateScore(socket: SocketServerSide, msg: Msg<'updateScore'>){
        this.server.updateScore(msg.payload.id, msg.payload.game, msg.payload.win);
    }

    onRequestLeaderboard(socket: SocketServerSide, msg: Msg<'requestLeaderboard'>) {
        let keys = new Array;
        for (let key of this.server.scores.keys()) {
            keys.push(key);
            let value = this.server.scores.get(key);
            keys.push(value);
        }

        this.server.sendUser(msg.payload.id, 'requestLeaderboard', {id: msg.payload.id, keys: keys});
    }

    onUpdateSkin(socket: SocketServerSide, msg: Msg<'updateSkin'>): void {
        // if client in lobby, send only to itself
        for(var i = 0; i < this.server.clientsInLobby.length; i++) {
            if(msg.payload.id == this.server.clientsInLobby[i]){
                this.server.sendUser(msg.payload.id, 'updateSkin', msg.payload);
                return;
            }
        }

        for(let chnl of this.server.channels.keys()){
            this.server.channels.get(chnl)!.updateSkin(msg);
        }
    }

    onAudio(socket: SocketServerSide, msg: Msg<'audio'>): void {
        debug('received Audio message');
        if (msg.to && msg.from && msg.to.startsWith('#')) {
            if (!this.server.channels.has(msg.to)){
                this.server.send(socket, 'Error', {msg: `There is no channel named ${msg.to}`});
            } else {
                this.server.channels.get(msg.to)?.send(socket, msg.hash_nick, msg);
            }
        }
    }

    /**
     * called when setAdmin received -> sent when a client becomes admin of a world
     * 
     * actions:
     *      - that world (channel) is now PRIVATE and has a password
     *      - all clients in that world should receive an update that someone is admin (and thus that they cannot become admin anymore)
     *      - all clients in lobby should know that this world is now private
     */
    onSetAdmin(socket: SocketServerSide, msg: Msg<'setAdmin'>){
        for(let cnl of this.server.channels.keys()){
            if(cnl == '#' + msg.payload.worldName){
                this.server.channels.get(cnl)!.isPrivate = true;
                this.server.channels.get(cnl)!.adminOfWorld = msg.hash_nick;
                this.server.channels.get(cnl)!.psw = msg.payload.password;
                this.sendWorldAdminUpdate(this.server.channels.get(cnl)!, msg.hash_nick);
                this.sendPrivateWorldsUpdate();
            }
        }
    }

    /**
     * inform every client in the lobby that the world (channel) has now been private (and so they need a password to join)
     * (and visually there would be a "private" sign in lobby)
     */
    sendPrivateWorldsUpdate(){
        for(var i = 0; i < this.server.clientsInLobby.length; i++) {
            let id = this.server.clientsInLobby[i];
            this.server.sendUser(id, 'allPrivateWorlds', {worlds:this.server.getAllPrivateWorlds()});
        }
    }

    /**
     * update all players in the world that a client has been made admin 
     * OR
     * update all players in the world that an admin has left the world 
     */
    sendWorldAdminUpdate(channel: Channel, hashnick: string){
        for(let usr of channel.users.keys()){
            this.server.sendUser(usr, 'updateAdmin', {hashnick: hashnick});
        }
    }

    /**
     * A client tried entering a private world and entered a password
     *  -> check if this is correct (send successPassword) or false (send failPassword)
     */
    onTryPassword(socket: SocketServerSide, msg: Msg<'tryPassword'>){
        for(let cnl of this.server.channels.keys()){
            if(cnl == msg.payload.worldName){
                if(msg.payload.password == this.server.channels.get(cnl)?.psw){
                    this.server.send(socket, 'successPassword', {});
                    return;
                }
            }
        }
        this.server.send(socket, 'failPassword', {});
    }

    checkIsAdmin(chnl : Channel|undefined, hash_nick: string){
        if(chnl?.adminOfWorld != undefined){ //if this client is the admin of the world, and this client want to leave -> world public
            if(chnl.adminOfWorld == hash_nick){
                debug('chnl= ', chnl);
                chnl.adminOfWorld = undefined;
                chnl.isPrivate = false;
                chnl.psw = undefined;
                this.sendWorldAdminUpdate(chnl, '');
                this.sendPrivateWorldsUpdate();
            }
        }
    }

    /**
     * a joinWorld message has been received:
     *      - a client want to join a world
     *      - a client want to switch worlds
     *      - a client want to return to lobby (msg.payload.world_name == undefined)
     */
    onJoinWorld(socket: SocketServerSide, msg: Msg<'joinWorld'>): void {
        const id = msg.hash_nick;
        const index = this.server.clientsInLobby.indexOf(id);
        if (index == -1){ //client not in lobby
            this.worldToWorld(socket, msg);
        }else{
            this.server.clientsInLobby.splice(index, 1);
            //client was in lobby and wants to join a world
            this.lobbyToWorld(socket, msg);
        }
    }

    /**
     * The client is in lobby
     * He has sent a joinWorld
     */
    lobbyToWorld(socket: SocketServerSide, msg: Msg<'joinWorld'>){
        const id = msg.hash_nick;
        const worldName = '#' + msg.payload.world_name;
        let chnl = this.server.channels.get(worldName);
        let wrld = this.server.worlds[msg.payload.world_name];
        if(!this.server.channels.has(worldName) || wrld == undefined){//the given world_name is wrong -> client to lobby
            this.server.clientsInLobby.push(id);
            //Client is already in lobby, so his knowledge doesn't need to be updated
            return;
        }
        if(msg.payload.isBot){
            chnl!.addBot(socket, msg.from, msg.hash_nick);
            this.sendWorldSizeUpdate(msg.payload.world_name, 'joined_bot');
        } else {
            chnl?.addUser(socket, msg.from, msg.hash_nick);
            this.sendWorldSizeUpdate(msg.payload.world_name, 'joined_client');
        }
        //this.sendWorldSizeUpdate(msg.payload.world_name, 'joined_client');

        wrld = this.server.channels.get(worldName)!.worldLogic;

        this.server.send(socket, 'joinWorld', {world_name:msg.payload.world_name, world_logic:wrld});
        chnl?.sendAllPositions(socket, msg.payload.world_name, id, msg.payload.coordinates!);
    }

    /**
     * The client is not in lobby, so is in a world.
     * He has sent a joinWorld
     */
    worldToWorld(socket: SocketServerSide, msg: Msg<'joinWorld'>){
        const id = msg.hash_nick;
        if(msg.payload.world_name == '' && msg.to != undefined){
            //The client is not in lobby and wants to go to the lobby, so we need to find the world in which he is.
            //Then we need to remove him from the world and send a joinworld message with world_name = undefined
            
            // the client wants to go back to the lobby, so we need to remove him from his channel
            let chnl = this.server.channels.get('#' + msg.to);
            if(chnl != undefined){
                chnl.deleteFromWorld(id);
                this.checkIsAdmin(chnl, msg.hash_nick); //check if client is admin
                if(msg.payload.isBot){
                    this.sendWorldSizeUpdate(msg.to, 'left_bot');
                }else{
                    this.sendWorldSizeUpdate(msg.to, 'left_client');
                }
            }
            this.server.clientsInLobby.push(id);            
            this.updateClientLobbyKnowledge(socket); //client goes to lobby -> update lobby knowledge
            
            this.server.send(socket, 'joinWorld', {world_name:msg.payload.world_name}); //client to lobby
        
        } else if (msg.payload.world_name != '' && msg.to != undefined){
            //The client is not in lobby and want to go to another world, so we need to find the world in which he is.
            //Then we need to remove him from the world and send a joinworld message with world_name = msg.payload.world_name
            let chnl = this.server.channels.get('#' + msg.to);
            if(chnl != undefined){
                chnl.deleteFromWorld(id);
                if(msg.payload.isBot){
                    this.sendWorldSizeUpdate(msg.to, 'left_bot');
                }else{
                    this.sendWorldSizeUpdate(msg.to, 'left_client'); //update all clients that a client left the world
                }
                this.checkIsAdmin(chnl, msg.hash_nick); //check if client is admin
            }
            let chnl2 = this.server.channels.get('#' + msg.payload.world_name);
           
            if(chnl2 != undefined){
                //add user to new world
                if(msg.payload.isBot){
                    chnl2?.addBot(socket, msg.from, msg.hash_nick);
                    this.sendWorldSizeUpdate(msg.payload.world_name, 'joined_bot'); //update all clients that a bot joined the world
                }else{
                    chnl2?.addUser(socket, msg.from, msg.hash_nick);
                    this.sendWorldSizeUpdate(msg.payload.world_name, 'joined_client'); //update all clients that a client joined the world
                }
                let wrld = this.server.worlds[msg.payload.world_name];
                if(wrld == undefined){
                    this.server.clientsInLobby.push(id);
                    this.updateClientLobbyKnowledge(socket);

                    this.server.send(socket, 'joinWorld', {world_name:msg.payload.world_name});//to lobby
                    return;
                }
                wrld = chnl2!.worldLogic;
                
                this.server.send(socket, 'joinWorld', {world_name:msg.payload.world_name, world_logic:wrld});
                chnl2!.sendAllPositions(socket, msg.payload.world_name, id, msg.payload.coordinates!);
            } else {
                //the given world name doesn't exist, so send client to lobby
                this.server.clientsInLobby.push(id);
                this.updateClientLobbyKnowledge(socket);

                this.server.send(socket, 'joinWorld', {world_name:msg.payload.world_name}); //client will be send to lobby
                chnl2!.sendAllPositions(socket, msg.payload.world_name, id, msg.payload.coordinates!);
                return;
            }
        }
    }

    updateClientLobbyKnowledge(socket : SocketServerSide){
        this.server.send(socket, 'worldSize', {worlds:this.getWorldSizes()}); //let client visualise the amount of client in each world
        this.server.send(socket, 'allPrivateWorlds', {worlds:this.server.getAllPrivateWorlds()}); //client will join the lobby so send allPrivateWorlds
    }

    /**
     * Emit an error. 
     */
    error(socket:SocketServerSide, error:string) {      
        this.server.send(socket, 'Error', {msg: error});
    }

    /**
     * Emit a success. 
     */
    success(socket:SocketServerSide, success:string) {      
        this.server.send(socket, 'Succes', {msg:success});
    }

    // I think this method should be removed (pathfinding is done by every client)
    // update the pos ding van een client 
    onSendPath(socket: SocketServerSide, msg: Msg<'sendPath'>){
        assert(isMsg('sendPath', msg));
        this.server.paths.set(msg.payload.hash_nick, msg.payload.path);
    }
    
    onConnectionAttempt(socket: SocketServerSide, msg: Msg<'connectionAttempt'>) {
        assert(isMsg('connectionAttempt', msg));

        const hash_key = sha1(msg.payload.public_key);
        const hash_nick: string = hash_key + ':' + msg.payload.nick;

        // If the connection attempt is more than 5 minutes ago
        if ((new Date().getTime()) - new Date(msg.timestamp).getTime() > 300000) {
            this.error(socket, 'Connectection attempt is te lang geleden.');
            socket.close();
        }

        // If the combination of this hash and nick is already in use
        if (this.server.public_keys.has(hash_nick)) {
            this.error(socket, 'The combination of your public key and nick is already in use.');
            return;
        }

        // Send verification data to client
        this.sendVerification(socket, hash_nick, msg.payload.public_key, msg.payload.isBrowserClient);
    }

   
    sendVerification(socket:SocketServerSide, hash_nick:string, public_key:string, isBrowserClient: boolean) {
        // Set up unverified client
        const data = new Date().getTime().toString();
        this.server.socket_data.set(hash_nick, 
            {hash_nick: hash_nick,
                isVerified: false, 
                verification_data: data,
                public_key: public_key,
                isBrowserClient: isBrowserClient}); 

        // Send command
        this.server.send(socket, 'promptVerification', {verification_data:data});
    }
    

    async onSubmitVerification(socket: SocketServerSide, msg: Msg) {
        assert(isMsg('submitVerification', msg));
        
        // We verify the signature sent by this unverified client
        let unverifiedClient = this.server.socket_data.get(msg.hash_nick)!;
        const hash_nick = unverifiedClient.hash_nick;

        const isVerified = this.server.verifyServer(unverifiedClient.public_key,
            msg.payload.signature, unverifiedClient!.verification_data, unverifiedClient!.isBrowserClient);

            
        if (isVerified) {
            this.server.socket_data.get(msg.hash_nick!)!.isVerified = true;
            this.success(socket, 'Client is Verified.');
            this.server.registerUser(socket, this.server.socket_data.get(msg.hash_nick!)!.public_key,
            this.server.socket_data.get(msg.hash_nick!)!.hash_nick.split(':')[1]);
            // This client is added to the required channels
            this.addHashNickChannel(socket, hash_nick);

            this.server.public_keys.set(hash_nick, unverifiedClient.public_key);
            this.sendHash(socket, hash_nick);
            this.server.send(socket, 'lobbyLogic', {logic: this.server.getLobbyLogic()});
            this.server.send(socket, 'allWorlds', {worlds:this.server.getAllWorlds()}); //client will join the lobby so send allWorlds
            this.server.send(socket, 'allPrivateWorlds', {worlds:this.server.getAllPrivateWorlds()}); //client will join the lobby so send allPrivateWorlds
            this.server.send(socket, 'allBotSizes', {bots: this.server.getAllBotSizes()});
            this.server.send(socket, 'worldSize', {worlds:this.getWorldSizes()}); //let client visualise the amount of client in each world
            if(!msg.payload.browser) //only push when browser client
                this.server.cliClients.push(msg.hash_nick);
            this.server.clientsInLobby.push(msg.hash_nick); //add client to array containing all clients in lobby
        } else {
            this.error(socket,'Client couldn\'t be verified');
            this.server.send(socket, 'failedVerification', {});
            socket.close();
        }
    }

    /**
     * update all players in lobby that a client joined/left a world
     */
    sendWorldSizeUpdate(world1: string, action1 : string, world2? : string, action2? : string){
        for(var i = 0; i < this.server.clientsInLobby.length; i++) {
            let id = this.server.clientsInLobby[i];
            if(!world2)
                world2 = '';
            action2 = '';
            this.server.sendUser(id, 'worldSizeUpdate', {world1:world1, action1: action1, world2: world2, action2: action2});
        }
    }

    /**
     * returns a list containing the amount of clients in each world (channel)
     */
    getWorldSizes() : number[]{
        let mapping : number[] = [];

        for(let world in this.server.worlds){
            let channel = this.server.channels.get('#' + world);
            if(channel != undefined){
                let size = channel?.getUsers().size - 1;
                mapping.push(size);
            }
        }
        return mapping;
    }
        

    /**
     * Add this client in a channel with itself.
     */
    addHashNickChannel(socket:SocketServerSide, hash_nick:string) {
        if (!this.server.channels.has('#channel_' + hash_nick)) {
            let new_msg: Msg<'ChannelCreate'> = {command:'ChannelCreate', 
                payload: { hash_nick: hash_nick, 
                    channel: 'channel_' + hash_nick, 
                    id: socket.getId(),
                    history: 50, 
                    externalMessages: false },
                timestamp:getTime(),
                hash_nick: hash_nick};
            this.channelManager.doChannelCreate(socket, hashMessage(new_msg));
        } else {
            let newmsg:Msg<'ChannelJoin'> =  {command:'ChannelJoin', 
                payload: { hash_nick: hash_nick,
                    id: socket.getId(), 
                    channel: 'channel_' + hash_nick},
                timestamp:getTime(),
                hash_nick: hash_nick};
            this.channelManager.doChannelJoin(socket, newmsg);
        }
    }

    /**
     * Let the client know what its hash_nick is.
     */
    sendHash(socket: SocketServerSide, hash_nick: string) {
        this.server.send(socket, 'myHashNick', {hash_nick: hash_nick});
    }

    onUpdatePosition(socket: SocketServerSide, args: Msg) {
        assert(isMsg('updatePosition', args));
        for(let chnl of this.server.channels.keys()){
            this.server.channels.get(chnl)?.updatePosition(args);
        }
        
    }

    onTicTacToeMsg(socket: SocketServerSide, args: Msg) {
        assert(isMsg('TicTacToeMsg', args));
        this.server.managerTicTacToe.handleMessage(args);
    }

    onCTFMsg(socket: SocketServerSide, args: Msg<'CTFMsg'>) {
        this.server.handleCTFMsg(args);
    }

    onRequestPublicKey(socket: SocketServerSide, args: Msg) {
        assert(isMsg('requestPublicKey', args));

        // Search for hash_nick using the given prefix
        let hash_nick = this.searchHashNick(args.payload.hash_nick_prefix);
        
        // Send public key
        if (hash_nick == undefined) { 
            debug('The searched client does not exist on this server');
        } else {
            const public_key = this.server.public_keys.get(hash_nick)!;

            // Retrieve nick from hash_nick. We only need to do this once.
            let nicklist = hash_nick.split(':');
            nicklist[0] = ''; // Delete hash
            let nick = nicklist.join(':').slice(1); // Slice removes ":"

            this.server.send(socket, 'givePublicKey', { hash_nick: hash_nick, 
                public_key: public_key, 
                nick: nick});
        }
    }

    /**
     * Search for the hash-nick using the given prefix.
     */
    searchHashNick(prefix: string) {
        var candidates = this.server.public_keys;
        var hash_nick = undefined;   
        // eslint-disable-next-line no-unused-vars
        for (const [key, value] of candidates) {
            var i;
            for (i = 0; i < prefix.length; i++)
                if (prefix[i] != key[i])
                    break;

            if (i == prefix.length && hash_nick == undefined)
                hash_nick = key;
            else if (i == prefix.length)
                break;
        }
        return hash_nick;
    }

    onDisconnectAttempt(socket: SocketServerSide,args: Msg) {
        assert(isMsg('disconnectAttempt', args));

        // The verification data should be different each time for security reasons.
        const data = new Date().getTime().toString();
        
        this.server.disconnect_data.set(socket.getId(), {hash_nick: args.payload.hash_nick!,
            explicit: args.payload.explicit,
            channels: args.payload.channels,
            verification_data: data}); 
        this.server.send(socket, 'disconnectVerification', {verification_data:data});   
    }



    async onCommitDisconnect(socket: SocketServerSide,args: Msg) {
        assert(isMsg('disconnectCommit', args));

        let data = this.server.disconnect_data.get(socket.getId())!;
        const hash_nick = data.hash_nick;
        const isVerified = this.server.verifyServer(this.server.public_keys.get(hash_nick)!,
            args.payload.signature, data!.verification_data, this.server.socket_data.get(args.hash_nick)!.isBrowserClient);


        if (isVerified) {
            // It deregistrates the public key 
            this.server.public_keys.delete(hash_nick);

            // If explicit, deregistrates the client from all channels where is was known.
            if (data.explicit=='true')
                for (let channel of data.channels!) {
                    let msg = this.server.createMsg('ChannelLeave', {channel: channel});
                    socket.send(msg);
                }

            if(!this.server.socket_data.get(args.hash_nick)!.isBrowserClient){
                if(this.server.cliClients.indexOf(hash_nick) != -1)
                    this.server.cliClients.splice(this.server.cliClients.indexOf(hash_nick), 1);
                socket.close();   
            }else{
                this.server.send(socket, 'browserDisconnect', {socket: socket});
            } 
        } else {
            this.error(socket, 'Disconnection attempt failed.');
        }
    }
}


export default Command;
