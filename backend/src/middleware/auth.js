export const authenticate = async (request, reply) => {
  try {
    await request.jwtVerify();
    // Add user id to request
    request.userId = request.user.id;
  } catch (err) {
    reply.code(401).send({
      success: false,
      message: 'Unauthorized - Invalid or missing token',
    });
  }
};

export const optionalAuth = async (request, reply) => {
  try {
    await request.jwtVerify();
    request.userId = request.user.id;
  } catch (err) {
    // Continue without authentication
    request.userId = null;
  }
};
