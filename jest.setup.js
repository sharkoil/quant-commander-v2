// Optional: configure or set up a testing framework before each test.
// If you delete this file, remove `setupFilesAfterEnv` from `jest.config.js`

import '@testing-library/jest-dom';

// Mock react-markdown to avoid ES modules issues
jest.mock('react-markdown', () => {
  return function MockMarkdown({ children }) {
    return children;
  };
});

// Only mock remark-gfm if it exists, otherwise ignore
jest.mock('remark-gfm', () => ({}), { virtual: true });
