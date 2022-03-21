// To run these tests, simple use `ava dist/pluginTest.js` 
// We aliased this command to a NPM script pluginTest.
//import ChatServer from './server.js';
import ChatClient from '../app/client.js';
// import { ClientMessage, pluginImplementation, ServerMessage } from '../protocol';
import * as plugin from '../plugins/plugin';
import ChatServer from '../app/server.js';
import {pluginAction} from '../plugins/plugin';
import { isMsg, Msg, pluginImplementation } from '../comm/proto3.js';
import { SocketioHttpServer, SocketioSocketClientSide } from '../comm/impl/socketio/index.js';



function assert(cond: boolean, ...args: unknown[]) {
    if (!cond) {
        console.error(...args);
        process.exit(1);
    }
}

class TestClient extends ChatClient {
    id_number:number;
    got_message: boolean;
    receive_nick: string|undefined;

    constructor(server_url: string, nick: string, id_number:number){
        super(new SocketioSocketClientSide(server_url), nick, true);
        this.id_number = id_number;
        this.got_message = false;
        this.receive_nick = this.nick;
    }

    onMessage(msg:Msg){
        if(isMsg('ChatMessage', msg)){
            this.got_message = true;
            this.receive_nick = msg.from;
        }else{
            super.onMessage(msg);
        }
        return msg;
    }
}

//we first make some simple tests for the Eliza bot
// eslint-disable-next-line no-unused-vars
const elizaTest = async() => {
    let otherUser = new TestClient('http://localhost:3000', 'otherUser', 1);

    setTimeout(()=>{
        // otherUser.chan.createChannel('test', undefined, undefined, undefined, 'false');
        pluginAction({ //activate the eliza bot
            action: 'activate', 
            name: 'eliza-bot',
            prompt:'@eliza'}, otherUser);
    }, 1000);

    setTimeout(()=> {
        otherUser.send('ChatMessage', {text: 'hello test'});
        pluginAction({ //start the eliza bot
            action: 'start', 
            name: 'eliza-bot',
            prompt:'@arthur'}, otherUser);
        
    }, 1500);
 
    setTimeout(()=> {
        assert(otherUser.got_message, 'There was no message received. (part of test)');
        otherUser.got_message = false;
        otherUser.receive_nick = undefined;
        otherUser.send('ChatMessage', {text: '@arthur How are you'});
    }, 3500);

    //need a long timeout because the eliza bot waits a couple seconds to make the reply look more 'natural'.
    setTimeout(()=> {
        assert(otherUser.got_message, 'No message from arthur (part of test)');
    }, 6500);

    return new Promise((resolve) => setTimeout(() => {
        otherUser.socket!.close();
        console.log('eliza fin');
        resolve('done!');
    }, 7000));
};

//basic test for the corona bot
// eslint-disable-next-line no-unused-vars
const coronaTest = () => {
    let newUser = new TestClient('http://localhost:3000', 'newUser', 1);

    setTimeout(()=>{
        pluginAction({ //activate the corona bot
            action: 'activate', 
            name: 'corona-bot',
            prompt:'@rona2.0'}, newUser);
    }, 1000);

    setTimeout(()=> {
        // const ts_string = (new Date()).toISOString();
        newUser.send('ChatMessage', {text:'I\'m tired of sitting inside'});
        pluginAction({
            action: 'start', 
            name: 'corona-bot',
            prompt:'rona'}, newUser);
    }, 2000);

    setTimeout(()=> {
        assert(newUser.got_message, 'There was no message received. (part of test)');
        newUser.got_message = false;
        newUser.receive_nick = newUser.nick;
        newUser.send('ChatMessage', {text:'rona Belgium'});
    }, 3500);

    setTimeout(()=> {
        assert(newUser.got_message, 'No message from rona (part of test)');
    }, 6500);

    return new Promise((resolve) => setTimeout(() => {
        newUser.socket!.close();
        //bot.socket.close();
        console.log('corona fin');
        resolve('done!');
    }, 6900));

};

//test basic functionality off hte rot13 bot
const rot13Test = async () => {
    let BotClient:pluginImplementation = require('../plugins/rot-13/index').default;

    const txt = 'These are the launch codes for our nuclear missile: 485720836530';

    const message:Msg<'ChatMessage'> = {
        command:'ChatMessage',
        payload:{text:txt},
        timestamp: '',
        hash_nick: ''
    };

    //after sending a message through the rot13 bot it should not be the same message
    const encryptedmessage = BotClient.sendMessage(message);
    assert(txt != encryptedmessage.payload.text, 'the message was not encrypted');

    //after sending the encrypted message through the bot again it should give back the original message
    const encr:Msg<'ChatMessage'> = {
        command:'ChatMessage',
        payload:encryptedmessage.payload,
        timestamp:'',
        hash_nick:''
    };
    const decryptedmessage = BotClient.receiveMessage(encr);
    assert(txt == decryptedmessage.payload.text, 'the message was not decrypted');
    
    return new Promise((resolve) => setTimeout(() => {
        resolve('done!');
    }, 1000));

};



const main_plugin_test = async () => {

    let server = new ChatServer(new SocketioHttpServer(3000), undefined, 3000, undefined);
    console.log('to make sure these test work, put all plugins to active in the src/plugins/pluginsConfig.json');
    plugin.addPlugins();

    const tests = [
        // elizaTest,
        // coronaTest,
        rot13Test];

    let nbFailed = 0;

    for (let i = 0; i < tests.length; i++) {
        try {
            await tests[i]();
        } catch (error) {
            console.error(error);
            nbFailed += 1;
        }
    }

    server.server.close();

    // [nbFailed, nbTotal], used in main_test.ts
    return [nbFailed, tests.length];
};

export default main_plugin_test;