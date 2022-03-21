/* eslint-disable no-undef */
/* eslint-disable no-unused-vars */

import { ChatClient } from '../app/client';
import { isMsg, Msg } from '../comm/proto3';
import { onUpdateSkin, returnToLobby, switchRoom} from '../world/client_handler';
import { clearLobby, setLobby, showWorld, showPasswordPrompt, updateLobby, updateTilesLobby, sleep, visualiseWorldName, redrawPosition, redrawPlayers, isHittable, checkIfDied} from '../world/world';
import { playAudio, setClickHandlers, setKeyHandler } from './browser_main';
import { addPasswordCommand, removePasswordCommand, log, addRequestAdminCommand, removeRequestAdminCommand, updateInputBox } from './key_handler';
import { emptyHtml, showDiedScreen } from './settings';
import {createLeaderboard} from '../browser/settings';

let client : ChatClient | undefined;

/**
 * We will override every client function that logs something to the console to log it to our custom console
 * @param client 
 */
export function setHandlers(clientt : ChatClient){
    client = clientt;
    client.onChatMessage = (msg:Msg<'ChatMessage'>) => onChatMessage(msg);
    client.onEncMessage = (msg:Msg<'encMessage'>) => onEncMessage(msg);
    client!.incommingcmd.cmds.delete('allWorlds');
    client.incommingcmd.registerCommand('allWorlds', msg => {
        if(isMsg('allWorlds', msg))
            onAllWorlds(msg.payload.worlds);
    });
    client!.incommingcmd.cmds.delete('joinWorld');
    client.incommingcmd.registerCommand('joinWorld', msg => {
        if(isMsg('joinWorld', msg))
            onJoinWorld(msg.payload.world_name, msg.payload.world_logic);
    });
    client!.incommingcmd.cmds.delete('worldSize');
    client.incommingcmd.registerCommand('worldSize', msg => {
        if(isMsg('worldSize', msg))
            onWorldSize(msg.payload.worlds);
    });
    client!.incommingcmd.cmds.delete('worldSizeUpdate');
    client.incommingcmd.registerCommand('worldSizeUpdate', msg => {
        if(isMsg('worldSizeUpdate', msg))
            onWorldSizeUpdate(msg);
    });
    client!.incommingcmd.cmds.delete('successPassword');
    client.incommingcmd.registerCommand('successPassword', msg => {
        if(isMsg('successPassword', msg))
            onSuccessPassword();
    });
    client!.incommingcmd.cmds.delete('failPassword');
    client.incommingcmd.registerCommand('failPassword', msg => {
        if(isMsg('failPassword', msg))
            onFailPassword();
    });
    client!.incommingcmd.cmds.delete('allPrivateWorlds');
    client.incommingcmd.registerCommand('allPrivateWorlds', msg => {
        if(isMsg('allPrivateWorlds', msg))
            onAllPrivateWorlds(msg.payload.worlds);
    });
    client!.incommingcmd.cmds.delete('updateAdmin');
    client.incommingcmd.registerCommand('updateAdmin', msg => {
        if(isMsg('updateAdmin', msg))
            onUpdateAdmin(msg.payload.hashnick);
    });
    client!.incommingcmd.cmds.delete('lobbyLogic');
    client.incommingcmd.registerCommand('lobbyLogic', msg => {
        if(isMsg('lobbyLogic', msg))
            onLobbyLogic(msg);
    });
    client!.incommingcmd.cmds.delete('audio');
    client.incommingcmd.registerCommand('audio', msg => {
        if(isMsg('audio', msg))
            onAudio(msg);
    });
    client!.incommingcmd.cmds.delete('failedVerification');
    client.incommingcmd.registerCommand('failedVerification', msg => {
        if(isMsg('failedVerification', msg))
            onFailedVerification(msg);
    });
    client!.incommingcmd.cmds.delete('updateSkin');
    client.incommingcmd.registerCommand('updateSkin', msg => {
        if(isMsg('updateSkin', msg))
            onUpdateSkin(msg, client!);
    });
    client!.incommingcmd.cmds.delete('allBotSizes');
    client.incommingcmd.registerCommand('allBotSizes', msg => {
        if(isMsg('allBotSizes', msg))
            onAllBotSizes(msg, client!);
    });
    client!.incommingcmd.cmds.delete('updateWorldTiles');
    client.incommingcmd.registerCommand('updateWorldTiles', msg => {
        if(isMsg('updateWorldTiles', msg))
            updateWorldTiles(msg, client!);
    });
    client!.incommingcmd.cmds.delete('requestLeaderboard');
    client.incommingcmd.registerCommand('requestLeaderboard', msg => {
        if(isMsg('requestLeaderboard', msg))
            onRequestLeaderboard(msg, client!);
    });
    client.incommingcmd.registerCommand('browserDisconnect', msg => {
        if(isMsg('browserDisconnect', msg))
            onBrowserDisconnect(msg);
    });
}

