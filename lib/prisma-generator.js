"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.generate = void 0;
const internals_1 = require("@prisma/internals");
const fs_1 = require("fs");
const path_1 = __importDefault(require("path"));
const pluralize_1 = __importDefault(require("pluralize"));
const prisma_generator_1 = require("prisma-trpc-shield-generator/lib/prisma-generator");
const prisma_generator_2 = require("prisma-zod-generator/lib/prisma-generator");
const config_1 = require("./config");
const helpers_1 = require("./helpers");
const project_1 = require("./project");
const removeDir_1 = __importDefault(require("./utils/removeDir"));
async function generate(options) {
    var _a;
    const outputDir = (0, internals_1.parseEnvValue)(options.generator.output);
    const results = config_1.configSchema.safeParse(options.generator.config);
    if (!results.success)
        throw new Error('Invalid options passed');
    const config = results.data;
    await fs_1.promises.mkdir(outputDir, { recursive: true });
    await (0, removeDir_1.default)(outputDir, true);
    await (0, prisma_generator_2.generate)(options);
    let shieldOutputPath;
    if (config.withShield) {
        const outputPath = options.generator.output.value;
        shieldOutputPath =
            (outputPath
                .split(path_1.default.sep)
                .slice(0, outputPath.split(path_1.default.sep).length - 1)
                .join(path_1.default.sep) + '/shield')
                .split(path_1.default.sep)
                .join(path_1.default.posix.sep);
        shieldOutputPath = path_1.default.relative(path_1.default.join(outputPath, 'routers', 'helpers'), shieldOutputPath);
        await (0, prisma_generator_1.generate)({
            ...options,
            generator: {
                ...options.generator,
                output: {
                    ...options.generator.output,
                    value: shieldOutputPath,
                },
            },
        });
    }
    const prismaClientProvider = options.otherGenerators.find((it) => (0, internals_1.parseEnvValue)(it.provider) === 'prisma-client-js');
    const dataSource = (_a = options.datasources) === null || _a === void 0 ? void 0 : _a[0];
    const prismaClientDmmf = await (0, internals_1.getDMMF)({
        datamodel: options.datamodel,
        previewFeatures: prismaClientProvider.previewFeatures,
    });
    const createRouter = project_1.project.createSourceFile(path_1.default.resolve(outputDir, 'routers', 'helpers', 'createRouter.ts'), undefined, { overwrite: true });
    (0, helpers_1.generatetRPCImport)(createRouter);
    if (config.withShield) {
        (0, helpers_1.generateShieldImport)(createRouter, shieldOutputPath);
    }
    (0, helpers_1.generateBaseRouter)(createRouter, config);
    createRouter.formatText({
        indentSize: 2,
    });
    const appRouter = project_1.project.createSourceFile(path_1.default.resolve(outputDir, 'routers', `index.ts`), undefined, { overwrite: true });
    (0, helpers_1.generateCreateRouterImport)(appRouter, config.withMiddleware);
    appRouter.addStatements(/* ts */ `
  export const appRouter = ${config.withMiddleware ? 'createProtectedRouter' : 'createRouter'}()`);
    prismaClientDmmf.mappings.modelOperations.forEach((modelOperation) => {
        const { model, ...operations } = modelOperation;
        const plural = (0, pluralize_1.default)(model.toLowerCase());
        const hasCreateMany = Boolean(operations.createMany);
        (0, helpers_1.generateRouterImport)(appRouter, plural, model);
        const modelRouter = project_1.project.createSourceFile(path_1.default.resolve(outputDir, 'routers', `${model}.router.ts`), undefined, { overwrite: true });
        (0, helpers_1.generateCreateRouterImport)(modelRouter, false);
        (0, helpers_1.generateRouterSchemaImports)(modelRouter, model, hasCreateMany, dataSource.provider);
        modelRouter.addStatements(/* ts */ `
    export const ${plural}Router = createRouter()`);
        for (const [opType, opNameWithModel] of Object.entries(operations)) {
            (0, helpers_1.generateProcedure)(modelRouter, opNameWithModel, (0, helpers_1.getInputTypeByOpName)(opType, model), model, opType);
        }
        modelRouter.formatText({ indentSize: 2 });
        appRouter.addStatements(/* ts */ `
    .merge('${model.toLowerCase()}.', ${plural}Router)`);
    });
    appRouter.formatText({ indentSize: 2 });
    await project_1.project.save();
}
exports.generate = generate;
//# sourceMappingURL=prisma-generator.js.map