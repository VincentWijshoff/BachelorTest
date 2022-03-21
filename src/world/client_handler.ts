import { ChatClient } from '../app/client';
import { log } from '../browser/key_handler';
import { checkCoin, showDiedScreen } from '../browser/settings';
import { isMsg, Msg } from '../comm/proto3';
import { moveClient, visualiseClient, changeDirection, showNewSkin, redrawPosition, redrawPlayers, redrawNickNamesOfPlayersOnPosition} from './world';

/**
 * Event handlers for updating positions and calling the appropriate methods to visualize these updates
 */

export function setPositionHandlers(client : ChatClient){
    client!.incommingcmd.cmds.delete('updatePosition');
    client.incommingcmd.registerCommand('updatePosition', msg => {
        if(isMsg('updatePosition', msg))
            onUpdatePosition(msg, client!);
    });
    client!.incommingcmd.cmds.delete('deleteClient');
    client.incommingcmd.registerCommand('deleteClient', msg => {
        if(isMsg('deleteClient', msg))
            onDeleteClient(msg, client!);
    });
}


function onUpdatePosition(msg: Msg<'updatePosition'>, client: ChatClient) {
    if (client.clientPositions.has(msg.payload.hashnick)) {
        // move existing client
        moveClient(msg.payload, client, msg.payload.direction);
    } else {
        visualiseClient(msg.payload, client);
        // visualize new client
    }
    client.clientPositions.set(msg.payload.hashnick, {x: msg.payload.x, y: msg.payload.y, skin: msg.payload.skin});
}


function onDeleteClient(msg: Msg<'deleteClient'>, client: ChatClient) {
    if (client.clientPositions.has(msg.payload.hash_nick)) {
        const p = client.clientPositions.get(msg.payload.hash_nick)!;
        log('user: ' + msg.payload.hash_nick.split(':')[1] + ' left this world');
        // redraw the tile the player was last on
        redrawPosition(p.x, p.y, client);
        redrawPosition(p.x, p.y-1, client);
        redrawPlayers(p.x, p.y - 1, client, msg.payload.hash_nick);
        redrawNickNamesOfPlayersOnPosition(p.x, p.y, client, msg.payload.hash_nick);
        client.clientPositions.delete(msg.payload.hash_nick);
        // redraw all players also on that tile
        redrawPlayers(p.x, p.y, client, msg.payload.hash_nick);
    }
}

/**
 * send the client back to the lobby (use joinWorld message with empty world_name)
 * 
 * used for example when a client stands on a 'teleport tile'
 */
function returnToLobby(client: ChatClient){
    client.isMovingIce = false;
    if( client.nick.startsWith('bot')){
        client.send('joinWorld', {world_name: '', isBot: true}, {to:client.currWorld, hash_nick:client.hash_nick});
    }
    else{ client.send('joinWorld', {world_name: ''}, {to:client.currWorld, hash_nick:client.hash_nick});}
}

/**
 * send the client, which is already in a world, to another world
 * 
 * used for example when a client stands on a 'teleport tile'
 */
function switchRoom(room :string, x: number, y: number, client: ChatClient){
    if( client.nick.startsWith('bot')){
        client.send('joinWorld', {world_name: room, coordinates: {x: x,y: y, skin: client.skin}, isBot: true}, {to:client.currWorld, hash_nick:client.hash_nick});
    }
    else{client.send('joinWorld', {world_name: room, coordinates: {x: x,y: y, skin: client.skin}}, {to:client.currWorld, hash_nick:client.hash_nick});}
    
    // Stop CTF game if necessary
    if (client!.CTFGame !== undefined && client!.CTFGame.running) client!.CTFGame.running = false;
}


function checkJoinWorld(x: number, y:number, client:ChatClient){
    if(y > 6 && y < 13){ 
        return false; //client is on normal tyle
    }else if(y <= 6){
        if(x <=  6){
            switchRoom('GrassWorld', 14, 18, client); //move to grassworld
        }else if(x <= 14){
            switchRoom('IceWorld', 14, 18, client); //move to iceworld
        }else if (x <= 22){
            switchRoom('LavaWorld', 14, 18, client); //move to LavaWorld
        }else{
            switchRoom('DesertWorld', 14, 18, client); //move to DesertWorld
        }
    }else{
        if(x <=  6){
            switchRoom('OceanWorld', 14, 18, client); //move to OceanWorld
        }else if(x <= 14){
            switchRoom('HillsWorld', 14, 18, client); //move to HillsWorld
        }else if (x <= 22){
            switchRoom('PsychedelicWorld', 14, 18, client); //move to PsychedelicWorld
        }else{
            switchRoom('CaveWorld', 14, 18, client); //move to CaveWorld
        }
    }
    client.inLobby = false;
    return true;
}

