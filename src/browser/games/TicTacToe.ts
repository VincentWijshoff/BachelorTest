/* eslint-disable no-unused-vars */
/* eslint-disable no-undef */
/// <reference lib="dom" />

import { PassThrough } from 'node:stream';
import { ChatClient } from '../../app';
import { Msg } from '../../comm/proto3';


/**
 * Class with all the functionality for playing the tic-tac-toe game in a pop-up window
 */
export class TicTacToe {

    acceptingMsgs: boolean; // Is this client accepting messages related to TicTacToe?
    startModal: HTMLElement;
    gameModal: HTMLElement;
    client: ChatClient;
    myTurn: boolean; // Which client's turn is it? In dual player mode, the invited client gets the first move
    myChar: string; // X or O, in dual player mode, the inviting client gets 'X' while the invited client gets 'O'
    startInfo: HTMLElement; // info on the start screen
    opponentInfo: HTMLElement // opponent info displayed in game
    gameInfo: HTMLElement; // info displayed during the game
    emptyPositions: string[]; // the empty positions on the playing board
    board: Map<string, string>; // Map from positions to played character, e.g. '13' -> 'X'
    BUTTONS: HTMLElement[]; // a button for every position
    listPool: HTMLElement;
    inputHashnick: HTMLInputElement;
    startBtnA: HTMLElement;
    startBtnB: HTMLElement;
    gameBtn: HTMLElement;
    pool: string[]; // array with the hashnicks of other clients that are searching for opponents
    /**
     * States for a game against a client, see https://drive.google.com/file/d/1JKlkBQ85Zxa-OZyCJNbNZtjVM_QfGbvH/view?usp=sharing
     * Note: in a single player game, this state is irrelevant
     * (this.acceptingMsgs remains false, state is only relevant for handling messages for a dual player game)
     */
    state: 'Searching'|'Awaiting accept'|'Got invite'|'In game';
    awaitingAcceptFrom: string; // Hashnick of the client from which an accept message is expected
    opponent: string; // Hashnick of opponent in dual player game
    rematchWanted: boolean; // Pressed the button for a rematch?
    rematchInvite: boolean; // Got an invite for a rematch?

    static POSITIONS: string[] = ['11', '12', '13', '21', '22', '23', '31', '32', '33'];

    constructor(client: ChatClient) {
        this.client = client;
        this.gameModal = document.getElementById('TicTacToe') as HTMLElement;
        this.startModal = document.getElementById('TicTacToeStart') as HTMLElement;

        // There are 5 elements on the start screen that are manipulated
        this.startInfo = document.getElementById('TTTinfo') as HTMLElement;
        this.listPool = document.getElementById('listPool') as HTMLElement;
        this.inputHashnick = document.getElementById('inputHashnick') as HTMLInputElement;
        this.startBtnA = document.getElementById('TTTbtnA') as HTMLElement;
        this.startBtnB = document.getElementById('TTTbtnB') as HTMLElement;
        this.gameBtn = document.getElementById('TTTbtnInGame') as HTMLElement;
        
        this.opponentInfo = document.getElementById('TTTopponentInfo') as HTMLElement;
        this.gameInfo = document.getElementById('TTTgameInfo') as HTMLElement;

        this.acceptingMsgs = false;
        this.myTurn = false;
        this.myChar = 'X';
        this.emptyPositions = [...TicTacToe.POSITIONS];
        this.board = new Map();
        this.BUTTONS = [];
        this.pool = [];
        this.state = 'Searching';
        this.awaitingAcceptFrom = '';
        this.opponent = '';
        this.rematchWanted = false;
        this.rematchInvite = false;
        this.initGame();

        this.startBtnA.onclick = () => {
            this.proceedToGame();
            this.startSinglePlayer();
        };
        this.startBtnB.onclick = () => {
            this.acceptingMsgs = true;
            this.startSearchOpponent();
        };
    }

