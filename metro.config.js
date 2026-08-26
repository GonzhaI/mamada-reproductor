// Metro config: agrega 'ogg' a los assets reconocidos (samples de foley CC0).
// El resto de los defaults viene de @expo/metro-config (SDK 54).
const { getDefaultConfig } = require('expo/metro-config')

const config = getDefaultConfig(__dirname)
config.resolver.assetExts.push('ogg')

module.exports = config
