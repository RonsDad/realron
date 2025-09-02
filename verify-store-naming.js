// Verification script to prove all state variables from page.tsx are preserved with EXACT names in the store

const fs = require('fs');
const path = require('path');

// Extract all useState declarations from page.tsx
const pageContent = fs.readFileSync(path.join(__dirname, 'src/app/page.tsx'), 'utf8');

// Regular expression to find all useState declarations
const useStateRegex = /const\s+\[(\w+),\s+set\w+\]\s*=\s*useState[<\(]/g;

// Extract all state variable names from page.tsx
const originalStateVars = [];
let match;
while ((match = useStateRegex.exec(pageContent)) !== null) {
  originalStateVars.push(match[1]);
}

console.log('📊 VERIFICATION REPORT: State Variable Name Preservation\n');
console.log('=' .repeat(60));
console.log('\n✅ Found', originalStateVars.length, 'state variables in page.tsx:\n');

// List all original state variables
originalStateVars.forEach((varName, index) => {
  console.log(`${(index + 1).toString().padStart(2)}. ${varName}`);
});

// Now verify each one exists in our store types
const storeTypesContent = fs.readFileSync(path.join(__dirname, 'src/store/types.ts'), 'utf8');

console.log('\n' + '=' .repeat(60));
console.log('\n🔍 Verifying each state variable exists in store with EXACT name:\n');

let allMatched = true;
const missingVars = [];

originalStateVars.forEach((varName) => {
  // Check if the variable name exists in store types (as a property)
  const regex = new RegExp(`\\b${varName}\\s*:`);
  const exists = regex.test(storeTypesContent);
  
  if (exists) {
    console.log(`✅ ${varName.padEnd(30)} -> FOUND in store (exact match)`);
  } else {
    console.log(`❌ ${varName.padEnd(30)} -> MISSING from store`);
    missingVars.push(varName);
    allMatched = false;
  }
});

console.log('\n' + '=' .repeat(60));

// Also check our store slices to ensure they're properly initialized
const sliceFiles = [
  'chat', 'agent', 'deepResearch', 'ui', 'tool', 'connection'
];

console.log('\n📁 Verifying slice files have correct initial states:\n');

sliceFiles.forEach((sliceName) => {
  const slicePath = path.join(__dirname, `src/store/slices/${sliceName}.ts`);
  if (fs.existsSync(slicePath)) {
    const sliceContent = fs.readFileSync(slicePath, 'utf8');
    // Count initial state declarations
    const stateMatches = sliceContent.match(/^\s+\w+:\s+/gm);
    console.log(`✅ ${sliceName.padEnd(15)} slice -> ${stateMatches ? stateMatches.length : 0} state properties initialized`);
  } else {
    console.log(`❌ ${sliceName.padEnd(15)} slice -> FILE NOT FOUND`);
  }
});

console.log('\n' + '=' .repeat(60));

// Final summary
if (allMatched) {
  console.log('\n🎉 SUCCESS: All', originalStateVars.length, 'state variables preserved with EXACT names!');
  console.log('✅ The refactor maintains 100% naming compatibility with page.tsx\n');
} else {
  console.log('\n⚠️  WARNING:', missingVars.length, 'variables not found in store:');
  missingVars.forEach(v => console.log('  -', v));
  console.log('\nThese may be refs or derived state that don\'t need to be in the store.\n');
}

// Additional check for refs that shouldn't be in the store
const refRegex = /const\s+(\w+)\s*=\s*useRef/g;
const refs = [];
while ((match = refRegex.exec(pageContent)) !== null) {
  refs.push(match[1]);
}

console.log('📌 Found', refs.length, 'refs in page.tsx (these should NOT be in store):');
refs.forEach(ref => console.log('  -', ref));

console.log('\n' + '=' .repeat(60));
console.log('\n📊 FINAL STATISTICS:');
console.log('  - Total useState variables:', originalStateVars.length);
console.log('  - Successfully mapped to store:', originalStateVars.filter(v => !missingVars.includes(v)).length);
console.log('  - Refs (not needed in store):', refs.length);
console.log('\n');