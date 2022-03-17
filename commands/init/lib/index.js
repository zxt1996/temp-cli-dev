'use strict';

const Command = require('@temp-cli-dev/command');
const fs = require('fs');
const inquirer = require('inquirer');
const fse = require('fs-extra');

class InitCommand extends Command {
    init() {
        this.projectName = this._argv[0] || '';
        this.force = !!this._cmd.force;
    }

    exec () {
        // 1. 准备阶段
        this.prepare()
        // 2.下载模板
        // 3.安装模板
    }

    async prepare () {
        // 1. 判断当前目录是否为空
        const localPath = process.cwd();
        console.log('localPath >>>', localPath);
        if (!this.isDirEmpty(localPath)) {
            let isContinue = false;
            // 如果 用户不是强制更新，那么就要询问用户是否继续创建
            if (!this.force) {
                isContinue = (
                    await inquirer.prompt({
                        type: 'confirm',
                        name: 'isContinue',
                        message: '当前目录不为空，是否继续创建？',
                        default: false
                    })
                ).isContinue;

                if (!isContinue) {
                    return;
                }
            }

            // 不管用户是否是强制更新，最后都会展示这次询问，因为清空当前目录文件是一个非常严谨的操作
            if (isContinue || this.force) {
                // 做二次确认
                const { confirmDelete } = await inquirer.prompt({
                    type: 'confirm',
                    name: 'confirmDelete',
                    message: '是否确认清空当前目录下的文件？',
                    default: false
                });

                if (confirmDelete) {
                    // 清空当前目录
                    fse.emptyDirSync(localPath);
                }
            }
        }
        // 2. 是否启动强制更新
        // 3. 选择创建项目或组件
        // 4.获取项目的基本信息
    }

    isDirEmpty(localPath){
        let fileList = fs.readdirSync(localPath)
        // 文件过滤逻辑
        fileList = fileList.filter(file => (
            !file.startsWith('.') && ['node_modules'].indexOf(file) < 0
          ));
        return !fileList || fileList.length <= 0
    }
}

function init(argv)  {
    return new InitCommand(argv);
}

module.exports = init;
module.exports.InitCommand = InitCommand;