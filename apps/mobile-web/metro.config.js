const { getDefaultConfig } = require("expo/metro-config");

const config = getDefaultConfig(__dirname);

// Algumas dependências do colyseus.js (ex: @colyseus/httpie) só declaram
// exports para "node" e "browser", sem uma condição "react-native" — sem
// isso o Metro tenta usar a versão Node (que importa módulos como "https",
// inexistentes no celular) ao empacotar para Android/iOS. Adicionar
// "browser" nas condições resolve, já que essa versão usa XMLHttpRequest,
// disponível tanto no navegador quanto no React Native.
config.resolver.unstable_enablePackageExports = true;
config.resolver.unstable_conditionNames = ["react-native", "browser", "require", "import"];

module.exports = config;
