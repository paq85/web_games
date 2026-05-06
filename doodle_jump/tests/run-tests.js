const fs = require('fs');
const path = require('path');

// Simple test framework
let passed = 0;
let failed = 0;
let total = 0;

function assert(condition, message) {
  total++;
  if (condition) {
    passed++;
    console.log(`  ✓ ${message}`);
  } else {
    failed++;
    console.error(`  ✗ ${message}`);
  }
}

function assertEquals(actual, expected, message) {
  total++;
  if (actual === expected) {
    passed++;
    console.log(`  ✓ ${message}`);
  } else {
    failed++;
    console.error(`  ✗ ${message}`);
    console.error(`    Expected: ${expected}, Got: ${actual}`);
  }
}

function assertNotEquals(actual, expected, message) {
  total++;
  if (actual !== expected) {
    passed++;
    console.log(`  ✓ ${message}`);
  } else {
    failed++;
    console.error(`  ✗ ${message}`);
  }
}

function assertTrue(value, message) {
  assert(value === true, message);
}

function assertFalse(value, message) {
  assert(value === false, message);
}

function assertInArray(value, array, message) {
  total++;
  if (array.includes(value)) {
    passed++;
    console.log(`  ✓ ${message}`);
  } else {
    failed++;
    console.error(`  ✗ ${message}`);
    console.error(`    ${value} not in ${array}`);
  }
}

function assertGreaterThan(actual, expected, message) {
  total++;
  if (actual > expected) {
    passed++;
    console.log(`  ✓ ${message}`);
  } else {
    failed++;
    console.error(`  ✗ ${message}`);
    console.error(`    ${actual} is not > ${expected}`);
  }
}

function assertLessThan(actual, expected, message) {
  total++;
  if (actual < expected) {
    passed++;
    console.log(`  ✓ ${message}`);
  } else {
    failed++;
    console.error(`  ✗ ${message}`);
    console.error(`    ${actual} is not < ${expected}`);
  }
}

function assertGreaterThanOrEqual(actual, expected, message) {
  total++;
  if (actual >= expected) {
    passed++;
    console.log(`  ✓ ${message}`);
  } else {
    failed++;
    console.error(`  ✗ ${message}`);
  }
}

function assertObjectHas(obj, keys, message) {
  total++;
  const hasAll = keys.every(k => obj.hasOwnProperty(k));
  if (hasAll) {
    passed++;
    console.log(`  ✓ ${message}`);
  } else {
    failed++;
    console.error(`  ✗ ${message}`);
  }
}

// Run a test group
function testGroup(name, fn) {
  console.log(`\n${name}`);
  fn();
}

// Export for test files
global.assert = assert;
global.assertEquals = assertEquals;
global.assertNotEquals = assertNotEquals;
global.assertTrue = assertTrue;
global.assertFalse = assertFalse;
global.assertInArray = assertInArray;
global.assertGreaterThan = assertGreaterThan;
global.assertLessThan = assertLessThan;
global.assertGreaterThanOrEqual = assertGreaterThanOrEqual;
global.assertObjectHas = assertObjectHas;
global.testGroup = testGroup;

// Read and evaluate test files
const testDir = path.join(__dirname);
const testFiles = fs.readdirSync(testDir)
  .filter(f => f.endsWith('.test.js') && f !== 'run-tests.js');

console.log('\n========================================');
console.log('  Doodle Jump Unit Tests');
console.log('========================================');

for (const file of testFiles) {
  try {
    const filePath = path.join(testDir, file);
    const content = fs.readFileSync(filePath, 'utf-8');
    // Transform ES modules to CommonJS for Node.js
    const transformed = content
      .replace(/import\s*\{([^}]+)\}\s*from\s*['"]\.\/([^'"]+)['"]/g, (match, imports, module) => {
        const names = imports.split(',').map(n => n.trim()).filter(Boolean);
        const baseName = module.replace(/\.js$/, '').replace(/[.-]/g, '_');
        return `const ${baseName} = require('./${module}');`;
      })
      .replace(/export\s+(const|let|var|function|class)\s+(\w+)/g, (match, type, name) => {
        return `global.__${name} = ${type === 'const' || type === 'let' || type === 'var' ? '' : type + ' '}${name}`;
      });

    eval(transformed);
  } catch (e) {
    console.error(`\nError loading ${file}:`, e.message);
  }
}

console.log('\n========================================');
console.log(`  Results: ${passed}/${total} passed, ${failed} failed`);
console.log('========================================\n');

process.exit(failed > 0 ? 1 : 0);