function onBrowserDisconnect(msg: Msg<'browserDisconnect'>){
    var el = document.getElementById('body');
    var elClone = el?.cloneNode(true);
    el?.parentNode?.replaceChild(elClone!, el);
    msg.payload.socket.close();
    setClickHandlers();
}

function onRequestLeaderboard(msg : Msg<'requestLeaderboard'>, client: ChatClient){
    let totalscores = new Map(); // hashnick --> totalscore. Used for sorting 

    let len = (msg.payload.keys.length)-1;
    for (let i = 0; i <= len; i+=2){
        client.scores.set(msg.payload.keys[i], msg.payload.keys[i+1]);
    }
    
    // add the totalscore to the scores from the client
    // make totalscores map
    for(let key of client.scores.keys()){
        let values = client.scores.get(key);
        let totalscore = 0;
        for (let index of values!){
            totalscore += index;
        }
        client.scores.get(key)!.push(totalscore as never);
        totalscores.set(key, totalscore);
    }
    // sort totalscoresmap
    const sortedTotalscore = new Map([...totalscores.entries()].sort((a, b) => b[1] - a[1]));

    createLeaderboard(sortedTotalscore, client.scores, client);
}


function updateWorldTiles(msg : Msg<'updateWorldTiles'>, client: ChatClient){
    for(let i in msg.payload.updatedTiles){
        client.world[msg.payload.updatedTiles[i].x][msg.payload.updatedTiles[i].y] = msg.payload.updatedTiles[i].tile;
        redrawPosition(msg.payload.updatedTiles[i].y, msg.payload.updatedTiles[i].x, client);
        redrawPlayers(msg.payload.updatedTiles[i].y, msg.payload.updatedTiles[i].x, client, '');
        if(msg.payload.updatedTiles[i].tile.includes('D')){
            client.worldBinary[msg.payload.updatedTiles[i].x][msg.payload.updatedTiles[i].y] = 2;
            if(checkIfDied(client)){
                showDiedScreen(client, '');
            }
        }else if(isHittable(msg.payload.updatedTiles[i].tile)){
            client.worldBinary[msg.payload.updatedTiles[i].x][msg.payload.updatedTiles[i].y] = 1;
        }else{
            client.worldBinary[msg.payload.updatedTiles[i].x][msg.payload.updatedTiles[i].y] = 0;
        }
    }
}

function onFailedVerification(msg: Msg<'failedVerification'>){
    client?.disconnect();
    emptyHtml(client);
    document.getElementById('loginform')!.hidden = false;
    document.getElementById('wrongKeys')!.hidden = false;
    let audio = document.getElementById('audio') as HTMLAudioElement;
    audio!.volume = 0;
}

function onAudio(msg : Msg<'audio'>){
    log('[ '+msg.from+' -> all : '+ msg.timestamp+' ]: Received audio message');
    playAudio(msg.payload.blob);
}


function onLobbyLogic(msg : Msg<'lobbyLogic'>){
    setKeyHandler();
    client!.lobbyLogic = msg.payload.logic;
}

/**
 * update the admin of the world
 * 
 * if hashnick == "" -> admin left
 * else new admin
 */
function onUpdateAdmin(hashnick: string){
    if(hashnick == ''){ //delete admin when hashnick == ""
        addRequestAdminCommand(); //other clients can become admin
        updateInputBox(); //do this to update the bar
        log('World is now public!');
        let index = client!.currentPrivateWorlds!.indexOf(client!.currWorld!);
        client!.currentPrivateWorlds?.splice(index);
        return;
    }
    //add admin
    log('World is now private');
    removeRequestAdminCommand();
    updateInputBox();
    client!.currentPrivateWorlds?.push(client!.currWorld!);
}


