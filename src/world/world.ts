/* eslint-disable no-undef */
import { ChatClient } from '../app/client';
import {Tilemap} from './textures/tilemap';


export function sleep(time:number){
    return new Promise((resolve) =>{
        setTimeout(() => {
            resolve('');
        }, time);
    });
}

/**
 * Create the lobby (and visualise)
 */
async function setLobby(client : ChatClient){    
    if(!client.inLobby){
        clearLobby();
        showWorld(client.lobbyLogic!, 'Lobby', client);
        await sleep(100);
        client.world = client.lobbyLogic!;
        client.currWorld = 'Lobby';
        client.clientPositions.set(client.hash_nick, {x:15, y:10, skin: client.skin});
        visualiseClient({hashnick: client.hash_nick, x: 15, y:10, skin: client.skin}, client);
    }
    client.inLobby = true;
    visualiseLobby(client);
}

function visualiseLobby(client : ChatClient){
    let worlds = client.currentWorlds;
    let canvas:HTMLCanvasElement|null = document.getElementById('window') as HTMLCanvasElement;

    let worldWidth: number; //width of every world cell
    if(worlds!.length % 2 == 0){
        worldWidth = 2*canvas.width / worlds!.length;
    }else{
        worldWidth = 2*canvas.width / (worlds!.length + 1);
    }

    for(let i = 0; i<worlds!.length; i++){
        visualiseWorldName(worlds![i], client);
    }

    canvas.addEventListener('click', function(event){
        if(!client.inLobby)
            return;        
        var x = event.pageX;
        var y = event.pageY;     
        let worldPressed = checkWhichCellPressed(x, y, worldWidth, client);

        //finally if pressed on a cell -> send joinWorld
        if(worldPressed){
            client.inLobby = false;
            client.send('joinWorld', {world_name: worldPressed, coordinates: {x:14, y:18, skin: client.skin}});
        }
    }, false);
}

function checkWhichCellPressed(x: number, y: number, worldWidth : number, client : ChatClient){
    let canvas:HTMLCanvasElement|null = document.getElementById('window') as HTMLCanvasElement;
    let worlds = client.currentWorlds;
    //logic for checking which cell is pressed
    let worldPressed;
    if(y < canvas!.height/3){
        //world is one of top layer
        let index = 0;
        let x_coord = x;
        worldPressed;
        // eslint-disable-next-line no-constant-condition
        while(true){
            x_coord -= worldWidth;
            if(x_coord < 0){
                worldPressed = worlds![index];
                break;
            }else if(x_coord == 0){ //pressed on a line -> do nothing
                break;
            }
            index++;
        }
    }else if(y > canvas!.height*2/3){
        //world is one of bottom layer
        let index = Math.round(worlds!.length/2);
        let x_coord = x;
        worldPressed;
        // eslint-disable-next-line no-constant-condition
        while(true){
            x_coord -= worldWidth;
            if(x_coord < 0){
                worldPressed = worlds![index];
                break;
            }else if(x_coord == 0){ //pressed on a line -> do nothing
                break;
            }
            index++;
        }
    }
    return worldPressed;
    //no case when y == canvas.height -> pressed on line -> do nothing
}

/**
 * Set the collor of the ctx for according to the world
 */
function setColor(ctx: CanvasRenderingContext2D, world : string){
    if(world == 'LavaWorld'){
        ctx!.fillStyle = 'red';
    }else if(world == 'DesertWorld'){
        ctx!.fillStyle ='purple';
    }else if(world == 'HillsWorld'){
        ctx!.fillStyle ='pink';
    }else if(world == 'CaveWorld'){
        ctx!.fillStyle ='pink';
    }else if(world == 'PsychedelicWorld'){
        ctx!.fillStyle ='white';
    } else {
        ctx!.fillStyle ='black';
    } 
}

export async function updateLobby(world: string, action : string, client : ChatClient){
    let index = client.currentWorlds?.indexOf(world);
    if(index != -1){ //world is a valid world name -> update 
        if(action == 'left_client'){
            client.worldSizes![index!] -= 1;
        }else if (action == 'joined_client'){
            client.worldSizes![index!] += 1;
        }else if (action == 'left_bot'){
            client.botsInWorld![index!] -= 1;
        }else if (action == 'joined_bot'){
            client.botsInWorld![index!] += 1;
        }
        updateTilesLobby(world, client);
        await sleep(50);
        visualiseWorldName(world, client);
        //visualise world name
        //update tiles of that world
    }
}

