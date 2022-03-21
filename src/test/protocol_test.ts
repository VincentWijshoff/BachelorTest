import ChatClient, { getTime, hashMessage, verifyHash } from '../app/client.js';
import ChatServer from '../app/server.js';
import { strict as assert } from 'assert';
import { isMsgX, Msg } from '../comm/proto3.js';
import { SocketioHttpServer, SocketioSocketClientSide } from '../comm/impl/socketio/index.js';

function sleep(ms: number) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

/**
 * Basic test of current message type checking
 * Message type checking is yet to be extended
 * Currently, the checks are limited
 */
const rawMessageValidation = async () => {
    // Verify that invalid messages don't pass
    type ClientMessage = any;
    type ServerMessage = any;
    const msg: ClientMessage = {command:'print-all-channels'}; // No data field --> invalid
    console.log('Receiving malformed messages (part of the test):');
    assert(!isMsgX(msg));
    const msg2: ServerMessage = {command:'shout-to-all'};
    assert(!isMsgX(msg2));
};

/**
 * Both the client and server use a public key extracted from the https certificate.
 * We validate that this key extraction works flawlessly
 */
const testClientVerification = async() => {
    // create a client connected to a server and check if it got verified
    let server = new ChatServer(new SocketioHttpServer(3001), undefined, 3001, undefined);
    await sleep(500);
    let client = new ChatClient(new SocketioSocketClientSide('http://localhost:3001'), 'testNick', true);
    await sleep(500);
    // if the client is verified, the isverified functino in server shoould return true
    assert(server.isVerified(client.hash_nick), 'client was not verified');
    server.server.close();
};

/**
 * Test the hashing and signing of messages on the side of the server
 * The client should automatically be able to verify the server's signature,
 * because it already has the public key from the https certificate.
 */
const HashingAndUnhashing = async () => {
    // hashing is static so no client or server needed
    let msg : Msg<'ChatMessage'> = { command: 'ChatMessage', payload: {text: 'testmsg'}, timestamp: getTime(), hash_nick: 'tester' };
    msg = hashMessage(msg);
    assert(verifyHash(msg));
    // now we do a false hash
    let msg2 : Msg<'ChatMessage'> = { command: 'ChatMessage', payload: {text: 'testmsg2'}, timestamp: getTime(), hash_nick: 'tester2' };
    assert(!verifyHash(msg2));
    msg2.hash = 'sdv';
    assert(!verifyHash(msg2));
};


const main_protocol_test = async () => {

    const tests = [
        rawMessageValidation,
        testClientVerification,
        HashingAndUnhashing
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

export default main_protocol_test;