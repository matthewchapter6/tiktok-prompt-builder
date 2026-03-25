const fs = require('fs');

let helpers = fs.readFileSync('src/utils/helpers.js', 'utf8');

// Fix 1: Remove productCatOpts from the import line since it's defined in the file itself
helpers = helpers.replace(
  'import { OPTS, FUNNEL_OPTIONS, PLATFORM_ASPECT, o, productCatOpts } from "../constants/options";',
  'import { OPTS, FUNNEL_OPTIONS, PLATFORM_ASPECT, o } from "../constants/options";'
);

// Fix 2: Remove productCatOpts from the export list since it's defined locally
helpers = helpers.replace(
  '  clipSec, calcClips,\n' +
  '  settingLabel, lightingLabel,\n' +
  '  optLabel, chipsLabel, productCatOpts,\n' +
  '  compressImage, fileToBase64,',
  '  clipSec, calcClips,\n' +
  '  settingLabel, lightingLabel,\n' +
  '  optLabel, chipsLabel, productCatOpts, productCatLabel,\n' +
  '  compressImage, fileToBase64,'
);

fs.writeFileSync('src/utils/helpers.js', helpers, 'utf8');
console.log('✅ Fixed helpers.js');

// Verify
const h = fs.readFileSync('src/utils/helpers.js', 'utf8');
console.log('Import line:', h.split('\n')[0]);
console.log('Has productCatOpts in export:', h.includes('productCatOpts, productCatLabel'));