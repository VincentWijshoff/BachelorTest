import { SocketServerSide } from '../comm/interface';
import { ChatServer } from '../app/server';

import { Msg } from '../comm/proto3';

import * as debugModule from 'debug';
import Channel from '../channel';
const debug = debugModule('chat:channelmanager:server');

export class ServerChannelManager {

    chatServer: ChatServer;

    constructor(chatServer: ChatServer) {
        this.chatServer = chatServer;

        chatServer.on('ChannelCreate', (socket: SocketServerSide, msg: Msg<'ChannelCreate'>) => this.doChannelCreate(socket, msg));
        chatServer.on('ChannelJoin', (socket: SocketServerSide, msg: Msg<'ChannelJoin'>) => this.doChannelJoin(socket, msg));
        chatServer.on('ChannelLeave', (socket: SocketServerSide, msg: Msg<'ChannelLeave'>) => this.doChannelLeave(socket, msg));
        chatServer.on('requestAllChannels', (socket: SocketServerSide, msg: Msg<'requestAllChannels'>) => this.onAllChannels(socket, msg));
        chatServer.on('reaper', () => this.reaper());
        
        for(const world in chatServer.worlds){
            const channame = '#' + world;
            this.chatServer.channels.set(channame, new Channel(channame, this.chatServer, undefined, undefined, ''));
        }
    }
    // eslint-disable-next-line no-unused-vars
    onAllChannels(socket: SocketServerSide, msg: Msg<'requestAllChannels'>): void {
        for(let cnl of this.chatServer.channels.keys()){
            this.chatServer.send(socket, 'printChannel', {channel: cnl});
        }
    }

    doChannelCreate(socket: SocketServerSide, msg: Msg<'ChannelCreate'>) {
        // eslint-disable-next-line no-unused-vars
        const { hash, nick } = this.chatServer.socketToUserInfo(socket) || {};
        if (this.chatServer.channels.has('#' + msg.payload.channel)) {
            this.chatServer.send(socket, 'Error', {msg: `There is already a channel named ${'#' + msg.payload.channel}! You can join this channel yourself.`});
        } else if (!isValidName('#' + msg.payload.channel)) {
            this.chatServer.send(socket, 'Error', {msg: `The name ${'#' + msg.payload.channel} is not allowed for a channel`});
        } else {
            this.chatServer.channels.set('#' + msg.payload.channel, new Channel('#' + msg.payload.channel, this.chatServer,socket,msg.payload.password, msg.hash_nick));
            this.chatServer.send(socket, 'Succes', {msg:`Created channel ${'#' + msg.payload.channel}`});
        }
    }

    doChannelJoin(socket: SocketServerSide, msg: Msg<'ChannelJoin'>) {
        const channel = '#' + msg.payload.channel;
        let nick = this.chatServer.socketToUserInfo(socket)!.nick;
        if (!this.chatServer.channels.has(channel)) {
            this.chatServer.send(socket, 'Error', {msg: `The channel ${channel} does not exist! You can make this channel yourself.`});
        } else if (this.chatServer.channels.get(channel)?.users.has(msg.hash_nick)) {
            this.chatServer.send(socket, 'Error', {msg: `You are already joined to the channel ${channel}`});
        } else {
            if (this.chatServer.channels.get(channel)?.secret) {
                if (msg.payload.password != this.chatServer.channels.get(channel)?.password) {
                    this.chatServer.send(socket, 'Error', {msg: `No acces to the channel ${channel}: wrong password`});
                } else {
                    this.chatServer.channels.get(channel)?.addUser(socket, nick, msg.hash_nick);
                    this.chatServer.command.sendWorldSizeUpdate(msg.payload.channel, 'joined_client');
                }
            } else {
                if(msg.payload.channel == 'CaveWorld' && this.chatServer.channels.get(channel)?.isPrivate){
                    debug('password = ' + this.chatServer.channels.get(channel)?.psw);
                    if(msg.payload.password == this.chatServer.channels.get(channel)?.psw){
                        this.chatServer.channels.get(channel)?.addUser(socket, nick, msg.hash_nick);
                        this.chatServer.command.sendWorldSizeUpdate(msg.payload.channel, 'joined_client');
                        return;
                    }
                    this.chatServer.send(socket, 'Error', {msg: `No acces to the channel ${channel}: wrong password, or no password given! Use --password= next time!`});
                    return;
                }
                this.chatServer.channels.get(channel)?.addUser(socket, nick, msg.hash_nick);
                this.chatServer.command.sendWorldSizeUpdate(msg.payload.channel, 'joined_client');
            }
        }
    }

    doChannelLeave(socket: SocketServerSide, msg: Msg<'ChannelLeave'>) {
        const channel = '#' + msg.payload.channel;
        if (!this.chatServer.channels.has(channel)) {
            this.chatServer.send(socket, 'Error', {msg: `The channel ${channel} does not exist!`});
        } else if (!this.chatServer.channels.get(channel)?.users.has(msg.hash_nick)) {
            this.chatServer.send(socket, 'Error', {msg: '`You are not joined to the channel ${channel}`'});
        } else {
            this.chatServer.channels.get(channel)?.users.delete(msg.hash_nick);
            this.chatServer.send(socket, 'Succes', {msg: `${msg.hash_nick} left the channel ${channel}.`});
            this.chatServer.command.sendWorldSizeUpdate(msg.payload.channel, 'left_client');

        }
    }

    reaper() {
        // do we want to check channels? we just want to listen to the userdel event?
    }
}

/**
  * Check if the suggested name is a valid channel name
  * @param {string} name - suggested channel name 
  * @return {boolean} - True if the name is valid, False if the name is not valid 
  */
function isValidName(name:string) {
    if (name.charAt(0) == '#' && (name.match(/#/g)||[]).length == 1) {
        return name.indexOf(' ') < 0;
    }
    return false;
}