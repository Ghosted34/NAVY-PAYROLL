#!/usr/bin/env node
/**
 * GENERATOR SCRIPT: src/ folder structure and template files
 * 
 * This script creates:
 * 1. All module directories
 * 2. Template files (.routes.js, .service.js, .repository.js) for each module
 * 3. The main.js entry point that imports all routes
 * 4. The test-src-structure.js validation script
 * 
 * Usage: node generate-src-structure.js
 */

const fs = require('fs');
const path = require('path');

const srcPath = path.join(__dirname, 'src');

// Template generators
const templates = {
  routes: (moduleName) => `/**
 * FILE: src/*\\/${moduleName}/${moduleName}.routes.js
 * 
 * Routes for ${moduleName}.
 */

"use strict";

const express = require("express");
const router = express.Router();
const ${moduleName}Service = require("./${moduleName}.service");

// Route handlers will be implemented here
// TODO: Implement ${moduleName} routes

module.exports = router;
`,

  service: (moduleName) => `/**
 * FILE: src/*\\/${moduleName}/${moduleName}.service.js
 * 
 * Business logic for ${moduleName}.
 */

"use strict";

// Service implementation
module.exports = {
  // TODO: Implement ${moduleName} service methods
};
`,

  repository: (moduleName) => `/**
 * FILE: src/*\\/${moduleName}/${moduleName}.repository.js
 * 
 * Database queries and data access for ${moduleName}.
 */

"use strict";

// Repository implementation
module.exports = {
  // TODO: Implement ${moduleName} repository methods
};
`,
};

// Define all modules with their paths
const modules = {
  'auth/unifiedLogin': 'unifiedLogin',
  'dashboard/stats': 'stats',
  'dashboard/notification': 'notification',
  'dashboard/preferences': 'preferences',
  'administration/users': 'users',
  'administration/roles': 'roles',
  'administration/switchpayrollclass': 'switchpayrollclass',
  'administration/permissions': 'permissions',
  'administration/payrollclassSetup': 'payrollclassSetup',
  'administration/payrollclassChange': 'payrollclassChange',
  'administration/changeregNo': 'changeregNo',
  'administration/companyProfile': 'companyProfile',
  'administration/monthendProcessing': 'monthendProcessing',
  'administration/irregular-oneoff/oneoffrank': 'oneoffrank',
  'administration/irregular-oneoff/reportRequirementSetup': 'reportRequirementSetup',
  'administration/irregular-oneoff/individualPayment': 'individualPayment',
  'administration/irregular-oneoff/oneoff-calculation': 'oneoffCalculation',
  'administration/irregular-oneoff/oneoff-reports': 'oneoffReports',
  'personnelProfile/personnels': 'personnels',
  'dataEntry/paymentDeductions': 'paymentDeductions',
  'dataEntry/arrearsCalculations': 'arrearsCalculations',
  'dataEntry/cummulativePayroll': 'cummulativePayroll',
  'dataEntry/inputDocumentation': 'inputDocumentation',
  'dataEntry/payHeadAdjustments': 'payHeadAdjustments',
  'fileUpdate/inputVariable': 'inputVariable',
  'fileUpdate/masterFileUpdate': 'masterFileUpdate',
  'fileUpdate/personnelData': 'personnelData',
  'fileUpdate/recallPayment': 'recallPayment',
  'fileUpdate/savePayroll': 'savePayroll',
  'payrollCalculations/payrollCalculation': 'payrollCalculation',
  'payrollCalculations/backup': 'backup',
  'payrollCalculations/restore': 'restore',
  'payrollCalculations/calculationReports': 'calculationReports',
  'utilities/backup-db': 'backupDb',
  'utilities/restore-db': 'restoreDb',
  'utilities/ippis-payment': 'ippisPayment',
  'utilities/consolidated-payslips': 'consolidatedPayslips',
  'referenceTable/states': 'states',
  'referenceTable/payelements': 'payelements',
  'referenceTable/overtime': 'overtime',
  'referenceTable/bankdetails': 'bankdetails',
  'referenceTable/localgovernment': 'localgovernment',
  'referenceTable/department': 'department',
  'referenceTable/command': 'command',
  'referenceTable/tax': 'tax',
  'referenceTable/payperrank': 'payperrank',
  'referenceTable/mutuallyexclusive': 'mutuallyexclusive',
  'referenceTable/salaryscale': 'salaryscale',
  'referenceTable/pfa': 'pfa',
  'referenceTable/dropdownhelper': 'dropdownhelper',
  'reports/erndedAnalysis': 'erndedAnalysis',
  'reports/loanAnalysis': 'loanAnalysis',
  'reports/nathouseFunds': 'nathouseFunds',
  'reports/personnelReport': 'personnelReport',
  'reports/nstif': 'nstif',
  'reports/paydedBankAnalysis': 'paydedBankAnalysis',
  'reports/paymentsBank': 'paymentsBank',
  'reports/controlSheet': 'controlSheet',
  'reports/payrollRegister': 'payrollRegister',
  'reports/payslips': 'payslips',
  'reports/salaryReconcile': 'salaryReconcile',
  'reports/salarySummary': 'salarySummary',
  'reports/salaryHistory': 'salaryHistory',
  'reports/taxstatePay': 'taxstatePay',
  'auditTrail/duplicateAccno': 'duplicateAccno',
  'auditTrail/overpayment': 'overpayment',
  'auditTrail/personalDetailsRecord': 'personalDetailsRecord',
  'auditTrail/salaryVariance': 'salaryVariance',
  'auditTrail/variationInput': 'variationInput',
  'auditTrail/rangePayments': 'rangePayments',
  'userDashboard/email/mailSystem': 'mailSystem',
  'userDashboard/payslips/userpayslip': 'userpayslip',
  'userDashboard/payslips/adminpayslip': 'adminpayslip',
  'userDashboard/emolument/admin': 'admin',
  'userDashboard/emolument/audit': 'audit',
  'userDashboard/emolument/form': 'form',
  'userDashboard/emolument/system': 'system',
  'userDashboard/emolument/do': 'do',
  'userDashboard/emolument/fo': 'fo',
  'userDashboard/emolument/cpo': 'cpo',
  'userDashboard/emolument/reports': 'reports',
  'userDashboard/emolument/documents': 'documents',
  'userDashboard/emolument/tickets': 'tickets',
  'fileUploadHelper/salaryscaleupload': 'salaryscaleupload',
  'fileUploadHelper/personnelUpload': 'personnelUpload',
  'fileUploadHelper/paydedUpload': 'paydedUpload',
  'fileUploadHelper/inputDocumentationUpload': 'inputDocumentationUpload',
  'helpers/puppeteer-gen-reports/paydedReport': 'paydedReport',
  'helpers/logService': 'logService',
};