/**
 * redraw the tiles of the lobby, but only those of the world whose content have been changed (given as parameter 'name')
 */
export function updateTilesLobby(name: string, client: ChatClient){
    let lobbylogic = client.lobbyLogic!;
    let index = client.currentWorlds?.indexOf(name);
    let canvas:HTMLCanvasElement|null = document.getElementById('window') as HTMLCanvasElement;
    let ctx = canvas.getContext('2d');
    let imgW = canvas.width / lobbylogic[0].length;
    let imgH = canvas.height / lobbylogic.length;
    let width;
    let startX;
    let startY;
    if(index! < client.currentWorlds!.length/2){ //world is one of the toplayer worlds
        startY = 0;
    }else{
        startY = 13;
    }
    if(index == 0|| index == 4){
        startX = 0;
        width = 7;
    }else if (index == 1|| index == 5){
        startX = 7;
        width = 8;
    }else if (index == 2|| index == 6){
        startX = 15;
        width = 8;
    }else{
        startX = 23;
        width = 7;
    }

    for(let i = startY; i<startY+7; i++){ //vertical loop
        for(let j = startX; j<startX + width; j++){
            loadImage(lobbylogic, i, j, imgW, imgH, ctx, 'Lobby');
        }
    }
}

/**
 * Logic for visualising the content of the given world in lobby (calculates coordinates) 
 */
export function visualiseWorldName(world : string, client: ChatClient){
    let worlds = client.currentWorlds;
    let canvas:HTMLCanvasElement|null = document.getElementById('window') as HTMLCanvasElement;
    let index = worlds?.indexOf(world);
    if(index == -1)
        return;
    let posX;
    if(index! < worlds!.length/2){
        posX = canvas.height/6;
    }else{
        posX = (canvas.height*5)/6 - 20;
    }
    let worldWidth: number; //width of every world cell
    if(worlds!.length % 2 == 0){
        worldWidth = 2*canvas.width / worlds!.length;
    }else{
        worldWidth = 2*canvas.width / (worlds!.length + 1);
    }
    let nameSpace = worldWidth / 2;
    if(index == 0 || index == 4){
        printWorldName(world, posX, nameSpace, client);
    }else if(index == 1 || index == 5){
        printWorldName(world, posX, nameSpace + worldWidth, client);
    }else if(index == 2 || index == 6){
        printWorldName(world, posX, nameSpace + 2*worldWidth, client);
    }else{
        printWorldName(world, posX, nameSpace + 3*worldWidth, client);
    }
}

/**
 * Visualise the world contents (in lobby) of the given world
 */
function printWorldName(world: string, posY : number, posX : number, client : ChatClient){
    let canvas:HTMLCanvasElement|null = document.getElementById('window') as HTMLCanvasElement;
    let ctx = canvas.getContext('2d');
    if(ctx){
        ctx.font = '30px verdana';
        ctx.textAlign = 'center';
    }
    setColor(ctx!, world);
    ctx?.fillText(world, posX, posY);
    if(ctx){
        ctx.font = '20px verdana';
    }
    let i = client.currentWorlds?.indexOf(world);
    const size = client.worldSizes![i!];
    let botsInWorld : number = client.botsInWorld![i!];
    ctx?.fillText('Players in world:', posX, 30 + posY);
    if(size != undefined){
        ctx?.fillText((size).toString(), posX, 55 + posY);
    } 
    if(botsInWorld != 0){
        ctx?.fillText('Bots in world:', posX, 90 + posY);
        ctx?.fillText(botsInWorld.toString(), posX, 115 + posY);
    }
    if(client.currentPrivateWorlds!.includes(world) && botsInWorld == 0){
        ctx?.fillText('Private', posX, 90 + posY); //world is private
    }else if(client.currentPrivateWorlds!.includes(world)){
        ctx?.fillText('Private', posX, 150 + posY); //world is private
    }
}

function setMusic(src : string) : void{
    const audio = document.getElementById('audio') as HTMLAudioElement;
    audio!.src = `./BackgroundMusic/${src}.mp3`;
}

function clearLobby(){
    let canvas:HTMLCanvasElement|null = document.getElementById('window') as HTMLCanvasElement;
    let ctx = canvas.getContext('2d');
    ctx?.clearRect(0, 0, canvas.width, canvas.height);
}