function onChatMessage(msg:Msg<'ChatMessage'>) {
    if (msg.to && msg.to.startsWith('#')){
        log('['+ msg.from + ']: '+ msg.payload.text);
    } else if (msg.to){
        // Direct message
        log('[ '+msg.from+' -> me : '+ msg.timestamp+' ]: '+ msg.payload.text);
    } else {
        log('[ '+msg.from+' -> all : '+ msg.timestamp+' ]: '+ msg.payload.text);
    }
}

function onEncMessage(msg:Msg<'encMessage'>) {
    // for testing
    client!.testMsgReceived += 1;

    if (msg.payload.signed == 'true') {
        let message = client!.decryptSignedMessage(msg.payload.text, msg.timestamp);
        client!.testMsgMsg = message;

        if (message != undefined){
            let lastpart = message.substring(message.indexOf(':'));//cut off the [+nick
            message = '[ ' + msg.from + ' -> ' + client!.nick + lastpart;
            log(message);
        }else {
            client!.testFrom = msg.from;
        }
    } else {
        let message = client!.decryptEncryptedMessage(msg.payload.text, msg.timestamp, msg.from);
        // for testing
        client!.testMsgMsg = message;
        client!.testFrom = msg.from;

        if (message != undefined){
            let lastpart = message.substring(message.indexOf(':'));//cut off the [+nick
            message = '[ ' + msg.from + ' -> ' + client!.nick + lastpart;
            log(message);
        }
    }
}

/**
 * Setter of currentPrivateWorlds (in client)
 * 
 * Used when a client connects to a server (and is in lobby)
 */
export async function onAllPrivateWorlds(worlds : string[]){
    client!.currentPrivateWorlds = worlds;
    updateInputBox();
    updateTilesLobby('CaveWorld', client!);
    await sleep(50);
    visualiseWorldName('CaveWorld', client!);
}

/**
 * Setter of currentWorlds (in client)
 * 
 * Used when a client connects to a server (and is in lobby)
 */
function onAllWorlds(worlds : string[]){
    client!.currentWorlds = worlds;
    updateInputBox();
}

function onAllBotSizes(msg: Msg<'allBotSizes'>, client: ChatClient){
    client.botsInWorld = msg.payload.bots;
}


function onWorldSizeUpdate(msg : Msg<'worldSizeUpdate'>){
    updateLobby(msg.payload.world1, msg.payload.action1, client!);
    if(msg.payload.world2 != ''){
        updateLobby(msg.payload.world2!, msg.payload.action2!, client!);
    }
}


/**
 * Setter of worldSizes (in client)
 * 
 * Used to see how many clients are in every world
 */
function onWorldSize(sizes : number[]){
    if(client!.worldSizes != sizes){
        client!.worldSizes = sizes;
        updateInputBox();
        setLobby(client!);
    }
}

/**
 * let the client join the given world (by name)
 */
async function onJoinWorld(worldName : string, world? : string[][]){
    if(world == undefined){
        console.log('the received world was undefined, going back to lobby');
        removeRequestAdminCommand();
        updateInputBox();
        return;
    }
    clearLobby();
    client!.clientPositions = new Map();
    client!.currWorld = worldName;
    if(worldName != 'CaveWorld'){
        removeRequestAdminCommand();
    }
    if(worldName == 'CaveWorld' && !client!.isAllowed && client!.currentPrivateWorlds!.includes(worldName)){
        showPasswordPrompt();
        addPasswordCommand();
        updateInputBox();
    }else{
        removePasswordCommand();
        console.log('Client is added to world: ' + worldName);
        if(worldName == 'CaveWorld' && !client!.currentPrivateWorlds!.includes(worldName)){
            addRequestAdminCommand();
        }
        updateInputBox();
        showWorld(world, worldName, client!);
        await sleep(500)
        ;       client!.isAllowed = false;
    }
}

function onSuccessPassword(){
    updateInputBox();
    client!.isAllowed = true;
    switchRoom(client!.currWorld!, 15, 19, client!);
}

function onFailPassword(){
    removePasswordCommand();
    updateInputBox();
    returnToLobby(client!);
}