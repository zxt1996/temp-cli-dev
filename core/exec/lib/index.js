'use strict';

const Package = require('@temp-cli-dev/package');
const path = require('path');
const log = require('npmlog');
const cp = require('child_process');

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

    // 如果不存在targetPath，说明是执行线上的命令，手动设置缓存本地的targetPath路径及缓存路径
    if (!targetPath) {
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
       if (rootFile) {    //新添加
        //   require(rootFile).call(null, Array.from(arguments));
         try {
            //在当前进程中调用
            // require(rootFile).call(null, Array.from(arguments));
            //在node子进程中调用
            const args = Array.from(arguments);
            const cmd = args[args.length - 1];
            const o = Object.create(null);
            Object.keys(cmd).forEach(key => {
                if (cmd.hasOwnProperty(key) && !key.startsWith('_') && key !== 'parent') {
                    o[key] = cmd[key];
                }
            })
            args[args.length - 1] = o;
            const code = `require('${rootFile}').call(null, ${JSON.stringify(args)})`;
            const child = cp.spawn('node', ['-e', code], {
                cwd: process.cwd(),
                stdio: 'inherit'
            });
            child.on('error', e => {
                log.error(e.message);
                process.exit(1);
            });
            child.on('exit', e => {
                log.verbose('命令执行成功:' + e);
                process.exit(e);
            })
         } catch (e) {
            log.error(e.message);
         }
       }
     }
}

module.exports = exec;