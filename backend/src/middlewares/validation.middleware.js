// File: FinanceTracker/backend/src/middlewares/validation.middleware.js
export const validateRequest = (schema, property = 'body') => {
  return async (request, reply) => {
    try {
      const dataToValidate = property === 'query' ? request.query : request.body;
      const result = schema.safeParse(dataToValidate);
      
      if (!result.success) {
        const errors = result.error.errors.map(err => ({
          field: err.path.join('.'),
          message: err.message
        }));
        
        return reply.status(400).send({
          success: false,
          error: 'Validation failed',
          errors
        });
      }
      
      // Replace request data with validated data
      if (property === 'query') {
        request.query = result.data;
      } else {
        request.body = result.data;
      }
    } catch (error) {
      return reply.status(500).send({
        success: false,
        error: 'Validation error',
        message: 'An error occurred during validation'
      });
    }
  };
};
