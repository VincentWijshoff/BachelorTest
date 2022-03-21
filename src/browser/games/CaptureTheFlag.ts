/* eslint-disable no-unused-vars */
/* eslint-disable no-undef */
/// <reference lib="dom" />

import { Msg } from '../../comm/proto3';
import { log } from '../key_handler';


/**
 * Class containing all client-side CTF-related functionality
 */
export class CaptureTheFlag {
    
    /**
     * Boolean representing if the game is active. Set to false:
     * - Upon switching to a different room
     * - If the game ends
     */
    running: boolean;
    flag_pos: {row: number, column: number};

    constructor() {
        this.running = false;
        this.flag_pos = {row: 0, column: 0};
    }


    handleMessage(msg: Msg<'CTFMsg'>) {
        if (msg.payload.type == 'info') {
            log(msg.payload.text!);
        }
        else if (msg.payload.type == 'newRound') {
            this.handleNewRound(msg);
        }
        else if (msg.payload.type == 'stopGame') {
            this.running = false;
        }
    }


    handleNewRound(msg: Msg<'CTFMsg'>) {
        this.flag_pos = msg.payload.pos!;
        this.drawFlag();
    }
    

    drawFlag() {
        let canvas: HTMLCanvasElement = document.getElementById('window') as HTMLCanvasElement;
        let ctx = canvas.getContext('2d');

        let imgW = canvas.width / 30; 
        let imgH = canvas.height / 20;

        const row = this.flag_pos.row;
        const column = this.flag_pos.column;

        var imageObj = new Image();
        imageObj.src = '../../../tiles/flag.png';
        imageObj.onload = function () {
            if(ctx){
                ctx.drawImage(imageObj, column*imgW, row*imgH, imgW, imgH);
            }
        };
    }
}