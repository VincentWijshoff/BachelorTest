/* eslint-disable no-unused-vars */
// Original JavaScript code by Chirp Internet: chirpinternet.eu
// Please acknowledge use of this code by including this header.

export class MazeBuilder {

    width : number;
    height : number;
    cols : number;
    rows : number;
    maze : number[][]; // 0 = path, 1 = wall, 2 = lobby teleport, 3 = left teleport, 4 = right teleport
    totalSteps: number = -1;

    constructor(width : number, height : number) {
  
        this.width = (width - 1) / 2;
        this.height = (height - 1) / 2;
  
        this.cols = width;
        this.rows = height;
  
        this.maze = this.initArray(0);
  
        // place initial walls
        this.maze.forEach((row, r) => {
            row.forEach((cell, c) => {
                switch(r)
                {
                case 0:
                case this.rows - 1:
                    this.maze[r][c] = 1;
                    break;
  
                default:
                    if((r % 2) == 1) {
                        if((c == 0) || (c == this.cols - 1)) {
                            this.maze[r][c] = 1;
                        }
                    } else if(c % 2 == 0) {
                        this.maze[r][c] = 1;
                    }
  
                }
                if(r == this.rows - 1 && c == (this.cols / 2) - 1) {
                    // place portal in middle off lowest row
                    this.maze[r][c] = 2;
                }
                if(r == this.rows - 2 && c == (this.cols / 2) - 1) {
                    // empty spawn position
                    this.maze[r][c] = 0;
                }
                if(c == this.cols - 1 && r == (this.rows / 2) - 1) {
                    // place portal on right middle
                    this.maze[r][c] = 4;
                }
                if(c == this.cols - 2 && r == (this.rows / 2) - 1) {
                    // empty place in front of portal
                    this.maze[r][c] = 0;
                }
                if(r == (this.rows / 2) - 1 && c == 0) {
                    // place portal on left middle
                    this.maze[r][c] = 3;
                }
                if(c == 1 && r == (this.rows / 2) - 1) {
                    // empty place in front of portal
                    this.maze[r][c] = 0;
                }
            });
  
        });
  
        // start partitioning
        this.partition(1, this.height - 1, 1, this.width - 1);

    }
  
    initArray(value : number) {
        return new Array(this.rows).fill(0).map(() => new Array(this.cols).fill(value));
    }
  
    rand(min : number, max : number) {
        return min + Math.floor(Math.random() * (1 + max - min));
    }
  
    posToSpace(x : number) {
        return 2 * (x-1) + 1;
    }
  
    posToWall(x : number) {
        return 2 * x;
    }
  
    inBounds(r : number, c : number) {
        if((typeof this.maze[r] == 'undefined') || (typeof this.maze[r][c] == 'undefined')) {
            return false; // out of bounds
        }
        return true;
    }
  
    shuffle(array : boolean[]) {
        // sauce: https://stackoverflow.com/a/12646864
        for(let i = array.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [array[i], array[j]] = [array[j], array[i]];
        }
        return array;
    }
  
    partition(r1 : number, r2 : number, c1 : number, c2 : number) {
        // create partition walls
        // ref: https://en.wikipedia.org/wiki/Maze_generation_algorithm#Recursive_division_method
  
        let horiz, vert, x, y, start, end;
  
        if((r2 < r1) || (c2 < c1)) {
            return false;
        }
  
        if(r1 == r2) {
            horiz = r1;
        } else {
            x = r1+1;
            y = r2-1;
            start = Math.round(x + (y-x) / 4);
            end = Math.round(x + 3*(y-x) / 4);
            horiz = this.rand(start, end);
        }
  
        if(c1 == c2) {
            vert = c1;
        } else {
            x = c1 + 1;
            y = c2 - 1;
            start = Math.round(x + (y - x) / 3);
            end = Math.round(x + 2 * (y - x) / 3);
            vert = this.rand(start, end);
        }
  
        for(let i = this.posToWall(r1)-1; i <= this.posToWall(r2)+1; i++) {
            for(let j = this.posToWall(c1)-1; j <= this.posToWall(c2)+1; j++) {
                if((i == this.posToWall(horiz)) || (j == this.posToWall(vert))) {
                    this.maze[i][j] = 1;
                }
            }
        }
  
        let gaps = this.shuffle([true, true, true, false]);
  
        // create gaps in partition walls
  
        if(gaps[0]) {
            let gapPosition = this.rand(c1, vert);
            this.maze[this.posToWall(horiz)][this.posToSpace(gapPosition)] = 0;
        }
  
        if(gaps[1]) {
            let gapPosition = this.rand(vert+1, c2+1);
            this.maze[this.posToWall(horiz)][this.posToSpace(gapPosition)] = 0;
        }
  
        if(gaps[2]) {
            let gapPosition = this.rand(r1, horiz);
            this.maze[this.posToSpace(gapPosition)][this.posToWall(vert)] = 0;
        }
  
        if(gaps[3]) {
            let gapPosition = this.rand(horiz+1, r2+1);
            this.maze[this.posToSpace(gapPosition)][this.posToWall(vert)] = 0;
        }
  
        // recursively partition newly created chambers
  
        this.partition(r1, horiz-1, c1, vert-1);
        this.partition(horiz+1, r2, c1, vert-1);
        this.partition(r1, horiz-1, vert+1, c2);
        this.partition(horiz+1, r2, vert+1, c2);
  
    }
  
