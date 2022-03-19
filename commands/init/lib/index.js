'use strict';

const Command = require('@temp-cli-dev/command');
const fs = require('fs');
const inquirer = require('inquirer');
const fse = require('fs-extra');
const semver = require('semver');
const Package = require('@temp-cli-dev/package');
const {
    spinnerStart,
    sleep
} = require('@temp-cli-dev/utils');
const userHome = require('user-home');

const getTemplateProject = require('./getProjectTemplate');

const TYPE_PROJECT = 'project';
const TYPE_COMPONENT = 'component';
class InitCommand extends Command {
    init() {
        this.projectName = this._argv[0] || '';
        this.force = !!this._cmd.force;
    }

    async exec () {
        try {
            // 1. 准备阶段
            let projectInfo = await this.prepare();
            console.log('projectInfo >>>', projectInfo);
            if (projectInfo) {
                this.projectInfo = projectInfo;
                //2.下载模版
                await this.downloadTemplate()
            }
            // 3.安装模板
        } catch (e) {
            console.log(e);
        }
    }

    async prepare () {
        //0 判断项目模板是否存在
        const template = await getTemplateProject();
        if(!template || template.length ===0){
            throw new Error('项目模版不存在')
        }
        this.template = template;
        // 1. 判断当前目录是否为空
        const localPath = process.cwd();
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

            // 2. 是否启动强制更新
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

        return this.getProjectInfo();
    }

    async getProjectInfo () {
        let projectInfo = {};
        //1.选取创建项目或组件
        const { type } = await inquirer.prompt({
            type: 'list',
            name: 'type',
            message: '请选择初始化类型', 
            default: TYPE_PROJECT,
            choices: [{
                name: '项目',
                value: TYPE_PROJECT,
              }, {
                name: '组件',
                value: TYPE_COMPONENT,
              }]
        })
        //2.获取项目/组件的基本信息
        if(type === TYPE_PROJECT){
            // 获取项目的基本信息
            const project = await inquirer.prompt([{
                type: 'input',
                name: 'projectName',
                message: '请输入项目的名称',
                default: '',
                validate: function(v) {
                    const done = this.async()
                    setTimeout(function(){
                        //1.输入的首字符必须为英文字符
                        //2.尾字符必须为英文或数字，不能为字符
                        //3.字符仅运行"-_"
                        //\w = a-zA-Z0-9  *表示0个或多个
                        if(!/^[a-zA-Z]+([-][a-zA-Z][a-zA-Z0-9]*|[_][a-zA-Z][a-zA-Z0-9]*|[a-zA-Z0-9])*$/.test(v)){
                            done('请输入合法的项目名称')
                            return;
                        }
                        done(null, true);
                    }, 0);
                },
                filter: function(v){
                    return v;
                }
            }, {
                type: 'input',
                name: 'projectVersion',
                message: '请输入项目版本号',
                default: '1.0.0',
                validate: function(v) {
                    const done = this.async();
                    setTimeout(function() {
                        if(!(!!semver.valid(v))){
                            done('请输入合法的版本号')
                            return;
                        }
                        done(null,true);
                    }, 0);
                },
                filter: function(v) {
                    if (!!semver.valid(v)){
                        return semver.valid(v);
                    } else {
                        return v;
                    }
                }
            }, {
                type: 'list',
                name: 'projectTemplate',
                message: '请选择项目模版',
                default:'',
                choices: this.createTemplateChoise()
            }])
            projectInfo = {
                type,
                ...project
            }
        } else if (type === TYPE_COMPONENT){
                // 获取组件的基本信息
        }

        // 用 kebab-case 将驼峰格式的名称转为连字符格式的
        if (projectInfo.projectName) {
            projectInfo.className = require('kebab-case')(projectInfo.projectName).replace(/^-/, '');
        }
        if (projectInfo.projectVersion) {
            projectInfo.version = projectInfo.projectVersion;
        }
        if (projectInfo.componentDescription) {
            projectInfo.description = projectInfo.componentDescription;
        }

        return projectInfo;
    }

    createTemplateChoise() {
        return this.template.map(item=> ({
            value: item.npmName,
            name: item.name
        }))
    }

    isDirEmpty(localPath){
        let fileList = fs.readdirSync(localPath)
        // 文件过滤逻辑
        fileList = fileList.filter(file => (
            !file.startsWith('.') && ['node_modules'].indexOf(file) < 0
          ));
        return !fileList || fileList.length <= 0
    }

    async downloadTemplate() {
        const { projectTemplate } = this.projectInfo;
        const templateInfo = this.template.find((item) => item.npmName === projectTemplate);
        const targetPath = path.resolve(userHome, 'temp-cli-dev', 'template');
        const storeDir = path.resolve(userHome, 'temp-cli-dev', 'template', 'node_modules');
        const { npmName, version } = templateInfo;
        this.templateInfo = templateInfo;
        const templateNpm = new Package({
            targetPath,
            storeDir,
            packageName: npmName,
            packageVersion: version
        })
        if (!await templateNpm.exists()) {
            const spinner = spinnerStart('正在下载模板...');
            await sleep();
            try {
                await templateNpm.install();
            } catch (e) {
                throw e;
            } finally {
                spinner.stop(true);
                if (await templateNpm.exists()) {
                    console.log('下载模板成功');
                }
                this.templateNpm = templateNpm;
            }
        } else {
            const spinner = spinnerStart('正在更新模板...');
            await sleep();
            try {
                await templateNpm.update();
            } catch (e) {
                throw e;
            } finally {
                spinner.stop(true);
                if (await templateNpm.exists()) {
                    console.log('更新模板成功');
                }
                this.templateNpm = templateNpm;
            }
        }

    }
}

function init(argv)  {
    return new InitCommand(argv);
}

module.exports = init;
module.exports.InitCommand = InitCommand;