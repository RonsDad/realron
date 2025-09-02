// File generated from our OpenAPI spec by Stainless. See CONTRIBUTING.md for details.

import { APIResource } from '../../../core/resource';
import * as V3API from './v3';
import {
  Address,
  AmbulanceCertification,
  AmbulanceTransportInformation,
  ClaimAdjustment,
  ClaimPricingRepricingInformation,
  ClaimSubmission,
  ContactInformation,
  RawX12Request,
  ReferenceIdentification,
  ReportInformation,
  Response,
  ServiceFacilityLocation,
  ServiceLineProvider,
  Supervising,
  V3,
  V3HealthCheckResponse,
  V3SubmitClaimParams,
  V3SubmitRawX12ClaimParams,
  V3ValidateClaimParams,
  V3ValidateRawX12ClaimParams,
} from './v3';

export class Professionalclaims extends APIResource {
  v3: V3API.V3 = new V3API.V3(this._client);
}

Professionalclaims.V3 = V3;

export declare namespace Professionalclaims {
  export {
    V3 as V3,
    type Address as Address,
    type AmbulanceCertification as AmbulanceCertification,
    type AmbulanceTransportInformation as AmbulanceTransportInformation,
    type ClaimAdjustment as ClaimAdjustment,
    type ClaimPricingRepricingInformation as ClaimPricingRepricingInformation,
    type ClaimSubmission as ClaimSubmission,
    type ContactInformation as ContactInformation,
    type RawX12Request as RawX12Request,
    type ReferenceIdentification as ReferenceIdentification,
    type ReportInformation as ReportInformation,
    type Response as Response,
    type ServiceFacilityLocation as ServiceFacilityLocation,
    type ServiceLineProvider as ServiceLineProvider,
    type Supervising as Supervising,
    type V3HealthCheckResponse as V3HealthCheckResponse,
    type V3SubmitClaimParams as V3SubmitClaimParams,
    type V3SubmitRawX12ClaimParams as V3SubmitRawX12ClaimParams,
    type V3ValidateClaimParams as V3ValidateClaimParams,
    type V3ValidateRawX12ClaimParams as V3ValidateRawX12ClaimParams,
  };
}
