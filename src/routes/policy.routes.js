const { Router } = require('express');
const {
  createPolicy,
  getActivePolicies,
  togglePolicyState
} = require('../controllers/policy.controller');

const router = Router();

// Routes mounted at /api/v1/policies
router.route('/')
  .post(createPolicy)
  .get(getActivePolicies);

router.route('/:id/toggle')
  .patch(togglePolicyState);

module.exports = router;
