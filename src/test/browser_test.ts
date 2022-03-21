import { ChatClient, ChatServer } from '../app';
import { SocketioSocketClientSide } from '../comm/impl/socketio/client';
import { SocketioHttpServer } from '../comm/impl/socketio/server';
import { isMsg, Msg } from '../comm/proto3';

function sleep(ms: number) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

function assert(a : boolean, msg : string){
    if(!a) console.log('failed assertion ' +  msg);
}

const got_all_worlds = async () => {
    // we check if a user got all worlds after connecting to a server
    let server :ChatServer = new ChatServer(new SocketioHttpServer(3000), undefined, 3000, undefined);
    await sleep(500); // some time for the server to setup
    let client :ChatClient = new ChatClient(new SocketioSocketClientSide('http://localhost:3000'), 'client1', true); // mut be cli else hash failes
    await sleep(500); // some time for the client to connect
    // the client should have gotten all world information
    assert(client.currentWorlds!.length == 8, 'currworld length'); // there are 8 worlds
    for (let i = 0; i < client.worldSizes!.length; i++) {
        const size = client.worldSizes![i];
        assert(size == 0, 'size of world ' + i); // every world should be empty
    }
    assert(client.currentPrivateWorlds!.length == 0, 'private worlds'); // no private worlds now
    server.server.close();
    client.socket?.close();
};

const joined_world = async () => {
    // join a world with one client and see if joined channel
    let server :ChatServer = new ChatServer(new SocketioHttpServer(3000), undefined, 3000, undefined);
    await sleep(500); // some time for the server to setup
    let client1 :ChatClient = new ChatClient(new SocketioSocketClientSide('http://localhost:3000'), 'client1', true); 
    const oldSize = server.channels.get('#DesertWorld')?.getUsers().size!;
    await sleep(500); // some time for the client to connect
    client1.send('joinWorld', {world_name: 'DesertWorld', coordinates: {x: 14,y: 18, skin: client1.skin}}, {to:client1.currWorld, hash_nick:client1.hash_nick});
    //some time to join desert world
    await sleep(500);
    assert(client1.currWorld == 'DesertWorld', 'in desert world: ' + client1.currWorld); // is client in world
    assert(client1.clientPositions.size == 0, 'positions size = ' + client1.clientPositions.size);
    // check if client joined the channel
    assert(server.channels.get('#DesertWorld')?.getUsers().size == oldSize + 1, 'client joined channel');
    server.server.close();
    client1.socket?.close();
};

const players_in_world = async () => {
    // join a world with one client and see if joined channel
    let server :ChatServer = new ChatServer(new SocketioHttpServer(3000), undefined, 3000, undefined);
    await sleep(500); // some time for the server to setup
    let client1 :ChatClient = new ChatClient(new SocketioSocketClientSide('http://localhost:3000'), 'client1', true); 
    let client2 :ChatClient = new ChatClient(new SocketioSocketClientSide('http://localhost:3000'), 'client2', true);
    await sleep(500); // some time for the client to connect
    // check if the worldsizes gets updated when a client joinnes a world
    client1.send('joinWorld', {world_name: 'DesertWorld', coordinates: {x: 14,y: 18, skin: client1.skin}}, {to:client1.currWorld, hash_nick:client1.hash_nick});
    //some time to join desert world
    await sleep(500);
    // desert is the 4th world
    assert(client2.worldSizes![3] == 1, 'update amount of clients in desert world: ' + client2.worldSizes![3]);
    server.server.close();
    client1.socket?.close();
    client2.socket?.close();
};

// we simulate this function without the HTML elements
function onSpeedClick(client: ChatClient){
    if(client.speed == 1){
        client.speed = 2;
    }else if(client.speed == 2){
        client.speed = 3;
    }else{
        client.speed = 1;
    }
}

const movement_speed = async () => {
    // join a world with one client and see if joined channel
    let server :ChatServer = new ChatServer(new SocketioHttpServer(3000), undefined, 3000, undefined);
    await sleep(500); // some time for the server to setup
    let client1 :ChatClient = new ChatClient(new SocketioSocketClientSide('http://localhost:3000'), 'client1', true); 
    await sleep(500); // some time for the client to connect
    // movement speed should be 1 by default
    assert(client1.speed == 1, 'movement speed should be 1 but was (1): '+ client1.speed);
    // we simulate a press on the setting, and check the movement speed again
    onSpeedClick(client1);
    assert(client1.speed == 2, 'movement speed should be 2 but was: '+ client1.speed);
    onSpeedClick(client1);
    assert(client1.speed == 3, 'movement speed should be 3 but was: '+ client1.speed);
    onSpeedClick(client1);
    assert(client1.speed == 1, 'movement speed should be 1 but was (2): '+ client1.speed);
    server.server.close();
    client1.socket?.close();
};

