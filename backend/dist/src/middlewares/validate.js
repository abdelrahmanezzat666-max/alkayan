export function validate(schemas) {
    return (req, _res, next) => {
        if (schemas.body) {
            req.body = schemas.body.parse(req.body);
        }
        if (schemas.params) {
            schemas.params.parse(req.params);
        }
        if (schemas.query) {
            schemas.query.parse(req.query);
        }
        next();
    };
}
