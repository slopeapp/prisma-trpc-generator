"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getProcedureTypeByOpName = exports.getInputTypeByOpName = exports.generateRouterSchemaImports = exports.generateProcedure = exports.generateBaseRouter = exports.generateRouterImport = exports.generateShieldImport = exports.generatetRPCImport = exports.generateCreateRouterImport = void 0;
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
function generateProcedure(sourceFile, name, typeName, modelName, opType) {
    let input = 'input';
    const nameWithoutModel = name.replace(modelName, '');
    switch (nameWithoutModel) {
        case 'findUnique':
            input = '{ where: input.where }';
            break;
        case 'findFirst':
        case 'findMany':
            break;
        case 'deleteOne':
            input = '{ where: input.where }';
            break;
        case 'deleteMany':
        case 'updateMany':
        case 'aggregate':
            break;
        case 'groupBy':
            input =
                '{ where: input.where, orderBy: input.orderBy, by: input.by, having: input.having, take: input.take, skip: input.skip }';
            break;
        case 'createOne':
        case 'createMany':
            input = '{ data: input.data }';
            break;
        case 'updateOne':
            input = '{ where: input.where, data: input.data }';
            break;
        case 'upsertOne':
            input =
                '{ where: input.where, create: input.create, update: input.update }';
            break;
    }
    sourceFile.addStatements(/* ts */ `
  .${(0, exports.getProcedureTypeByOpName)(opType)}("${name}", {
    input: ${typeName},
    async resolve({ ctx, input }) {
      const ${name} = await ctx.prisma.${(0, uncapitalizeFirstLetter_1.uncapitalizeFirstLetter)(modelName)}.${opType.replace('One', '')}(${input});
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
    if (provider === "mongodb") {
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
//# sourceMappingURL=helpers.js.map