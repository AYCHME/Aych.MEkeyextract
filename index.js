#!/usr/bin/env node

const path = require('path')
const program = require('commander')
const vfs = require('vinyl-fs')
const sort = require('gulp-sort')
const scanner = require('i18next-scanner/lib')
const pkg = require('./package.json')
const _ = require('lodash')
const generateI18nextScannerConfig = require('./i18next-scanner.config')
const cleanRawLocales = require('./clean-raw-locales')
const translateExcel = require('./tranlateExcel')
const diff = require('./diff')

const defaultConfig = {
  scan: {
    input: [
      './src/locales/raw',
    ],
    output: './src/locales/raw',
    functions: ['\\\$tt', '\\\$ttt'], // 翻译函数的名字
    extensions: ['.js', '.ts', '.vue'],
    langs: ['en', 'zh-cn', 'zh-tw', 'jp', 'ko'],
  },
  clean: {
    input: './src/locales/raw',
    output: './src/locales',
    autoS2T: true,
    raw: {
      regex: /[\u4e00-\u9fa5]/,
      remove: true,
      // useDefault: true // todo: 暂时还没做
    }
  },
  translate: {
    input: './src/locales/raw',
    output: './src/locales/raw',
    langs: ['en'],
  },
  diff: {
    input: './src/locales/raw',
    output: './src/locales/diff',
    langs: ['en'],
    raw: {
      regex: /[\u4e00-\u9fa5]/,
    }
  }
}

function getConfig (configPath = 'i18n-abc.config.js') {
  const config = require(path.resolve(configPath))

  if (!config) {
    throw new Error('未找到 i18n-abc.config.js 文件')
  }

  return _.merge(defaultConfig, config)
}

program
  .command('scan')
  .option('-c <config>', '指定配置信息，默认为 i18n-abc.config.js')
  .description('扫描文件内容，生成 i18n 的多语言文件')
  .action(function (option) {
    console.log('start to scan')
    const i18nextScannerConfig = generateI18nextScannerConfig(getConfig(option.config).scan)

    vfs.src(i18nextScannerConfig.input)
      .pipe(sort()) // Sort files in stream by path
      .pipe(scanner(i18nextScannerConfig.options, i18nextScannerConfig.transform, i18nextScannerConfig.flush))
      .pipe(vfs.dest(i18nextScannerConfig.output))
  })

program
  .command('clean')
  .option('-c <config>', '指定配置信息，默认为 i18n-abc.config.js')
  .description('清理生成的 i18n 文件，生成"干净"的多语言文件')
  .action(function (option) {
    console.log('start to clean')
    const cleanConfig = getConfig(option.config).clean

    cleanRawLocales(cleanConfig)
  })

program
  .command('translate')
  .option('-c <config>', '指定配置信息，默认为 ./i18n-abc.config.js')
  .description('从 Excel 中提取翻译并应用于同名的 json 文件')
  .action(function (config) {
    console.log('start to translate')
    const translateConfig = getConfig(config.config).translate

    translateExcel(translateConfig)
  })

program
  .command('diff')
  .option('-c <config>', '指定配置信息，默认为 ./i18n-abc.config.js')
  .description('从 json 文件中提取未翻译的内容，并生成 excel 文件')
  .action(function (config) {
    console.log('start to translate')
    const translateConfig = getConfig(config.config).diff

    diff(translateConfig, config)
  })

program
  .version(pkg.version)
  .usage('[options] <file ...>')
  .option('--config <config>', 'Path to the config file (default: i18next-scanner.config.js)', 'i18next-scanner.config.js')
  .option('--output <path>', 'Path to the output directory (default: .)')

program.parse(process.argv) // 解析命令行参数
