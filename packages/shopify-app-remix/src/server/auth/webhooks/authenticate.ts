import {ShopifyRestResources} from '@shopify/shopify-api';

import {adminClientFactory} from '../../clients/admin';
import type {BasicParams, MandatoryTopics} from '../../types';

import type {WebhookContext, WebhookContextWithSession} from './types';

export function authenticateWebhookFactory<
  Resources extends ShopifyRestResources,
  Topics extends string | number | symbol | MandatoryTopics,
>({api, config, logger}: BasicParams) {
  return async function authenticate(
    request: Request,
  ): Promise<
    WebhookContext<Topics> | WebhookContextWithSession<Topics, Resources>
  > {
    if (request.method !== 'POST') {
      logger.debug(
        'Received a non-POST request for a webhook. Only POST requests are allowed.',
        {url: request.url, method: request.method},
      );
      throw new Response(undefined, {
        status: 405,
        statusText: 'Method not allowed',
      });
    }

    const rawBody = await request.text();

    const check = await api.webhooks.validate({
      rawBody,
      rawRequest: request,
    });

    if (!check.valid) {
      logger.debug('Webhook validation failed', check);
      throw new Response(undefined, {status: 400, statusText: 'Bad Request'});
    }

    const sessionId = api.session.getOfflineId(check.domain);
    const session = await config.sessionStorage.loadSession(sessionId);
    const webhookContext: WebhookContext<Topics> = {
      apiVersion: check.apiVersion,
      shop: check.domain,
      topic: check.topic as Topics,
      webhookId: check.webhookId,
      payload: JSON.parse(rawBody),
      session: undefined,
      admin: undefined,
    };

    if (!session) {
      return webhookContext;
    }

    return {
      ...webhookContext,
      session,
      admin: adminClientFactory<Resources>({
        params: {api, config, logger},
        session,
      }),
    };
  };
}
