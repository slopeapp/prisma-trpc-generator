"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.resolveModelsComments = exports.getProcedureTypeByOpName = exports.getInputTypeByOpName = exports.generateRouterSchemaImports = exports.generateProcedure = exports.generateBaseRouter = exports.generateRouterImport = exports.generateShieldImport = exports.generatetRPCImport = exports.generateCreateRouterImport = void 0;
const uncapitalizeFirstLetter_1 = require("./utils/uncapitalizeFirstLetter");
const generateCreateRouterImport = (sourceFile, isProtectedMiddleware) => {
    sourceFile.addImportDeclaration({
        moduleSpecifier: './helpers/createRouter',
        namedImports: [
            isProtectedMiddleware ? 'createProtectedRouter' : 'createRouter',
        ],
    });
};
exports.generateCreateRouterImport = generateCreateRouterImport;
const generatetRPCImport = (sourceFile) => {
    sourceFile.addImportDeclaration({
        moduleSpecifier: '@trpc/server',
        namespaceImport: 'trpc',
    });
};
exports.generatetRPCImport = generatetRPCImport;
const generateShieldImport = (sourceFile, shieldOutputPath) => {
    sourceFile.addImportDeclaration({
        moduleSpecifier: `${shieldOutputPath}/shield`,
        namedImports: ['permissions'],
    });
};
exports.generateShieldImport = generateShieldImport;
const generateRouterImport = (sourceFile, modelNamePlural, modelNameCamelCase) => {
    sourceFile.addImportDeclaration({
        moduleSpecifier: `./${modelNameCamelCase}.router`,
        namedImports: [`${modelNamePlural}Router`],
    });
};
exports.generateRouterImport = generateRouterImport;
function generateBaseRouter(sourceFile, config) {
    sourceFile.addStatements(/* ts */ `
  import { Context } from '${config.contextPath}';
    
  export function createRouter() {
    return trpc.router<Context>();
  }`);
    const middlewares = [];
    if (config.withMiddleware) {
        middlewares.push(/* ts */ `
    .middleware(({ ctx, next }) => {
      console.log("inside middleware!")
      return next();
    })`);
    }
    if (config.withShield) {
        middlewares.push(/* ts */ `
    .middleware(permissions)`);
    }
    sourceFile.addStatements(/* ts */ `
    export function createProtectedRouter() {
      return trpc
        .router<Context>()
        ${middlewares.join('\r')};
    }`);
}
exports.generateBaseRouter = generateBaseRouter;
function generateProcedure(sourceFile, name, typeName, modelName, opType, baseOpType) {
    sourceFile.addStatements(/* ts */ `
  .${(0, exports.getProcedureTypeByOpName)(baseOpType)}("${name}", {
    input: ${typeName},
    async resolve({ ctx, input }) {
      const ${name} = await ctx.prisma.${(0, uncapitalizeFirstLetter_1.uncapitalizeFirstLetter)(modelName)}.${opType.replace('One', '')}(input);
      return ${name};
    },
  })`);
}
exports.generateProcedure = generateProcedure;
function generateRouterSchemaImports(sourceFile, name, hasCreateMany, provider) {
    let statements = [
        `import { ${name}FindUniqueSchema } from "../schemas/findUnique${name}.schema";`,
        `import { ${name}FindFirstSchema } from "../schemas/findFirst${name}.schema";`,
        `import { ${name}FindManySchema } from "../schemas/findMany${name}.schema";`,
        `import { ${name}CreateOneSchema } from "../schemas/createOne${name}.schema";`,
    ];
    if (hasCreateMany) {
        statements.push(`import { ${name}CreateManySchema } from "../schemas/createMany${name}.schema";`);
    }
    statements = statements.concat([
        `import { ${name}DeleteOneSchema } from "../schemas/deleteOne${name}.schema";`,
        `import { ${name}UpdateOneSchema } from "../schemas/updateOne${name}.schema";`,
        `import { ${name}DeleteManySchema } from "../schemas/deleteMany${name}.schema";`,
        `import { ${name}UpdateManySchema } from "../schemas/updateMany${name}.schema";`,
        `import { ${name}UpsertSchema } from "../schemas/upsertOne${name}.schema";`,
        `import { ${name}AggregateSchema } from "../schemas/aggregate${name}.schema";`,
        `import { ${name}GroupBySchema } from "../schemas/groupBy${name}.schema";`,
    ]);
    if (provider === 'mongodb') {
        statements = statements.concat([
            `import { ${name}FindRawObjectSchema } from "../schemas/objects/${name}FindRaw.schema";`,
            `import { ${name}AggregateRawObjectSchema } from "../schemas/objects/${name}AggregateRaw.schema";`,
        ]);
    }
    sourceFile.addStatements(/* ts */ statements.join('\n'));
}
exports.generateRouterSchemaImports = generateRouterSchemaImports;
const getInputTypeByOpName = (opName, modelName) => {
    let inputType;
    switch (opName) {
        case 'findUnique':
            inputType = `${modelName}FindUniqueSchema`;
            break;
        case 'findFirst':
            inputType = `${modelName}FindFirstSchema`;
            break;
        case 'findMany':
            inputType = `${modelName}FindManySchema`;
            break;
        case 'findRaw':
            inputType = `${modelName}FindRawObjectSchema`;
            break;
        case 'createOne':
            inputType = `${modelName}CreateOneSchema`;
            break;
        case 'createMany':
            inputType = `${modelName}CreateManySchema`;
            break;
        case 'deleteOne':
            inputType = `${modelName}DeleteOneSchema`;
            break;
        case 'updateOne':
            inputType = `${modelName}UpdateOneSchema`;
            break;
        case 'deleteMany':
            inputType = `${modelName}DeleteManySchema`;
            break;
        case 'updateMany':
            inputType = `${modelName}UpdateManySchema`;
            break;
        case 'upsertOne':
            inputType = `${modelName}UpsertSchema`;
            break;
        case 'aggregate':
            inputType = `${modelName}AggregateSchema`;
            break;
        case 'aggregateRaw':
            inputType = `${modelName}AggregateRawObjectSchema`;
            break;
        case 'groupBy':
            inputType = `${modelName}GroupBySchema`;
            break;
        default:
            console.log('getInputTypeByOpName: ', { opName, modelName });
    }
    return inputType;
};
exports.getInputTypeByOpName = getInputTypeByOpName;
const getProcedureTypeByOpName = (opName) => {
    let procType;
    switch (opName) {
        case 'findUnique':
        case 'findFirst':
        case 'findMany':
        case 'findRaw':
        case 'aggregate':
        case 'aggregateRaw':
        case 'groupBy':
            procType = 'query';
            break;
        case 'createOne':
        case 'createMany':
        case 'deleteOne':
        case 'updateOne':
        case 'deleteMany':
        case 'updateMany':
        case 'upsertOne':
            procType = 'mutation';
            break;
        default:
            console.log('getProcedureTypeByOpName: ', { opName });
    }
    return procType;
};
exports.getProcedureTypeByOpName = getProcedureTypeByOpName;
function resolveModelsComments(models, hiddenModels) {
    var _a, _b, _c, _d, _e, _f;
    const modelAttributeRegex = /(@@Gen\.)+([A-z])+(\()+(.+)+(\))+/;
    const attributeNameRegex = /(?:\.)+([A-Za-z])+(?:\()+/;
    const attributeArgsRegex = /(?:\()+([A-Za-z])+\:+(.+)+(?:\))+/;
    for (const model of models) {
        if (model.documentation) {
            const attribute = (_b = (_a = model.documentation) === null || _a === void 0 ? void 0 : _a.match(modelAttributeRegex)) === null || _b === void 0 ? void 0 : _b[0];
            const attributeName = (_d = (_c = attribute === null || attribute === void 0 ? void 0 : attribute.match(attributeNameRegex)) === null || _c === void 0 ? void 0 : _c[0]) === null || _d === void 0 ? void 0 : _d.slice(1, -1);
            if (attributeName !== 'model')
                continue;
            const rawAttributeArgs = (_f = (_e = attribute === null || attribute === void 0 ? void 0 : attribute.match(attributeArgsRegex)) === null || _e === void 0 ? void 0 : _e[0]) === null || _f === void 0 ? void 0 : _f.slice(1, -1);
            const parsedAttributeArgs = {};
            if (rawAttributeArgs) {
                const rawAttributeArgsParts = rawAttributeArgs
                    .split(':')
                    .map((it) => it.trim())
                    .map((part) => (part.startsWith('[') ? part : part.split(',')))
                    .flat()
                    .map((it) => it.trim());
                for (let i = 0; i < rawAttributeArgsParts.length; i += 2) {
                    const key = rawAttributeArgsParts[i];
                    const value = rawAttributeArgsParts[i + 1];
                    parsedAttributeArgs[key] = JSON.parse(value);
                }
            }
            if (parsedAttributeArgs.hide) {
                hiddenModels.push(model.name);
            }
        }
    }
}
exports.resolveModelsComments = resolveModelsComments;
//# sourceMappingURL=helpers.js.map