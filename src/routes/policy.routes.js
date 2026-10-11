const { Router } = require('express');
const {
  createPolicy,
  getPolicies,
  togglePolicyState
} = require('../controllers/policy.controller');

const router = Router();

// Routes mounted at /api/v1/policies
router.route('/')
  .post(createPolicy)
  .get(getPolicies);

// Toggle policy active state via PATCH or PUT
router.route('/:id/toggle')
  .patch(togglePolicyState)
  .put(togglePolicyState);

router.route('/:id')
  .patch(togglePolicyState)
  .put(togglePolicyState);

module.exports = router;
