import Chatserver from '../app/server';
import ChatClient, { printInfo } from '../app/client';
import { assert } from 'console';
import ChatServer from '../app/server';
import { SocketioHttpServer, SocketioSocketClientSide } from '../comm/impl/socketio';


let server: ChatServer;
let client1: ChatClient;
let client2: ChatClient;
let client3: ChatClient; 


const createChannel = async () => {
    return new Promise<void>((resolve) => {
        setTimeout(() => {
            client1.send('ChannelCreate', {channel: 'new_channel'});
            client2.send('ChannelCreate', {channel: 'second_channel'});
            setTimeout(() => {
                assert(server.channels.size === 13, 'Channel size != 13'); //3 clients + 2 new channels + 8 static worlds
                assert(server.channels.has('#new_channel'), 'All channels in server doesn\'t contain channel with name: \'#new_channel\'');
                assert(server.channels.get('#new_channel')!.users.size === 1, 'Amount of users in channel: \'#new_channel\' != 1');
                assert(server.channels.has('#second_channel'), 'All channels in server doesn\'t contain channel with name: \'#second_channel\'');
                assert(server.channels.get('#second_channel')!.users.size === 1, 'Amount of users in channel: \'#second_channel\' != 1');
                resolve();
            }, 500);}, 500);
    });
};


const joinChannel = async () => {
    return new Promise<void>((resolve) => {
        setTimeout(() => {
            client3.send('ChannelJoin', {channel:'new_channel'});
            client3.send('ChannelJoin', {channel:'second_channel'});
            setTimeout(() => {
                assert(server.channels.get('#new_channel')!.users.size === 2, 'Amount of users in channel: \'#new channel\' != 2');
                assert(server.channels.get('#new_channel')!.users.has(client3.hash_nick), 'Client 3 is not in channel: "#new_channel"');
                assert(server.channels.get('#second_channel')!.users.size === 2, 'Amount of users in channel: "#second_channel" != 2');
                assert(server.channels.get('#second_channel')!.users.has(client3.hash_nick), 'Client 3 is not in channel: "#second_channel"');
                // assert(client3.myChannels.has('#new_channel'), '"#new_channel" is not in all channels of client3');
                // assert(client3.myChannels.has('#second_channel'), '"#second_channel" is not in all channels of client');
                resolve();
            }, 500);}, 500);
    });
};


const sendChannel = async () => {
    return new Promise<void>((resolve) => {
        setTimeout(() => {
            client3.send('ChatMessage', {text: 'hello'}, {to: '#new_channel', hash_nick:client3.hash_nick});
            client1.send('ChatMessage', {text: 'hi'}, {to: '#new_channel', hash_nick:client1.hash_nick});
            client3.send('ChatMessage', {text: 'how are you'}, {to: '#new_channel', hash_nick:client3.hash_nick});
            setTimeout(() => {
                assert(server.channels.get('#new_channel')!.history.size === 3, '#Messages send != 3');
                resolve();
            }, 500);}, 500);
    });
};


const leaveChannel = async () => {
    return new Promise<void>((resolve) => {
        setTimeout(() => {
            client3.send('ChannelLeave', {channel: 'new_channel'});
            client3.send('ChannelLeave', {channel: 'second_channel'});
            setTimeout(() => {
                assert(server.channels.get('#new_channel')!.users.size === 1, 'Amount of users in channel: "#new_channel" != 1');
                assert(server.channels.get('#second_channel')!.users.size === 1, 'Amount of users in "#second_channel" != 1');
                resolve();
            }, 500);}, 500);
    });
};


// const deleteChannel = async () => {
//     return new Promise<void>((resolve) => {
//         setTimeout(() => {
//             client1.send('ChannelDelete', {channel: 'second_channel'});
//             setTimeout(() => {
//                 assert(server.channels.size === 12, '# of Channels != 12');
//                 resolve();
//             }, 500);
//             client1.send('ChannelLeave', {channel: '#new_channel'});
//             setTimeout(() => {
//                 assert(server.channels.size === 12, '# of Channels != 12 but was : '+ server.channels.size);
//                 resolve();
//             }, 5000);
//         }, 500);
//     });
// };

const main_channels_test = async () => {

    server = new Chatserver(new SocketioHttpServer(3000), undefined, 3000, undefined);
    client1 = new ChatClient(new SocketioSocketClientSide('http://localhost:3000'), 'client1', true);
    client2 = new ChatClient(new SocketioSocketClientSide('http://localhost:3000'), 'client2', true);
    client3  = new ChatClient(new SocketioSocketClientSide('http://localhost:3000'), 'client3', true);
    printInfo('channelTests:');

    const tests = [createChannel, joinChannel, sendChannel, leaveChannel];
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
    client1.socket!.close();
    client2.socket!.close();
    client3.socket!.close();

    return [nbFailed, tests.length];
};

export default main_channels_test;