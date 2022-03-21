import { Builder, By, Key } from 'selenium-webdriver';

// Variable registering the messages in the message box.
let messages;
// Variable registering the interval at which to check the message box.
// eslint-disable-next-line no-undef
let interval: NodeJS.Timeout;
// Variable registering the driver.
let driver: any;
// Variable registering the vote this bot will send out.
let vote: any;

main();

/**
 * Run this bot.
 * 
 * @effect Navigate to the localhost.
 *       | driver.get('http://localhost:3000/')
 * @effect Login with nickname bot.
 *       | driver.findElement(By.id('nickname')).sendKeys('vote_bot')
 *       | (await driver.findElement(By.id('loginbtn'))).click()
 * 
 */
async function main() {
    driver = await new Builder().forBrowser('chrome').build();
    driver.manage().window().maximize();

    try {
        await driver.get('http://localhost:3000/');
        await driver.findElement(By.id('nickname')).sendKeys(process.argv[2]);
        await (await driver.findElement(By.id('loginbtn'))).click();
        vote = process.argv[3];
        console.log('Login succesful');
    } finally {
        setTimeout(async () => {goToLavaWorld();await driver.findElement(By.id('sound_on')).click();}, 6000);
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
    setTimeout(() => moveRight(), 2200);
    setTimeout(() => {interval = setInterval(() => {checkMessages();}, 1000);}, 3000);
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

/**
 * Move up in the world.
 * 
 * 
 */
async function moveRight() {
    await driver.actions().keyDown(Key.ARROW_RIGHT).perform();
    await driver.actions().keyUp(Key.ARROW_RIGHT).perform();
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
    
    if (message.startsWith('survey')) {
        let bot_vote = 'vote ' + vote.toString();
        sendMessage(bot_vote);
        clearInterval(interval);
    }
}

async function sendMessage(message: string) {
    await driver.findElement(By.id('messageBox')).sendKeys(message);
    await driver.actions().keyDown(Key.ENTER).perform();
    await driver.actions().keyUp(Key.ENTER).perform();
}
