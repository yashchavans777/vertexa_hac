const express = require('express');
const router = express.Router();
const gatewayController = require('../controllers/gatewayController');

// Step 2: Evaluate incoming action request
router.post('/evaluate', gatewayController.evaluateAction);

// Step 3: Human Approval workflow
router.post('/approve', gatewayController.approveAction);

module.exports = router;
