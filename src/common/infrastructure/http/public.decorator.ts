import { SetMetadata } from '@nestjs/common';

export const IS_PUBLIC_ROUTE = 'isPublicRoute';

/**
 * Every route requires a session by default (global AuthGuard). Mark here
 * the ones that must stay open: login/registration, and diner routes where
 * login is optional (they identify the diner themselves).
 */
export const Public = () => SetMetadata(IS_PUBLIC_ROUTE, true);
