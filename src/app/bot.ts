import { Builder, By, Key } from 'selenium-webdriver';

// Variable registering the messages in the message box.
let messages;
// Variable registering the interval at which to check the message box.
// eslint-disable-next-line no-undef
let interval: NodeJS.Timeout;
// Variable referencing a list containing all the sent Messages.
let handledMessages: String[] = [];
// Variable referencing a list containing all handled voters.
let handledVoters: String[] = [];
// Variable registering the vote book.
let voteBook: any;
// Variable registering the driver.
let driver: any;

main();

/**
 * Run this bot.
 * 
 * @effect Navigate to the localhost.
 *       | driver.get('http://localhost:3000/')
 * @effect Login with nickname bot.
 *       | driver.findElement(By.id('nickname')).sendKeys('bot')
 *       | (await driver.findElement(By.id('loginbtn'))).click()
 * 
 */
async function main() {
    driver = await new Builder().forBrowser('chrome').build();
    driver.manage().window().maximize();
    

    try {
        await driver.get('http://localhost:3000/');
        await driver.findElement(By.id('nickname')).sendKeys('bot');
        await (await driver.findElement(By.id('loginbtn'))).click();
        console.log('Login succesful');
    } finally {

        setTimeout(async () => {goToLavaWorld(); await driver.findElement(By.id('sound_on')).click();
        }, 6000);
    }
}

/**
 * Go to the lava world. 
 * 
 * 
 * @effect Move to the lava world.
 *       | moveUp(driver) 
 * @effect Check the messages in the message box.
 *       | setInterval(() => {checkMessages(driver)}, 1000)
 */
async function goToLavaWorld() {
    setTimeout(() => moveUp(), 500);
    setTimeout(() => moveUp(), 1000);
    setTimeout(() => moveUp(), 1500);
    setTimeout(() => moveUp(), 2000);
    setTimeout(() => {interval = setInterval(() => {checkMessages();}, 1000);}, 3000);
}

async function goToGrassWorld() {
    setTimeout(() => moveLeft(), 500);
    setTimeout(() => moveLeft(), 1000);
    setTimeout(() => moveLeft(), 1500);
    setTimeout(() => moveLeft(), 2000);
    setTimeout(() => moveLeft(), 2500);
    setTimeout(() => moveLeft(), 3000);
    setTimeout(() => moveLeft(), 3500);
    setTimeout(() => moveLeft(), 4000);
    setTimeout(() => moveLeft(), 4500);
    setTimeout(() => moveUp(), 5000);
    setTimeout(() => moveUp(), 5500);
    setTimeout(() => moveUp(), 6000);
    setTimeout(() => moveUp(), 6500);
    setTimeout(() => {interval = setInterval(() => {checkMessages();}, 1000);}, 75000);

}

async function goToIceWorld() {
    setTimeout(() => moveLeft(), 500);
    setTimeout(() => moveUp(), 1000);
    setTimeout(() => moveUp(), 1500);
    setTimeout(() => moveUp(), 2000);
    setTimeout(() => moveUp(), 2500);
    setTimeout(() => {interval = setInterval(() => {checkMessages();}, 1000);}, 3500);
}

/**
 * Move up in the world.
 * 
 * 
 */
async function moveUp() {
    await driver.actions().keyDown(Key.ARROW_UP).perform();
    await driver.actions().keyUp(Key.ARROW_UP).perform();
}

async function moveLeft() {
    await driver.actions().keyDown(Key.ARROW_LEFT).perform();
    await driver.actions().keyUp(Key.ARROW_LEFT).perform();
}

/**
 * Check the messages in the world.
 * 
 *  
 */
async function checkMessages() {
    messages = await driver.findElements(By.className('message'));
    (messages).forEach((element: any) => {element.getText().then((value: any) => {checkMessage(value);});});

}

async function removeElements() {
    await driver.actions().keyDown('t').perform();
    await driver.actions().keyUp('t').perform();
    driver.executeScript('document.getElementById("messages-box").innerHTML = "";');
}

/**
 * Check if a message is a command for the bot.
 * 
 * 
 * @param message 
 *        The message to check.
 */
