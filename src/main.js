/**
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

// AUTH
const unifiedLoginRoutes = require("./auth/unifiedLogin/unifiedLogin.routes");

// DASHBOARD
const statsRoutes = require("./dashboard/stats/stats.routes");
const notificationRoutes = require("./dashboard/notification/notification.routes");
const preferencesRoutes = require("./dashboard/preferences/preferences.routes");

// ADMINISTRATION
const usersRoutes = require("./administration/users/users.routes");
const rolesRoutes = require("./administration/roles/roles.routes");
const switchpayrollclassRoutes = require("./administration/switchpayrollclass/switchpayrollclass.routes");
const permissionsRoutes = require("./administration/permissions/permissions.routes");
const payrollclassSetupRoutes = require("./administration/payrollclassSetup/payrollclassSetup.routes");
const payrollclassChangeRoutes = require("./administration/payrollclassChange/payrollclassChange.routes");
const changeregNoRoutes = require("./administration/changeregNo/changeregNo.routes");
const companyProfileRoutes = require("./administration/companyProfile/companyProfile.routes");
const monthendProcessingRoutes = require("./administration/monthendProcessing/monthendProcessing.routes");
const oneoffrankRoutes = require("./administration/irregular-oneoff/oneoffrank/oneoffrank.routes");
const reportRequirementSetupRoutes = require("./administration/irregular-oneoff/reportRequirementSetup/reportRequirementSetup.routes");
const individualPaymentRoutes = require("./administration/irregular-oneoff/individualPayment/individualPayment.routes");
const oneoffCalculationRoutes = require("./administration/irregular-oneoff/oneoff-calculation/oneoffCalculation.routes");
const oneoffReportsRoutes = require("./administration/irregular-oneoff/oneoff-reports/oneoffReports.routes");

// PERSONNELPROFILE
const personnelsRoutes = require("./personnelProfile/personnels/personnels.routes");

// DATAENTRY
const paymentDeductionsRoutes = require("./dataEntry/paymentDeductions/paymentDeductions.routes");
const arrearsCalculationsRoutes = require("./dataEntry/arrearsCalculations/arrearsCalculations.routes");
const cummulativePayrollRoutes = require("./dataEntry/cummulativePayroll/cummulativePayroll.routes");
const inputDocumentationRoutes = require("./dataEntry/inputDocumentation/inputDocumentation.routes");
const payHeadAdjustmentsRoutes = require("./dataEntry/payHeadAdjustments/payHeadAdjustments.routes");

// FILEUPDATE
const inputVariableRoutes = require("./fileUpdate/inputVariable/inputVariable.routes");
const masterFileUpdateRoutes = require("./fileUpdate/masterFileUpdate/masterFileUpdate.routes");
const personnelDataRoutes = require("./fileUpdate/personnelData/personnelData.routes");
const recallPaymentRoutes = require("./fileUpdate/recallPayment/recallPayment.routes");
const savePayrollRoutes = require("./fileUpdate/savePayroll/savePayroll.routes");

// PAYROLLCALCULATIONS
const payrollCalculationRoutes = require("./payrollCalculations/payrollCalculation/payrollCalculation.routes");
const backupRoutes = require("./payrollCalculations/backup/backup.routes");
const restoreRoutes = require("./payrollCalculations/restore/restore.routes");
const calculationReportsRoutes = require("./payrollCalculations/calculationReports/calculationReports.routes");

// UTILITIES
const backupDbRoutes = require("./utilities/backup-db/backupDb.routes");
const restoreDbRoutes = require("./utilities/restore-db/restoreDb.routes");
const ippisPaymentRoutes = require("./utilities/ippis-payment/ippisPayment.routes");
const consolidatedPayslipsRoutes = require("./utilities/consolidated-payslips/consolidatedPayslips.routes");

// REFERENCETABLE
const statesRoutes = require("./referenceTable/states/states.routes");
const payelementsRoutes = require("./referenceTable/payelements/payelements.routes");
const overtimeRoutes = require("./referenceTable/overtime/overtime.routes");
const bankdetailsRoutes = require("./referenceTable/bankdetails/bankdetails.routes");
const localgovernmentRoutes = require("./referenceTable/localgovernment/localgovernment.routes");
const departmentRoutes = require("./referenceTable/department/department.routes");
const commandRoutes = require("./referenceTable/command/command.routes");
const taxRoutes = require("./referenceTable/tax/tax.routes");
const payperrankRoutes = require("./referenceTable/payperrank/payperrank.routes");
const mutuallyexclusiveRoutes = require("./referenceTable/mutuallyexclusive/mutuallyexclusive.routes");
const salaryscaleRoutes = require("./referenceTable/salaryscale/salaryscale.routes");
const pfaRoutes = require("./referenceTable/pfa/pfa.routes");
const dropdownhelperRoutes = require("./referenceTable/dropdownhelper/dropdownhelper.routes");

// REPORTS
const erndedAnalysisRoutes = require("./reports/erndedAnalysis/erndedAnalysis.routes");
const loanAnalysisRoutes = require("./reports/loanAnalysis/loanAnalysis.routes");
const nathouseFundsRoutes = require("./reports/nathouseFunds/nathouseFunds.routes");
const personnelReportRoutes = require("./reports/personnelReport/personnelReport.routes");
const nstifRoutes = require("./reports/nstif/nstif.routes");
const paydedBankAnalysisRoutes = require("./reports/paydedBankAnalysis/paydedBankAnalysis.routes");
const paymentsBankRoutes = require("./reports/paymentsBank/paymentsBank.routes");
const controlSheetRoutes = require("./reports/controlSheet/controlSheet.routes");
const payrollRegisterRoutes = require("./reports/payrollRegister/payrollRegister.routes");
const payslipsRoutes = require("./reports/payslips/payslips.routes");
const salaryReconcileRoutes = require("./reports/salaryReconcile/salaryReconcile.routes");
const salarySummaryRoutes = require("./reports/salarySummary/salarySummary.routes");
const salaryHistoryRoutes = require("./reports/salaryHistory/salaryHistory.routes");
const taxstatePayRoutes = require("./reports/taxstatePay/taxstatePay.routes");

// AUDITTRAIL
const duplicateAccnoRoutes = require("./auditTrail/duplicateAccno/duplicateAccno.routes");
const overpaymentRoutes = require("./auditTrail/overpayment/overpayment.routes");
const personalDetailsRecordRoutes = require("./auditTrail/personalDetailsRecord/personalDetailsRecord.routes");
const salaryVarianceRoutes = require("./auditTrail/salaryVariance/salaryVariance.routes");
const variationInputRoutes = require("./auditTrail/variationInput/variationInput.routes");
const rangePaymentsRoutes = require("./auditTrail/rangePayments/rangePayments.routes");

// USERDASHBOARD
const mailSystemRoutes = require("./userDashboard/email/mailSystem/mailSystem.routes");
const userpayslipRoutes = require("./userDashboard/payslips/userpayslip/userpayslip.routes");
const adminpayslipRoutes = require("./userDashboard/payslips/adminpayslip/adminpayslip.routes");
const adminRoutes = require("./userDashboard/emolument/admin/admin.routes");
const auditRoutes = require("./userDashboard/emolument/audit/audit.routes");
const formRoutes = require("./userDashboard/emolument/form/form.routes");
const systemRoutes = require("./userDashboard/emolument/system/system.routes");
const doRoutes = require("./userDashboard/emolument/do/do.routes");
const foRoutes = require("./userDashboard/emolument/fo/fo.routes");
const cpoRoutes = require("./userDashboard/emolument/cpo/cpo.routes");
const reportsRoutes = require("./userDashboard/emolument/reports/reports.routes");
const documentsRoutes = require("./userDashboard/emolument/documents/documents.routes");
const ticketsRoutes = require("./userDashboard/emolument/tickets/tickets.routes");

// FILEUPLOADHELPER
const salaryscaleuploadRoutes = require("./fileUploadHelper/salaryscaleupload/salaryscaleupload.routes");
const personnelUploadRoutes = require("./fileUploadHelper/personnelUpload/personnelUpload.routes");
const paydedUploadRoutes = require("./fileUploadHelper/paydedUpload/paydedUpload.routes");
const inputDocumentationUploadRoutes = require("./fileUploadHelper/inputDocumentationUpload/inputDocumentationUpload.routes");

// HELPERS
const paydedReportRoutes = require("./helpers/puppeteer-gen-reports/paydedReport/paydedReport.routes");
const logServiceRoutes = require("./helpers/logService/logService.routes");


module.exports = (app) => {
  // AUTH
  app.use("/unified-login", unifiedLoginRoutes);

  // DASHBOARD
  app.use("/stats", statsRoutes);
  app.use("/notification", notificationRoutes);
  app.use("/preferences", preferencesRoutes);

  // ADMINISTRATION
  app.use("/users", usersRoutes);
  app.use("/roles", rolesRoutes);
  app.use("/switchpayrollclass", switchpayrollclassRoutes);
  app.use("/permissions", permissionsRoutes);
  app.use("/payrollclass-setup", payrollclassSetupRoutes);
  app.use("/payrollclass-change", payrollclassChangeRoutes);
  app.use("/changereg-no", changeregNoRoutes);
  app.use("/company-profile", companyProfileRoutes);
  app.use("/monthend-processing", monthendProcessingRoutes);
  app.use("/irregular-oneoff/oneoffrank", oneoffrankRoutes);
  app.use("/irregular-oneoff/report-requirement-setup", reportRequirementSetupRoutes);
  app.use("/irregular-oneoff/individual-payment", individualPaymentRoutes);
  app.use("/irregular-oneoff/oneoff-calculation", oneoffCalculationRoutes);
  app.use("/irregular-oneoff/oneoff-reports", oneoffReportsRoutes);

  // PERSONNELPROFILE
  app.use("/personnels", personnelsRoutes);

  // DATAENTRY
  app.use("/payment-deductions", paymentDeductionsRoutes);
  app.use("/arrears-calculations", arrearsCalculationsRoutes);
  app.use("/cummulative-payroll", cummulativePayrollRoutes);
  app.use("/input-documentation", inputDocumentationRoutes);
  app.use("/pay-head-adjustments", payHeadAdjustmentsRoutes);

  // FILEUPDATE
  app.use("/input-variable", inputVariableRoutes);
  app.use("/master-file-update", masterFileUpdateRoutes);
  app.use("/personnel-data", personnelDataRoutes);
  app.use("/recall-payment", recallPaymentRoutes);
  app.use("/save-payroll", savePayrollRoutes);

  // PAYROLLCALCULATIONS
  app.use("/payroll-calculation", payrollCalculationRoutes);
  app.use("/backup", backupRoutes);
  app.use("/restore", restoreRoutes);
  app.use("/calculation-reports", calculationReportsRoutes);

  // UTILITIES
  app.use("/backup-db", backupDbRoutes);
  app.use("/restore-db", restoreDbRoutes);
  app.use("/ippis-payment", ippisPaymentRoutes);
  app.use("/consolidated-payslips", consolidatedPayslipsRoutes);

  // REFERENCETABLE
  app.use("/states", statesRoutes);
  app.use("/payelements", payelementsRoutes);
  app.use("/overtime", overtimeRoutes);
  app.use("/bankdetails", bankdetailsRoutes);
  app.use("/localgovernment", localgovernmentRoutes);
  app.use("/department", departmentRoutes);
  app.use("/command", commandRoutes);
  app.use("/tax", taxRoutes);
  app.use("/payperrank", payperrankRoutes);
  app.use("/mutuallyexclusive", mutuallyexclusiveRoutes);
  app.use("/salaryscale", salaryscaleRoutes);
  app.use("/pfa", pfaRoutes);
  app.use("/dropdownhelper", dropdownhelperRoutes);

  // REPORTS
  app.use("/ernded-analysis", erndedAnalysisRoutes);
  app.use("/loan-analysis", loanAnalysisRoutes);
  app.use("/nathouse-funds", nathouseFundsRoutes);
  app.use("/personnel-report", personnelReportRoutes);
  app.use("/nstif", nstifRoutes);
  app.use("/payded-bank-analysis", paydedBankAnalysisRoutes);
  app.use("/payments-bank", paymentsBankRoutes);
  app.use("/control-sheet", controlSheetRoutes);
  app.use("/payroll-register", payrollRegisterRoutes);
  app.use("/payslips", payslipsRoutes);
  app.use("/salary-reconcile", salaryReconcileRoutes);
  app.use("/salary-summary", salarySummaryRoutes);
  app.use("/salary-history", salaryHistoryRoutes);
  app.use("/taxstate-pay", taxstatePayRoutes);

  // AUDITTRAIL
  app.use("/duplicate-accno", duplicateAccnoRoutes);
  app.use("/overpayment", overpaymentRoutes);
  app.use("/personal-details-record", personalDetailsRecordRoutes);
  app.use("/salary-variance", salaryVarianceRoutes);
  app.use("/variation-input", variationInputRoutes);
  app.use("/range-payments", rangePaymentsRoutes);

  // USERDASHBOARD
  app.use("/email/mail-system", mailSystemRoutes);
  app.use("/payslips/userpayslip", userpayslipRoutes);
  app.use("/payslips/adminpayslip", adminpayslipRoutes);
  app.use("/emolument/admin", adminRoutes);
  app.use("/emolument/audit", auditRoutes);
  app.use("/emolument/form", formRoutes);
  app.use("/emolument/system", systemRoutes);
  app.use("/emolument/do", doRoutes);
  app.use("/emolument/fo", foRoutes);
  app.use("/emolument/cpo", cpoRoutes);
  app.use("/emolument/reports", reportsRoutes);
  app.use("/emolument/documents", documentsRoutes);
  app.use("/emolument/tickets", ticketsRoutes);

  // FILEUPLOADHELPER
  app.use("/salaryscaleupload", salaryscaleuploadRoutes);
  app.use("/personnel-upload", personnelUploadRoutes);
  app.use("/payded-upload", paydedUploadRoutes);
  app.use("/input-documentation-upload", inputDocumentationUploadRoutes);

  // HELPERS
  app.use("/puppeteer-gen-reports/payded-report", paydedReportRoutes);
  app.use("/log-service", logServiceRoutes);

};

