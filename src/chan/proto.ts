/* eslint-disable no-unused-vars */
import { verifier } from '../comm/proto3';

export interface ChannelJoin {
    channel: string;
    withNick?: boolean;
    credentials?: string;
    secret?: boolean;
    password?: string;
    hash_nick?: string;
    id?: string;
}

export function isChannelJoin(a: unknown): a is ChannelJoin {
    const aa = a as ChannelJoin;
    return (typeof aa.channel === 'string') &&
           (aa.withNick === undefined || typeof aa.withNick === 'boolean') &&
           (aa.credentials === undefined || typeof aa.credentials === 'string');
}

export interface ChannelJoined {
    channel: string;
    hash: string;
    nick: string;
}

export function isChannelJoined(a: unknown): a is ChannelJoined {
    return (typeof (a as ChannelJoined).channel === 'string');
}

export interface ChannelLeave {
    channel: string;
    nick?: string;
}

export function isChannelLeave(a: unknown): a is ChannelLeave {
    return (typeof (a as ChannelLeave).channel === 'string') &&
           ((a as ChannelLeave).nick === undefined || typeof (a as ChannelLeave).nick === 'string');
}

export interface ChannelLeft {
    channel: string;
    hash: string;
    nick: string;
}

export function isChannelLeft(a: unknown): a is ChannelLeft {
    return (typeof (a as ChannelLeft).channel === 'string');
}

export interface ChannelCreate {
    channel: string;
    withNick?: boolean;
    password?: string;
    history?: number;
    open?:string;
    key?: string;
    externalMessages?:boolean;
    id?:string;
    hash_nick?:string;
}

export function isChannelCreate(a: unknown): a is ChannelCreate {
    const aa = a as ChannelCreate;
    return (typeof aa.channel === 'string') &&
           (aa.withNick === undefined || typeof aa.withNick === 'boolean') &&
           (aa.history === undefined || typeof aa.history === 'number') &&
           (aa.password === undefined || typeof aa.password === 'string') &&
           (aa.open === undefined || typeof aa.open === 'string') &&
           (aa.key === undefined || typeof aa.key === 'string') &&
           (aa.externalMessages === undefined || typeof aa.externalMessages === 'boolean') &&
           (aa.id === undefined || aa.id === 'string') &&
           (aa.hash_nick === undefined || aa.hash_nick === 'string');
}

export interface ChannelCreated {
    channel: string;
    owner: string;
    history: number;
}

export function isChannelCreated(a: unknown): a is ChannelCreated {
    const aa = a as ChannelCreated;
    return (typeof aa.channel === 'string') &&
           (typeof aa.owner === 'string') &&
           (typeof aa.history === 'number');
}

export interface ChannelDelete {
    channel: string;
}

export function isChannelDelete(a: unknown): a is ChannelDelete {
    return (typeof (a as ChannelDelete).channel === 'string');
}

export interface ChannelDeleted {
    channel: string;
}

export function isChannelDeleted(a: unknown): a is ChannelDeleted {
    return (typeof (a as ChannelDeleted).channel === 'string');
}

export interface ChannelInfo {
    channel: string;
    secret: string;
    users: [string, string][];
    history: number;
    open: boolean;
}

export function isChannelInfo(a: unknown): a is ChannelInfo {
    const aa = a as ChannelInfo;
    return (typeof aa.channel === 'string') &&
           (typeof aa.history === 'number') &&
           (typeof aa.open === 'boolean') &&
           (typeof aa.secret === 'string') &&
           (aa.users instanceof Array) &&
           (aa.users[0] instanceof Array) &&
           (typeof aa.users[0][0] === 'string') &&
           (typeof aa.users[0][1] === 'string');
}

export interface  ChannelListRequest {
    limit: number;
    from?: string;
}

export function isChannelListRequest(a: unknown): a is ChannelListRequest {
    const aa = a as ChannelListRequest;
    return (typeof aa.limit === 'number') &&
           (aa.from === undefined || typeof aa.from === 'string');
}

export type HistoryTypes = 'sendChannel' | 'Succes';
export const historyTypes = new Set<string>(['sendChannel', 'Succes']);

export function isTypeForHistoryLog(command: string): boolean {
    return historyTypes.has(command);
}

export interface requestAllChannels {}

export function isRequestAllChannels(a: unknown): a is requestAllChannels {
    return true;
}

export interface refuseAccess {text: string; socketId: string}

export function isRefuseAccess(a: unknown): a is refuseAccess {
    const aa = a as refuseAccess;
    return typeof aa.text === 'string' && typeof aa.socketId === 'string';
}

export interface requestAccess {channel: string, hash_nick:string, id:string}