    isGap(...cells : any[]) {
        return cells.every((array) => {
            let row, col;
            [row, col] = array;
            if(this.maze[row][col] > 0) {
                if(this.maze[row][col] != 2) {
                    return false;
                }
            }
            return true;
        });
    }
  
    countSteps(array : number[][], r : number, c : number, val : number, stop : number) {
  
        if(!this.inBounds(r, c)) {
            return false; // out of bounds
        }
  
        if(array[r][c] <= val) {
            return false; // shorter route already mapped
        }
  
        if(!this.isGap([r, c])) {
            return false; // not traversable
        }
  
        array[r][c] = val;
  
        if(this.maze[r][c] == stop) {
            return true; // reached destination
        }
  
        this.countSteps(array, r-1, c, val+1, stop);
        this.countSteps(array, r, c+1, val+1, stop);
        this.countSteps(array, r+1, c, val+1, stop);
        this.countSteps(array, r, c-1, val+1, stop);
  
    }
  
    getKeyLocation() {
  
        let fromEntrance = this.initArray(0);
        let fromExit = this.initArray(0);
  
        this.totalSteps = -1;
  
        for(let j = 1; j < this.cols-1; j++) {
            if(this.maze[this.rows-1][j] == 2) {
                this.countSteps(fromEntrance, this.rows-1, j, 0, 2);
            }
            if(this.maze[0][j] == 2) {
                this.countSteps(fromExit, 0, j, 0, 2);
            }
        }
  
        let fc = -1, fr = -1;
  
        this.maze.forEach((row, r) => {
            row.forEach((cell, c) => {
                if(typeof fromEntrance[r][c] == 'undefined') {
                    return;
                }
                let stepCount = fromEntrance[r][c] + fromExit[r][c];
                if(stepCount > this.totalSteps) {
                    fr = r;
                    fc = c;
                    this.totalSteps = stepCount;
                }
            });
        });
  
        return [fr, fc];
    }
  
    placeKey() {
  
        let fr, fc;
        [fr, fc] = this.getKeyLocation();
  
        this.maze[fr][fc] = 2;
  
    }

    isValidPos(pos : {x: number, y:number}, list : {x: number, y:number}[]) : boolean{
        // world boundaries
        if( pos.x < 0 || pos.y < 0){
            return false;
        }
        if ( pos.x > this.rows - 1 || pos.y > this.cols - 1){
            return false;
        }
        // walkable paths, all is walkable except 1 (= wall)
        if(this.maze[pos.x][pos.y] == 1){
            return false;
        }
        // check if position is already in the list, then it waa visited and should not be checked again
        for(let i = 0; i < list.length; i++) {
            if(list[i].x == pos.x && list[i].y == pos.y){
                return false;
            }
        }
        return true;
    }

    getNeighbours(x : number, y : number, list : {x: number, y:number}[]) : {x: number, y:number}[]{
        let positions : {x: number, y:number}[] = [];
        // we first make all new positions
        const left = {x : x-1, y : y};
        const right = {x : x+1, y : y};
        const up = {x : x, y : y-1};
        const down = {x : x, y : y+1};
        // we now add a position to the list if the position is a valid one and is has not been visited yet
        if(this.isValidPos(left, list)){
            positions.push(left);
        }
        if(this.isValidPos(right, list)){
            positions.push(right);
        }
        if(this.isValidPos(up, list)){
            positions.push(up);
        }
        if(this.isValidPos(down, list)){
            positions.push(down);
        }
        return positions;
    }

