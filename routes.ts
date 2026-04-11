/* tslint:disable */
/* eslint-disable */
// WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
import type { TsoaRoute } from '@tsoa/runtime';
import { ExpressTemplateService, fetchMiddlewares } from '@tsoa/runtime';
// WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
import { UserController } from './src/interface/http/controllers/user.controller';
// WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
import { OnboardingController } from './src/interface/http/controllers/onboarding.controller';
// WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
import { CurrencyController } from './src/interface/http/controllers/currency.controller';
// WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
import { AuthController } from './src/interface/http/controllers/auth.controller';
// WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
import { expressAuthentication } from './src/infra/config/tsoa-express-auth';
import { AccountingEntityController } from './src/interface/http/controllers/account-entity.controller';
// @ts-ignore - no great way to install types from subpackage
import type {
  Request as ExRequest,
  Response as ExResponse,
  RequestHandler,
  Router,
} from 'express';

const expressAuthenticationRecasted = expressAuthentication as (
  req: ExRequest,
  securityName: string,
  scopes?: string[],
  res?: ExResponse
) => Promise<any>;

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
  UAppThemePreference: {
    dataType: 'refAlias',
    type: {
      dataType: 'union',
      subSchemas: [
        { dataType: 'enum', enums: ['light'] },
        { dataType: 'enum', enums: ['dark'] },
        { dataType: 'enum', enums: ['system'] },
      ],
      validators: {},
    },
  },
  // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
  UAppUsageMode: {
    dataType: 'refAlias',
    type: {
      dataType: 'union',
      subSchemas: [
        { dataType: 'enum', enums: ['power_user'] },
        { dataType: 'enum', enums: ['non_power_user'] },
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
          { ref: 'UAppThemePreference' },
          { dataType: 'enum', enums: [null] },
        ],
      },
      appUsageMode: {
        dataType: 'union',
        subSchemas: [
          { ref: 'UAppUsageMode' },
          { dataType: 'enum', enums: [null] },
        ],
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
  IAccountingEntityOnboardingReq: {
    dataType: 'refObject',
    properties: {
      name: { dataType: 'string', required: true },
      entityType: { ref: 'UAccountingEntityType', required: true },
      operatingCountryCode: { dataType: 'string', required: true },
      functionalCurrencyCode: { dataType: 'string', required: true },
      reportingCurrencyCode: { dataType: 'string', required: true },
      fiscalYearStart: { ref: 'IFiscalYearStart', required: true },
      appUsageMode: { ref: 'UAppUsageMode', required: true },
    },
    additionalProperties: false,
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
  IUserSignupReq: {
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
          name: { dataType: 'string', required: true },
          operatingCountryCode: { dataType: 'string', required: true },
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
      name: { dataType: 'string', required: true },
      operatingCountryCode: { dataType: 'string', required: true },
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
    '/api/v1/users/preferences',
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
    '/api/v1/users/profile',
    authenticateMiddleware([{ bearerAuth: [] }]),
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
  const argsOnboardingController_onboardAccountingEntity: Record<
    string,
    TsoaRoute.ParameterSchema
  > = {
    requestBody: {
      in: 'body',
      name: 'requestBody',
      required: true,
      ref: 'IAccountingEntityOnboardingReq',
    },
  };
  app.post(
    '/api/v1/onboarding/accounting-entity',
    authenticateMiddleware([{ bearerAuth: [] }]),
    ...fetchMiddlewares<RequestHandler>(OnboardingController),
    ...fetchMiddlewares<RequestHandler>(
      OnboardingController.prototype.onboardAccountingEntity
    ),

    async function OnboardingController_onboardAccountingEntity(
      request: ExRequest,
      response: ExResponse,
      next: any
    ) {
      // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa

      let validatedArgs: any[] = [];
      try {
        validatedArgs = templateService.getValidatedArgs({
          args: argsOnboardingController_onboardAccountingEntity,
          request,
          response,
        });

        const controller = new OnboardingController();

        await templateService.apiHandler({
          methodName: 'onboardAccountingEntity',
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
    body: { in: 'body', name: 'body', required: true, ref: 'IUserSignupReq' },
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

  function authenticateMiddleware(security: TsoaRoute.Security[] = []) {
    return async function runAuthenticationMiddleware(
      request: any,
      response: any,
      next: any
    ) {
      // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa

      // keep track of failed auth attempts so we can hand back the most
      // recent one.  This behavior was previously existing so preserving it
      // here
      const failedAttempts: any[] = [];
      const pushAndRethrow = (error: any) => {
        failedAttempts.push(error);
        throw error;
      };

      const secMethodOrPromises: Promise<any>[] = [];
      for (const secMethod of security) {
        if (Object.keys(secMethod).length > 1) {
          const secMethodAndPromises: Promise<any>[] = [];

          for (const name in secMethod) {
            secMethodAndPromises.push(
              expressAuthenticationRecasted(
                request,
                name,
                secMethod[name],
                response
              ).catch(pushAndRethrow)
            );
          }

          // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa

          secMethodOrPromises.push(
            Promise.all(secMethodAndPromises).then((users) => {
              return users[0];
            })
          );
        } else {
          for (const name in secMethod) {
            secMethodOrPromises.push(
              expressAuthenticationRecasted(
                request,
                name,
                secMethod[name],
                response
              ).catch(pushAndRethrow)
            );
          }
        }
      }

      // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa

      try {
        request['user'] = await Promise.any(secMethodOrPromises);

        // Response was sent in middleware, abort
        if (response.writableEnded) {
          return;
        }

        next();
      } catch (err) {
        // Show most recent error as response
        const error = failedAttempts.pop();
        error.status = error.status || 401;

        // Response was sent in middleware, abort
        if (response.writableEnded) {
          return;
        }
        next(error);
      }

      // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
    };
  }

  // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
}

// WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