console.log('📁 Generating src/ folder structure and template files...\n');

let created = 0;
let failed = 0;

// Create directories and files
Object.entries(modules).forEach(([modulePath, moduleName]) => {
  const fullPath = path.join(srcPath, modulePath);
  
  try {
    // Create directory if it doesn't exist
    if (!fs.existsSync(fullPath)) {
      fs.mkdirSync(fullPath, { recursive: true });
    }
    
    // Create template files
    const fileTypes = ['routes', 'service', 'repository'];
    fileTypes.forEach((fileType) => {
      const fileName = `${moduleName}.${fileType}.js`;
      const filePath = path.join(fullPath, fileName);
      
      if (!fs.existsSync(filePath)) {
        const content = templates[fileType](moduleName);
        fs.writeFileSync(filePath, content);
        created++;
      }
    });
    
    console.log(`✅ ${modulePath}`);
  } catch (err) {
    console.error(`❌ Failed to create ${modulePath}:`, err.message);
    failed++;
  }
});

console.log(`\n✅ Created ${created} template files across ${Object.keys(modules).length} modules!`);
if (failed > 0) console.log(`⚠️  ${failed} operations failed.`);

// Generate main.js
console.log('\n📝 Generating src/main.js...');

const mainJsContent = generateMainJs();
const mainJsPath = path.join(srcPath, 'main.js');
fs.writeFileSync(mainJsPath, mainJsContent);
console.log('✅ src/main.js created!');

console.log('\n✨ Generation complete! The src/ structure is ready for development.');

function generateMainJs() {
  let imports = '';
  let exports = '';

  // Group modules by category
  const categories = {};
  Object.entries(modules).forEach(([modulePath, moduleName]) => {
    const category = modulePath.split('/')[0];
    if (!categories[category]) {
      categories[category] = [];
    }
    categories[category].push([modulePath, moduleName]);
  });

  // Generate imports
  let lineNum = 1;
  Object.entries(categories).forEach(([category, categoryModules]) => {
    imports += `// ${category.toUpperCase()}\n`;
    categoryModules.forEach(([modulePath, moduleName]) => {
      const pathFromSrc = `./${modulePath}/${moduleName}.routes`;
      imports += `const ${toCamelCase(moduleName)}Routes = require("${pathFromSrc}");\n`;
    });
    imports += '\n';
  });

  // Generate exports/registrations
  exports += `module.exports = (app) => {\n`;
  Object.entries(categories).forEach(([category, categoryModules]) => {
    exports += `  // ${category.toUpperCase()}\n`;
    categoryModules.forEach(([modulePath, moduleName]) => {
      const routePath = '/' + modulePath.split('/').slice(1).join('/').replace(/([a-z])([A-Z])/g, '$1-$2').toLowerCase();
      exports += `  app.use("${routePath}", ${toCamelCase(moduleName)}Routes);\n`;
    });
    exports += '\n';
  });
  exports += `};\n`;

  return `/**
 * FILE: src/main.js
 * 
 * Main entry point for API route registration.
 * This file imports all routes from the src/ modules and exports
 * a function that registers them with the Express app.
 * 
 * Usage in server.js or routes/index.js:
 * const srcRoutes = require('./src/main');
 * srcRoutes(app);
 */

"use strict";

${imports}
${exports}
`;
}

function toCamelCase(str) {
  return str
    .replace(/(?:^\w|[A-Z]|\b\w)/g, (word, index) => (index === 0 ? word.toLowerCase() : word.toUpperCase()))
    .replace(/-/g, '');
}
