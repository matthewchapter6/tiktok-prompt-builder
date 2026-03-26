const fs = require('fs');
let g = fs.readFileSync('src/components/GrokTab.js', 'utf8');

g = g.replace(
  'const generateVideo = async () => {',
  'const generateVideo = async () => {\n    console.log("[GrokTab] generateVideo called, prompt length:", prompt.length, "generating:", generating);'
);

fs.writeFileSync('src/components/GrokTab.js', g, 'utf8');
console.log('Debug added:', g.includes('[GrokTab] generateVideo called'));