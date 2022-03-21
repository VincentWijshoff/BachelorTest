/* eslint-disable no-undef */
import { ChatClient } from '../app';
import { returnToLobby } from '../world/client_handler';
import { getImage, redrawPlayers, redrawPosition, setLobby, sleep } from '../world/world';
import { setClickHandlers } from './browser_main';

export function initSettings(client : ChatClient){
    createFAQButtont();
    createSoundButton();
    createSpeedButton(client);
    createSkinButton(client);
    createAchievementButton();
    createLeaderboardButton(client);
    createLogoutButton(client);
    
}

function createLeaderboardButton(client: ChatClient){
    let leaderboardBtn = createButton('leaderboard');
    leaderboardBtn.addEventListener('click', () => {
        requestLeaderboard(client);
    });
    focusCanvas();
}

function requestLeaderboard(client: ChatClient){
    client.send('requestLeaderboard',{id: client.hash_nick, keys: ['']});
}

export function createLeaderboard(sortedTotalscore: any, scores: any, client: ChatClient){
    const tableBody = document.getElementById('dataScores');
    let rang = 1;
    let dataTable = '';
    
    for (let key of sortedTotalscore.keys()){
        // the key is a hashnick, we only want the nick on the leaderboard 
        let leaderboardnick = key;
        let indexOfNick = leaderboardnick.indexOf(':');
        if (indexOfNick != -1){
            leaderboardnick = leaderboardnick.slice((indexOfNick+1));
        }
        let values = scores.get(key);
        dataTable += '<tr><td>'+leaderboardnick+'</td>';
        for (let index of values){
            dataTable += '<td>'+index+'</td>';
        }
        dataTable += '<td>'+rang+'</td></tr>';
        rang += 1;
    }
    tableBody!.innerHTML = dataTable;
    
    showLeaderboard(client);
}

function showLeaderboard(client: ChatClient){
    const modal = document.getElementById('scores') as HTMLElement;
    modal.style.display = 'block';

    const closeBtn = document.getElementById('closeleaderboard') as HTMLElement;
    closeBtn.onclick = () => {
        client.scores.clear();
        modal.style.display='none';
        focusCanvas();
    };
}

function createFAQButtont(){
    let faqBtn = createButton('FAQ');
    faqBtn.addEventListener('click', () => {
        onFaqClick();
    });
    focusCanvas();
}

function onFaqClick(){
    const modal = document.getElementById('faq') as HTMLElement;
    modal.style.display = 'block';

    const closeBtn = document.getElementById('closefaq') as HTMLElement;
    closeBtn.onclick = () => {
        modal.style.display='none';
        focusCanvas();
    };
}


function createSoundButton(){
    let soundBtn = createButton('sound_on');
    const audio = document.getElementById('audio') as HTMLAudioElement;
    audio.volume = 0.1;
    soundBtn.addEventListener('click', () => {
        onSoundClick(soundBtn);
    });
}

function changeSrc(btn: HTMLInputElement, src: string){
    let localImg = getImage(src);
    if(!localImg){
        btn.src = src;
    }else{
        btn.src = localImg;
    }
}

function changeSrcImg(btn: HTMLImageElement, src: string){
    let localImg = getImage(src);
    if(!localImg){
        btn.src = src;
    }else{
        btn.src = localImg;
    }
}

function onSoundClick(btn : HTMLInputElement){
    const audio = document.getElementById('audio') as HTMLAudioElement;
    if(audio!.volume == 0){ //audio is already off -> set back on
        changeSrc(btn, './../settings/sound_on.png');
        audio!.volume = 0.1;
    }else{ //audio is on -> set off
        audio!.volume = 0;
        changeSrc(btn, './../settings/sound_off.png');
    }
    focusCanvas();
}

function createSpeedButton(client: ChatClient){
    let speedBtn = createButton('speed_slow');
    speedBtn.addEventListener('click', () => {
        onSpeedClick(client, speedBtn);
    });
}

function onSpeedClick(client: ChatClient, bikeBtn: HTMLInputElement){
    if(client.speed == 1){
        client.speed = 2;
        changeSrc(bikeBtn, './../settings/speed_medium.png');
    }else if(client.speed == 2){
        client.speed = 3;
        changeSrc(bikeBtn, './../settings/speed_fast.png');
    }else{
        client.speed = 1;
        changeSrc(bikeBtn, './../settings/speed_slow.png');
    }
    focusCanvas();
}