// eslint-disable-next-line no-unused-vars
async function showWorld(world : string[][], name: string, client: ChatClient){
    setMusic(name);
    let canvas:HTMLCanvasElement|null = document.getElementById('window') as HTMLCanvasElement;
    let ctx = canvas.getContext('2d');
    let imgW = canvas.width / world[0].length;
    let imgH = canvas.height / world.length;
    let worldBinary : number[][] = [];

    // optimisation, we save a map off every tile andd all positions it is used in, so every tile is loaded only once and reprinted multiple times
    let tileSet : Map<string, {x: number, y: number}[]> = new Map<string, {x: number, y: number}[]>();

    // For loop over all elements from the matrix here
    for (let i = 0; i < world.length; i++){
        worldBinary.push([]);
        for (let j = 0; j < world[0].length; j++){
            worldBinary[i].push(-1);
            let img:string|undefined = world[i][j];
            if(tileSet.has(img)){
                let tileList = tileSet.get(img)!;
                tileList.push({x: i, y: j});
                tileSet.set(img, tileList);
            }else{
                tileSet.set(img, [{x: i, y: j}]);
            }
            // loadImage(world, i, j, imgW, imgH, ctx, name, worldBinary, client);
        }
    }
    // now we draw the tiles foreach entry in the tileSet
    tileSet.forEach(img => {
        loadImageArray(world, img, imgW, imgH, ctx, name,  worldBinary, client);
    });

    client.world = world;
    client.worldBinary = worldBinary;
}

function loadImageArray(world: string[][], img2: { x: number; y: number; }[], imgW: number, imgH: number, ctx: CanvasRenderingContext2D | null,name: string, worldBinary: number[][], client: ChatClient) {
    let img1:string = world[img2[0].x][img2[0].y]!;
    let img = Tilemap.get(name)?.get(img1);

    if(img1.includes('coin')){
        if(client && client.coins.indexOf(name) >= 0){
            img = Tilemap.get(name)?.get('tile');
        }
    }

    var imageObj = new Image();
    let src = `../../tiles/${name}/${img}`;
    let localImg = getImage(src); // try and get image from local storage
    if(!localImg){
        // the image was not in storage and needs te be saved into local storage
        imageObj.src = src;
        imageObj.width = imgW; // need to set attributes and load image before able to set into local storage
        imageObj.height = imgH;
        console.log('setting img into local storage');
        imageObj.onload = () => {
            setImage(src, imageObj); // set image in local storage
            doImageVisuals(ctx!, img2, img1, worldBinary, imgW, imgH, imageObj);
        };
    }else{
        // the image was in local storage, and can be used from there
        imageObj.setAttribute('src', localImg!);
        console.log('got image from local storage');

        imageObj.onload = function () {
            doImageVisuals(ctx!, img2, img1, worldBinary, imgW, imgH, imageObj);
        };
    }    
}

function doImageVisuals(ctx : CanvasRenderingContext2D, img2 : { x: number; y: number; }[], img1 : string, worldBinary :number[][], imgW : number, imgH : number, imageObj : HTMLImageElement){
    if(ctx){
        img2.forEach(position => {

            let i = position.x;
            let j = position.y;

            if(isHittable(img1)){
                if(worldBinary)
                    worldBinary[i][j] = 1;
            }else{
                if(worldBinary)
                    worldBinary[i][j] = 0;
            }
            if(img1.includes('D')){
                if(worldBinary)
                    worldBinary[i][j] = 2;
            }if(img1.includes('coin')){
                if(worldBinary)
                    worldBinary[i][j] = 4;
            }
        
            let x = j*imgW;
            let y = i*imgH;
            ctx.drawImage(imageObj, x, y, imgW, imgH);
        });

    }
}

/**
 * function for rendering tile
 * 
 * made new function because otherwise the onload function would render the LAST sprite 400 times
 */
function loadImage(world: string[][], i: number, j: number, imgW: number, imgH: number, ctx: CanvasRenderingContext2D | null, name: string, worldBinary?: number[][], client? : ChatClient){
    let img1:string|undefined = world[i][j];
    let x = j*imgW;
    let y = i*imgH;
    var imageObj = new Image();

    let img = Tilemap.get(name)?.get(img1);
    // check if the tile is a inpassable tile or not
    if(isHittable(img1)){
        if(worldBinary)
            worldBinary[i][j] = 1;
    }if(img1.includes('D')){
        if(worldBinary)
            worldBinary[i][j] = 2;
    }if(img1.includes('coin')){
        if(client && client.coins.indexOf(name) >= 0){
            img = Tilemap.get(name)?.get('tile');
        }
        if(worldBinary)
            worldBinary[i][j] = 4;
    }

    let src :string = `../../tiles/${name}/${img}`;
    const localImg = getImage(src);
    if(localImg){
        imageObj.src = localImg;
    }else{
        imageObj.src = src;
    }

    imageObj.onload = function () {
        if(ctx){
            ctx.drawImage(imageObj, x, y, imgW, imgH);            
        }
    };
}

