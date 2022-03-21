/* eslint-disable no-unused-vars */
/* eslint-disable no-undef */
/// <reference lib="dom" />

import { doKeyEvent, handleMessage, initializeInputBox, log } from './key_handler';
import * as handler from './key_handler';
import { ChatClient } from '../app/client';
import { SocketioSocketClientSide } from '../comm/impl/socketio/client';
import { generateKeyPair } from './security';
import { setHandlers } from './client_handler';
import { setPositionHandlers } from '../world/client_handler';
import { RockPaperScissors } from './games/rock-paper-scissors';
import { TicTacToe } from './games/TicTacToe';
import { initSettings } from './settings';
import { IMediaRecorder, MediaRecorder } from 'extendable-media-recorder';
import { setupLocalStorage, sleep } from '../world/world';
import { WhisperManager } from './WhisperManager';
import { CaptureTheFlag } from './games/CaptureTheFlag';


// const nickName = document.getElementById('nickname');

let client : ChatClient | undefined;



let pubKeyButton = document.getElementById('pub_key') as HTMLInputElement;
let privKeyButton = document.getElementById('priv_key') as HTMLInputElement;

const audio = document.getElementById('audio') as HTMLAudioElement;
audio!.volume = 0.1;

async function getClient(nick : string) {
    const {publicKey, privateKey} = await retreiveKeys();
    client = undefined;
    client = new ChatClient(new SocketioSocketClientSide('/'), nick, false, publicKey, privateKey);
    client.CTFGame = new CaptureTheFlag();
    setHandlers(client);
    setPositionHandlers(client);
    setEventListeners();
    initializeInputBox();

    initSettings(client!);

}

export function setKeyHandler(){
    let body = document.getElementById('body') as HTMLBodyElement;
    body.addEventListener('keydown', (key) => {
        handleMessage(key);
    });
}


function showLoadingScreen(){
    let canvas = document.getElementById('window') as HTMLCanvasElement;
    let ctx = canvas.getContext('2d');
    if(ctx){
        ctx.font = '40px verdana';
        ctx.textAlign = 'center';
    }
    ctx?.fillText('Loading lobby ...', canvas.width/2, canvas.height/2);
}

async function retreiveKeys(): Promise<{publicKey: string, privateKey: string}>{
    if(!pubKeyButton.value || !privKeyButton.value){
        return generateKeyPair();
    }
    let publicKey: string;
    let privateKey: string;

    let pubKey = pubKeyButton.files![0];
    publicKey = await readKey(pubKey);
    let privKey = privKeyButton.files![0];
    privateKey = await readKey(privKey);
    pubKeyButton.value = '';
    privKeyButton.value = '';


    return {publicKey: publicKey, privateKey: privateKey};
}

async function readKey(key: File): Promise<string>{
    const reader = new FileReader();
    reader.readAsText(key);
    let promise : Promise<string> = new Promise((resolve, reject) => {
        reader.onload = (() => {
            if (reader.result instanceof ArrayBuffer)
                resolve(reader.result.toString());
            else
                resolve(reader.result!);
        });
    });
    return promise;
}



export function setClickHandlers(){
    const pubButton: HTMLButtonElement | null = document.getElementById('pubbtn') as HTMLButtonElement;
    const privButton: HTMLButtonElement | null = document.getElementById('privbtn') as HTMLButtonElement;
    
    pubButton.addEventListener('click', () => {
        pubKeyButton!.click();
    
    });
    
    privButton.addEventListener('click', () => {
        privKeyButton!.click();
    });
    
    const loginButton:HTMLButtonElement | null = document.getElementById('loginbtn') as HTMLButtonElement;
    loginButton.addEventListener('click', () => {
        const val = (document.getElementById('nickname') as HTMLInputElement).value;
        if(val == ''){
            alert('please give a valid nickname');
        } else {
            const a = document.getElementById('loginform');
            document.getElementById('wrongKeys')!.hidden = true;
            a!.hidden = true;
            const grid = document.getElementById('mainGrid') as HTMLDivElement;
            let canvas:HTMLCanvasElement = document.createElement('canvas');
            canvas.id = 'window';
            canvas.tabIndex = 1;
            canvas.width = window.innerWidth - 85;
            canvas.height = window.innerHeight - 100;
            grid.appendChild(canvas);
            showLoadingScreen();
            setupLocalStorage();
            getClient(val);
            
            canvas.focus();
        }
    });
}