function createButton(imgName: string){
    let body = document.getElementById('settings');
    let btn = document.createElement('input');
    btn.className = 'sideButton';
    btn.id = imgName;
    btn.type = 'image';
    let src = `./../settings/${imgName}.png`;
    let localImg = getImage(src);
    if(!localImg){
        btn.src = src;
    }else{
        btn.src = localImg;
    }
    
    btn.width = 50;
    btn.height = 50; 
    body!.appendChild(btn);
    return btn;
}

function createSkinButton(client: ChatClient){
    let skinBtn = createButton('skins/basic');
    skinBtn.addEventListener('click', () => {
        onSkinClick(client, skinBtn);
    });
}

// eslint-disable-next-line no-unused-vars
let activeSkins = ['basic', 'second', 'fifth','third', 'fourth', 'noReward'];

// eslint-disable-next-line no-unused-vars
function onSkinClick(client: ChatClient, skinBtn: HTMLInputElement){
    let index = activeSkins.indexOf(client.skin);
    if(index == activeSkins.length - 1){
        index = -1;
    }
    // new indez of new skin
    index += 1;
    let newskin = activeSkins[index];
    client.skin = newskin;
    changeSrc(skinBtn, `./../settings/skins/${newskin}.png`);
    client.send('updateSkin', {id: client.hash_nick, skin: newskin});
    focusCanvas();
}

function createLogoutButton(client: ChatClient){
    let logoutBtn = createButton('logoutButton');
    logoutBtn.addEventListener('click', () => {
        onLogoutClick(client);
    });
}

function onLogoutClick(client: ChatClient){
    const audio = document.getElementById('audio') as HTMLAudioElement;
    let prevVolume = audio.volume;
    audio.volume = 0;
    hideHtml();    
    const modal = document.getElementById('logout') as HTMLElement;
    modal.style.display = 'block';

    document.getElementById('lobbyLink')?.addEventListener('click', () => {

        client.disconnect();
        emptyHtml(client);
        modal.style.display='none';
        var el = document.getElementById('body');
        var elClone = el?.cloneNode(true);
        el?.parentNode?.replaceChild(elClone!, el);
        setClickHandlers();
        document.getElementById('loginform')!.hidden = false;

    });

    document.getElementById('reconnect')?.addEventListener('click', () => {
        modal.style.display='none';
        document.getElementById('ioBox')!.hidden = false;
        document.getElementById('window')!.hidden = false;
        document.getElementById('settings')!.hidden = false;
        audio.volume = prevVolume;
        focusCanvas();
    });
}

export function hideHtml(){
    document.getElementById('ioBox')!.hidden = true;
    document.getElementById('window')!.hidden = true;
    document.getElementById('settings')!.hidden = true;
}

export function emptyHtml(client: ChatClient | undefined){
    document.getElementById('settings')!.hidden = false;
    document.getElementById('ioBox')?.remove();
    document.getElementById('window')?.remove();
    removeAllAchievements(client);
    let settings = document.getElementById('settings');
    while(settings!.firstChild){
        settings!.removeChild(settings!.firstChild);
    }
}

function createAchievementButton(){
    let btn = createButton('achievement');
    btn.id = 'achievementBTN';
    btn.addEventListener('click', () => {
        onAchievementClick();
    });
}

function onAchievementClick(){
    const modal = document.getElementById('coins') as HTMLElement;
    modal.style.display = 'block';
    setAchievementNotification(false);
    const closeBtn = document.getElementById('closeCoins') as HTMLElement;
    closeBtn.onclick = () => {
        modal.style.display='none';
        focusCanvas();
    };
}

function removeAllAchievements(client: ChatClient | undefined){
    if(!client){
        return;
    }
    const worlds = client.currentWorlds!;
    if(worlds){
        worlds.forEach(world => {
            let img = document.getElementById(world + 'coin') as HTMLImageElement;
            img.src = './../settings/achievements/locked.png';
        });
    }
    let rew = document.getElementById('firstCoinReward') as HTMLImageElement;
    changeSrcImg(rew, './../settings/achievements/locked.png');
    rew = document.getElementById('secondCoinReward') as HTMLImageElement;
    changeSrcImg(rew, './../settings/achievements/locked.png');
}