/**
 * the steps we want to take when visualising the movement of a client:
 *      -> first we remove the client from its old position by redrawing the tile on that position
 *      -> then we remove the name off the client on the old position by redrawing the tile on 1 tile above the old position
 *      -> then we redraw all names off the clients on the position 1 below the old position
 *      -> then we redraw every player on the old position of the client
 *      -> then we redraw all names off the players on the old position
 *      -> then we redraw all players on 1 above the old positon off the player
 *      -> now we can paint the moving user on its new position
 *      -> and finnaly we draw the name off the moved client on its new position
 */

async function moveClient(payload: {hashnick: string, x: number, y: number, skin:string}, client: ChatClient, direction: string, prevpos?: {x: number, y: number}){
    client.isMoving = true;

    // first some data collection
    let old_position = {x: 0, y: 0};
    if(prevpos){
        old_position = prevpos;
    }else if (direction == 'front') {
        old_position.x = payload.x;
        old_position.y = payload.y - 1;
    } else if (direction == 'back') {
        old_position.x = payload.x;
        old_position.y = payload.y + 1;
    } else if (direction == 'right') {
        old_position.x = payload.x - 1;
        old_position.y = payload.y;
    } else {
        old_position.x = payload.x + 1;
        old_position.y = payload.y;
    }
    
    let skin = payload.skin;
    if (client.currWorld == 'OceanWorld') {
        skin = 'ocean';
        if (direction == 'front' || direction == 'back') {
            direction = 'leftocean';
        }else{
            direction = direction + 'ocean';
        }
    }

    // we want a smooth transaction between old and new position
    // so we do this loop, but in stead off drawing the client on the new position instantly, we do it in STEPS steps
    // we take TIME between transition off tiles, so we do every step with a wait off TIME/STEPS delay
    // every step should be DISTANCE/STEPS long with the DISTANCE being the distance between old and new position
    // the YMOVE and XMOVE are 0 or 1 if the movement is in that direction

    // |||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||

    // const STEPS : number = 10;  // These 2 paramters make the entire movement
    // const TIME : number = 100;

    // // |||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||

    // const XMOVE : number = payload.x - old_position.x;
    // const YMOVE : number = payload.y - old_position.y;
    // let canvas:HTMLCanvasElement|null = document.getElementById('window') as HTMLCanvasElement;
    // const imgW = canvas.width / 30; 
    // const imgH = canvas.height / 20;
    // const DISTANCE : number = Math.abs(XMOVE*imgW + YMOVE*imgH); // if XMOVE == 0 => DISTANCE == imgH and vise versa
    // const STEP : number = DISTANCE/STEPS;

    // -> we remove the name off the client on the old position by redrawing the tile on 1 tile above the old position
    //console.log('REDRAW TILE ON TILE ABOVE OLD POSITION: ', old_position.x, old_position.y-1);

    redrawPosition(old_position.x, old_position.y - 1, client);


    // for(let i = 1 ; i <= STEPS ; i++){

    // -> first we remove the client from its old position by redrawing the tile on that position
    //console.log('REDRAW TILE ON OLD POSITION: ', old_position.x, old_position.y);

    redrawPosition(old_position.x, old_position.y, client);

        

    // -> we redraw the new position as well to smooth the transition
    // redrawPosition(payload.x, payload.y, client);
    // redrawPosition(payload.x, payload.y - 1, client);

    //-> then we redraw all names off the clients on the position 1 below the old position
    //console.log('REDRAW NICKNAMES OF CLIENTS ON TILE BELOW OLD TILE: ', old_position.x, old_position.y+1);

    redrawNickNamesOfPlayersOnPosition(old_position.x, old_position.y + 1, client);

    //-> then we redraw every player on the old position of the client
    //console.log('REDRAW ALL PLAYERS ON OLD POSITION ', old_position.x, old_position.y);

    redrawPlayers(old_position.x, old_position.y, client, payload.hashnick);

    //-> then we redraw all names off the players on the old position
    //console.log('REDRAW NICKNAMES OF CLIENTS ON OLD TILE: ', old_position.x, old_position.y);

    redrawNickNamesOfPlayersOnPosition(old_position.x, old_position.y, client, payload.hashnick);

    //-> then we redraw all players on 1 above the old positon off the player
    //console.log('REDRAW ALL PLAYERS ON POSITION 1 ABOVE OLD POSITION ', old_position.x, old_position.y - 1);

    redrawPlayers(old_position.x, old_position.y - 1, client, payload.hashnick);

    // -> we then do the exact same thing on the new position
    // redrawNickNamesOfPlayersOnPosition(payload.x, payload.y + 1, client);
    // redrawPlayers(payload.x, payload.y, client, payload.hashnick);
    // redrawNickNamesOfPlayersOnPosition(payload.x, payload.y, client, payload.hashnick);
    // redrawPlayers(payload.x, payload.y - 1, client, payload.hashnick);

    //-> now we can paint the moving user on its new position
    //-> and finnaly we draw the name off the moved client on its new position
    //console.log('DRAW CHARACTER AT NEW POSITION', payload.x, payload.y);

    // drawSkinInDirectionOnAbsolutePositionWithNick(old_position.x * imgW + XMOVE*STEP*i, old_position.y * imgH + YMOVE*STEP*i, skin, direction, payload.hashnick.split(':')[1], client);

    // await sleep(TIME/STEPS);
    // }

    drawSkinInDirectionOnPositionWithNick(payload.x, payload.y, skin, direction, payload.hashnick.split(':')[1], client);
    client.isMoving = false;

    // Draw flag for CTF game
    if (client.CTFGame !== undefined && client.CTFGame.running) {
        client.CTFGame.drawFlag();
    }

}

