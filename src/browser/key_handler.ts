import { ChatClient } from '../app';
import { moveDown, moveLeft, moveRight, moveUp } from '../world/client_handler';
/* eslint-disable no-undef */
/// <reference lib="dom" />

import { send } from './browser_main';

//NOTE: when the command is too long, the typing box will jump to a new line, need to make sure this does not happen to keap things clean
let activeCommands = ['message', 'whisper', 'set history', 'play game', 'voice-message'];
let helpCommands = {
    'message' : 'When sending a message, everyone on the server will receive this message',
    'whisper' : 'Send a message to nearby clients. Additional options:<br> - /show Show recipients of whisper<br> - /range Configure range (the grid is 20x30)<br> - /ostracize Exclude a client with a given hash or nick<br> - /reset Reset to default settings',
    'set history' : 'This lets you set the history of the messages, thus how many messages max will be shown in the message box',
    'play game' : 'Play a game by entering the name or a number. Options:<br>* 1/rock-paper-scissors<br>* 2/tic-tac-toe<br>* 3/capture-the-flag',
    'voice-message' : 'Send a voice message; pres enter once to start recording, pres enter again to stop, default stop after 5 seconds'
};
type helpKey = keyof typeof helpCommands;
let startCommand = 'message';
let msgHistory = ['Welcome to our server!'];
let OVERFLOW = 30;
let lastMessage = '';

export function addRequestAdminCommand(){
    if(!activeCommands.includes('request admin')){
        activeCommands.unshift('request admin');
    }

}

export function removeRequestAdminCommand(){
    if(activeCommands.includes('request admin')){
        let index = activeCommands.indexOf('request admin');
        activeCommands.splice(index, 1);
    }
    
}

export function addPasswordCommand(){
    if(!activeCommands.includes('password')){
        activeCommands.unshift('password');
        startCommand = 'password';
    }

}

export function removePasswordCommand(){
    if(activeCommands.includes('password')){
        let index = activeCommands.indexOf('password');
        activeCommands.splice(index, 1);
        startCommand = 'message';
    }

}

export function log( words: string):void {
    
    while (msgHistory.length > OVERFLOW) {
        msgHistory.shift();
    }
    msgHistory.push(words);
    let msgbox = document.getElementById('messages-box') as HTMLDivElement;
    lastMessage = words;
    setTimeout(() => {
        if(lastMessage == msgHistory[msgHistory.length-1]){
            console.log('closing due timeout');
            deleteMessageBox();
        }
    }, 2000);
    if (!msgbox){
        startMessageBox();
    }
    if(msgbox){
        updateMessages(msgbox);
    }
}

export function setOverflow(num:number){
    OVERFLOW = num;
    while (msgHistory.length > OVERFLOW) {
        msgHistory.shift();
    }
}

function updateMessages(container:HTMLDivElement){
    while (container.firstChild) {
        container.removeChild(container.firstChild);
    }
    for (let i = msgHistory.length - 1; i > -1; i--) {
        let msg = msgHistory[i];
        let obj = document.createElement('div');
        obj.innerHTML = msg;
        obj.className = 'message';
        container.appendChild(obj);
    }
}

function sleep(time:number){
    return new Promise((resolve) =>{
        setTimeout(() => {
            resolve('');
        }, time);
    });
}


export async function doKeyEvent(key:KeyboardEvent, client: ChatClient){
    if(key.key === 't'){
        startMessageBox();
    }else if(key.key === 'ArrowUp'){
        if(client!.currWorld == 'IceWorld'){
            if(client.isMovingIce){
                return;
            }
            client.isMovingIce = true;
            while(client.isMovingIce){
                await sleep(200);
                moveUp(client);
            }
        }else{
            if(client.isMoving){
                return;
            }
            for(let i = 0; i<client.speed; i++){
                moveUp(client);
                await sleep(100);
            }
        }    
    }else if(key.key === 'ArrowDown'){
        if(client!.currWorld == 'IceWorld'){
            if(client.isMovingIce){
                return;
            }
            client.isMovingIce = true;
            while(client.isMovingIce){
                await sleep(200);
                moveDown(client);
            }
        }else{
            if(client.isMoving){
                return;
            }
            for(let i = 0; i<client.speed; i++){
                moveDown(client);
                await sleep(100);
            }
        }
    }else if(key.key === 'ArrowLeft'){
        if(client!.currWorld == 'IceWorld'){
            if(client.isMovingIce){
                return;
            }
            client.isMovingIce = true;
            while(client.isMovingIce){
                await sleep(200);
                moveLeft(client);
            }
        }else{
            if(client.isMoving){
                return;
            }
            for(let i = 0; i<client.speed; i++){
                moveLeft(client);
                await sleep(100);
            }
        }
    }else if(key.key === 'ArrowRight'){
        if(client!.currWorld == 'IceWorld'){
            if(client.isMovingIce){
                return;
            }
            client.isMovingIce = true;
            while(client.isMovingIce){
                await sleep(200);
                moveRight(client);
            }
        }else{
            if(client.isMoving){
                return;
            }
            for(let i = 0; i<client.speed; i++){
                moveRight(client);
                await sleep(100);
            }
        }
    }
}

