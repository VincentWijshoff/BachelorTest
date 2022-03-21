/* eslint-disable no-undef */
/* eslint-disable no-unused-vars */
import * as debugModule from 'debug';
import { type } from 'os';
import { boolean, string } from 'yargs';
import { addAchievement } from '../browser/settings';
import { SocketServerSide } from './interface';
const debug = debugModule('chat:proto3');

//// Verifier

export type PayloadVerifier<P=unknown> = (a: unknown) => a is P;

export const verifier = new Map<keyof Payloads, PayloadVerifier>();

export function verifyPayload(command: keyof Payloads, a: unknown): boolean {
    const v = verifier.get(command);
    if(v) {
        const r = v(a);
        return r;
    } else {
        return false;
    }
}

//// Msg's with payloads

export interface Msg<CommandString extends keyof Payloads = keyof Payloads> {
    to?: string;    // could be a user hash, or a channel name, or a user hash + nickname combo
    from?: string;  // idem
    timestamp: string; // the timestamp that this particular Msg is being sent (so this gets updated on every hop)
    command: CommandString; // the command string which identifies the type of the payload
    payload: Payloads[CommandString]; // the payload for this command
    hash_nick: string;
    hash?: String;
}

export type MsgOpts = Omit<Msg, 'command' | 'payload' | 'timestamp'>;

export function getMsgOpts(msg: Msg): MsgOpts {
    const { command, payload, timestamp, ...remMsgOpts } = msg;
    return remMsgOpts;
}

//// Utility type

export interface WithCommandProperty {
    command: string;
}

export function isWithCommandProperty(a: unknown): a is WithCommandProperty {
    return typeof (a as WithCommandProperty).command === 'string';
}

export interface WithPayload {
    payload: {};
}

export function isWithPayload(a: unknown): a is WithCommandProperty {
    return typeof (a as WithPayload).payload === typeof {};
}


//// External Msg verifier (for messages received over a socket)

export function isMsgX<CommandString extends keyof Payloads>(a: unknown): a is Msg<CommandString> {
    const aa = a as Msg;
    if(isWithCommandProperty(aa) && isWithPayload(aa)){
        return verifyPayload(aa.command, aa.payload);
    }
    return false;
}

//// Internal Msg verifier (for when we know it is certainly a Msg we just need
//// to know which type...)
export function isMsg<C extends keyof Payloads>(command: C, m: Msg): m is Msg<C> {
    return m.command === command; // TypeScript guarantees us that we have a message
    // it is just not smart enough to use the m.command === command as a typeguard
    // this might become possible in the future...
}

//// Some payloads

export interface Error {
    msg: string;
}

export function isError(a: unknown): a is Error {
    return typeof (a as Error).msg === 'string';
}
verifier.set('Error', isError);

export interface Info {
    msg: string;
}

export function isInfo(a: unknown): a is Info {
    return typeof (a as Info).msg === 'string';
}
verifier.set('Info', isInfo);

export interface ChatMessage {
    text: string;
}

export function isChatMessage(a: unknown): a is ChatMessage {
    const aa = a as ChatMessage;
    return typeof aa.text === 'string';
}
verifier.set('ChatMessage', isChatMessage);

export interface allWorlds {
    worlds: string[];
}

export function isAllWorlds(a: unknown): a is allWorlds {
    const aa = a as allWorlds;
    return aa.worlds instanceof Array &&
            ((aa.worlds.length > 0 && typeof aa.worlds[0] === 'string') || aa.worlds.length == 0);
}
verifier.set('allWorlds', isAllWorlds);

export interface allPrivateWorlds {
    worlds: string[];
}

export function isAllPrivateWorlds(a: unknown): a is allPrivateWorlds {
    const aa = a as allPrivateWorlds;
    return aa.worlds instanceof Array &&
            ((aa.worlds.length > 0 && typeof aa.worlds[0] === 'string') || aa.worlds.length == 0);
}
verifier.set('allPrivateWorlds', isAllPrivateWorlds);

export interface joinWorld {
    world_name: string;
    world_logic?: string[][];
    coordinates?: {x:number, y:number, skin: string};
    isBot?: boolean;
}

export function isJoinWorld(a: unknown): a is joinWorld {
    const aa = a as joinWorld;
    return typeof (a as joinWorld).world_name === 'string' &&
            (
                aa.world_logic == undefined || ( //worlds are always at least of length > 1
                    aa.world_logic instanceof Array && aa.world_logic[0] instanceof Array && typeof aa.world_logic[0][0] === 'string'
                )
            ) && (aa.isBot == undefined || typeof aa.isBot === 'boolean');
}
verifier.set('joinWorld', isJoinWorld);

