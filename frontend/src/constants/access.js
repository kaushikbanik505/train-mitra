export const LEARNER_OWNER_EMAIL = 'iamkaushik018@gmail.com';

export function isLearnerOwner(user) {
  return user?.email?.toLowerCase() === LEARNER_OWNER_EMAIL;
}

// Real access control lives server-side (the backend checks the JWT's role claim,
// not this) - this is only used to decide what the frontend renders.
export function isAdmin(user) {
  return user?.role === 'admin';
}
