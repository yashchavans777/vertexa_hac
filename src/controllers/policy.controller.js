const Policy = require('../models/policy.model');
const { asyncHandler } = require('../utils/asyncHandler');
const { ApiError } = require('../utils/ApiError');
const { ApiResponse } = require('../utils/ApiResponse');

/**
 * @desc    Create a new declarative enterprise security policy
 * @route   POST /api/v1/policies
 * @access  Internal Admin / Security Engineer
 */
const createPolicy = asyncHandler(async (req, res) => {
  const { policyName, description, targetTools, effect, conditions, isActive, priority } = req.body;

  // Validation
  if (!policyName || typeof policyName !== 'string' || !policyName.trim()) {
    throw new ApiError(400, 'Validation Error: policyName is required.');
  }

  if (!Array.isArray(targetTools) || targetTools.length === 0) {
    throw new ApiError(400, 'Validation Error: targetTools must be a non-empty array of tool identifiers.');
  }

  const validEffects = ['ALLOW', 'BLOCK', 'REQUIRE_APPROVAL'];
  if (!effect || !validEffects.includes(effect)) {
    throw new ApiError(400, `Validation Error: effect must be one of [${validEffects.join(', ')}].`);
  }

  // Conflict check
  const existingPolicy = await Policy.findOne({ policyName: policyName.trim() });
  if (existingPolicy) {
    throw new ApiError(409, `Policy with name "${policyName.trim()}" already exists.`);
  }

  const policy = await Policy.create({
    policyName: policyName.trim(),
    description: description || '',
    targetTools,
    effect,
    conditions: conditions || {},
    isActive: isActive !== undefined ? Boolean(isActive) : true,
    priority: priority !== undefined ? Number(priority) : 0
  });

  return res
    .status(201)
    .json(new ApiResponse(201, policy, 'Security policy created successfully.'));
});

/**
 * @desc    Fetch all policies from MongoDB (both active and inactive) so disabled policies still render
 * @route   GET /api/v1/policies
 * @access  Internal Security Gateway / Auditor / Dashboard
 */
const getPolicies = asyncHandler(async (req, res) => {
  const filter = {};
  // Only filter by isActive if explicitly requested via query parameter (?active=true or ?isActive=false)
  if (req.query.active !== undefined) {
    filter.isActive = req.query.active === 'true';
  } else if (req.query.isActive !== undefined) {
    filter.isActive = req.query.isActive === 'true';
  }

  const policies = await Policy.find(filter)
    .sort({ priority: -1, createdAt: -1 })
    .lean();

  const totalActive = policies.filter((p) => p.isActive).length;

  return res
    .status(200)
    .json(
      new ApiResponse(
        200,
        {
          total: policies.length,
          totalActive,
          totalInactive: policies.length - totalActive,
          policies
        },
        'Security policies retrieved successfully.'
      )
    );
});

/**
 * @desc    Toggle or update policy active state (enable/disable for incident response)
 * @route   PATCH /api/v1/policies/:id/toggle
 * @route   PATCH /api/v1/policies/:id
 * @access  Internal Admin / SOC Responder
 */
const togglePolicyState = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { isActive } = req.body || {};

  if (!id) {
    throw new ApiError(400, 'Policy ID is required.');
  }

  const policy = await Policy.findById(id);
  if (!policy) {
    throw new ApiError(404, `Policy with ID "${id}" was not found.`);
  }

  // If isActive is explicitly specified in req.body, apply it; otherwise toggle current boolean
  if (isActive !== undefined) {
    policy.isActive = Boolean(isActive);
  } else {
    policy.isActive = !policy.isActive;
  }

  await policy.save();

  const stateStr = policy.isActive ? 'ACTIVATED' : 'DEACTIVATED';

  return res
    .status(200)
    .json(
      new ApiResponse(
        200,
        policy,
        `Policy "${policy.policyName}" has been successfully ${stateStr}.`
      )
    );
});

module.exports = {
  createPolicy,
  getPolicies,
  getActivePolicies: getPolicies, // Alias for backwards compatibility
  togglePolicyState
};