    /**
     * Make the pop-up visible and make sure the close buttons work as intended
     */
    initGame() {
        for (let i = 0; i < TicTacToe.POSITIONS.length; i = i+1) {
            const button = document.getElementById(TicTacToe.POSITIONS[i]) as HTMLElement;
            this.BUTTONS.push(button);
        }

        this.clearGame();

        this.startInfo.innerHTML = 'Choose your opponent!';
        this.inputHashnick.style.display = 'none';
        this.listPool.style.display = 'none';
        this.startBtnA.innerHTML = 'Play against computer';
        this.startBtnB.innerHTML = 'Engage another client';
        this.startBtnA.style.display = 'block';
        this.startBtnB.style.display = 'block';

        this.startModal.style.display = 'block';

        const closeStart = document.getElementById('closeTTTStart') as HTMLElement;
        closeStart.onclick = () => {
            this.startModal.style.display = 'none';
            this.acceptingMsgs = false;
            this.client.send('TicTacToeMsg', {type: 'leave', from: this.client.hash_nick});
        };
        const closeBtnGame = document.getElementById('closeTTT') as HTMLElement;
        closeBtnGame.onclick = () => {
            this.gameModal.style.display='none';
            this.acceptingMsgs = false;
            this.client.send('TicTacToeMsg', {type: 'exit', from: this.client.hash_nick, to: this.opponent});
        };
    }

    clearGame() {
        for (let i = 0; i < this.BUTTONS.length; i = i+1) {
            this.BUTTONS[i].innerHTML = '';
        }
        this.startInfo.innerHTML = '';
        this.gameInfo.innerHTML = '';
    }



    /**
     * Start the process of searching for another client to play against.
     * In this state (= 'Searching') the client can submit a hashnick in order
     * to send an invite to an available client.
     */
    startSearchOpponent() {
        this.state = 'Searching';
        this.startInfo.innerHTML = 'Invite a client or wait for an invite';

        this.pool = [];
        this.client.send('TicTacToeMsg', {type: 'join', from: this.client.hash_nick});

        this.inputHashnick.style.display = 'block';
        this.listPool.style.display = 'block';
        this.startBtnA.innerHTML = 'Send invite';
        this.startBtnB.style.display = 'none';

        this.startBtnA.onclick = () => {
            let input = this.inputHashnick.value; // Either hash:nick or hash
            if (!this.pool.includes(input)) {
                let invalidInput = true;
                for (let i = 0; i < this.pool.length; i = i+1) {
                    if (this.pool[i].split(':')[0] == input) {
                        input = this.pool[i];
                        invalidInput = false;
                    }
                }
                if (invalidInput) {
                    this.startInfo.innerHTML = 'Enter a valid hash:nick or hash (or wait for an invite)';
                    return;
                }
            }
            this.client.send('TicTacToeMsg', {type: 'invite',
                from: this.client.hash_nick, to: input});
            this.awaitingAcceptFrom = input;
            this.onInviteSent(input);
        };
    }

    /**
     * Update the html content representing the list of clients in the pool.
     * Note: this list is only displayed in the 'Searching' state.
     */
    updateListPool() {
        let content = 'Available clients:';
        for (let i=0; i < this.pool.length; i=i+1) {
            content = content + '<br>' + this.pool[i];
        }
        this.listPool.innerHTML = content;
    }

    /**
     * Transition to the 'Awaiting accept' state after an invite has been sent
     * @param recipient The hashnick of the client to which the invite was sent
     */
    onInviteSent(recipient: string) {
        this.state = 'Awaiting accept';
        this.startInfo.innerHTML = 'Awaiting accept';
        this.inputHashnick.style.display = 'none';
        this.listPool.style.display = 'none';

        this.startBtnA.innerHTML = 'Cancel';
        this.startBtnA.onclick = () => {
            this.client.send('TicTacToeMsg', {type: 'abort',
                from: this.client.hash_nick, to: recipient});
            this.startSearchOpponent();
        };
    }