/**
 * Call when client wants to move
 */
export function move(x: number, y: number, client: ChatClient, direction: string){
    checkCoin(x, y , client);
    client.send('updatePosition', {hashnick: client.hash_nick, x: x, y: y, direction: direction, skin: client.skin});
}

function die (client : ChatClient){
    let deathReason = '';
    if (client.currWorld == 'DesertWorld'){ 
        client?.send('ChatMessage', {text: `${client.nick} tried to hug a cactus...`}, {to:'#' + client.currWorld, hash_nick: client.hash_nick});
        deathReason = 'You tried to hugh a cactus...';}
    if (client.currWorld == 'LavaWorld'){ 
        client?.send('ChatMessage', {text: `${client.nick} tried to swim in lava...`}, {to:'#' + client.currWorld, hash_nick: client.hash_nick});
        deathReason = 'You tried to swim in lava...';}
    if (client.currWorld == 'HillsWorld'){
        client?.send('ChatMessage', {text: `${client.nick} tried to skydive...`}, {to:'#' + client.currWorld, hash_nick: client.hash_nick});
        deathReason = 'You tried to skydive...';}
    if (client.currWorld == 'GrassWorld'){ 
        client?.send('ChatMessage', {text: `${client.nick} tried to swim in deadly waters...`}, {to:'#' + client.currWorld, hash_nick: client.hash_nick});
        deathReason = 'You tried to swim in deadly waters...';}
    client.isMoving = false;
    client.isMovingIce = false;
    showDiedScreen(client, deathReason);
}

//same x, y coordinate - 1
function moveUp(client: ChatClient){
        
    let currentPos = client.clientPositions.get(client.hash_nick);
    let worldBinary = client.worldBinary;
    currentPos!.y -= 1;
    if(currentPos!.y < 0 || worldBinary[currentPos!.y][currentPos!.x] == 1){
        // cannot move up
        changeDirection(client, 'back');
        currentPos!.y += 1;
        client.isMovingIce = false;
    }else{
        if(!client.inLobby){ // move client in world
            if (worldBinary[currentPos!.y][currentPos!.x] == 2) {
                die(client);
                return;
            }
            move(currentPos!.x, currentPos!.y, client, 'back');
            return;
        }else if(checkJoinWorld(currentPos!.x, currentPos!.y, client)){ //joning a world
            return;
        }
        moveClient({hashnick: client.hash_nick, x: currentPos!.x, y: currentPos!.y, skin: currentPos!.skin}, client, 'back');
    }   
}

//x + 1, same y
function moveRight(client: ChatClient){
    let currentPos = client.clientPositions.get(client.hash_nick);
    let worldBinary = client.worldBinary;
    currentPos!.x += 1;
    if(!client.inLobby){

        //if client is on teleport tile
        if(currentPos!.x == 14 && currentPos!.y == 19){
            console.log('client is returning to lobby');
            returnToLobby(client);
            client.isMovingIce = false;
            return;
        }

        //if client is on bridge and presses right
        if(currentPos!.x == worldBinary[0].length && currentPos!.y == 9){
            let worldNames = client.currentWorlds;
            let index = (worldNames!.indexOf(client.currWorld!) + 1) % worldNames!.length;
            console.log('joining world ', worldNames![index]);
            switchRoom(worldNames![index], 0, 9, client);
            client.isMovingIce = false;
            return;
        }

        if(currentPos!.x >= worldBinary[0].length || worldBinary[currentPos!.y][currentPos!.x] == 1){
            // cannot move right
            client.isMovingIce = false;
            changeDirection(client, 'right');
            currentPos!.x -= 1;
        }else{
            move(currentPos!.x, currentPos!.y, client, 'right');
        }        

        if (worldBinary[currentPos!.y][currentPos!.x] == 2) {
            die(client);
            return;
        }
    }else{
        if(checkJoinWorld(currentPos!.x, currentPos!.y, client)){
            return;
        }
        if(worldBinary[currentPos!.y][currentPos!.x] == 1){
            changeDirection(client, 'right');
            currentPos!.x -= 1;
            return;
        }
        if(currentPos!.x >= worldBinary[0].length){
            // cannot move right so looping around to left side
            moveClient({hashnick: client.hash_nick, x: 0, y: currentPos!.y, skin: currentPos!.skin}, client, 'right', {x: currentPos!.x-1, y: currentPos!.y}); 
            currentPos!.x = 0;
        }else {
            moveClient({hashnick: client.hash_nick, x: currentPos!.x, y: currentPos!.y, skin: currentPos!.skin}, client, 'right'); 
        }
    }
}

