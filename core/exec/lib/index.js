'use strict';

const Package = require('@temp-cli-dev/package');
const path = require('path');

const SETTINGS = {
    init: '@temp-cli-dev/init'
};

const CATCH_DIR = 'dependencies';

async function exec() {
    let targetPath = process.env.CLI_TARGET_PATH;
    const homePath = process.env.CLI_HOME_PATH;
    let storeDir ='';
    let pkg;
    const cmdObj = arguments[arguments.length - 1];
    const cmdName = cmdObj.name(); 
    const packageName = SETTINGS[cmdName];
    const packageVersion = 'latest';

    console.log('targetPath >>>', targetPath);

    // 如果不存在targetPath，说明是执行线上的命令，手动设置缓存本地的targetPath路径及缓存路径
    if (!targetPath) {
        console.log('adasd', homePath);
        //生成缓存路径
        targetPath = path.resolve(homePath, CATCH_DIR);  
        storeDir = path.resolve(targetPath, 'node_modules');
        pkg = new Package({                                     
          targetPath,
          storeDir,
          packageName,
          packageVersion
       });
       if (await pkg.exists()) {    
          // 更新package
          log.verbose('更新package')
          await pkg.update();
       } else {
          // 安装package
          await pkg.install();
       }
     } else {
       pkg = new Package({
          targetPath,
          packageName,
          packageVersion
       })
       const rootFile = pkg.getRootFilePath();
       console.log('rootFile >>>', rootFile);
       if (rootFile) {    //新添加
          require(rootFile).apply(null,arguments);
       }
     }
}

module.exports = exec;