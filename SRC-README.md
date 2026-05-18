# API Infrastructure Setup Guide

This folder structure generates a well-organized API infrastructure based on the routes defined in `routes/index.js`.

## Quick Start

### Option 1: Automated Setup (Recommended)

```bash
node install-runner.js
```

This will:
1. Generate the complete src/ folder structure
2. Create template files (.routes.js, .service.js, .repository.js)
3. Generate src/main.js entry point
4. Validate the generated structure

### Option 2: Step-by-Step

1. **Generate Structure:**
   ```bash
   node generate-full-src-structure.js
   ```

2. **Validate Structure:**
   ```bash
   node test-src-structure.js
   ```

## Folder Structure

The generated `src/` folder contains 74+ modules organized by category:

```
src/
├── auth/
│   └── unifiedLogin/
├── dashboard/
│   ├── stats/
│   ├── notification/
│   └── preferences/
├── administration/
│   ├── users/
│   ├── roles/
│   ├── ... (8 more modules)
│   └── irregular-oneoff/
├── personnelProfile/
├── dataEntry/
├── fileUpdate/
├── payrollCalculations/
├── utilities/
├── referenceTable/ (13 modules)
├── reports/ (14 modules)
├── auditTrail/
├── userDashboard/
│   ├── email/mailSystem/
│   ├── payslips/
│   └── emolument/ (9 sub-modules)
├── fileUploadHelper/
├── helpers/
├── common/
└── main.js (entry point)
```

## Module Structure

Each module follows this pattern:

```
moduleName/
├── moduleName.routes.js      # Express route handlers
├── moduleName.service.js     # Business logic
└── moduleName.repository.js  # Database queries
```

### Example: unifiedLogin

```javascript
// src/auth/unifiedLogin/unifiedLogin.routes.js
const express = require("express");
const router = express.Router();
const unifiedLoginService = require("./unifiedLogin.service");

// Implement routes here
module.exports = router;

// src/auth/unifiedLogin/unifiedLogin.service.js
module.exports = {
  // Implement business logic here
};

// src/auth/unifiedLogin/unifiedLogin.repository.js
module.exports = {
  // Implement database queries here
};
```

## Integration with Express App

In your `routes/index.js` or `server.js`, import the main entry point:

```javascript
const srcRoutes = require('./src/main');

module.exports = (app) => {
  // ... existing routes ...
  
  // Register all src/ module routes
  srcRoutes(app);
};
```

Or in `server.js`:

```javascript
const express = require('express');
const app = express();
const srcRoutes = require('./src/main');

// ... middleware ...

srcRoutes(app);

app.listen(3000, () => {
  console.log('Server running on port 3000');
});
```

## src/main.js

The `src/main.js` file is the central entry point that:
1. Imports all module routes from the src/ directory
2. Exports a function that registers routes with the Express app
3. Maps each module to its appropriate API endpoint

**Example output from src/main.js:**

```javascript
module.exports = (app) => {
  // AUTH
  app.use("/auth/unifiedLogin", unifiedLoginRoutes);
  
  // DASHBOARD
  app.use("/dashboard/stats", statsRoutes);
  app.use("/dashboard/notification", notificationRoutes);
  app.use("/dashboard/preferences", preferencesRoutes);
  
  // ADMINISTRATION
  app.use("/administration/users", usersRoutes);
  // ... etc
};
```

## Development Workflow

1. **Generate the structure:**
   ```bash
   node generate-full-src-structure.js
   ```

2. **Validate the structure:**
   ```bash
   node test-src-structure.js
   ```

3. **Implement module logic:**
   - Edit `src/<category>/<module>/<module>.service.js` for business logic
   - Edit `src/<category>/<module>/<module>.repository.js` for database queries
   - Edit `src/<category>/<module>/<module>.routes.js` for route handlers

4. **Test your implementation:**
   ```bash
   npm test
   ```

## Module Categories

### Auth (1 module)
- unifiedLogin

### Dashboard (3 modules)
- stats
- notification
- preferences

### Administration (13 modules)
- users, roles, switchpayrollclass, permissions, payrollclassSetup, payrollclassChange
- changeregNo, companyProfile, monthendProcessing
- irregular-oneoff: oneoffrank, reportRequirementSetup, individualPayment, oneoffCalculation, oneoffReports

### Personnel Profile (1 module)
- personnels

### Data Entry (5 modules)
- paymentDeductions, arrearsCalculations, cummulativePayroll, inputDocumentation, payHeadAdjustments

### File Update (5 modules)
- inputVariable, masterFileUpdate, personnelData, recallPayment, savePayroll

### Payroll Calculations (4 modules)
- payrollCalculation, backup, restore, calculationReports

### Utilities (4 modules)
- backup-db, restore-db, ippis-payment, consolidated-payslips

### Reference Tables (13 modules)
- states, payelements, overtime, bankdetails, localgovernment, department, command
- tax, payperrank, mutuallyexclusive, salaryscale, pfa, dropdownhelper

### Reports (14 modules)
- erndedAnalysis, loanAnalysis, nathouseFunds, personnelReport, nstif
- paydedBankAnalysis, paymentsBank, controlSheet, payrollRegister, payslips
- salaryReconcile, salarySummary, salaryHistory, taxstatePay

### Audit Trail (6 modules)
- duplicateAccno, overpayment, personalDetailsRecord, salaryVariance, variationInput, rangePayments

### User Dashboard (12 modules)
- email: mailSystem
- payslips: userpayslip, adminpayslip
- emolument: admin, audit, form, system, do, fo, cpo, reports, documents, tickets

### File Upload Helper (4 modules)
- salaryscaleupload, personnelUpload, paydedUpload, inputDocumentationUpload

### Helpers (2 modules)
- puppeteer-gen-reports: paydedReport
- logService

## Files Created

- `generate-full-src-structure.js` - Main generator script
- `test-src-structure.js` - Validation script
- `install-runner.js` - Automated setup runner
- `src/main.js` - Generated entry point (after running generator)
- `src/*/` - All module directories and template files (after running generator)

## Troubleshooting

### Generator fails to create directories
Ensure you have write permissions in the project directory.

### Test fails with missing files
Re-run the generator: `node generate-full-src-structure.js`

### Routes not registering
Ensure `src/main.js` is properly imported in your Express app initialization.

## Notes

- The `routes/index.js` file remains unchanged
- The `src/` folder is the new centralized module location
- Each module is self-contained with routes, service, and repository layers
- Follow the 3-layer architecture pattern for consistency
