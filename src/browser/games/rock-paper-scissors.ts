/* eslint-disable no-unused-vars */
/* eslint-disable no-undef */
/// <reference lib="dom" />

import { ChatClient } from '../../app';


const TIMEOUT = 1500;
const WIDTH1 = 250;
const WIDTH2 = 150;

/**
 * Class with all the functionality for playing the rock-paper-scissors game in a pop-up window
 */
export class RockPaperScissors {
    
    running: boolean;
    allowedToChoose: boolean; // Is the client allowed to change his choice?
    replayButton: HTMLElement;
    client: ChatClient;

    constructor(client: ChatClient) {
        this.running = true;
        this.allowedToChoose = false;
        this.replayButton = document.getElementById('RPS_Play_again') as HTMLElement;
        this.initGame();
        this.startGame();
        this.client = client;
    }

    /**
     * Game initialization: display modal and initialize 'onclick' methods of buttons
     */
    initGame() {
        const modal = document.getElementById('rock-paper-scissors') as HTMLElement;
        this.replayButton.style.display = 'none';
        modal.style.display = 'block';

        const closeBtn = document.getElementById('closeRPS') as HTMLElement;
        closeBtn.onclick = () => {
            modal.style.display='none';
            this.running = false;
        };

        this.clearImages();

        const buttons = ['rock', 'paper', 'scissors'];
        for (let i = 0; i < buttons.length; i++) {
            this.assignAction(buttons[i]);
        }
    }

    /**
     * Assign the appropriate action to the given button (change image in html)
     */
    assignAction(button: string) {
        const rightImg = document.getElementById('rightImg') as HTMLImageElement;
        const buttonElement = document.getElementById(button) as HTMLElement;
        buttonElement.onclick = () => {
            if (this.allowedToChoose) {
                rightImg.src = './games/rock-paper-scissors/' + button + '.png';
                rightImg.width = WIDTH2;
            }
        };
    }

    /**
     * Main event loop
     */
    async startGame() {
        this.showInfo('Make your choice<br>using the buttons!');
        await sleep(TIMEOUT);
        if (!this.running) return;
        let i = 1;
        let wins = 0;
        while (i < 4) {
            let result: Promise<string>|string = await this.newRound(i);
            result = result.toString();
            if (result == 'game_was_interrupted') return;
            if (result == 'exAequo') {
                i = i - 1;
                this.showInfo('Ex aequo!<br>Win rate: ' + wins.toString() + '/' + i.toString());
            }
            else {
                let infoMsg;
                if (result == 'win') {
                    infoMsg = this.pickRandom(['Success!', 'Congrats!', 'Good job!']);
                    wins = wins + 1;
                }
                else {
                    infoMsg = this.pickRandom(['Bad luck ...', 'Oh no!', 'Try again ...']);
                }
                if (i == 3) {
                    break;
                }
                infoMsg = infoMsg + '<br>Win rate: ' + wins.toString() + '/' + i.toString();
                this.showInfo(infoMsg);
            }
            i = i + 1;
            await sleep(2*TIMEOUT);
            if (!this.running) return;
        }
        this.onEndGame(wins);
    }

    showInfo(s: string) {
        const info = document.getElementById('RPSinfo') as HTMLElement;
        info.innerHTML = s;
    }

    /**
     * Upon ending a game: display score and 'Play again' button
     * @param wins The number of wins (out of 3 rounds)
     */
    onEndGame(wins: number) {
        if (wins > 1) {
            this.client.updateScore('RPS', true);
            this.showInfo('You won!<br>Score: ' + wins.toString() + '/3');
        }
        else {
            this.client.updateScore('RPS', false);
            this.showInfo('You lost!<br>Score: ' + wins.toString() + '/3');
        }
        this.replayButton.style.display = 'block';
        this.replayButton.onclick = () => {
            this.clearImages();
            this.replayButton.style.display = 'none';
            this.startGame();
        };
    }

    /**
     * Execute a new round
     * 
     * @param i The round number
     * @returns A string representing the result of this round
     */
    async newRound(i: number): Promise<string> {
        this.allowedToChoose = true;
        this.clearImages();

        this.showInfo('Starting<br>round ' + i.toString() + '/3');
        await sleep(TIMEOUT);
        if (!this.running) return 'game_was_interrupted';

        for (let j = 3; j > 0; j = j-1) {
            this.showInfo('Round ends in<br>' + j.toString());
            await sleep(TIMEOUT);
            if (!this.running) return 'game_was_interrupted';
        }
        this.allowedToChoose = false;

        const leftImg = document.getElementById('leftImg') as HTMLImageElement;
        const rightImg = document.getElementById('rightImg') as HTMLImageElement;
        const my_move = this.makeRandomChoice();
        leftImg.src = './games/rock-paper-scissors/' + my_move + '.png';
        leftImg.width = WIDTH2;

        const len = rightImg.src.length;
        const client_move = rightImg.src.charAt(len-5);
        
        return this.determineResult(my_move, client_move);
    }

    clearImages() {
        const leftImg = document.getElementById('leftImg') as HTMLImageElement;
        const rightImg = document.getElementById('rightImg') as HTMLImageElement;
        leftImg.src = './games/rock-paper-scissors/cloud.jpg';
        leftImg.width = WIDTH1;
        rightImg.src = './games/rock-paper-scissors/cloud.jpg';
        rightImg.width = WIDTH1;
    }

    /**
     * Pick a random action
     */
    makeRandomChoice() {
        const choices = ['rock', 'paper', 'scissors'];
        return this.pickRandom(choices);
    }

    pickRandom(a: Array<string>): string {
        const len = a.length;
        return a[Math.floor(Math.random() * len)];
    }

    /**
     * Return a string reflecting whether or not the client has won.
     * If the client has not yet chosen his action, he automatically loses.
     * Options: win, lose, exAequo
     */
    determineResult(my_move: string, client_move: string): string {
        if (client_move == 'd') {
            return 'lose';
        }
        my_move = my_move.charAt(my_move.length-1);
        if (client_move == my_move) {
            return 'exAequo';
        }
        if (['rk', 'ks', 'sr'].includes(client_move + my_move)) {
            return 'win';
        }
        return 'lose';
    }

}

async function sleep(duration: number) {
    return new Promise(resolve => setTimeout(resolve, duration));
}