export interface worldSize {
    worlds: number[];
}

export function isWorldSize(a: unknown): a is worldSize {
    const aa = a as worldSize;
    return aa.worlds instanceof Array;
}
verifier.set('worldSize', isWorldSize);

export interface Connected {
    msg: string;
}

export function isConnected(a: unknown): a is Connected {
    return typeof (a as Connected).msg === 'string';
}
verifier.set('Connected', isConnected);

export interface connectionAttempt {
    public_key: string;
    nick:string;
    isBrowserClient: boolean;
}

export function isConnectionAttempt(a: unknown): a is connectionAttempt {
    return typeof (a as connectionAttempt).public_key === 'string' &&
            typeof (a as connectionAttempt).nick === 'string';
}
verifier.set('connectionAttempt', isConnectionAttempt);

export interface disconnectAttempt {
    hash_nick: string;
    explicit: string;
    channels: string[];
}

export function isDisconnectAttempt(a: unknown): a is disconnectAttempt {
    const aa = a as disconnectAttempt;
    return typeof aa.hash_nick === 'string' &&
            typeof aa.explicit === 'string'; 
}
verifier.set('disconnectAttempt', isDisconnectAttempt);

export interface requestPublicKey {
    hash_nick_prefix: string,
    server_ip?:string,
    sending_client_id?:string;
}

export function isRequestPublicKey(a: unknown): a is requestPublicKey {
    const aa = a as requestPublicKey;
    return typeof aa.hash_nick_prefix === 'string' && 
            (aa.server_ip === undefined || typeof aa.server_ip === 'string') &&
            (aa.sending_client_id === undefined || typeof aa.sending_client_id === 'string');
}
verifier.set('requestPublicKey', isRequestPublicKey);

export interface mutualFriend {
    to: string;
    hash_nick: string;
    public_key: string;
    nick: string;
}

export function isMutualFriend(a: unknown): a is mutualFriend {
    const aa = a as mutualFriend;
    return typeof aa.to === 'string' &&
            typeof aa.hash_nick === 'string' &&
            typeof aa.public_key === 'string' &&
            typeof aa.nick === 'string';
}
verifier.set('mutualFriend', isMutualFriend);

export interface succes {msg:string}

export interface sendEnc {signed: string, text: Buffer}

export interface disconnectCommit {signature: Buffer}

export interface myHashNick {public_key?: Object, hash_nick:string}

export interface encMessage {signed: string, text: Buffer, signature?: Buffer}

export interface promptVerification {verification_data:string}

export interface submitVerification {signature: ArrayBuffer, browser:boolean}

export interface disconnectVerification {verification_data:string}

export interface givePublicKey {hash_nick: string, public_key:string, nick?: string, client_id?:string, server_id?:string}

export interface sendDefaultWorld {world: unknown}

export interface tryPassword {password: string, worldName: string}

export interface successPassword {}

export interface failPassword {}

export interface updatePosition {hashnick: string, x: number, y: number, direction: string, skin: string}

export interface updateSkin {id: string, skin: string}

export interface TicTacToeMsg {type: 'join'|'leave'|'invite'|'accept'|'abort'|'move'|'rematch'|'exit', from: string, to?: string, pos?: string}

export interface CTFMsg {type: 'requestGame'|'startGame'|'info'|'error'|'newRound'|'stopGame', world: string, text?: string, pos?: {row: number, column: number}}

export interface sendPath {path: unknown, hash_nick: string}

export interface deleteClient {hash_nick: string}

export interface setAdmin {worldName: string, password: string}

export interface updateAdmin {hashnick: string}

export interface lobbyLogic {logic: string[][]}

export interface audio {blob : Blob}

export interface failedVerification {}

export interface worldSizeUpdate {world1: string, action1: string, world2?: string, action2?: string}

export interface allBotSizes {bots : number[]}

export interface updateWorldTiles {updatedTiles : {x: number, y: number, tile: string}[]}

export interface updateScore{id: string, game: string, win: boolean}

export interface requestLeaderboard {id: string, keys: Array<any>}

export function isUpdateScore(a: unknown): a is updateScore {
    const aa = a as updateScore;
    return typeof aa.id === 'string' && typeof aa.game === 'string' && typeof aa.win === 'boolean';
}
verifier.set('updateScore', isUpdateScore);