export function checkIfDied(client: ChatClient){
    return client.worldBinary[client.clientPositions.get(client.hash_nick)!.y][client.clientPositions.get(client.hash_nick)!.x] == 2;
}

// eslint-disable-next-line no-unused-vars
async function visualiseClient(payload: {hashnick: string, x: number, y: number, skin:string}, client: ChatClient){
    console.log(payload.hashnick + ' will be visualised');
    //visualise client
    while(client.worldBinary[payload.y][payload.x] == -1){
        await sleep(100); //wait for the tile to be visualised before visualising client
    }
    console.log('PRINTING CLIENT');

    let canvas:HTMLCanvasElement|null = document.getElementById('window') as HTMLCanvasElement;
    let ctx = canvas.getContext('2d');

    let imgW = canvas.width / 30; 
    let imgH = canvas.height / 20;
    
    var imageObj = new Image();
    let src: string;
    if (client.currWorld == 'OceanWorld'){
        src = '../../tiles/char/ocean/leftocean.png';
        client.skinDirection = 'leftocean'; 
    }
    else {
        src = `../../tiles/char/${payload.skin}/front.png`;
        client.skinDirection = 'front';
    }
    const localImg = getImage(src);
    if(localImg){
        imageObj.src = localImg;
    }else{
        imageObj.src = src;
    }

    imageObj.onload = function () {
        if(ctx){
            ctx.drawImage(imageObj, payload.x*imgW, payload.y*imgH, imgW, imgH);
            ctx.font = '19px Comic Sans MS';
            ctx.fillStyle = 'black';
            ctx.textAlign = 'center';
            let nick = getMaxNick(ctx, imgW, payload.hashnick.split(':')[1]);
            ctx.fillText(nick, payload.x*imgW + imgW/2, (payload.y*imgH) - imgH/2);
        }
    };
}

export function isHittable(tileName : string){
    return tileName.toLowerCase().includes('bear') || tileName.toLowerCase().includes('wall') || tileName.toLowerCase().includes('fence') || tileName.toLowerCase().includes('tree') || tileName.toLowerCase().includes('curve') || tileName.toLowerCase().includes('rock') || tileName.toLowerCase().includes('island')|| tileName.toLowerCase().includes('corner')|| tileName.toLowerCase().includes('blue');
}