    /**
     * Called upon receiving an invite from another client
     * @param sender The hash:nick of the sender
     */
    onInvite(sender: string) {
        this.state = 'Got invite';
        this.startInfo.innerHTML = 'Got invite from ' + sender;
        this.inputHashnick.style.display = 'none';
        this.listPool.style.display = 'none';
        this.startBtnB.style.display = 'block';
        this.startBtnA.innerHTML = 'Accept';
        this.startBtnB.innerHTML = 'Refuse';
        this.startBtnA.onclick = () => {
            this.client.send('TicTacToeMsg', {type: 'accept',
                from: this.client.hash_nick, to: sender});
            this.opponent = sender;
            this.myChar = 'O';
            this.myTurn = true;
            this.proceedToGame();
            this.startDualPlayer();
        };
        this.startBtnB.onclick = () => {
            this.client.send('TicTacToeMsg', {type: 'abort',
                from: this.client.hash_nick, to: sender});
            this.startSearchOpponent();
        };
    }

    /**
     * Add a given hashnick to this.pool and update the html element representing this pool
     */
    addToPool(hashnick: string) {
        if (!this.pool.includes(hashnick)) {
            this.pool.push(hashnick);
            this.updateListPool();
        }
    }

    /**
     * Remove the given hashnick from the this.pool and update the html element representing this pool
     */
    removeFromPool(hashnick: string) {
        this.pool = this.pool.filter((e: string) => {return e != hashnick;});
        this.updateListPool();
    }

    /**
     * General message handler for all TicTacToe-related messages
     */
    handleMessage(msg: Msg<'TicTacToeMsg'>) {
        if (this.state == 'In game') {
            if (this.opponent != msg.payload.from) return;
            if (msg.payload.type == 'move') {
                this.handleMove(msg.payload.pos!);
            }
            else if (msg.payload.type == 'rematch') {
                this.rematchInvite = true;
                if (this.rematchWanted) {
                    this.proceedToGame();
                    this.startDualPlayer();
                }
            }
            else if (msg.payload.type == 'exit') {
                this.handleExit();
            }
            return;
        }
        if (msg.payload.type == 'join') {
            if (msg.payload.from != this.client.hash_nick) this.addToPool(msg.payload.from);
        }
        else if (msg.payload.type == 'invite' && this.state == 'Searching') {
            this.onInvite(msg.payload.from);
        }
        else if (msg.payload.type == 'leave') {
            this.removeFromPool(msg.payload.from);
        }
        else if (msg.payload.type == 'accept') {
            if (this.state == 'Awaiting accept' && msg.payload.from == this.awaitingAcceptFrom) {
                this.opponent = this.awaitingAcceptFrom;
                this.proceedToGame();
                this.startDualPlayer();
            }
        }
        else if (msg.payload.type == 'abort') {
            if (this.state == 'Awaiting accept' || this.state == 'Got invite') this.startSearchOpponent();
        }
    }


    /**
     * Continue from the start screen to the game screen
     */
    proceedToGame() {
        this.state = 'In game';
        this.startModal.style.display = 'none';
        this.gameModal.style.display = 'block';
        this.gameBtn.style.display = 'none';
        this.board.clear();
        this.emptyPositions = [...TicTacToe.POSITIONS];
        for (let i = 0; i < this.BUTTONS.length; i = i+1) {
            this.BUTTONS[i].innerHTML = '';
        }
    }