export interface browserDisconnect {socket: SocketServerSide}

export function isBrowserDisconnect(a: unknown): a is browserDisconnect{
    return true;
}

export function isRequestLeaderboard(a: unknown): a is requestLeaderboard{
    const aa = a as requestLeaderboard;
    return typeof aa.id === 'string';
}
verifier.set('requestLeaderboard', isRequestLeaderboard);

export function isUpdateWorldTiles(a: unknown): a is updateWorldTiles {
    const aa = a as updateWorldTiles;
    return typeof aa.updatedTiles[0].x === 'number';
}
verifier.set('updateWorldTiles', isUpdateWorldTiles);


export function isAllBotSizes(a: unknown): a is allBotSizes {
    const aa = a as allBotSizes;
    return aa.bots instanceof Array;
}
verifier.set('allBotSizes', isAllBotSizes);

export function isWorldSizeUpdate(a: unknown): a is worldSizeUpdate {
    const aa = a as worldSizeUpdate;
    return typeof aa.action1 === 'string' && typeof aa.world1 === 'string';
}
verifier.set('worldSizeUpdate', isWorldSizeUpdate);


export function isFailedVerification(a: unknown): a is failedVerification{
    return true;
}
verifier.set('failedVerification', isFailedVerification);

export function isUpdateSkin(a: unknown): a is updateSkin{
    const aa = a as updateSkin;
    return typeof aa.skin === 'string';
}
verifier.set('updateSkin', isUpdateSkin);

export function isAudio(a: unknown): a is audio {
    const aa = a as audio;
    return aa.blob instanceof Blob;
}
verifier.set('audio', isAudio);

export function isLobbyLogic(a: unknown): a is lobbyLogic {
    const aa = a as lobbyLogic;
    return aa.logic instanceof Array;
}
verifier.set('lobbyLogic', isLobbyLogic);

export function isDeleteClient(a: unknown): a is deleteClient {
    return typeof (a as deleteClient).hash_nick == 'string';
}
verifier.set('deleteClient', isDeleteClient);

// verifiers for the above payloads

export function isUpdateAdmin(a: unknown): a is updateAdmin {
    const aa = a as updateAdmin;
    return typeof aa.hashnick === 'string';
}
verifier.set('updateAdmin', isUpdateAdmin);

export function isSetAdmin(a: unknown): a is setAdmin {
    const aa = a as setAdmin;
    return typeof aa.worldName === 'string' && typeof aa.password === 'string';
}
verifier.set('setAdmin', isSetAdmin);

export function isTryPassword(a: unknown): a is tryPassword {
    const aa = a as tryPassword;
    return typeof aa.password === 'string' && typeof aa.worldName === 'string';
}
verifier.set('tryPassword', isTryPassword);

export function isSuccessPassword(a: unknown): a is successPassword {
    return true;
}
verifier.set('successPassword', isSuccessPassword);

export function isFailPassword(a: unknown): a is failPassword {
    return true;
}
verifier.set('failPassword', isFailPassword);

export function isUpdatePosition(a: unknown): a is updatePosition {
    const aa = a as updatePosition;
    return typeof aa.hashnick === 'string'
    && typeof aa.x === 'number' && typeof aa.y === 'number';
}
verifier.set('updatePosition', isUpdatePosition);

export function isTicTacToeMsg(a: unknown): a is TicTacToeMsg {
    const aa = a as TicTacToeMsg;
    return typeof aa.type === 'string' && typeof aa.from === 'string';
}
verifier.set('TicTacToeMsg', isTicTacToeMsg);

export function isCTFMsg(a: unknown): a is CTFMsg {
    const aa = a as CTFMsg;
    return typeof aa.type === 'string' && typeof aa.world === 'string';
}
verifier.set('CTFMsg', isCTFMsg);

export function isSucces(a: unknown): a is succes {
    return typeof (a as succes).msg === 'string';
}
verifier.set('Succes', isSucces);

export function isSendEnc(a: unknown): a is sendEnc {
    const aa = a as sendEnc;
    return typeof aa.signed === 'string' && typeof aa.text === 'string';
}
verifier.set('sendEnc', isSendEnc);

export function isDisconnectCommit(a: unknown): a is disconnectCommit {
    return (a as disconnectCommit).signature instanceof Buffer;
}
verifier.set('disconnectCommit', isDisconnectCommit);

