const fs = require('fs');
let g = fs.readFileSync('src/components/GrokTab.js', 'utf8');

const oldText = '    // Credit check\r\n    const cost = getGrokCreditCost();\r\n    const enough = await hasEnoughCredits(user.id, cost);';
const newText = '    // Credit check\r\n    const cost = getGrokCreditCost();\r\n    console.log("[GrokTab] credit cost:", cost, "user:", user && user.id);\r\n    const enough = await hasEnoughCredits(user.id, cost);\r\n    console.log("[GrokTab] hasEnoughCredits:", enough);';

let result = g.replace(oldText, newText);

if (!result.includes('[GrokTab] credit cost')) {
  // Try with LF only
  const oldText2 = '    // Credit check\n    const cost = getGrokCreditCost();\n    const enough = await hasEnoughCredits(user.id, cost);';
  const newText2 = '    // Credit check\n    const cost = getGrokCreditCost();\n    console.log("[GrokTab] credit cost:", cost, "user:", user && user.id);\n    const enough = await hasEnoughCredits(user.id, cost);\n    console.log("[GrokTab] hasEnoughCredits:", enough);';
  result = g.replace(oldText2, newText2);
}

fs.writeFileSync('src/components/GrokTab.js', result, 'utf8');
console.log('Done:', result.includes('[GrokTab] credit cost'));