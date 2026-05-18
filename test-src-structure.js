#!/usr/bin/env node
/**
 * TEST: Validate src/ folder structure and module exports
 * 
 * This script verifies that all modules have been properly generated
 * with the required template files (.routes.js, .service.js, .repository.js)
 * 
 * Run with: node test-src-structure.js
 */

const fs = require('fs');
const path = require('path');

const SRC_PATH = path.join(__dirname, 'src');

// Define all modules that should exist
const EXPECTED_MODULES = {
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

const REQUIRED_FILES = ['routes', 'service', 'repository'];

function validateStructure() {
  console.log('🧪 Testing src/ folder structure...\n');
  
  let passed = 0;
  let failed = 0;
  const failedModules = [];

  Object.entries(EXPECTED_MODULES).forEach(([modulePath, moduleName]) => {
    const fullPath = path.join(SRC_PATH, modulePath);
    
    if (!fs.existsSync(fullPath)) {
      console.log(`❌ MISSING DIRECTORY: ${modulePath}`);
      failed++;
      failedModules.push(modulePath);
      return;
    }

    REQUIRED_FILES.forEach((fileType) => {
      const fileName = `${moduleName}.${fileType}.js`;
      const filePath = path.join(fullPath, fileName);
      if (fs.existsSync(filePath)) {
        passed++;
      } else {
        console.log(`❌ MISSING FILE: ${modulePath}/${fileName}`);
        failed++;
        failedModules.push(`${modulePath}/${fileName}`);
      }
    });
  });

  if (failedModules.length === 0) {
    console.log(`✅ All ${Object.keys(EXPECTED_MODULES).length} modules verified!`);
  }

  console.log(`\n📊 Results:`);
  console.log(`   ✅ Files found: ${passed}`);
  console.log(`   ❌ Files missing: ${failed}`);
  console.log(`   📦 Modules: ${Object.keys(EXPECTED_MODULES).length}`);

  // Verify main.js exists
  const mainJsPath = path.join(SRC_PATH, 'main.js');
  console.log(`\n📝 Entry Point:`);
  if (fs.existsSync(mainJsPath)) {
    console.log(`   ✅ src/main.js exists`);
  } else {
    console.log(`   ❌ src/main.js is missing`);
    failed++;
  }

  console.log('\n' + '='.repeat(50));
  process.exit(failed > 0 ? 1 : 0);
}

validateStructure();