export function isMyHashNick(a: unknown): a is myHashNick {
    const aa = a as myHashNick;
    return (aa.public_key === undefined || typeof aa.public_key === typeof Object) && 
            (typeof aa.hash_nick === undefined || typeof aa.hash_nick == 'string');
}
verifier.set('myHashNick', isMyHashNick);

export function isEncMessage(a: unknown): a is encMessage {
    const aa = a as encMessage;
    return typeof aa.signed === 'string' && aa.text instanceof Buffer &&
            (aa.signature === undefined || aa.signature instanceof Buffer);
}
verifier.set('encMessage', isEncMessage);

export function isPromptVerification(a: unknown): a is promptVerification {
    return typeof (a as promptVerification).verification_data === 'string';
}
verifier.set('promptVerification', isPromptVerification);

export function isSubmitVerification(a: unknown): a is submitVerification {
    return (a as submitVerification).signature instanceof Object;
}
verifier.set('submitVerification', isSubmitVerification);

export function isDisconnecterification(a: unknown): a is disconnectVerification {
    return typeof (a as disconnectVerification).verification_data === 'string';
}
verifier.set('disconnectVerification', isDisconnecterification);

export function isGivePublicKey(a: unknown): a is givePublicKey {
    const aa = a as givePublicKey;
    return typeof aa.hash_nick === 'string' &&
            typeof aa.public_key === 'string' &&
            (aa.nick === undefined || typeof aa.nick === 'string') &&
            (aa.client_id === undefined || typeof aa.client_id === 'string') &&
            (aa.server_id === undefined || typeof aa.server_id === 'string');
}
verifier.set('givePublicKey', isGivePublicKey);

// plugin payloads

export interface activePlugins {channelPlugins:string[]}

export type pluginImplementation = {sendMessage:Function, receiveMessage:Function, onPluginsLoaded:Function, examples:Array<Array<string>>, options:Array<[string, unknown]>, checks:Array<any>, createBot:Function};

export type elizaResponses = {weight:number, responses:Array <string>};

//plugin verifiers

export function isActivePlugins(a: unknown): a is activePlugins {
    const aa = a as activePlugins;
    return true;
}
verifier.set('activePlugins', isActivePlugins);

// CLI special types

export type command_parameter_type = {name:string, isMainParameter?:boolean, optional?:boolean, defaultValue?:Function};

export type command_args = {name:string, helpText?:string, parameters?:command_parameter_type[], callback?:Function};

//// Declaring the payloads and verifiers
// How to do this from within other source files using declare?
// https://www.typescriptlang.org/docs/handbook/declaration-merging.html#module-augmentation
// See for example src/auth/proto.ts and src/chan/proto.ts

export interface Payloads {
    'Error': Error;
    'Info': Info;
    'Succes': succes;
    'ChatMessage': ChatMessage
    'Connected': Connected;
    'connectionAttempt': connectionAttempt;
    'disconnectAttempt': disconnectAttempt;
    'disconnectCommit': disconnectCommit;
    'requestPublicKey': requestPublicKey;
    'mutualFriend': mutualFriend;
    'sendEnc': sendEnc;
    'myHashNick': myHashNick;
    'encMessage': encMessage;
    'promptVerification': promptVerification;
    'submitVerification': submitVerification;
    'disconnectVerification': disconnectVerification;
    'givePublicKey': givePublicKey;
    'activePlugins': activePlugins;
    'updatePosition': updatePosition;
    'TicTacToeMsg': TicTacToeMsg;
    'CTFMsg': CTFMsg;
    'sendPath': sendPath;
    'deleteClient': deleteClient;
    'allWorlds': allWorlds;
    'joinWorld': joinWorld;
    'worldSize': worldSize;
    'tryPassword': tryPassword;
    'successPassword': successPassword;
    'failPassword': failPassword;
    'allPrivateWorlds': allPrivateWorlds;
    'setAdmin': setAdmin;
    'updateAdmin': updateAdmin;
    'lobbyLogic': lobbyLogic;
    'audio' : audio;
    'failedVerification' : failedVerification;
    'worldSizeUpdate' : worldSizeUpdate;
    'updateSkin' : updateSkin;
    'allBotSizes' : allBotSizes;
    'updateWorldTiles' : updateWorldTiles;
    'requestLeaderboard' : requestLeaderboard;
    'updateScore': updateScore;
    'browserDisconnect': browserDisconnect;
}