    /**
     * Start a match between two clients
     */
    startDualPlayer() {
        this.opponentInfo.innerHTML = 'Your opponent is ' + this.opponent.split(':')[1];
        this.showGameInfo();
        this.rematchWanted = false;
        this.rematchInvite = false;
        
        // Assign actions to buttons
        for (let i = 0; i < this.BUTTONS.length; i = i+1) {
            const position = TicTacToe.POSITIONS[i];
            const button = this.BUTTONS[i];
            button.onclick = () => {
                if (this.myTurn && this.emptyPositions.includes(position)) {
                    this.occupyPosition(position, this.myChar);
                    button.innerHTML = this.myChar;
                    this.client.send('TicTacToeMsg', {type: 'move',
                        from: this.client.hash_nick, to: this.opponent, pos: position});
                    if (this.winningMove() || this.emptyPositions.length == 0) {
                        if(this.winningMove()){
                            this.client.updateScore('TTT', true);
                        }
                        this.endGame(false, this.winningMove() ? 'You' : 'Nobody');
                        return;
                    }
                    this.myTurn = false;
                    this.showGameInfo();
                }
            };
        }
    }

    
    /**
     * Show game info: display whose turn it is and which character the client is playing
     */
    showGameInfo() {
        if (this.myTurn) {
            // eslint-disable-next-line quotes
            this.gameInfo.innerHTML = "It's your turn<br>You're playing " + this.myChar;
        }
        else {
            // eslint-disable-next-line quotes
            this.gameInfo.innerHTML = "Waiting for your opponent's move ...";
        }
    }

    /**
     * Handle the event of the opponent sending a new move
     * @param pos A string representing the position of the move, e.g. '23'
     */
    handleMove(pos: string) {
        this.occupyPosition(pos, this.myChar == 'X' ? 'O' : 'X');
        const i = TicTacToe.POSITIONS.indexOf(pos);
        this.BUTTONS[i].innerHTML = this.myChar == 'X' ? 'O' : 'X';
        if (this.winningMove() || this.emptyPositions.length == 0) {
            if(this.winningMove()){
                this.client.updateScore('TTT', false);
            }
            this.endGame(false, this.winningMove() ? 'Your opponent' : 'Nobody');
            return;
        }
        this.myTurn = true;
        this.showGameInfo();
    }

    handleExit() {
        this.opponentInfo.innerHTML = 'OPPONENT LEFT THE GAME<br>Your opponent was ' + this.opponent.split(':')[1];
        this.gameInfo.innerHTML = 'Click the button to start playing against the computer instead';
        this.gameBtn.style.display = 'block';
        this.myTurn = false;
        this.gameBtn.onclick = () => {
            this.opponentInfo.innerHTML = '';
            this.proceedToGame();
            this.startSinglePlayer();
        };
    }

    /**
     * Initiate a game against the computer
     */
    startSinglePlayer() {
        // eslint-disable-next-line quotes
        this.gameInfo.innerHTML = "It's your turn<br>You're playing " + this.myChar;
        // Assign actions to buttons
        for (let i = 0; i < this.BUTTONS.length; i = i+1) {
            const position = TicTacToe.POSITIONS[i];
            const button = this.BUTTONS[i];
            button.onclick = () => {
                if (this.myTurn && this.emptyPositions.includes(position)) {
                    this.occupyPosition(position, this.myChar);
                    button.innerHTML = this.myChar;
                    if (this.winningMove() || this.emptyPositions.length == 0) {
                        this.endGame(true, this.winningMove() ? 'You' : 'Nobody');
                        return;
                    }
                    this.myTurn = false;
                    this.gameInfo.innerHTML = 'Waiting for computer move ...';
                    setTimeout(() => this.computerMove(), 1000);
                }
            };
        }
        this.myTurn = true;
    }

    computerMove() {
        if (this.emptyPositions.length == 0) return;
        const char = this.myChar == 'X' ? 'O' : 'X';
        const move = this.determineComputerMove(char);
        this.occupyPosition(move, char);
        const button = document.getElementById(move) as HTMLElement;
        button.innerHTML = char;

        if (this.winningMove()) {
            this.endGame(true, 'The computer');
            return;
        }
        this.myTurn = true;
        // eslint-disable-next-line quotes
        this.gameInfo.innerHTML = "It's your turn<br>You're playing " + this.myChar;
    }

