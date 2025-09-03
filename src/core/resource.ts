// File generated from our OpenAPI spec by Stainless. See CONTRIBUTING.md for details.

import type { Claims } from '../client';

export abstract class APIResource {
  protected _client: Claims;

  constructor(client: Claims) {
    this._client = client;
  }
}
