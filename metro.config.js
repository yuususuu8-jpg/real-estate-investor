const { getDefaultConfig } = require('expo/metro-config');

const config = getDefaultConfig(__dirname);

// Web bundling configuration
config.resolver.sourceExts = [...config.resolver.sourceExts, 'mjs'];

module.exports = config;
