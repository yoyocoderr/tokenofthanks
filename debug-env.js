#!/usr/bin/env node

// Debug script to check environment variables
require('dotenv').config();

console.log('🔍 Environment Variable Debug');
console.log('=============================');

const frontendUrl = process.env.FRONTEND_URL;
console.log('FRONTEND_URL:', JSON.stringify(frontendUrl));
console.log('FRONTEND_URL length:', frontendUrl ? frontendUrl.length : 'undefined');
console.log('FRONTEND_URL trimmed:', JSON.stringify(frontendUrl ? frontendUrl.trim() : 'undefined'));

if (frontendUrl) {
  console.log('Character codes:');
  Array.from(frontendUrl).forEach((char, index) => {
    const code = char.charCodeAt(0);
    const hex = code.toString(16).padStart(4, '0');
    console.log(`  ${index}: '${char}' (U+${hex}, ${code})`);
  });
  
  // Check for common problematic characters
  const hasNewline = frontendUrl.includes('\n') || frontendUrl.includes('\r');
  const hasTab = frontendUrl.includes('\t');
  const hasSpace = frontendUrl.startsWith(' ') || frontendUrl.endsWith(' ');
  
  console.log('\nProblematic characters:');
  console.log('  Has newline:', hasNewline);
  console.log('  Has tab:', hasTab);
  console.log('  Has leading/trailing space:', hasSpace);
  
  if (hasNewline || hasTab || hasSpace) {
    console.log('\n❌ Found problematic characters!');
    console.log('Please clean your environment variable.');
  } else {
    console.log('\n✅ No problematic characters found.');
  }
} else {
  console.log('❌ FRONTEND_URL is not set');
}

console.log('\nOther relevant env vars:');
console.log('NODE_ENV:', process.env.NODE_ENV);
console.log('PORT:', process.env.PORT);
