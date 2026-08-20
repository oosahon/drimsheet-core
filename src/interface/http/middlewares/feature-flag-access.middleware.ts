import { RequestHandler } from 'express';

import IAppContext from '@app/context/contracts/app-context.contract';
import IFeatureFlagService from '@app/context/contracts/feature-flag.service.contract';
import featureFlagError from '@app/context/errors/feature-flag.error';

interface IDependencies {
  featureFlagService: IFeatureFlagService;
  appContext: IAppContext;
}

type TMiddlewareShape = Record<keyof IFeatureFlagService, RequestHandler>;

export default function makeFeatureFlagAccessMiddleware(
  deps: IDependencies
): TMiddlewareShape {
  return {
    async canAccessAlpha1(req, res, next) {
      const { user } = deps.appContext.get(['user']);
      const canAccess = await deps.featureFlagService.canAccessAlpha1({
        userId: user.id,
      });

      if (!canAccess) {
        throw new featureFlagError.NotPermitted();
      }

      next();
    },
  };
}
