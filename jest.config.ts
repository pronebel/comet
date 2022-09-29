/** @type {import('ts-jest/dist/types').InitialOptionsTsJest} */
export default {
    preset: 'ts-jest',
    testEnvironment: 'node',
    rootDir: './',
    verbose: true,
    globals: {
        window: true,
    }

};
