/* tslint:disable */
/* eslint-disable */
// WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
import type { TsoaRoute } from '@tsoa/runtime';
import { fetchMiddlewares, ExpressTemplateService } from '@tsoa/runtime';
// WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
import { UserController } from './src/interface/http/controllers/user.controller';
// WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
import { CurrencyController } from './src/interface/http/controllers/currency.controller';
// WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
import { AuthController } from './src/interface/http/controllers/auth.controller';
// WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
import { AccountingEntityController } from './src/interface/http/controllers/account-entity.controller';
import type {
  Request as ExRequest,
  Response as ExResponse,
  RequestHandler,
  Router,
} from 'express';

// WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa

const models: TsoaRoute.Models = {
  TEntityId: {
    dataType: 'refAlias',
    type: {
      dataType: 'intersection',
      subSchemas: [
        { dataType: 'string' },
        {
          dataType: 'nestedObjectLiteral',
          nestedProperties: {
            __brand: { dataType: 'enum', enums: ['uuid'], required: true },
          },
        },
      ],
      validators: {},
    },
  },
  // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
  IUserAppPreferences: {
    dataType: 'refObject',
    properties: {
      theme: {
        dataType: 'union',
        subSchemas: [
          { dataType: 'enum', enums: ['light'] },
          { dataType: 'enum', enums: ['dark'] },
          { dataType: 'enum', enums: ['system'] },
        ],
        required: true,
      },
    },
    additionalProperties: false,
  },
  // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
  IUserPreferences: {
    dataType: 'refObject',
    properties: {
      id: { ref: 'TEntityId', required: true },
      appPreferences: { ref: 'IUserAppPreferences', required: true },
      createdAt: { dataType: 'datetime', required: true },
      updatedAt: { dataType: 'datetime', required: true },
    },
    additionalProperties: false,
  },
  // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
  'Pick_IUser.Exclude_keyofIUser.password__': {
    dataType: 'refAlias',
    type: {
      dataType: 'nestedObjectLiteral',
      nestedProperties: {},
      validators: {},
    },
  },
  // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
  'Omit_IUser.password_': {
    dataType: 'refAlias',
    type: { ref: 'Pick_IUser.Exclude_keyofIUser.password__', validators: {} },
  },
  // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
  IApiValidationError: {
    dataType: 'refObject',
    properties: {
      field: { dataType: 'string', required: true },
      message: { dataType: 'string', required: true },
    },
    additionalProperties: false,
  },
  // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
  IApiError: {
    dataType: 'refObject',
    properties: {
      message: { dataType: 'string', required: true },
      validationErrors: {
        dataType: 'array',
        array: { dataType: 'refObject', ref: 'IApiValidationError' },
      },
      cause: { dataType: 'any' },
    },
    additionalProperties: false,
  },
  // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
  IIndividualSignupReq: {
    dataType: 'refObject',
    properties: {
      firstName: { dataType: 'string', required: true },
      lastName: { dataType: 'string', required: true },
      email: { dataType: 'string', required: true },
      password: { dataType: 'string', required: true },
    },
    additionalProperties: false,
  },
  // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
  IAuthRes: {
    dataType: 'refObject',
    properties: {
      authToken: { dataType: 'string', required: true },
      refreshToken: { dataType: 'string', required: true },
    },
    additionalProperties: false,
  },
  // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
  UAccountingEntityType: {
    dataType: 'refAlias',
    type: {
      dataType: 'union',
      subSchemas: [
        { dataType: 'enum', enums: ['individual'] },
        { dataType: 'enum', enums: ['sole_trader'] },
        { dataType: 'enum', enums: ['company'] },
      ],
      validators: {},
    },
  },
  // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
  IFiscalYearStart: {
    dataType: 'refObject',
    properties: {
      month: { dataType: 'double', required: true },
      day: { dataType: 'double', required: true },
    },
    additionalProperties: false,
  },
  // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
  'Pick_IAccountingEntity.Exclude_keyofIAccountingEntity.functionalCurrency-or-reportingCurrency__':
    {
      dataType: 'refAlias',
      type: {
        dataType: 'nestedObjectLiteral',
        nestedProperties: {
          id: { ref: 'TEntityId', required: true },
          createdAt: { dataType: 'datetime', required: true },
          updatedAt: { dataType: 'datetime', required: true },
          deletedAt: { dataType: 'datetime', required: true },
          type: { ref: 'UAccountingEntityType', required: true },
          ownerId: { ref: 'TEntityId', required: true },
          fiscalYearStart: { ref: 'IFiscalYearStart', required: true },
        },
        validators: {},
      },
    },
  // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
  IAccountingEntityRes: {
    dataType: 'refObject',
    properties: {
      id: { ref: 'TEntityId', required: true },
      createdAt: { dataType: 'datetime', required: true },
      updatedAt: { dataType: 'datetime', required: true },
      deletedAt: { dataType: 'datetime', required: true },
      type: { ref: 'UAccountingEntityType', required: true },
      ownerId: { ref: 'TEntityId', required: true },
      fiscalYearStart: { ref: 'IFiscalYearStart', required: true },
      functionalCurrency: { dataType: 'string', required: true },
      reportingCurrency: { dataType: 'string', required: true },
    },
    additionalProperties: false,
  },
  // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
};
const templateService = new ExpressTemplateService(models, {
  noImplicitAdditionalProperties: 'throw-on-extras',
  bodyCoercion: true,
});

// WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa

export function RegisterRoutes(app: Router) {
  // ###########################################################################################################
  //  NOTE: If you do not see routes for all of your controllers in this file, then you might not have informed tsoa of where to look
  //      Please look into the "controllerPathGlobs" config option described in the readme: https://github.com/lukeautry/tsoa
  // ###########################################################################################################

  const argsUserController_getCurrencies: Record<
    string,
    TsoaRoute.ParameterSchema
  > = {};
  app.get(
    '/api/v1/user/preferences',
    ...fetchMiddlewares<RequestHandler>(UserController),
    ...fetchMiddlewares<RequestHandler>(UserController.prototype.getCurrencies),

    async function UserController_getCurrencies(
      request: ExRequest,
      response: ExResponse,
      next: any
    ) {
      // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa

      let validatedArgs: any[] = [];
      try {
        validatedArgs = templateService.getValidatedArgs({
          args: argsUserController_getCurrencies,
          request,
          response,
        });

        const controller = new UserController();

        await templateService.apiHandler({
          methodName: 'getCurrencies',
          controller,
          response,
          next,
          validatedArgs,
          successStatus: 200,
        });
      } catch (err) {
        return next(err);
      }
    }
  );
  // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
  const argsUserController_getAuthUserProfile: Record<
    string,
    TsoaRoute.ParameterSchema
  > = {};
  app.get(
    '/api/v1/user/profile',
    ...fetchMiddlewares<RequestHandler>(UserController),
    ...fetchMiddlewares<RequestHandler>(
      UserController.prototype.getAuthUserProfile
    ),

    async function UserController_getAuthUserProfile(
      request: ExRequest,
      response: ExResponse,
      next: any
    ) {
      // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa

      let validatedArgs: any[] = [];
      try {
        validatedArgs = templateService.getValidatedArgs({
          args: argsUserController_getAuthUserProfile,
          request,
          response,
        });

        const controller = new UserController();

        await templateService.apiHandler({
          methodName: 'getAuthUserProfile',
          controller,
          response,
          next,
          validatedArgs,
          successStatus: 200,
        });
      } catch (err) {
        return next(err);
      }
    }
  );
  // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
  const argsCurrencyController_getCurrencies: Record<
    string,
    TsoaRoute.ParameterSchema
  > = {};
  app.get(
    '/api/v1/currencies',
    ...fetchMiddlewares<RequestHandler>(CurrencyController),
    ...fetchMiddlewares<RequestHandler>(
      CurrencyController.prototype.getCurrencies
    ),

    async function CurrencyController_getCurrencies(
      request: ExRequest,
      response: ExResponse,
      next: any
    ) {
      // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa

      let validatedArgs: any[] = [];
      try {
        validatedArgs = templateService.getValidatedArgs({
          args: argsCurrencyController_getCurrencies,
          request,
          response,
        });

        const controller = new CurrencyController();

        await templateService.apiHandler({
          methodName: 'getCurrencies',
          controller,
          response,
          next,
          validatedArgs,
          successStatus: 200,
        });
      } catch (err) {
        return next(err);
      }
    }
  );
  // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
  const argsAuthController_signupWithEmail: Record<
    string,
    TsoaRoute.ParameterSchema
  > = {
    body: {
      in: 'body',
      name: 'body',
      required: true,
      ref: 'IIndividualSignupReq',
    },
  };
  app.post(
    '/api/v1/auth/signup-with-email',
    ...fetchMiddlewares<RequestHandler>(AuthController),
    ...fetchMiddlewares<RequestHandler>(
      AuthController.prototype.signupWithEmail
    ),

    async function AuthController_signupWithEmail(
      request: ExRequest,
      response: ExResponse,
      next: any
    ) {
      // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa

      let validatedArgs: any[] = [];
      try {
        validatedArgs = templateService.getValidatedArgs({
          args: argsAuthController_signupWithEmail,
          request,
          response,
        });

        const controller = new AuthController();

        await templateService.apiHandler({
          methodName: 'signupWithEmail',
          controller,
          response,
          next,
          validatedArgs,
          successStatus: 201,
        });
      } catch (err) {
        return next(err);
      }
    }
  );
  // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
  const argsAuthController_verifyEmail: Record<
    string,
    TsoaRoute.ParameterSchema
  > = {
    token: { in: 'query', name: 'token', required: true, dataType: 'string' },
  };
  app.post(
    '/api/v1/auth/signup/complete',
    ...fetchMiddlewares<RequestHandler>(AuthController),
    ...fetchMiddlewares<RequestHandler>(AuthController.prototype.verifyEmail),

    async function AuthController_verifyEmail(
      request: ExRequest,
      response: ExResponse,
      next: any
    ) {
      // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa

      let validatedArgs: any[] = [];
      try {
        validatedArgs = templateService.getValidatedArgs({
          args: argsAuthController_verifyEmail,
          request,
          response,
        });

        const controller = new AuthController();

        await templateService.apiHandler({
          methodName: 'verifyEmail',
          controller,
          response,
          next,
          validatedArgs,
          successStatus: 200,
        });
      } catch (err) {
        return next(err);
      }
    }
  );
  // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
  const argsAccountingEntityController_getAccountingEntities: Record<
    string,
    TsoaRoute.ParameterSchema
  > = {};
  app.get(
    '/api/v1/accounting-entities',
    ...fetchMiddlewares<RequestHandler>(AccountingEntityController),
    ...fetchMiddlewares<RequestHandler>(
      AccountingEntityController.prototype.getAccountingEntities
    ),

    async function AccountingEntityController_getAccountingEntities(
      request: ExRequest,
      response: ExResponse,
      next: any
    ) {
      // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa

      let validatedArgs: any[] = [];
      try {
        validatedArgs = templateService.getValidatedArgs({
          args: argsAccountingEntityController_getAccountingEntities,
          request,
          response,
        });

        const controller = new AccountingEntityController();

        await templateService.apiHandler({
          methodName: 'getAccountingEntities',
          controller,
          response,
          next,
          validatedArgs,
          successStatus: 200,
        });
      } catch (err) {
        return next(err);
      }
    }
  );
  // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa

  // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa

  // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
}

// WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
