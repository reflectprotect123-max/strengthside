/** jest-expo's preset handles Expo/RN transforms; testMatch keeps collection
 * colocated-only so a stray test under test/ (fixtures dir) never runs. */
module.exports = {
  preset: 'jest-expo',
  testMatch: ['<rootDir>/src/**/*.test.@(ts|tsx)'],
};