// checks if cleint already had achievement and adds if not
export function addAchievement(achievement : string, client : ChatClient){
    if(client.coins.indexOf(achievement) >= 0){
        return;
    }
    // set notification
    setAchievementNotification(true);
    // client got coin
    client.coins.push(achievement);
    // set source for image in rewards to coin image
    let img = document.getElementById(achievement + 'coin') as HTMLImageElement;
    changeSrcImg(img, './../settings/achievements/' + achievement + '.png');
    //check for rewards
    if(client.coins.length == 4){
        // halfway so first reward
        let rew = document.getElementById('firstCoinReward') as HTMLImageElement;
        changeSrcImg(rew, './../settings/skins/firstReward.png');
        activeSkins.push('firstReward');
    } else if (client.coins.length == 8){
        // complete so final reward
        let rew = document.getElementById('secondCoinReward') as HTMLImageElement;
        changeSrcImg(rew, './../settings/skins/secondReward.png');
        activeSkins.push('secondReward');
    }
}

//false = no notification, true = notification
function setAchievementNotification( how : boolean){
    let btn = document.getElementById('achievementBTN') as HTMLInputElement;
    if(how){
        changeSrc(btn, './../settings/achievementNotification.png');
    }else{
        changeSrc(btn, './../settings/achievement.png');
    }
}

export function checkCoin(x: number, y: number, client: ChatClient){
    if(client.worldBinary[y][x] == 4){
        addAchievement(client.currWorld!, client);
        client.worldBinary[y][x] = 0;
        if (client.currWorld == 'HillsWorld') {
            client.world[y][x] = 'tile2';
        }
        else {client.world[y][x] = 'tile';}
        redrawPosition(x, y, client);
        redrawPlayers(x, y, client, 'payload.hashnick');
    }
}

export function focusCanvas(){
    let canvas = document.getElementById('window');
    canvas?.focus();
}

export async function showDiedScreen(client : ChatClient, deathReason : string){
    if(client.inDeadScreen){
        return;
    }
    if(document.getElementById('ioBox'))
        document.getElementById('ioBox')!.hidden = true;
    let world = client.currWorld;   
    client.inDeadScreen = true;
    hideHtml();
    if(document.getElementById('writeBox'))
        document.getElementById('writeBox')!.hidden = true;

    returnToLobby(client);
    await sleep(100);
    hideHtml();
    if(document.getElementById('writeBox'))
        document.getElementById('writeBox')!.hidden = true;

    const modal = document.getElementById('died') as HTMLElement;
    modal.style.display = 'block';

    const reason = document.getElementById('deathReason') as HTMLElement;
    reason.innerText = deathReason;

    document.getElementById('ReturnTolobbyLink')?.addEventListener('click', async () => {
        modal.style.display='none';
        document.getElementById('ioBox')!.hidden = false;
        document.getElementById('window')!.hidden = false;
        document.getElementById('settings')!.hidden = false;
        if(document.getElementById('writeBox'))
            document.getElementById('writeBox')!.hidden = false;
        //redraw lobby (since sometimes there are tiles from the previous world drawn in it)
        client.inLobby = false;
        setLobby(client);
        client.inDeadScreen = false;
        await sleep(100);
        focusCanvas();
    });

    //Remove previous eventlisteners, since the client could have died in another world
    var el = document.getElementById('ReturnToWorldLink');
    var elClone = el?.cloneNode(true);
    el?.parentNode?.replaceChild(elClone!, el);

    document.getElementById('ReturnToWorldLink')?.addEventListener('click', async () => {
        //join the world back at spawn position
        client.inLobby = false;
        console.log('joining world in returntoworldlink= ' + client.currWorld);

        client.send('joinWorld', {world_name: world!, coordinates: {x: 14, y: 18, skin: client.skin}});
        modal.style.display='none';
        document.getElementById('ioBox')!.hidden = false;
        document.getElementById('window')!.hidden = false;
        document.getElementById('settings')!.hidden = false;
        if(document.getElementById('writeBox'))
            document.getElementById('writeBox')!.hidden = false;
        
        client.inDeadScreen = false;
        focusCanvas();
    });
}