function changeDirection(client: ChatClient, direction: string='front'){
    
    let old_position = {x: 0, y: 0};
    let position = client.clientPositions.get(client.hash_nick);
    if (direction == 'front') {
        old_position.x = position!.x;
        old_position.y = position!.y - 1;
    } else if (direction == 'back') {
        old_position.x = position!.x;
        old_position.y = position!.y + 1;
    } else if (direction == 'right') {
        old_position.x = position!.x - 1;
        old_position.y = position!.y;
    } else {
        old_position.x = position!.x + 1;
        old_position.y = position!.y;
    }

    let skin = client.skin;
    var imageObj = new Image();
    if (client.currWorld == 'OceanWorld') {
        skin = 'ocean';
        if (direction == 'front' || direction == 'back') {
            direction = 'leftocean';
        } else {direction = direction + 'ocean';}
    }
    
    const src = `../../tiles/char/${skin}/${direction}.png`;
    const localImg = getImage(src);
    if(localImg){
        imageObj.src = localImg;
    }else{
        imageObj.src = src;
    }

    client.skinDirection = direction;
    
    redrawPosition(old_position.x ,old_position.y, client);
    drawSkinInDirectionOnPositionWithNick(old_position.x, old_position.y, skin, direction, client.nick, client);
}

// redraw tile on given position
export function redrawPosition(x: number, y: number, client: ChatClient){
    let canvas:HTMLCanvasElement|null = document.getElementById('window') as HTMLCanvasElement;
    let ctx = canvas.getContext('2d');

    let imgW = canvas.width / 30; 
    let imgH = canvas.height / 20;

    //redraw tile
    let img:string|undefined = client.world[y][x];
    var oldImage = new Image();
    if(img.includes('coin')){
        if(client && client.coins.indexOf(client.currWorld!) >= 0){
            img = Tilemap.get(client.currWorld!)?.get('tile')!;
        }else{
            img = Tilemap.get(client.currWorld!)?.get(img)!;
        }
    }else{
        img = Tilemap.get(client.currWorld!)?.get(img)!;
    }
    const src = `../../tiles/${client.currWorld}/${img}`;
    const localImg = getImage(src);
    if(localImg){
        oldImage.src = localImg;
    }else{
        oldImage.src = `../../tiles/${client.currWorld}/${img}`;
    }
    oldImage.onload = function () {
        if(ctx){
            ctx.drawImage(oldImage, x*imgW, y*imgH, imgW, imgH);
        }
    };
}

// draws the given skin in the given direction on the given position with the given nick above it
export function drawSkinInDirectionOnPositionWithNick(x: number, y: number, skin: string, direction: string, nick: string, client:ChatClient){
    var imageObj = new Image();
    const src = `../../tiles/char/${skin}/${direction}.png`;
    const localImg = getImage(src);
    if(localImg){
        imageObj.src = localImg;
    }else{
        imageObj.src = src;
    }
    // imageObj.src = `../../tiles/char/${skin}/${direction}.png`
    client.skinDirection = direction;
    let canvas:HTMLCanvasElement|null = document.getElementById('window') as HTMLCanvasElement;
    let ctx = canvas.getContext('2d');      
    let imgW = canvas.width / 30; 
    let imgH = canvas.height / 20;
    imageObj.onload = function () {
        if(ctx){
            ctx.drawImage(imageObj, x*imgW, y*imgH, imgW, imgH);
            ctx.font = '19px Comic Sans MS';
            ctx.fillStyle = 'black';
            ctx.textAlign = 'center';
            nick = getMaxNick(ctx, imgW, nick);
            ctx.fillText(nick, x*imgW + imgW/2, (y*imgH) - imgH/2);
        }
    };
}

//draw client on absolute position
export function drawSkinInDirectionOnAbsolutePositionWithNick(x: number, y: number, skin: string, direction: string, nick: string, client:ChatClient){
    var imageObj = new Image();
    const src = `../../tiles/char/${skin}/${direction}.png`;
    const localImg = getImage(src);
    if(localImg){
        imageObj.src = localImg;
    }else{
        imageObj.src = src;
    }
    // imageObj.src = `../../tiles/char/${skin}/${direction}.png`;
    client.skinDirection = direction;
    let canvas:HTMLCanvasElement|null = document.getElementById('window') as HTMLCanvasElement;
    let ctx = canvas.getContext('2d');      
    let imgW = canvas.width / 30; 
    let imgH = canvas.height / 20;
    imageObj.onload = function () {
        if(ctx){
            ctx.drawImage(imageObj, x, y, imgW, imgH);
        }
    };
}

/**
 * 
 * @param x  the position that the client moved to
 * @param y 
 * @param client this client
 * @param nick the nick of the client that moved
 */
