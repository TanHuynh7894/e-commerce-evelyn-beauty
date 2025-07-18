$folders = @("controllers", "middlewares", "models", "routes", "utils", "config", "auth", "view")
foreach ($folder in $folders) {
    javascript-obfuscator $folder --output "dist\$folder" --compact true --control-flow-flattening true
}
javascript-obfuscator server.js --output dist\server.js