export function isRequestAccess(a: unknown): a is requestAccess {
    const aa = a as requestAccess;
    return typeof aa.channel === 'string' && typeof aa.hash_nick === 'string' && typeof aa.id === 'string';
}

export interface grantAccess {channel:string; socketId:string; publicKey:string; privateKey:string}

export function isGrantAccess(a: unknown): a is grantAccess {
    const aa = a as grantAccess;
    return typeof aa.channel === 'string' && typeof aa.socketId === 'string' && typeof aa.publicKey === 'string' && typeof aa.privateKey === 'string';
}

export interface accessGranted {channel:string, publicKey: string, privateKey: string}

export function isAccessGranted(a: unknown): a is accessGranted {
    const aa = a as accessGranted;
    return typeof aa.channel === 'string' && typeof aa.publicKey === 'string' && typeof aa.privateKey === 'string';
}

export interface accessRefused {text:string}

export function isAccessRefused(a: unknown): a is accessRefused {
    const aa = a as accessRefused;
    return typeof aa.text === 'string';
}

export interface askAdmin {text: string, nick:string, channel:string, socketId:string, id:string}


export function isAskAdmin(a: unknown): a is askAdmin {
    const aa = a as askAdmin;
    return typeof aa.channel === 'string' && typeof aa.text === 'string' && typeof aa.nick === 'string' &&
            typeof aa.socketId === 'string' && typeof aa.id === 'string';
}

export interface channelAdd {channel:string, key?:string}

export function isChannelAdd(a: unknown): a is channelAdd {
    const aa = a as channelAdd;
    return typeof aa.channel === 'string';
}

export interface printChannel {channel: string}

export function isPrintChannel(a: unknown): a is printChannel {
    const aa = a as printChannel;
    return typeof aa.channel === 'string';
}

// Channel managing

export interface ChannelListChannelInfo {
    channel: string;
    numberOfUsers: number;
}

export function isChannelListChannelInfo(a: unknown): a is ChannelListChannelInfo {
    const aa = a as ChannelListChannelInfo;
    return (typeof aa.channel === 'string') && (typeof aa.numberOfUsers === 'number');
}

export interface ChannelList {
    channels: ChannelListChannelInfo[];
}

export function isChannelList(a: unknown): a is ChannelList {
    const aa = a as ChannelList;
    if(aa.channels instanceof Array) {
        for(const c of aa.channels) {
            if(!isChannelListChannelInfo(c)) return false;
        }
        return true;
    }
    return false;
}
// https://www.typescriptlang.org/docs/handbook/declaration-merging.html#module-augmentation
declare module '../comm/proto3' {
    export interface Payloads {
        'ChannelJoin': ChannelJoin;
        'ChannelJoined': ChannelJoined;
        'ChannelLeave': ChannelLeave;
        'ChannelLeft': ChannelLeft;
        'ChannelCreate': ChannelCreate;
        'ChannelCreated': ChannelCreated;
        'ChannelDelete': ChannelDelete;
        'ChannelDeleted': ChannelDeleted;
        'ChannelInfo': ChannelInfo;
        'ChannelListRequest': ChannelListRequest;
        'ChannelList': ChannelList;
        'requestAccess': requestAccess;
        'RefuseAccess': refuseAccess;
        'ChannelAdd': channelAdd;
        'requestAllChannels': requestAllChannels;
        'printChannel': printChannel;
        'grantAccess': grantAccess;
        'accessGranted': accessGranted;
        'accessRefused': accessRefused;
        'askAdmin': askAdmin;

    }
}

verifier.set('ChannelJoin', isChannelJoin);
verifier.set('ChannelJoined', isChannelJoined);
verifier.set('ChannelLeave', isChannelLeave);
verifier.set('ChannelLeft', isChannelLeft);
verifier.set('ChannelCreate', isChannelCreate);
verifier.set('ChannelCreated', isChannelCreated);
verifier.set('ChannelDelete', isChannelDelete);
verifier.set('ChannelDeleted', isChannelDeleted);
verifier.set('ChannelInfo', isChannelInfo);
verifier.set('ChannelListRequest', isChannelListRequest);
verifier.set('ChannelList', isChannelList);
verifier.set('requestAccess', isRequestAccess);
verifier.set('RefuseAccess', isRefuseAccess);
verifier.set('ChannelAdd', isChannelAdd);
verifier.set('requestAllChannels', isRequestAllChannels);
verifier.set('printChannel', isPrintChannel);
verifier.set('grantAccess', isGrantAccess);
verifier.set('accessGranted', isAccessGranted);
verifier.set('accessRefused', isAccessRefused);
verifier.set('askAdmin', isAskAdmin);