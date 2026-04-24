import { Request, RequestHandler, Response } from 'express';
import IRequestContext from '../../../app/contracts/app/request-context.contract';
import IAuthService from '../../../app/contracts/infra/auth-service.contract';
import ILogger from '../../../app/contracts/infra/logger.contract';
import accountingEntityEntity from '../../../domain/accounting-entity/entities/accounting-entity.entity';
import IAccountingEntityRepo from '../../../domain/accounting-entity/repos/accounting-entity.repo';
import { IAccountingEntity } from '../../../domain/accounting-entity/types/accounting-entity.types';
import IUserRepo from '../../../domain/user/repos/user.repo';
import { IUser } from '../../../domain/user/types/user.types';
import { NODE_ENV, WEB_APP_URL } from '../../../infra/config/vars.config';
import { TEntityId } from '../../../shared/types/uuid';
import stringUtils from '../../../shared/utils/string';
import generateUUID from '../../../shared/utils/uuid-generator';
import { ErrorBadRequest } from '../../../shared/value-objects/error';
import getHttpHeaderValue from '../helpers/get-http-header-value';

function getCorrelationId(req: Request) {
  return getHttpHeaderValue('x-correlation-id', req.headers) || generateUUID();
}

function getIdempotencyKey(req: Request) {
  return getHttpHeaderValue('x-idempotency-key', req.headers);
}

function handleSetRefreshToken(res: Response, token: string) {
  const hostname = new URL(WEB_APP_URL).hostname;
  const cookieDomain =
    hostname === 'localhost' || hostname === '127.0.0.1' ? undefined : hostname;

  res.cookie('refresh_token', token, {
    httpOnly: true,
    secure: NODE_ENV === 'production',
    domain: cookieDomain,
    sameSite: 'lax',
    maxAge: 1000 * 60 * 60 * 24 * 7,
  });
}

function handleClearRefreshToken(res: Response) {
  const hostname = new URL(WEB_APP_URL).hostname;
  const cookieDomain =
    hostname === 'localhost' || hostname === '127.0.0.1' ? undefined : hostname;

  res.clearCookie('refresh_token', {
    httpOnly: true,
    secure: NODE_ENV === 'production',
    domain: cookieDomain,
    sameSite: 'lax',
  });
}

async function getUser(
  req: Request,
  authService: IAuthService,
  logger: ILogger
) {
  const bearerToken = getHttpHeaderValue('authorization', req.headers);

  if (!bearerToken) return null;

  const token = bearerToken.split(' ')[1];

  if (!token) return null;

  try {
    const user = await authService.getAuthUser(token);
    return user;
  } catch (error) {
    logger.error('An error occurred while decoding token', {
      error,
    });
    return null;
  }
}

async function getAccountingEntity(
  req: Request,
  repo: IAccountingEntityRepo,
  userId?: TEntityId
): Promise<IAccountingEntity> {
  if (!userId) return {} as IAccountingEntity;

  const id = getHttpHeaderValue('x-accounting-entity-id', req.headers);

  if (!id) return {} as IAccountingEntity;

  const isValidUUID = stringUtils.isUUID(id);

  if (!isValidUUID) throw new ErrorBadRequest('Invalid accounting entity.');

  const accountingEntity = await repo.findById(id as TEntityId, {
    correlationId: getCorrelationId(req),
  });

  if (!accountingEntity)
    throw new ErrorBadRequest('Accounting entity not found.');

  return accountingEntity;
}

/**
 * DOMAIN: global
 *
 * This middleware is used to initialize the request context
 */
export default function requestContextInitMiddleware(
  requestContext: IRequestContext,
  accountingEntityRepo: IAccountingEntityRepo,
  authService: IAuthService,
  userRepo: IUserRepo,
  logger: ILogger
): RequestHandler {
  return async (req, res, next) => {
    const correlationId = getCorrelationId(req);
    const idempotencyKey = getIdempotencyKey(req);

    const authUser = await getUser(req, authService, logger);

    const accountingEntity = await getAccountingEntity(
      req,
      accountingEntityRepo,
      authUser?.id
    );

    let user = {} as IUser;

    if (authUser) {
      const existingUser = await userRepo.findById(authUser.id, {
        correlationId,
      });

      if (existingUser) {
        accountingEntityEntity.validateAccess(accountingEntity, existingUser);
        user = existingUser;
      }
    }

    requestContext.init(
      {
        user,
        accountingEntity,
        correlationId,
        idempotencyKey: idempotencyKey || '',
        clientSession: {
          setRefreshToken: (token: string) => handleSetRefreshToken(res, token),
          getRefreshToken: () => {
            return req.cookies.refresh_token;
          },
          clearRefreshToken: () => handleClearRefreshToken(res),
        },
      },
      next
    );
  };
}