//same x, y+1
function moveDown(client: ChatClient){
    let currentPos = client.clientPositions.get(client.hash_nick);
    let worldBinary = client.worldBinary;
    currentPos!.y += 1;
    //if client is on teleport tile
    if(currentPos!.x == 14 && currentPos!.y == 19){
        returnToLobby(client);
        client.isMovingIce = false;
        return;
    }

    if(currentPos!.y >= worldBinary.length || worldBinary[currentPos!.y][currentPos!.x] == 1){
        // cannot move down
        client.isMovingIce = false;
        changeDirection(client, 'front');
            currentPos!.y -= 1;
    }else{
        if(!client.inLobby){ // move in a world
            if (worldBinary[currentPos!.y][currentPos!.x] == 2) {
                die(client);
                return;
            }
            move(currentPos!.x, currentPos!.y, client, 'front');
            return;
        }else if (checkJoinWorld(currentPos!.x, currentPos!.y, client)){ // go to world
            return;
        }
        // move in lobby
        moveClient({hashnick: client.hash_nick, x: currentPos!.x, y: currentPos!.y, skin: currentPos!.skin}, client, 'front');
    }
}

//x-1, same y
function moveLeft(client: ChatClient){
    let currentPos = client.clientPositions.get(client.hash_nick);
    let worldBinary = client.worldBinary;
    currentPos!.x -= 1;
    if(!client.inLobby){
        //if client is on teleport tile
        if(currentPos!.x == 14 && currentPos!.y == 19){
            // return to lobby
            returnToLobby(client);
            client.isMovingIce = false;
            return;
        }

        //if client is on bridge and presses left
        if(currentPos!.x == -1 && currentPos!.y == 9){
            let worldNames = client.currentWorlds;
            let index = (worldNames!.indexOf(client.currWorld!) - 1) % worldNames!.length;
            if(index == -1){
                index = worldNames!.length -1;
            }
            console.log('joining world ', worldNames![index]);
            switchRoom(worldNames![index], 29, 9, client);
            client.isMovingIce = false;
            return;
        }

        if(currentPos!.x < 0 || worldBinary[currentPos!.y][currentPos!.x] == 1){
            // cannot move left         
            client.isMovingIce = false;
            changeDirection(client, 'left');
            currentPos!.x += 1;
        }else{
            move(currentPos!.x, currentPos!.y, client, 'left');
        }
        if (worldBinary[currentPos!.y][currentPos!.x] == 2) {
            die(client);
            return;
        }
    }else{ 
        //in lobby
        if(checkJoinWorld(currentPos!.x, currentPos!.y, client)){
            return;
        }
        if(worldBinary[currentPos!.y][currentPos!.x] == 1){
            changeDirection(client, 'left');
            currentPos!.x += 1;
            return;
        }
        if(currentPos!.x < 0){
            // cannot move left, wrapping around
            moveClient({hashnick: client.hash_nick, x: 29, y: currentPos!.y, skin: currentPos!.skin}, client, 'left', {x: currentPos!.x+1, y: currentPos!.y}); 
            currentPos!.x = 29;
        }else{
            moveClient({hashnick: client.hash_nick, x: currentPos!.x, y: currentPos!.y, skin: currentPos!.skin}, client, 'left'); 
        }  
    }
}

export function onUpdateSkin(msg : Msg<'updateSkin'>, client : ChatClient){
    // console.log('onUpdateSkinnnnn');
    if(client.clientPositions.has(msg.payload.id) && client.currWorld != 'OceanWorld'){
        // set the new skin off the new client
        let pos = client.clientPositions.get(msg.payload.id)!;
        pos.skin = msg.payload.skin;
        client.clientPositions.set(msg.payload.id, pos);
        showNewSkin({x: pos.x, y: pos.y, hashnick: msg.payload.id, skin: pos.skin}, client);
    }
}

export {moveUp, moveRight, moveLeft, moveDown, switchRoom, returnToLobby};

