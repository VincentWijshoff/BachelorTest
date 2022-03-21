import browser_test from './browser_test';
import channels_test from './channels_test';
import plugin_test from './plugin_test';
import protocol_test from './protocol_test';
import main_tictactoe_test from './TicTacToe_test';

(async () => {
    // List of every testscript to run
    const tests = [
        plugin_test, 
        channels_test, 
        protocol_test,
        browser_test,
        main_tictactoe_test
    ];
   

    let nbTests = 0;
    let nbFailedTests = 0;

    for (let i = 0; i < tests.length; i++) {
        let testResults = await tests[i]();
        console.log('Finished test: ', tests[i].name);
        console.log('----------------------------');
        console.log('Results (nb of failed tests / total): ', testResults);
        nbFailedTests += testResults[0];
        nbTests += testResults[1];
    }
    //Final results
    if (nbFailedTests == 0) {
        console.log(`\n\nAll tests passed!\nScore: ${nbTests}/${nbTests} 🎉\n`);
    } else {
        console.log(`\n\nTotal: ${nbFailedTests} out of ${nbTests} tests failed\n`);
    }
    process.exit();
})();