async function checkMessage( message: string) {
    message = message.split(']', 2)[1];

    if (message== undefined) {
        return;
    }

    message = message.substring(1);
    message = message.substring(1);
    //
    if (message.startsWith('messenger') && !handledMessages.includes(message)) {
        handledMessages.push(message);
        let command = message.split(' ');
        let worldName = command[1];
        if(isValidWorldname(worldName)){
            command.shift();
            command.shift();
            let envelope = command.join(' ');
            sendMessage('Message will be sent to world: ' + worldName);
            clearInterval(interval);
            setTimeout(() => (moveOutWorld()), 5000);
            setTimeout(() => {goToNextWorld( worldName); removeElements();}, 6000);
            setTimeout(() => {sendEnvelope( envelope); interval = setInterval(() => {checkMessages();}, 1000);}, 15000);
        }
        else{sendMessage('Please give me a valid world to send the message to next time.');}
    } else if (message.startsWith('survey') && !handledMessages.includes(message)) {
        surveyHandler(message);
    }
}

async function surveyHandler(message: string) {
    handledMessages.push(message);
    
    let command = message.split(';');
    command.shift();
    let question = command[0];
    command.shift();

    takeSurvey(command, question);
}



async function takeSurvey(command:string[], question:string) {
    let i = 1;
    let poll = question + ' (';
    command.forEach((value) => {poll += '\r ' + i + ': ' + value; i++;});
    poll += ' )';
    sendMessage(poll);
    voteBook = {};
    for (let j = 1; j < i ; j++)
        voteBook[j] = 0;
    console.log('Survey: ' + voteBook);
    clearInterval(interval);
    setTimeout(() => (printNumber( '3')), 7000);
    setTimeout(() => (printNumber( '2')), 8000);
    setTimeout(() => (printNumber('1')), 9000);
    setTimeout(() => (checkVotes( i)), 10000);
    setTimeout(() => (printResults()), 11000);
    
}


function isValidWorldname(worldname: string){
    if( worldname == 'GrassWorld' || worldname == 'LavaWorld' || worldname == 'IceWorld'){
        return true;
    }
    return false;
}

async function printNumber(nb: string) {
    sendMessage(nb);
}

async function checkVotes( nbOfOptions: number) {
    await sendMessage('Counting the votes...');
    messages = await driver.findElements(By.className('message'));
    console.log(messages);
    if (messages.length == 0) {
        await driver.actions().keyDown('t').perform();
        await driver.actions().keyUp('t').perform();
        messages = await driver.findElements(By.className('message'));
    }
    (messages).forEach((element: any) => {element.getText().then((value: any) => {checkVote( value, nbOfOptions);});});
}

async function checkVote( vote: string, nbOfOptions: number) {
    let name = vote.split(']', 2)[0];
    vote = vote.split(']', 2)[1];

    if (vote == undefined) {
        return;
    }

    name = name.substring(1);
    vote = vote.substring(1);
    vote = vote.substring(1);
    console.log('CheckVote: ' + vote);
    if (vote.startsWith('vote')) {
        handledMessages.push(vote);
        handledVoters.push(name);

        let voteNumber: string | number = vote.split('vote ')[1];
        try {
            voteNumber = parseInt(voteNumber);
            if (voteNumber > nbOfOptions)
                return;
        } catch {
            return;
        }
        voteBook[voteNumber] = voteBook[voteNumber] + 1;
        console.log('CheckedVote: ' + voteBook);
    }
}

async function printResults() {
    let nbOfVotes = 0;
    for (let key in voteBook) {
        nbOfVotes += voteBook[key];
    }
    console.log('PrintResults: ' + voteBook);

    let results = 'The results are (';
    for (let key in voteBook) {
        let value = (nbOfVotes == 0 ? 0 : voteBook[key]/nbOfVotes*100);
        results += key + ': ' + value + '%, ';
    }
    results += ' )';
    sendMessage(results);
}

/**
 * Move out the current world to the lobby.
 * 
 *
 */
async function moveOutWorld() {
    await driver.actions().keyDown(Key.ARROW_DOWN).perform();
    await driver.actions().keyUp(Key.ARROW_DOWN).perform();
    // eslint-disable-next-line no-unused-vars
    return new Promise(resolve => {
        setTimeout(function() {
            console.log('moveoutWorld');
        }, 2000);
    });
}

async function goToNextWorld(worldName: String) {
    if (worldName == 'GrassWorld')
        goToGrassWorld();
    else if (worldName == 'IceWorld')
        goToIceWorld();
    else if (worldName == 'LavaWorld')
        goToLavaWorld();
}

async function sendEnvelope( envelope: String) {
    sendMessage('I got a message: ' + envelope);
}


async function sendMessage(message: string) {
    await driver.findElement(By.id('messageBox')).sendKeys(message);
    await driver.actions().keyDown(Key.ENTER).perform();
    await driver.actions().keyUp(Key.ENTER).perform();
}
