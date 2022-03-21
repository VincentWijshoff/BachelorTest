import { Builder, By, Key, WebDriver } from 'selenium-webdriver';
import { Survey } from './survey';

// Variable registering the messages in the message box.
let messages;
// Variable registering the interval at which to check the message box.
// eslint-disable-next-line no-undef
let interval: NodeJS.Timeout;
// Variable referencing a list containing all the sent Messages.
// eslint-disable-next-line no-unused-vars
let sentMessages: String[] = [];

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
    let driver = await new Builder().forBrowser('chrome').build();
    driver.manage().window().maximize();

    try {
        await driver.get('http://localhost:3000/');
        await driver.findElement(By.id('nickname')).sendKeys('surveybot');
        await (await driver.findElement(By.id('loginbtn'))).click();
        console.log('Login succesful');
    } finally {
        setTimeout(() => {goToIceWorld(driver);}, 12000);
    }
    checkMessages(driver);
}


async function goToIceWorld(driver: WebDriver) {
    setTimeout(() => moveLeft(driver), 500);
    setTimeout(() => moveUp(driver), 1000);
    setTimeout(() => moveUp(driver), 1500);
    setTimeout(() => moveUp(driver), 2000);
    setTimeout(() => moveUp(driver), 2500);
    // eslint-disable-next-line no-unused-vars
    interval = setInterval(() => {checkMessages(driver);}, 3500);
}

/**
 * Move up in the world.
 * 
 * @param  driver 
 *         The driver running the bot.
 */
async function moveUp(driver: WebDriver) {
    await driver.actions().keyDown(Key.ARROW_UP).perform();
    await driver.actions().keyUp(Key.ARROW_UP).perform();
}

async function moveLeft(driver: WebDriver) {
    await driver.actions().keyDown(Key.ARROW_LEFT).perform();
    await driver.actions().keyUp(Key.ARROW_LEFT).perform();
}

/**
 * Check the messages in the world.
 * 
 * @param  driver
 *         The driver running the bot. 
 */
async function checkMessages(driver: WebDriver) {
    messages = await driver.findElements(By.className('message'));
    (messages).forEach((element) => {element.getText().then((value) => {handleMessage(driver, value);});});
}

// eslint-disable-next-line no-unused-vars
async function removeElements(driver: WebDriver) {
    await driver.actions().keyDown('t').perform();
    await driver.actions().keyUp('t').perform();
    driver.executeScript('document.getElementById("messages-box").innerHTML = "";');
}

/**
 * Check if a message is a command for the bot.
 * 
 * @param driver
 *        The driver that runs the bot. 
 * @param message 
 *        The message to check.
 */
async function handleMessage(driver: WebDriver, message: string) {
    let splitMessage = message.split(']', 2);
    // eslint-disable-next-line no-unused-vars
    let user = message[1].slice(1);
    if (message!= undefined) {
        message = message.substring(2);
    }
    if(message.startsWith('survey')){
        message = message.slice(7);
        splitMessage = message.split('-');

        let question = splitMessage[0];
        let answers = splitMessage.slice(1);
        let survey = new Survey(question, answers);

        checkAnswers(driver, survey);

        let result = survey.getResults();
    
        sendEnvelope(driver, result);
    }
}


async function checkAnswers(driver: WebDriver, survey: Survey){
    messages = await driver.findElements(By.className('message'));
    (messages).forEach((element) => {element.getText().then((value) => {survey.vote(parseInt(value), 'user');});});

}


async function sendEnvelope(driver: WebDriver, envelope: String) {
    await driver.findElement(By.id('messageBox')).sendKeys('I\'m conducting a survey, please vote by typing the number in the chat, you can only vote once: ' + envelope);
    await driver.actions().keyDown(Key.ENTER).perform();
    await driver.actions().keyUp(Key.ENTER).perform();
}