const private_world = async () => {
    // join a world with one client and see if joined channel
    let server :ChatServer = new ChatServer(new SocketioHttpServer(3000), undefined, 3000, undefined);
    await sleep(500); // some time for the server to setup
    let client1 :ChatClient = new ChatClient(new SocketioSocketClientSide('http://localhost:3000'), 'client1', true); 
    let client2 :ChatClient = new ChatClient(new SocketioSocketClientSide('http://localhost:3000'), 'client2', true);
    await sleep(500); // some time for the client to connect
    // client 1 joines the world that can be private
    client1.send('joinWorld', {world_name: 'CaveWorld', coordinates: {x: 14,y: 18, skin: client1.skin}}, {to:client1.currWorld, hash_nick:client1.hash_nick});
    //some time to join world
    await sleep(500);
    assert(client2.worldSizes![7] == 1, 'update amount of clients in Cave world: ' + client2.worldSizes![7]);
    // now the first client can request the world to be private
    client1.send('setAdmin', {worldName: client1.currWorld!, password: 'testPassword'});
    await sleep(500);
    // the second client should now know the world is private
    assert(client2.currentPrivateWorlds![0] == 'CaveWorld', 'CaveWorld was not private');
    // we try to give the wrong password
    let gotFail = false;
    client2.incommingcmd.cmds.delete('failPassword');
    // eslint-disable-next-line no-unused-vars
    client2.incommingcmd.registerCommand('failPassword', msg => {
        gotFail = true;
    });
    client2.send('tryPassword', {password: 'wrongPassword', worldName: '#CaveWorld'});
    await sleep(500);
    assert(gotFail, 'did not get the password fail response');
    // now we send the correct password
    let gotSucces = false;
    client2.incommingcmd.cmds.delete('successPassword');
    // eslint-disable-next-line no-unused-vars
    client2.incommingcmd.registerCommand('successPassword', msg => {
        gotSucces = true;
    });
    client2.send('tryPassword', {password: 'testPassword', worldName: '#CaveWorld'});
    await sleep(500);
    assert(gotSucces, 'the password was not correct');
    server.server.close();
    client1.socket?.close();
    client2.socket?.close();
};

function onUpdatePosition(msg : Msg<'updatePosition'>, client : ChatClient){
    client.clientPositions.set(msg.payload.hashnick, {x: msg.payload.x, y: msg.payload.y, skin: msg.payload.skin});
}

function onUpdateSkin(msg : Msg<'updateSkin'>, client : ChatClient){
    let pos = client.clientPositions.get(msg.payload.id)!;
    pos.skin = msg.payload.skin;
    client.clientPositions.set(msg.payload.id, pos);
}

const skin_changer = async () => {
    // join a world with one client and see if joined channel
    let server :ChatServer = new ChatServer(new SocketioHttpServer(3000), undefined, 3000, undefined);
    await sleep(500); // some time for the server to setup
    let client1 :ChatClient = new ChatClient(new SocketioSocketClientSide('http://localhost:3000'), 'client1', true); 
    let client2 :ChatClient = new ChatClient(new SocketioSocketClientSide('http://localhost:3000'), 'client2', true);
    await sleep(500); // some time for the client to connect
    client1.incommingcmd.cmds.delete('updatePosition');
    client1.incommingcmd.registerCommand('updatePosition', msg => {
        if(isMsg('updatePosition', msg))
            onUpdatePosition(msg, client1);
    });
    client2.incommingcmd.cmds.delete('updatePosition');
    client2.incommingcmd.registerCommand('updatePosition', msg => {
        if(isMsg('updatePosition', msg))
            onUpdatePosition(msg, client2);
    });
    client1.incommingcmd.cmds.delete('updateSkin');
    client1.incommingcmd.registerCommand('updateSkin', msg => {
        if(isMsg('updateSkin', msg))
            onUpdateSkin(msg, client1);
    });
    client2.incommingcmd.cmds.delete('updateSkin');
    client2.incommingcmd.registerCommand('updateSkin', msg => {
        if(isMsg('updateSkin', msg))
            onUpdateSkin(msg, client2);
    });
    // we first set the 2 in the same world
    client1.send('joinWorld', {world_name: 'DesertWorld', coordinates: {x: 14,y: 18, skin: client1.skin}}, {to:client1.currWorld, hash_nick:client1.hash_nick});
    client2.send('joinWorld', {world_name: 'DesertWorld', coordinates: {x: 13,y: 18, skin: client1.skin}}, {to:client2.currWorld, hash_nick:client2.hash_nick});
    await sleep(500); //wait for them to join
    // check position for both
    assert(client1.clientPositions.get(client2.hash_nick)!.x == 13, 'client 1 does not know client2 x position: ' + client1.clientPositions.get(client2.hash_nick)!.x);
    assert(client1.clientPositions.get(client2.hash_nick)!.y == 18, 'client 1 does not know client2 y position: ' + client1.clientPositions.get(client2.hash_nick)!.y);
    assert(client1.clientPositions.get(client2.hash_nick)!.skin == 'basic', 'client 1 does not know client2 skin: ' + client1.clientPositions.get(client2.hash_nick)!.skin);
    
    assert(client2.clientPositions.get(client1.hash_nick)!.x == 14, 'client 2 does not know client1 x position: ' + client2.clientPositions.get(client1.hash_nick)!.x);
    assert(client2.clientPositions.get(client1.hash_nick)!.y == 18, 'client 2 does not know client1 y position: ' + client2.clientPositions.get(client1.hash_nick)!.y);
    assert(client2.clientPositions.get(client1.hash_nick)!.skin == 'basic', 'client 2 does not know client1 skin: ' + client2.clientPositions.get(client1.hash_nick)!.skin);
    // we change the skin off the first client and check if it was chaged in the second client
    client1.send('updateSkin', {id: client1.hash_nick, skin: 'testSkin'});
    await sleep(500);
    // we check the change
    assert(client2.clientPositions.get(client1.hash_nick)!.skin == 'testSkin', 'client 2 does not know client1 skin: ' + client2.clientPositions.get(client1.hash_nick)!.skin);
    server.server.close();
    client1.socket?.close();
    client2.socket?.close();
};

const main_browser_test = async () => {

    const tests = [
        got_all_worlds,
        joined_world,
        players_in_world,
        movement_speed,
        private_world,
        skin_changer
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

export default main_browser_test;