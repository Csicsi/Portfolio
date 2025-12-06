export default {
  '*.{js,jsx}': (files) => {
    const filtered = files.filter((file) => !file.includes('/public/cub3d/'));
    if (filtered.length === 0) return [];
    return [`eslint --fix ${filtered.join(' ')}`, `prettier --write ${filtered.join(' ')}`];
  },
  '*.{css,md,json}': ['prettier --write'],
};
