'use strict';

const Package = require('@temp-cli-dev/package');

const SETTINGS = {
    init: '@temp-cli-dev/init'
};

function exec() {
    let targetPath = process.env.CLI_TARGET_PATH;
    // const homePath = process.env.CLI_HOME_PATH;
    let storeDir ='';
    let pkg;
    const cmdObj = arguments[arguments.length - 1];
    const cmdName = cmdObj.name(); 
    const packageName = SETTINGS[cmdName];
    const packageVersion = 'latest';
    pkg = new Package({
        targetPath,
        storeDir,
        packageName,
        packageVersion
    })
     
    console.log(pkg);

    const rootFile = pkg.getRootFilePath();

    console.log('rootFile >>>', rootFile);
}

module.exports = exec;