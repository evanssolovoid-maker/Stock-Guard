/**
 * Business utility functions for multi-tenant system
 */

/**
 * Get business owner ID from user object
 * For owners, returns their own ID
 * For workers/managers, returns their business_owner_id
 */
export function getBusinessOwnerId(user) {
  if (!user) return null;

  // If user is owner, their ID is the business owner ID
  if (user.role === "owner") {
    return user.id;
  }

  // For workers/managers, use business_owner_id
  return user.business_owner_id || user.id;
}

/**
 * Check if user has access to a business
 */
export function hasBusinessAccess(user, businessOwnerId) {
  if (!user || !businessOwnerId) return false;

  const userBusinessOwnerId = getBusinessOwnerId(user);
  return userBusinessOwnerId === businessOwnerId;
}
