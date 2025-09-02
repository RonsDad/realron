// File generated from our OpenAPI spec by Stainless. See CONTRIBUTING.md for details.

import { APIResource } from '../../core/resource';
import * as ProfessionalclaimsAPI from './professionalclaims/professionalclaims';
import { Professionalclaims } from './professionalclaims/professionalclaims';

export class Medicalnetwork extends APIResource {
  professionalclaims: ProfessionalclaimsAPI.Professionalclaims = new ProfessionalclaimsAPI.Professionalclaims(
    this._client,
  );
}

Medicalnetwork.Professionalclaims = Professionalclaims;

export declare namespace Medicalnetwork {
  export { Professionalclaims as Professionalclaims };
}
