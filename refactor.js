const fs = require('fs');
let g = fs.readFileSync('src/components/GrokTab.js', 'utf8');

// Fix 1: Remove getGrokCreditCost from import
g = g.replace(
  'import { CREDIT_COSTS, deductCredits, hasEnoughCredits, getGrokCreditCost } from "../lib/supabase";',
  'import { CREDIT_COSTS, deductCredits, hasEnoughCredits } from "../lib/supabase";'
);

// Fix 2: Replace getGrokCreditCost() call with hardcoded 14
g = g.replace('const cost = getGrokCreditCost();', 'const cost = 14;');

// Fix 3: Replace creditCost variable
g = g.replace('const creditCost = getGrokCreditCost();', 'const creditCost = 14;');

// Fix 4: Remove getGrokCreditCost import at top
g = g.replace(
  'import { CREDIT_COSTS, deductCredits, hasEnoughCredits } from "../lib/supabase";',
  'import { deductCredits, hasEnoughCredits } from "../lib/supabase";'
);

fs.writeFileSync('src/components/GrokTab.js', g, 'utf8');
console.log('Fixed cost hardcoded:', g.includes('const cost = 14'));
console.log('Fixed creditCost:', g.includes('const creditCost = 14'));