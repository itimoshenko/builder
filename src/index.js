#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const { getFilesPathes, debounce } = require('./utils');

const log = require('./logger')('builder');

const args = process.argv.slice(2);

if (args.some(arg => arg.includes('--help') || arg.includes('-h'))) {
  console.log('Usage: builder [options] <root_path>');
  console.log();
  console.log('Options:');
  console.log('-h, --help\toutput usage information');
  console.log('-w, --watch\twatch files ');

  return;
}

const config = require(path.resolve(process.cwd(), './builder.config'));

const workDir = path.resolve(process.cwd(), config.workDir);

const excludeFilters = config.exclude?.map(regExp => new RegExp(regExp));
const cssIncludeFilters = [/.+\.css$/];

const buildCSS = async () => {
  const filePathes = await getFilesPathes(workDir, excludeFilters, cssIncludeFilters);

  const cssFiles = await Promise.all(filePathes.map(async (filePath) => {
      return await fs.promises.readFile(filePath, { encoding: 'utf8' });
  }));

  await fs.promises.writeFile('index.css', cssFiles.join('\n'), { encoding: 'utf8' });
}

const watchFiles = async () => {
  const filesPathes = await getFilesPathes(workDir, excludeFilters, cssIncludeFilters);

  const promises = filesPathes.map(async (filePath) => {
    const fullPath = path.join(workDir, filePath);

    await fs.promises.access(fullPath, fs.F_OK).catch(() => {
      log(`${filePath} not found`);
    });

    fs.watch(fullPath, debounce(async (event, fileName) => {
      log(`${fileName} file changed`);

      buildCSS();
    }, config.watchDelay));
  });

  log(`watch mode started`);

  return await Promise.all(promises);
}

const run = async () => {
  buildCSS();

  if (args.some(arg => arg.includes('--watch') || arg.includes('-w'))) {
    await watchFiles();
  }
}

run();
