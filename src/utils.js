const fs = require('fs');
const path = require('path');

module.exports.checkPath = (p, excludeFilters = [], includeFilters = []) => !excludeFilters.some(f => f.test(p)) && includeFilters.some(f => f.test(p));

module.exports.getFilesPathes = async (dir, excludeFilters, includeFilters) => {
  const pathes = await fs.promises.readdir(dir);

  const stack = pathes;
  const result = [];

  while (stack.length) {
    const p = stack.pop();
    const stat = await fs.promises.stat(p);

    if (!stat.isFile()) {
      const subPathes = (await fs.promises.readdir(p)).map(sp => path.join(p, sp));

      stack.push(...subPathes);
    } else if (module.exports.checkPath(p, excludeFilters, includeFilters)) {
      result.push(p);
    }
  }

  return result;
}

module.exports.debounce = (cb, ms) => {
  let isCooldown = false;

  return (...args) => {
    if (isCooldown) return;

    cb.apply(this, args);

    isCooldown = true;

    setTimeout(() => isCooldown = false, ms);
  };
};