export function updateInputBox(){
    let inputbox = document.getElementById('ioBox') as HTMLDivElement;
    if(!inputbox){
        return;
    }
    let inpbox = document.getElementById('messageBox') as HTMLInputElement;
    const typedText = inpbox.value;
    
    let body = document.getElementById('body') as HTMLBodyElement;
    body.removeChild(inputbox);
    initializeInputBox(typedText);
}


/**
 * initializes the input box
 */
export function initializeInputBox(text? : string|null){
    let body = document.getElementById('body') as HTMLBodyElement;
    let container = document.createElement('div');
    let inputbox = document.createElement('input');
    let cmdcontainer = document.createElement('div');
    let cmdButton = document.createElement('button');
    let cmdbox = document.createElement('div');

    let cmds = [];

    inputbox.type = 'text';
    
    inputbox.placeholder = 'type your input (esc to exit)'; 
    inputbox.id = 'messageBox';
    inputbox.tabIndex = 1;
    inputbox.style.width = '80%';
    cmdcontainer.className = 'dropdown';
    cmdbox.id = 'cmdBox';
    cmdbox.className = 'dropdown-content';
    cmdButton.id = 'cmdButton';
    cmdButton.className = 'dropbtn';
    cmdButton.textContent = startCommand + ': ';
    container.id = 'ioBox';
    container.className = 'overlay';

    for (let i = 0; i < activeCommands.length; i++){
        let elem = document.createElement('a');
        elem.href = '#';
        elem.id = activeCommands[i];
        elem.textContent = activeCommands[i];
        cmds.push(elem);
        elem.onclick = () => {
            (document.getElementById('cmdButton') as HTMLButtonElement).textContent = activeCommands[i] + ': ';
        };
    }

    body.appendChild(container);
    container.appendChild(cmdcontainer);
    cmdcontainer.appendChild(cmdButton);
    cmdcontainer.appendChild(cmdbox);
    for(let i = 0; i < cmds.length; i++){
        cmdbox.appendChild(cmds[i]);
    }
    container.appendChild(inputbox);

    if(text && text!=null){
        inputbox.value = text;
    }
    
    cmdButton.onclick = toggleCommand;
    setTimeout(() => {
        inputbox.value = '';
        if(text && text!=null){
            inputbox.value = text;
        }
    }, 200);
}

/**
 * should be called when t was pressed so the textbox appears
 */
function startMessageBox(){
    let body = document.getElementById('body') as HTMLBodyElement;

    if(document.getElementById('writeBox')){ //return if inputbox is already showing
        return;
    }

    let container = document.createElement('div');
    let messages = document.createElement('div');

    container.id = 'writeBox';
    container.className = 'overlay';
    
    messages.id = 'messages-box';
    messages.className = 'messages-box';

    body.appendChild(container);  
    container.appendChild(messages);
    updateMessages(messages);   
}

/* When the user clicks on the button, 
toggle between hiding and showing the dropdown content */
function toggleCommand() {
    (document.getElementById('cmdBox') as HTMLDivElement).classList.toggle('show');
}
  
// Close the dropdown if the user clicks outside of it
window.onclick = function(event:any) {
    if (!event.target.matches('.dropbtn')) {
        var dropdowns = document.getElementsByClassName('dropdown-content');
        var i;
        for (i = 0; i < dropdowns.length; i++) {
            var openDropdown = dropdowns[i];
            if (openDropdown.classList.contains('show')) {
                openDropdown.classList.remove('show');
            }
        }
    }
};

/**
 * delete messagebox
 */
export function deleteMessageBox(){
    if(!document.getElementById('writeBox')){
        return;
    }
    let body = document.getElementById('body');
    body?.removeChild(document.getElementById('writeBox') as HTMLDivElement);
    (document.getElementById('window') as HTMLCanvasElement).focus();
}

export function handleMessage(key:KeyboardEvent){
    if(key.key === 'Enter'){
        //now the message should be sent to the server and the textbox should be removed
        const msg = (document.getElementById('messageBox') as HTMLInputElement).value;
        (document.getElementById('messageBox') as HTMLInputElement).value = '';
        const cmd = (document.getElementById('cmdButton') as HTMLButtonElement).textContent;
        const cmd1 = cmd!.substring(0, cmd!.length - 2);
        if (msg.toLowerCase() == 'help'){
            const cmd2 = cmd1 as helpKey;
            log('[HELP '+ cmd1 + ']: ' + helpCommands[cmd2]);
        }else{
            console.log('sending : ' + msg);
            send(cmd1!, msg);
        }
    } else if (key.key === 'Escape'){
        //console.log('did not send message');
        deleteMessageBox();
        let canvas = document.getElementById('window');
        canvas!.focus();
    }
}

export {startMessageBox as startInputBox};