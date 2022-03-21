import { ChatClient } from '../app/client';
import { isMsg, Msg } from '../comm/proto3';
import './proto';
import * as colors from 'ansi-colors';

import * as debugModule from 'debug';
const debug = debugModule('chat:channelmanager:client');

export class ClientChannelManager {

    chatClient: ChatClient;
    joinedChannels = new Set<string>();


    constructor(chatClient: ChatClient) {
        this.chatClient = chatClient;
        
        debug('adding all channel type messages to the protocol');

        chatClient.incommingcmd.registerCommand(
            'printChannel',
            (msg:Msg) => {
                if(isMsg('printChannel', msg))
                    console.log('[channelName]: ',msg.payload.channel);
            }
        );

        // now the outgoing commands

        chatClient.outgoingcmd.registerCommand(
            'createChannel',
            (msg:{channelName:string, key?:string, historyLimit?:number, externalMessages?:boolean, secret?:string}) => {
                this.createChannel(msg.channelName, msg.key, msg.historyLimit, msg.externalMessages, msg.secret);
            }
        );

        chatClient.outgoingcmd.registerCommand(
            'joinChannel',
            (args:{channelName: string, password: string|undefined}) => {
                this.joinChannel(args.channelName, args.password);
            }
        );

        chatClient.outgoingcmd.registerCommand(
            'leaveChannel',
            (channelName: string) => {
                this.leaveChannel(channelName);
            }
        );

        chatClient.outgoingcmd.registerCommand(
            'sendChannel',
            (msg:{channelName:string, message:string}) => {
                this.sendChannel(msg.channelName, msg.message);
            }
        );

        chatClient.outgoingcmd.registerCommand(
            'printAllChannels',
            // eslint-disable-next-line no-unused-vars
            (_channelName: string) => {
                this.printAllChannels();
            }
        );
    }

    //The event handlers

    printChannelMessage(txt : string, channel : string, time : string, from : string){
        console.log(colors.cyanBright('[ '+from+' -> '+ channel.substring(1) +' : '+time+' ]: '+ txt));
    }

    // Event handlers for all channel related things

    onAddChannel(msg:Msg<'ChannelAdd'>) {

        if(msg.payload.key)
            this.chatClient.myChannels.set('#' + msg.payload.channel, msg.payload.key);
        else
            this.chatClient.myChannels.set('#' + msg.payload.channel, undefined);
    }

    // these are the outgoing function handlers

    createChannel(channelName:string, key?:string, historyLimit?:number,
        externalMessages?:boolean, secret?:string) {
        var password = undefined;        
                
        this.chatClient.send('ChannelCreate', {channel: '#'+channelName, history:historyLimit, password: password, 
            open:secret, key:key, externalMessages : externalMessages});
    }

    joinChannel(channelName:string, password: string|undefined) {
        //var password = undefined;
        this.chatClient.myChannels.set(channelName, channelName);

        this.chatClient.send('ChannelJoin', {channel: channelName, password: password, hash_nick:this.chatClient.hash_nick!, id:this.chatClient.id});
    }

    leaveChannel(channelName:string) {
        this.chatClient.myChannels.delete(channelName);
        this.chatClient.send('ChannelLeave', {channel: channelName});
    }

    sendChannel(channelName:string, message: string) {
        this.chatClient.send('ChatMessage', 
            {text: message},
            {to: '#'+channelName, from: this.chatClient.nick, hash_nick: this.chatClient.hash_nick || ''});
    }

    printAllChannels() {
        this.chatClient.send('requestAllChannels', {});
    }
}
