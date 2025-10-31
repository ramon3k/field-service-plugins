// server/utils/asyncWrapper.js
// Utility to wrap async middleware functions to handle errors properly

function asyncWrapper(fn) {
    return (req, res, next) => {
        Promise.resolve(fn(req, res, next)).catch(next);
    };
}

function createAsyncMiddleware(middlewareFactory) {
    return (...args) => {
        const middleware = middlewareFactory(...args);
        return asyncWrapper(middleware);
    };
}

module.exports = {
    asyncWrapper,
    createAsyncMiddleware
};