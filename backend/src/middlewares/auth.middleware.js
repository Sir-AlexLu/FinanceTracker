// File: FinanceTracker/backend/src/middlewares/auth.middleware.js
export const authenticate = async (request, reply) => {
  try {
    const token = request.cookies.token;
    
    if (!token) {
      return reply.status(401).send({
        success: false,
        error: 'Authentication required',
        message: 'Please login to access this resource'
      });
    }

    try {
      const decoded = await request.jwtVerify();
      request.user = decoded;
    } catch (error) {
      return reply.status(401).send({
        success: false,
        error: 'Invalid token',
        message: 'Your session has expired or is invalid'
      });
    }
  } catch (error) {
    return reply.status(500).send({
      success: false,
      error: 'Authentication error',
      message: 'An error occurred during authentication'
    });
  }
};
