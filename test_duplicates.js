// Test script to verify Budget vs Actuals Analysis is no longer duplicated

console.log('✅ Testing Budget vs Actuals Analysis duplication fix...');

// Check if the duplicate creation has been removed from page.tsx
const fs = require('fs');
const pageContent = fs.readFileSync('./src/app/page.tsx', 'utf8');

// Count occurrences of Budget Variance Analysis creation
const budgetVarianceCreations = (pageContent.match(/title: ['"].*Budget.*Variance.*Analysis['"]|title: ['"].*Budget vs Actual.*Analysis['"]|Budget.*vs.*Actual.*Variance.*Analysis/g) || []).length;

console.log(`Budget Variance Analysis creations found: ${budgetVarianceCreations}`);

// Check if the automatic creation on CSV upload is still present
const hasAutomaticCreation = pageContent.includes('createBudgetVarianceAnalysisCard');
console.log(`Automatic creation on CSV upload: ${hasAutomaticCreation ? '✅ Present' : '❌ Missing'}`);

// Check if the duplicate useEffect creation has been removed
const hasUseEffectCreation = pageContent.includes('Budget vs Actual Variance Analysis') && pageContent.includes('useEffect');
console.log(`useEffect duplicate creation: ${hasUseEffectCreation ? '❌ Still present' : '✅ Removed'}`);

console.log('\n📊 Summary:');
console.log('- Budget Variance Analysis should appear only once (from automatic CSV upload creation)');
console.log('- The duplicate creation in useEffect should be removed');
console.log('- The automatic creation function should still exist for when users upload CSV files');

console.log('\n✅ Test completed!');
