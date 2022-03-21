import ChatClient from '../app/client.js';
import ChatServer from '../app/server.js';
import * as debugModule from 'debug';
const debug = debugModule('test:connection');
import Bag from '../bag';
import { writeFileSync } from 'fs';
import { generateKeyPairSync } from 'crypto';
import { isMsg, Msg } from '../comm/proto3.js';
import { SocketioHttpServer, SocketioSocketClientSide } from '../comm/impl/socketio/index.js';
// import { ClientMessage, ServerMessage } from '../protocol.js';


function assert(cond: boolean, ...args: unknown[]) {
    if (!cond) {
        console.error(...args);
        process.exit(1);
    }
}

function sleep(ms: number) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

function msg_received_default(): Msg {
    assert(false, 'No messages expected at this point!');
    // Random message in order for this function to have a ServerMessage return type
    return {command:'myHashNick', payload:{hash_nick: ''}, timestamp: '', hash_nick: ''};
}
// eslint-disable-next-line no-unused-vars
let msg_received: (client: number, msg: Msg) => Msg = msg_received_default;
// eslint-disable-next-line no-unused-vars
function expect_messages(timeout:number, msgs: unknown[], client1: ChatClient) {
    let msgsBag = new Bag(msgs.map(msg => JSON.stringify(msg)));
    // eslint-disable-next-line no-undef
    let timeoutId: NodeJS.Timeout|null = null;
    function createTimeout() {
        timeoutId = setTimeout((() => assert(false, 'expect_messages: timeout while waiting for messages [' + [...msgsBag].join(', ') + ']')), timeout);
    }
    createTimeout();
    return new Promise<void>(resolve => {
        msg_received = (client: number, message: Msg) => {
            const msg = message;
            const msgText = JSON.stringify(msg);
            debug(msgText);
            // ignore connection messages like 'prompt-verification'
            if (!isMsg('ChatMessage', message)) return message;
            if (timeoutId === null)
                throw new Error();
            clearTimeout(timeoutId);
            assert(msgsBag.has(msgText), 'Received unexpected message ', msgText, 'from client', client);

            msgsBag.delete(msgText);
            if (msgsBag.size == 0) {
                msg_received = msg_received_default;
                resolve();
            } else {
                createTimeout();
            }
            return message;
        };
    });
}


/**
 * Basic scenario
 * 
 * Two clients with a different nick connect and send messages to one another
 */
// eslint-disable-next-line no-unused-vars
const basicTest = async () => {
    const server = new ChatServer(new SocketioHttpServer(3000), undefined, 0, undefined);
    await sleep(5000);
    const client1 = new ChatClient(new SocketioSocketClientSide('http://localhost:3000'), 'nick1', true);
    const client2 = new ChatClient(new SocketioSocketClientSide('http://localhost:3000'), 'nick2', true);
    await sleep(2000);
    
    client1.on('message', (msg: Msg) => msg_received(1, msg));
    client2.on('message', (msg: Msg) => msg_received(2, msg));
    
    // const ts_string = (new Date()).toISOString();
    // const msg: Msg = {command:'shoutToAll',
    //     payload:{text:'test test', time:ts_string}, timestamp: ''};
    client1.send('ChatMessage', {text: 'test test'});

    await expect_messages(3000, [
        {client: 1, msg: {nick: 'nick1', text: 'This is a test message'}},
        {client: 2, msg: {nick: 'nick1', text: 'This is a test message'}}
    ], client1);
    

    client1.socket!.close();
    client2.socket!.close();
    server.server.close();
    //server.https_server.close();
};


/**
 * Use a wrong private key for a client
 * 
 * This client should obviously be rejected by the server
 */
// eslint-disable-next-line no-unused-vars
const wrongPrivateKey = async () => {
    let { privateKey } = generateKeyPairSync('rsa', {modulusLength: 2048});
    writeFileSync('keys/privateKeyTest.pem', privateKey.export({format:'pem',type:'pkcs1'}));
    
    const server: ChatServer = new ChatServer(new SocketioHttpServer(3000), undefined, 3000, undefined);
    await sleep(3000);
    const client1 = new ChatClient(new SocketioSocketClientSide('http://localhost:3000'), 'nick1',true, 'keys/publicKey.pem', 'keys/privateKey.pem');
    client1.onMessage = msg => msg_received(1, msg);
    // We use a wrong private key, the server should reject the signature and disconnect client2
    const client2 = new ChatClient(new SocketioSocketClientSide('http://localhost:3000'), 'nick2', true, 'keys/publicKey.pem', 'keys/privateKeyTest.pem');
    client2.onMessage = msg => msg_received(2, msg);

    await sleep(300);
    // const ts_string = (new Date()).toISOString();
    client1.send('ChatMessage', {text: 'this is a test message'});
    //{command:'shout-to-all',server_ip:'', data:{nick: 'nick1', text: 'This is a test message', time:ts_string}, hash:undefined});
    // Client 2 should not get the message
    await expect_messages(1000, [
        {client: 1, msg: {nick: 'nick1', text: 'This is a test message'}}
    ], client1);

    client1.socket!.close();
    client2.socket!.close();
    server.server.close();
    //server.https_server.close();
};


/**
 * Test for a network partition
 * 
 * We simulate a network partition for client2.
 * The server is not aware of this, client2 will simply not receive any messages anymore
 */
// eslint-disable-next-line no-unused-vars
const testNetworkPartition = async () => {
    const server = new ChatServer(new SocketioHttpServer(3000), undefined, 3000, undefined);
    const client1 = new ChatClient(new SocketioSocketClientSide('http://localhost:3000'), 'nick1', true);
    client1.onMessage = msg => msg_received(1, msg);
    const client2 = new ChatClient(new SocketioSocketClientSide('http://localhost:3000'), 'nick2', true);
    client2.onMessage = msg => msg_received(2, msg);

    await sleep(500);
    // use any type as a quick and dirty solution (I know there are better ways)
    // (client2.socket!.socket.io as any).engine.transport.ws.close = () => console.log('Dropping ws.close() on the floor!');
    // (client2.socket!.socket.io as any).engine.transport.ws.removeAllListeners('message_encrypted');

    // const ts_string = (new Date()).toISOString();
    client1.send('ChatMessage', {text: 'This is a test message'});
    // {command:'shout-to-all',server_ip:'', data:{nick: 'nick1', text: 'This is a test message', time:ts_string}, hash:undefined});
    // Client 2 should not get the message
    await expect_messages(600, [
        {client: 1, msg: {nick: 'nick1', text: 'This is a test message'}}
    ], client1);

    client1.socket!.close();
    client2.socket!.close();
    server.server.close();
    //server.https_server.close();
};




const main_connection_test = async () => {

    const tests: (() => Promise<void>)[] = [
        // basicTest,
        // wrongPrivateKey,
        // testNetworkPartition
    ];


    let nbFailed = 0;

    for (let i = 0; i < tests.length; i++) {
        try {
            await tests[i]();
        } catch (error) {
            console.error(error);
            nbFailed += 1;
        }
    }

    return [nbFailed, tests.length];
};

export default main_connection_test;