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
 * @desc    Fetch all active policies currently enforced by the policy engine
 * @route   GET /api/v1/policies
 * @access  Internal Security Gateway / Auditor
 */
const getActivePolicies = asyncHandler(async (req, res) => {
  const policies = await Policy.find({ isActive: true })
    .sort({ priority: -1, createdAt: 1 })
    .lean();

  return res
    .status(200)
    .json(
      new ApiResponse(
        200,
        {
          totalActive: policies.length,
          policies
        },
        'Active security policies retrieved successfully.'
      )
    );
});

/**
 * @desc    Toggle policy active state (enable/disable for incident response)
 * @route   PATCH /api/v1/policies/:id/toggle
 * @access  Internal Admin / SOC Responder
 */
const togglePolicyState = asyncHandler(async (req, res) => {
  const { id } = req.params;

  if (!id) {
    throw new ApiError(400, 'Policy ID is required.');
  }

  const policy = await Policy.findById(id);
  if (!policy) {
    throw new ApiError(404, `Policy with ID "${id}" was not found.`);
  }

  // Toggle state
  policy.isActive = !policy.isActive;
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
  getActivePolicies,
  togglePolicyState
};
