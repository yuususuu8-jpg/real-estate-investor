module.exports = function (api) {
  api.cache(true);
  return {
    presets: ['babel-preset-expo'],
    plugins: [
      // Handle import.meta for web compatibility
      function () {
        return {
          visitor: {
            MetaProperty(path) {
              path.replaceWithSourceString('process.env');
            },
          },
        };
      },
    ],
  };
};
