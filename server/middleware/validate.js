export function validateWith(schema) {
  return (req, res, next) => {
    const result = schema.safeParse(req.body);
    if (!result.success) {
      const errors = {};
      for (const issue of result.error.issues) {
        errors[issue.path.join(".")] = issue.message;
      }
      return res.status(400).json({ errors });
    }
    req.validated = result.data;
    next();
  };
}

export function validateParam(paramName, schema) {
  return (req, res, next) => {
    if (!schema.safeParse(req.params[paramName]).success)
      return res.status(400).json({ errors: { [paramName]: "Invalid format" } });
    next();
  };
}
