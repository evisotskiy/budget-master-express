const errorSchema = {
    "type": "object",
    "properties": {
        "message": { "type": "string" },
    },
    "required": ["message"],
    "additionalProperties": false
};

const validationErrorSchema = {
    "type": "object",
    "properties": {
        "errors": {
            "type": "array",
            "items": {
                "type": "object",
                "properties": {
                    "msg": { "type": "string" },
                    "param": { "type": "string" },
                    "location": { "type": "string" },
                },
                "required": ["msg", "param", "location"],
                "additionalProperties": true,
            }
        },
        "message": { "type": "string" },
    },
    "required": ["errors", "message"],
    "additionalProperties": false
};

module.exports = {
    errorSchema,
    validationErrorSchema
};
