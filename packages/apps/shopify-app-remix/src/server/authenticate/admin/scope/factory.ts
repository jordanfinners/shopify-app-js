import {Session} from '@shopify/shopify-api';

import {BasicParams} from '../../../types';
import {AdminApiContext} from '../../../clients';

import {ScopesApiContext} from './types';
import {requestScopesFactory} from './request';
import {queryScopesFactory} from './query';

export function scopesApiFactory(
  params: BasicParams,
  session: Session,
  admin: AdminApiContext,
): ScopesApiContext {
  return {
    query: queryScopesFactory(params, session, admin),
    request: requestScopesFactory(params, session),
  };
}
