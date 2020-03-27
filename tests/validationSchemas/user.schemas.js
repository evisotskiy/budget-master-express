const userInfoSchema = {
    "type": "object",
    "properties": {
        "name": { "type": "string" },
        "bill": { "type": "number" },
        "locale": { "type": "string" }
    },
    "required": ["name", "bill", "locale"],
    "additionalProperties": false
};

module.exports = {
    userInfoSchema
};
