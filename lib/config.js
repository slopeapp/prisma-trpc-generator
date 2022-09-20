"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.configSchema = void 0;
const zod_1 = require("zod");
const configBoolean = zod_1.z
    .enum(['true', 'false'])
    .transform((arg) => JSON.parse(arg));
exports.configSchema = zod_1.z.object({
    withMiddleware: configBoolean.default('true'),
    withShield: configBoolean.default('true'),
    contextPath: zod_1.z.string().default("../../../../src/context")
});
//# sourceMappingURL=config.js.map