export function redrawPlayers(x: number, y: number, client:ChatClient, nick: string){
    //redraw players on given position
    for(let user of client.clientPositions.keys()){
        if(user != nick){
            let otheruser = client.clientPositions.get(user)!;
            if(otheruser.x == x && otheruser.y == y){
                let canvas:HTMLCanvasElement|null = document.getElementById('window') as HTMLCanvasElement;
                let ctx = canvas.getContext('2d');

                let imgW = canvas.width / 30; 
                let imgH = canvas.height / 20;
                var imageObj = new Image();
                let src :string;
                if (client.currWorld == 'OceanWorld'){ 
                    src = '../../tiles/char/ocean/leftocean.png';
                }
                else {
                    src = `../../tiles/char/${otheruser.skin}/${client.skinDirection}.png`;
                }
                const localImg = getImage(src);
                if(localImg){
                    imageObj.src = localImg;
                }else{
                    imageObj.src = src;
                }
                imageObj.onload = function () {
                    if(ctx){
                        ctx.drawImage(imageObj, x*imgW, y*imgH, imgW, imgH);
                    }
                };
            }
        }
    }
}

/**
 * 
 * @param x  the position of the clients
 * @param y 
 * @param client this client
 */
export function redrawNickNamesOfPlayersOnPosition(x: number, y: number, client:ChatClient, mover? : string){
    //we go only to the players on the given position
    for(let user of client.clientPositions.keys()){
        let otheruser = client.clientPositions.get(user)!;
        if(otheruser.x == x && otheruser.y == y){
            // we do not need to redraw the nick off the client that is moving out off the position
            if(mover && mover == user){
                return;
            }
            // only on the correct position
            let canvas:HTMLCanvasElement|null = document.getElementById('window') as HTMLCanvasElement;
            let ctx = canvas.getContext('2d');

            let imgW = canvas.width / 30; 
            let imgH = canvas.height / 20;

            if(ctx){
                ctx.font = '19px Comic Sans MS';
                ctx.fillStyle = 'black';
                ctx.textAlign = 'center';
                let nick = getMaxNick(ctx, imgW, user.split(':')[1]);
                // text is faster than tiles to paint, so we delay this by a small margin
                setTimeout(() => {
                    ctx!.fillText(nick, otheruser.x*imgW + imgW/2, (otheruser.y*imgH) - imgH/2);
                }, 50);
            }
        }
    }
}

// get the shortened version off the nick to fit in 1 tile
function getMaxNick(ctx: CanvasRenderingContext2D, maxWidht: number, nick: string) : string{
    ctx.font = '20px Comic Sans MS';
    let curwidth = ctx.measureText(nick).width;
    // we cut off the last letter until it fits into 1 tile
    while(curwidth > maxWidht){
        nick = nick.slice(0, -1);
        curwidth = ctx.measureText(nick).width;
    }

    return nick;
}

// basically visualise client, but with tile redrawing
export function showNewSkin(payload: {hashnick: string, x: number, y: number, skin:string}, client: ChatClient){

    redrawPosition(payload.x, payload.y, client);

    let canvas:HTMLCanvasElement|null = document.getElementById('window') as HTMLCanvasElement;
    let ctx = canvas.getContext('2d');
    
    let imgW = canvas.width / 30; 
    let imgH = canvas.height / 20;
    
    // draw client after tile was redrawn
    var imageObj = new Image();
    
    let src :string;
    if (client.currWorld == 'OceanWorld'){ 
        src = '../../tiles/char/ocean/leftocean.png';
        client.skinDirection = 'leftocean';
    }
    else {
        src = `../../tiles/char/${payload.skin}/front.png`;
        client.skinDirection = 'front';
    }
    const localImg = getImage(src);
    if(localImg){
        imageObj.src = localImg;
    }else{
        imageObj.src = src;
    }

    imageObj.onload = function () {
        if(ctx){
            ctx.drawImage(imageObj, payload.x*imgW, payload.y*imgH, imgW, imgH);
        }
    };
}

/**
 * show a "Enter password in prompt to enter world!" text on screen
 */
function showPasswordPrompt(){
    clearLobby();
    let canvas:HTMLCanvasElement|null = document.getElementById('window') as HTMLCanvasElement;
    let ctx = canvas.getContext('2d');
    if(ctx){
        ctx.font = '40px verdana';
    }
    ctx?.fillText('Enter password in prompt to enter world!', canvas.width/2, canvas.height/2);
}

let localStorage : Storage;

export function getImage(source : string){
    return localStorage.getItem(source);
}

