import { z } from 'zod';
export declare const configSchema: z.ZodObject<{
    withMiddleware: z.ZodDefault<z.ZodEffects<z.ZodEnum<["true", "false"]>, any, "true" | "false">>;
    withShield: z.ZodDefault<z.ZodEffects<z.ZodEnum<["true", "false"]>, any, "true" | "false">>;
    contextPath: z.ZodDefault<z.ZodString>;
}, "strip", z.ZodTypeAny, {
    withMiddleware?: any;
    withShield?: any;
    contextPath?: string;
}, {
    withMiddleware?: "true" | "false";
    withShield?: "true" | "false";
    contextPath?: string;
}>;
export type Config = z.infer<typeof configSchema>;