    /**
     * End a single player game
     * @param isSinglePlayer Boolean reflecting whether the game is single player
     * @param winner String containing the winner
     */
    endGame(isSinglePlayer: boolean, winner: string) {
        this.gameInfo.innerHTML = winner + ' won!';
        this.gameBtn.style.display = 'block';
        for (let i = 0; i < this.BUTTONS.length; i = i+1) {
            // Disable buttons
            this.BUTTONS[i].onclick = () => {return;};
        }
        this.gameBtn.onclick = () => {
            if (isSinglePlayer) {
                this.proceedToGame();
                this.startSinglePlayer();
            }
            else {
                this.rematchWanted = true;
                // eslint-disable-next-line quotes
                this.gameInfo.innerHTML = "Waiting for your opponent to click 'Play again' ...";
                this.client.send('TicTacToeMsg', {type: 'rematch',
                    from: this.client.hash_nick, to: this.opponent});
                if (this.rematchInvite) {
                    this.proceedToGame();
                    this.startDualPlayer();
                }
            }
        };
    }

    /**
     * Return a rather intelligent move. Principles:
     *  1) If a winning move is possible, make it
     *  2) If a move can be made that blocks the opponent from winning in his next turn,
     *     then block this move
     *  3) If none of the above leads to a move, then make a random move
     */
    determineComputerMove(char: string): string {
        for (let i = 0; i < this.emptyPositions.length; i = i+1) {
            this.board.set(this.emptyPositions[i], char);
            const win = this.winningMove();
            this.board.delete(this.emptyPositions[i]);
            if (win) return this.emptyPositions[i];
        }
        const opponentChar = char == 'X' ? 'O' : 'X';
        for (let i = 0; i < this.emptyPositions.length; i = i+1) {
            this.board.set(this.emptyPositions[i], opponentChar);
            const win = this.winningMove();
            this.board.delete(this.emptyPositions[i]);
            if (win) return this.emptyPositions[i];
        }
        return this.getRandomMove();
    }

    /**
     * Get a random valid move
     * @returns A string indicating the position, e.g. '12'
     */
    getRandomMove(): string {
        const arr = this.emptyPositions;
        const len = arr.length;
        return arr[Math.floor(Math.random() * len)];
    }

    /**
     * Set the given character on the playing board (represented as a Map this.board).
     * Remove a given position from the array with empty positions.
     */
    occupyPosition(pos: string, char: string) {
        this.board.set(pos, char);
        this.emptyPositions = this.emptyPositions.filter((e: string) => {return e != pos;});
    }

    /**
     * Determine whether the board contains a winning combination
     */
    winningMove(): boolean {
        for (let i = 0; i < 3; i = i+1) {
            // Horizontal win on row i?
            if (this.board.get(TicTacToe.POSITIONS[3*i]) == this.board.get(TicTacToe.POSITIONS[3*i + 1])
                && this.board.get(TicTacToe.POSITIONS[3*i]) == this.board.get(TicTacToe.POSITIONS[3*i + 2])
                && this.board.get(TicTacToe.POSITIONS[3*i]) !== undefined) {
                return true;
            }
            // Vertical win in column i?
            if (this.board.get(TicTacToe.POSITIONS[i]) == this.board.get(TicTacToe.POSITIONS[i + 3])
                && this.board.get(TicTacToe.POSITIONS[i]) == this.board.get(TicTacToe.POSITIONS[i + 6])
                && this.board.get(TicTacToe.POSITIONS[i]) !== undefined){
                return true;
            }
        }
        return this.diagonalWin(true) || this.diagonalWin(false);
    }

    /**
     * Determine if the board contains a diagonal win matching the given direction.
     * @param direction Boolean reflecting whether the direction is / (as opposed to \\)
     */
    diagonalWin(direction: boolean): boolean {
        const start = direction ? 2 : 0;
        const step =  direction ? 2 : 4;
        return (this.board.get(TicTacToe.POSITIONS[start]) == this.board.get(TicTacToe.POSITIONS[start + step])
            && this.board.get(TicTacToe.POSITIONS[start]) == this.board.get(TicTacToe.POSITIONS[start + 2*step])
            && this.board.get(TicTacToe.POSITIONS[start]) !== undefined);
    }

}