// may only call method when image has been cropped propperly and has been loaded in
export function setImage(source: string, img : HTMLImageElement){
    var imgCanvas = document.createElement('canvas'),
        imgContext = imgCanvas.getContext('2d');

    // Make sure canvas is as big as the picture
    imgCanvas.width = img.width;
    imgCanvas.height = img.height;

    // Draw image into canvas element
    imgContext!.drawImage(img, 0, 0, img.width, img.height);

    // Get canvas contents as a data URL
    var imgAsDataURL = imgCanvas.toDataURL('image/png');

    // Save image into localStorage
    try {
        localStorage.setItem(source, imgAsDataURL);
    }
    catch (e) {
        console.log('Storage failed: ' + e);
    }
}

export function setupLocalStorage(){
    localStorage = window.localStorage;
    //localStorage.clear(); 
    // we want to get every tile in local storage before we load worlds so load speeds are extremely small
    // we loop through every world
    let canvas:HTMLCanvasElement|null = document.getElementById('window') as HTMLCanvasElement;
    const imgW = canvas.width / 30; 
    const imgH = canvas.height / 20;
    for (const world of Tilemap) {
        // every world has a tileset
        console.log(world[0]);
        const worldMap = Tilemap.get(world[0]);
        for (const tile of worldMap!) {
            // the src for each tile is as follows
            const src = `../../tiles/${world[0]}/${tile[1]}`;
            console.log(src);
            // we check if it already is in local storage
            const localImg = getImage(src); // try and get image from local storage
            if(!localImg){
                const imageObj = new Image();
                // the image was not in storage and needs te be saved into local storage
                imageObj.src = src;
                imageObj.width = imgW; // need to set attributes and load image before able to set into local storage
                imageObj.height = imgH;
                console.log('setting img into local storage');
                imageObj.onload = () => {
                    setImage(src, imageObj); // set image in local storage
                };
            }else{
                // the image was in local storage and need not be loaded again
                console.log('img was already in local storage');
            }
        }
    }
    // we also want every player char in local storage
    let direction = ['front', 'back', 'left', 'right'];
    for (let i = 0; i < getAllSKins().length; i++) {
        const skin = getAllSKins()[i];
        if(skin == 'ocean'){
            direction = ['downocean', 'leftocean', 'rightocean', 'upocean'];
        }else{
            direction = ['front', 'back', 'left', 'right'];
        }
        for (let j = 0; j < direction.length; j++) {
            const dir = direction[j];
            let src : string;
            src = `../../tiles/char/${skin}/${dir}.png`;
            console.log(src);
            // we check if it already is in local storage
            const localImg = getImage(src); // try and get image from local storage
            if(!localImg){
                const imageObj = new Image();
                // the image was not in storage and needs te be saved into local storage
                imageObj.src = src;
                imageObj.width = imgW; // need to set attributes and load image before able to set into local storage
                imageObj.height = imgH;
                console.log('setting img into local storage');
                imageObj.onload = () => {
                    setImage(src, imageObj); // set image in local storage
                };
            }else{
            // the image was in local storage and need not be loaded again
                console.log('img was already in local storage');
            }
        }
    }
    // we now set every setting image in local storage
    for (let i = 0; i < getAllSettings().length; i++) {
        const pic = getAllSettings()[i];
        let src : string;
        src = `./../settings/${pic}.png`;
        console.log(src);
        // we check if it already is in local storage
        const localImg = getImage(src); // try and get image from local storage
        if(!localImg){
            const imageObj = new Image();
            // the image was not in storage and needs te be saved into local storage
            imageObj.src = src;
            imageObj.width = 50; // need to set attributes and load image before able to set into local storage
            imageObj.height = 50;
            console.log('setting img into local storage');
            imageObj.onload = () => {
                setImage(src, imageObj); // set image in local storage
            };
        }else{
            // the image was in local storage and need not be loaded again
            console.log('img was already in local storage');
        }
    }
}

function getAllSKins(){
    return ['basic', 'fifth', 'firstReward', 'fourth', 'noReward', 'ocean', 'second', 'secondReward', 'third'];
}

function getAllSettings(){
    return ['achievement','achievementNotification','FAQ', 'logoutButton','sound_off','sound_on','speed_fast','speed_medium','speed_slow',
        'skins/basic', 'skins/fifth','skins/firstReward','skins/fourth','skins/noReward','skins/second','skins/secondReward','skins/third',
        'achievements/CaveWorld','achievements/DesertWorld','achievements/GrassWorld','achievements/HillsWorld','achievements/IceWorld',
        'achievements/LavaWorld','achievements/locked','achievements/OceanWorld','achievements/PsychedelicWorld'];
}



export {setLobby, clearLobby, showWorld, moveClient, visualiseClient, showPasswordPrompt, changeDirection};