setClickHandlers();
let keyDown: boolean = false;

function setEventListeners() {
    (document.getElementById('mainGrid') as HTMLDivElement).addEventListener('keydown', (key) => {
        if(!keyDown){
            doKeyEvent(key, client!);
            keyDown = true;
        }
    
    });
    (document.getElementById('mainGrid') as HTMLDivElement).addEventListener('keyup', (key) => {
        keyDown = false;
    });
}


export function send(cmd : string, msg : string){
    if(cmd == 'set history'){
        const nhis = parseInt(msg, 10);
        if (nhis){
            handler.setOverflow(nhis);
            log('[SUCCES]: Set new history limit to: ' + nhis);
        } else{
            log('[FAILED]: Could not set new history limit with given parameter, need an integer');
        }
    }else if (cmd == 'message'){
        if (!client?.inLobby){
            client?.send('ChatMessage', {text: msg}, {to:'#' + client.currWorld, hash_nick: client.hash_nick});
        } else {
            log('[FAILED]: Please join a room before sending messages');
        }
    }
    else if (cmd == 'whisper') {
        if (!client!.whisperManager) {
            client!.whisperManager = new WhisperManager(client!);
        }
        client!.whisperManager.handleMessage(msg);   
    }
    else if(cmd == 'password'){
        client?.send('tryPassword', {password: msg, worldName: '#' + client.currWorld!}); //add # for channel name
    }else if(cmd == 'request admin'){
        console.log(client!.currentPrivateWorlds);
        if(!client!.currentPrivateWorlds?.includes(client?.currWorld!)){
            log('[SUCCESS]: You are now admin of this world!');
            //handler.removePasswordCommand();
            handler.deleteMessageBox(); //do this to make sure the "request admin" command will dissapear
            client?.send('setAdmin', {worldName: client.currWorld!, password: msg});
        }else{
            log('[FAILED]: There is already an admin of this world!');
        }
    }else if (cmd == 'play game') {
        if (msg == '1' || msg == 'rock-paper-scissors') {
            client!.game = new RockPaperScissors(client!);
        }
        else if (msg == '2' || msg == 'tic-tac-toe') {
            client!.game = new TicTacToe(client!);
        }
        else if (msg == '3' || msg == 'capture-the-flag') {
            if (client!.currWorld == 'PsychedelicWorld' || client!.currWorld == 'Lobby') {
                log('[FAILED]: This game is not available in ' + client!.currWorld);
            }
            else if (client!.CTFGame !== undefined && client!.CTFGame.running) {
                log('[FAILED]: A CTF game is already running!');
            }
            else {
                client!.send('CTFMsg', {type: 'requestGame', world: client!.currWorld!});
            }
        }
        else {
            log('[FAILED]: Please enter a valid game. Type help for suggestions.');
        }
    }
    else if (cmd == 'voice-message' && !recording){
        var constraints = { audio: true };
        navigator.mediaDevices.getUserMedia(constraints).then(function(mediaStream) {
            mediaRecorder = new MediaRecorder(mediaStream);
            chunks = [];
            recording = true;
            mediaRecorder.ondataavailable = function(e) {
                chunks.push(e.data);
            };

            // Start recording
            mediaRecorder.start();
            console.log('start recording');

            // Stop recording after 5 seconds and broadcast it to server
            setTimeout(function() {
                stopRecording();
            }, 5000);
        });
    } else if (cmd == 'voice-message'){
        stopRecording();
    }
}

async function stopRecording(){
    console.log('stop recording');
    mediaRecorder.stop();
    await sleep(500);
    let blob = new Blob(chunks, { 'type' : 'audio/ogg; codecs=opus' });
    recording = false;
    client!.send('audio', {blob : blob}, {hash_nick: client!.hash_nick, from: client!.nick, to: '#' + client!.currWorld});
}

let mediaRecorder : IMediaRecorder;
let recording = false;
let chunks : Blob[] = [];

export function playAudio(arrayBuffer : Blob){
    let blob = new Blob([arrayBuffer], { 'type' : 'audio/ogg; codecs=opus' });
    let audio = document.createElement('audio');
    audio.volume = 0.1;
    audio.src = window.URL.createObjectURL(blob);
    const music = document.getElementById('audio') as HTMLAudioElement;
    music!.volume = 0;
    audio.addEventListener('ended', () => {
        music!.volume = 0.1;
    });
    audio.play();
}