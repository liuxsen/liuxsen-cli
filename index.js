#!/usr/bin/env node
const inquirer = require('inquirer');
const program = require('commander');
const download = require('git-clone');
const handlebars = require('handlebars');
const ora = require('ora');
const fs = require('fs');
const chalk = require('chalk');
const path = require('path');

const config = require('./package.json');

const { deleteall } = require('./utils/fs-utils');

program
  .version(config.version, '-v, --version')
  .command('init <name> <branch>')
  .action((name, branch) => {
    if (fs.existsSync(name)) {
      console.log(chalk.red('项目已经存在'));
      return;
    }
    inquirer
      .prompt([
        {
          type: 'input',
          name: 'description',
          message: '请输入项目描述'
        },
        {
          type: 'input',
          name: 'author',
          message: '请输入作者名称'
        }
      ])
      .then(answers => {
        const spinner = ora('正在下载模板...');
        spinner.start();
        download(
          'https://github.com/liuxsen/cli-template',
          `${name}`,
          {
            git: 'git',
            checkout: branch || 'master'
          },
          err => {
            if (!err) {
              const meta = {
                name,
                description: answers.description,
                author: answers.author
              };
              const fileName = `${name}/package.json`;
              if (fs.existsSync(fileName)) {
                const content = fs.readFileSync(fileName).toString();
                const result = handlebars.compile(content)(meta);
                fs.writeFileSync(fileName, result);
                spinner.text = '';
                spinner.succeed();
                // 删除git仓库文件夹
                console.log(chalk.green('项目创建成功'));
              }
              deleteall(path.resolve(name, '.git'));
            } else {
              spinner.fail();
              console.log(chalk.red('项目创建失败'));
              console.log(err);
            }
          }
        );
      });
  });
program.parse(process.argv);