    checkPath(x1 : number, y1 : number, x2 : number, y2 : number, list?: {x: number, y:number}[]) : boolean{
        // if same position return true
        if(x1 == x2 && y1 == y2){
            return true;
        }
        // if list not given, then init with current checking position
        if(!list){
            list = [{x:x1, y:y1}];
        }
        // get all valid neighbour positions that have not been visited yet
        let newpos : {x: number, y:number}[] = this.getNeighbours(x1, y1, list);
        for(let i = 0; i < newpos.length; i++) {
            list!.push(newpos[i]);
            if(this.checkPath(newpos[i].x, newpos[i].y, x2, y2, list)){
                return true;
            }
        }
        // no correct path was found so return false and backtrack a new path
        return false;
    }

    toString() : string[][]{
        // we want to make sure there is a path from left teleporter (=3) to lobby teleporter (=2) to right teleport (=4)
        // we make sure this is true by checking a path from right teleport to loby and from left teleport to loby
        // if both are true, a path is also possible from left to right
        // first we make sure the teleport and spawn positions are set
        this.maze.forEach((row, r) => {
            row.forEach((elem, e) => {
                // some important points
                if(r == this.rows - 1 && e == (this.cols / 2) - 1) {
                    // place portal in middle off lowest row
                    this.maze[r][e] = 2;
                }
                if(r == this.rows - 2 && e == (this.cols / 2) - 1) {
                    // empty spawn position
                    this.maze[r][e] = 0;
                }
                if(e == this.cols - 1 && r == (this.rows / 2) - 1) {
                    // place portal on right middle
                    this.maze[r][e] = 4;
                }
                if(e == this.cols - 2 && r == (this.rows / 2) - 1) {
                    // empty place in front of portal
                    this.maze[r][e] = 0;
                }
                if(r == (this.rows / 2) - 1 && e == 0) {
                    // place portal on left middle
                    this.maze[r][e] = 3;
                }
                if(e == 1 && r == (this.rows / 2) - 1) {
                    // empty place in front of portal
                    this.maze[r][e] = 0;
                }
            });
        });
        // FULL working backtracking algorithm

        //coin positioning

        const xCoin = Math.round( Math.random() * 29);
        const yCoin = Math.round( Math.random() * 19);
        this.maze[yCoin][xCoin] = 5;

        //there must be a path from coin to main portal
        if(!this.checkPath(yCoin, xCoin, this.rows - 1, (this.cols / 2) - 1) || yCoin == 0){
            let newmaze = new MazeBuilder(this.cols, this.rows);
            return newmaze.toString();
        }

        // IMPORTANT!
        // we expect it to generate a valid maze within reasonable time and not to many iterations, so we do not check for
        // potential stack overflow errors on backtracking throug creation and checks
        
        // we check from right teleport to loby teleport
        if(!this.checkPath((this.rows / 2) - 1, this.cols - 1, this.rows - 1, (this.cols / 2) - 1)){
            let newmaze = new MazeBuilder(this.cols, this.rows);
            return newmaze.toString();
        }
        // we check from left teleport to loby teleport
        if(!this.checkPath((this.rows / 2) - 1, 0, this.rows - 1, (this.cols / 2) - 1)){
            let newmaze = new MazeBuilder(this.cols, this.rows);
            return newmaze.toString();
        }

        // now we know there are paths, we set the strings
        let matrix : string[][] = new Array(this.rows).fill('').map(() => new Array(this.cols).fill(''));
        this.maze.forEach((row, r) => {
            row.forEach((elem, e) => {
                // to string
                if(this.maze[r][e] == 0){
                    matrix[r][e] = 'path' + 2;
                }else if (this.maze[r][e] == 1){
                    let number = (Math.floor(Math.random() * 7) + 1).toString();
                    matrix[r][e] = 'wall' + number;
                }else if (this.maze[r][e] == 2){
                    matrix[r][e] = 'portal';
                }else if (this.maze[r][e] == 3){
                    matrix[r][e] = 'portalleft';
                }else if (this.maze[r][e] == 4){
                    matrix[r][e] = 'portalright';
                }else if (this.maze[r][e] == 5){
                    matrix[r][e] = 'coin';
                } else {
                    matrix[r][e] = this.maze[r][e].toString();
                }
            });
        });
        return matrix;
    }
  
}