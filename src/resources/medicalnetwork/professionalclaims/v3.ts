// File generated from our OpenAPI spec by Stainless. See CONTRIBUTING.md for details.

import { APIResource } from '../../../core/resource';
import * as V3API from './v3';
import { APIPromise } from '../../../core/api-promise';
import { buildHeaders } from '../../../internal/headers';
import { RequestOptions } from '../../../internal/request-options';

export class V3 extends APIResource {
  /**
   * Health Check
   *
   * @example
   * ```ts
   * const response =
   *   await client.medicalnetwork.professionalclaims.v3.healthCheck();
   * ```
   */
  healthCheck(options?: RequestOptions): APIPromise<V3HealthCheckResponse> {
    return this._client.get('/medicalnetwork/professionalclaims/v3/healthcheck', options);
  }

  /**
   * Claim Submission
   *
   * @example
   * ```ts
   * const response = await client.medicalnetwork.professionalclaims.v3.submitClaim({
   *   billing: { providerType: 'BillingProvider' },
   *   claimInformation: {
   *     benefitsAssignmentCertificationIndicator: 'Y',
   *     claimChargeAmount: '28.75',
   *     claimFilingCode: 'CI',
   *     claimFrequencyCode: '1',
   *     healthCareCodeInformation: [
   *       { ... },
   *     ],
   *     patientControlNumber: '12345',
   *     placeOfServiceCode: '11',
   *     planParticipationCode: 'A',
   *     releaseInformationCode: 'Y',
   *     serviceLines: [
   *       { ... },
   *     ],
   *     signatureIndicator: 'Y',
   *   },
   *   controlNumber: '000000001',
   *   receiver: { organizationName: 'EXTRA HEALTHY INSURANCE' },
   *   submitter: {
   *     contactInformation: { ... },
   *   },
   *   subscriber: { paymentResponsibilityLevelCode: 'P' },
   * });
   * ```
   */
  submitClaim(params: V3SubmitClaimParams, options?: RequestOptions): APIPromise<Response> {
    const { 'x-chng-trace-id': xChngTraceID, ...body } = params;
    return this._client.post('/medicalnetwork/professionalclaims/v3/submission', {
      body,
      ...options,
      headers: buildHeaders([
        { ...(xChngTraceID != null ? { 'x-chng-trace-id': xChngTraceID } : undefined) },
        options?.headers,
      ]),
    });
  }

  /**
   * Claim Submission x12
   *
   * @example
   * ```ts
   * const response =
   *   await client.medicalnetwork.professionalclaims.v3.submitRawX12Claim();
   * ```
   */
  submitRawX12Claim(params: V3SubmitRawX12ClaimParams, options?: RequestOptions): APIPromise<Response> {
    const {
      'X-CHC-ClaimSubmission-BillerId': xChcClaimSubmissionBillerID,
      'X-CHC-ClaimSubmission-Pwd': xChcClaimSubmissionPwd,
      'X-CHC-ClaimSubmission-SubmitterId': xChcClaimSubmissionSubmitterID,
      'X-CHC-ClaimSubmission-Username': xChcClaimSubmissionUsername,
      'X-CHC-TraceId': xChcTraceID,
      'x-chng-trace-id': xChngTraceID,
      ...body
    } = params;
    return this._client.post('/medicalnetwork/professionalclaims/v3/raw-x12-submission', {
      body,
      ...options,
      headers: buildHeaders([
        {
          ...(xChcClaimSubmissionBillerID != null ?
            { 'X-CHC-ClaimSubmission-BillerId': xChcClaimSubmissionBillerID }
          : undefined),
          ...(xChcClaimSubmissionPwd != null ?
            { 'X-CHC-ClaimSubmission-Pwd': xChcClaimSubmissionPwd }
          : undefined),
          ...(xChcClaimSubmissionSubmitterID != null ?
            { 'X-CHC-ClaimSubmission-SubmitterId': xChcClaimSubmissionSubmitterID }
          : undefined),
          ...(xChcClaimSubmissionUsername != null ?
            { 'X-CHC-ClaimSubmission-Username': xChcClaimSubmissionUsername }
          : undefined),
          ...(xChcTraceID != null ? { 'X-CHC-TraceId': xChcTraceID } : undefined),
          ...(xChngTraceID != null ? { 'x-chng-trace-id': xChngTraceID } : undefined),
        },
        options?.headers,
      ]),
    });
  }

  /**
   * Claim Validation
   *
   * @example
   * ```ts
   * const response = await client.medicalnetwork.professionalclaims.v3.validateClaim({
   *   billing: { providerType: 'BillingProvider' },
   *   claimInformation: {
   *     benefitsAssignmentCertificationIndicator: 'Y',
   *     claimChargeAmount: '28.75',
   *     claimFilingCode: 'CI',
   *     claimFrequencyCode: '1',
   *     healthCareCodeInformation: [
   *       { ... },
   *     ],
   *     patientControlNumber: '12345',
   *     placeOfServiceCode: '11',
   *     planParticipationCode: 'A',
   *     releaseInformationCode: 'Y',
   *     serviceLines: [
   *       { ... },
   *     ],
   *     signatureIndicator: 'Y',
   *   },
   *   controlNumber: '000000001',
   *   receiver: { organizationName: 'EXTRA HEALTHY INSURANCE' },
   *   submitter: {
   *     contactInformation: { ... },
   *   },
   *   subscriber: { paymentResponsibilityLevelCode: 'P' },
   * });
   * ```
   */
  validateClaim(params: V3ValidateClaimParams, options?: RequestOptions): APIPromise<Response> {
    const { 'x-chng-trace-id': xChngTraceID, ...body } = params;
    return this._client.post('/medicalnetwork/professionalclaims/v3/validation', {
      body,
      ...options,
      headers: buildHeaders([
        { ...(xChngTraceID != null ? { 'x-chng-trace-id': xChngTraceID } : undefined) },
        options?.headers,
      ]),
    });
  }

  /**
   * Claim Validation x12
   *
   * @example
   * ```ts
   * const response =
   *   await client.medicalnetwork.professionalclaims.v3.validateRawX12Claim();
   * ```
   */
  validateRawX12Claim(params: V3ValidateRawX12ClaimParams, options?: RequestOptions): APIPromise<Response> {
    const {
      'X-CHC-ClaimSubmission-BillerId': xChcClaimSubmissionBillerID,
      'X-CHC-ClaimSubmission-Pwd': xChcClaimSubmissionPwd,
      'X-CHC-ClaimSubmission-SubmitterId': xChcClaimSubmissionSubmitterID,
      'X-CHC-ClaimSubmission-Username': xChcClaimSubmissionUsername,
      'X-CHC-TraceId': xChcTraceID,
      'x-chng-trace-id': xChngTraceID,
      ...body
    } = params;
    return this._client.post('/medicalnetwork/professionalclaims/v3/raw-x12-validation', {
      body,
      ...options,
      headers: buildHeaders([
        {
          ...(xChcClaimSubmissionBillerID != null ?
            { 'X-CHC-ClaimSubmission-BillerId': xChcClaimSubmissionBillerID }
          : undefined),
          ...(xChcClaimSubmissionPwd != null ?
            { 'X-CHC-ClaimSubmission-Pwd': xChcClaimSubmissionPwd }
          : undefined),
          ...(xChcClaimSubmissionSubmitterID != null ?
            { 'X-CHC-ClaimSubmission-SubmitterId': xChcClaimSubmissionSubmitterID }
          : undefined),
          ...(xChcClaimSubmissionUsername != null ?
            { 'X-CHC-ClaimSubmission-Username': xChcClaimSubmissionUsername }
          : undefined),
          ...(xChcTraceID != null ? { 'X-CHC-TraceId': xChcTraceID } : undefined),
          ...(xChngTraceID != null ? { 'x-chng-trace-id': xChngTraceID } : undefined),
        },
        options?.headers,
      ]),
    });
  }
}

/**
 * N3 and N4
 */
export interface Address {
  /**
   * Segment: N3, Element: N301
   */
  address1: string;

  /**
   * Segment: N4, Element: N401
   */
  city: string;

  /**
   * Segment: N3, Element: N302
   */
  address2?: string;

  /**
   * Segment: N4, Element: N404
   */
  countryCode?: string;

  /**
   * Segment: N4, Element: N407
   */
  countrySubDivisionCode?: string;

  /**
   * Segment: N4, Element: N403
   */
  postalCode?: string;

  /**
   * Segment: N4, Element: N402
   */
  state?: string;
}

/**
 * CRC
 */
export interface AmbulanceCertification {
  /**
   * Loop: 2300, Segment: CRC, Element: CRC02 when CRC01 = 07, Note: Allowed Values
   * are: 'N' No, 'Y' Yes
   */
  certificationConditionIndicator: 'N' | 'Y';

  /**
   * Loop: 2300, Segment: CRC, Element: CRC03, CRC04, CRC05, CRC06, CRC07, Note:
   * Allowed Values are: '01' Patient was admitted to a hospital, '04' Patient was
   * moved by stretcher, '05' Patient was unconscious or in shock, '06' Patient was
   * transported in an emergency situation, '07' Patient had to be physically
   * restrained, '08' Patient had visible hemorrhaging, '09' Ambulance service was
   * medically necessary, '12' Patient is confined to a bed or chair
   */
  conditionCodes: Array<'01' | '04' | '05' | '06' | '07' | '08' | '09' | '12'>;
}

/**
 * CR1
 */
export interface AmbulanceTransportInformation {
  /**
   * CR104, Note: Allowed Values are: 'A' Patient was transported to nearest facility
   * for care of symptoms, complaints, or both, 'B' Patient was transported for the
   * benefit of a preferred physician, 'C' Patient was transported for the nearness
   * of family members, 'D' Patient was transported for the care of a specialist or
   * for availability of specialized equipment, 'E' Patient Transferred to
   * Rehabilitation Facility
   */
  ambulanceTransportReasonCode: 'A' | 'B' | 'C' | 'D' | 'E';

  /**
   * Segment: CR1, Element: CR106
   */
  transportDistanceInMiles: string;

  /**
   * Segment: CR1, Element: CR102
   */
  patientWeightInPounds?: string;

  /**
   * Segment: CR1, Element: CR109
   */
  roundTripPurposeDescription?: string;

  /**
   * Segment: CR1, Element: CR110
   */
  stretcherPurposeDescription?: string;
}

/**
 * CR1
 */
export interface ClaimAdjustment {
  /**
   * Loop: 2430, Segment: CAS
   */
  adjustmentDetails: Array<ClaimAdjustment.AdjustmentDetail>;

  /**
   * Loop: 2430, Segment: CAS, Element: CAS01, Notes: Code identifying the general
   * category of payment adjustment
   */
  adjustmentGroupCode: 'CO' | 'CR' | 'OA' | 'PI' | 'PR';
}

export namespace ClaimAdjustment {
  /**
   * CAS
   */
  export interface AdjustmentDetail {
    /**
     * Loop: 2430, Segment: CAS, Element: CAS03, CAS06, CAS09, CAS12, CAS15, CAS18
     */
    adjustmentAmount: string;

    /**
     * Loop: 2430, Segment: CAS, Element: CAS02, CAS05, CAS08, CAS11, CAS14, CAS17
     */
    adjustmentReasonCode: string;

    /**
     * Loop: 2430, Segment: CAS, Element: CAS04, CAS07, CAS10, CAS13, CAS16, CAS19
     */
    adjustmentQuantity?: string;
  }
}

/**
 * HCP
 */
export interface ClaimPricingRepricingInformation {
  /**
   * Loop: 2300, Segment: HCP, Element: HCP01, Note: Allowed Values are: '00' Zero
   * Pricing (Not Covered Under Contract), '01' Priced as Billed at 100%, '02' Priced
   * at the Standard Fee Schedule, '03' Priced at a Contractual Percentage, '04'
   * Bundled Pricing, '05' Peer Review Pricing, '06' Bundled Pricing, '07' Flat Rate
   * Pricing, '08' Combination Pricing, '09' Maternity Pricing, '10' Other Pricing,
   * '11' Lower of Cost, '12' Ratio of Cost, '13' Cost Reimbursed, '14' Adjustment
   * Pricing
   */
  pricingMethodologyCode:
    | '00'
    | '01'
    | '02'
    | '03'
    | '04'
    | '05'
    | '06'
    | '07'
    | '08'
    | '09'
    | '10'
    | '11'
    | '12'
    | '13'
    | '14';

  /**
   * Loop: 2300, Segment: HCP, Element: HCP02
   */
  repricedAllowedAmount: string;

  /**
   * Loop: 2300, Segment: HCP, Element: HCP15, Note: Allowed Values are: '1'
   * Non-Network Professional Provider in Network Hospital, '2' Emergency Care, '3'
   * Services or Specialist not in Network, '4' Out-of-Service Area, '5' State
   * Mandates, '6' Other
   */
  exceptionCode?: '1' | '2' | '3' | '4' | '5' | '6';

  /**
   * Loop: 2300, Segment: HCP, Element: HCP14, Note: Allowed Values are: '1'
   * Procedure Followed (Compliance), '2' Not Followed - Call Not Made
   * (Non-Compliance Call Not Made), '3' Not Medically Necessary (Non-Compliance
   * Non-Medically Necessary), '4' Not Followed Other (Non-Compliance Other), '5'
   * Emergency Admit to Non-Network Hospital
   */
  policyComplianceCode?: '1' | '2' | '3' | '4' | '5';

  /**
   * Loop: 2300, Segment: HCP, Element: HCP13, Note: Allowed Values are: 'T1' Cannot
   * Identify Provider as TPO (Third Party Organization) Participant, 'T2' Cannot
   * Identify Payer as TPO (Third Party Organization) Participant, 'T3' Cannot
   * Identify Insured as TPO (Third Party Organization) Participant, 'T4' Payer Name
   * or Identifier Missing, 'T5' Certification Information Missing, '16' Claim does
   * not contain enough information for repricing
   */
  rejectReasonCode?: 'T1' | 'T2' | 'T3' | 'T4' | 'T5' | 'T6';

  /**
   * Loop: 2300, Segment: HCP, Element: HCP07
   */
  repricedApprovedAmbulatoryPatientGroupAmount?: string;

  /**
   * Loop: 2300, Segment: HCP, Element: HCP06
   */
  repricedApprovedAmbulatoryPatientGroupCode?: string;

  /**
   * Loop: 2300, Segment: HCP, Element: HCP03
   */
  repricedSavingAmount?: string;

  /**
   * Loop: 2300, Segment: HCP, Element: HCP04
   */
  repricingOrganizationIdentifier?: string;

  /**
   * Loop: 2300, Segment: HCP, Element: HCP05
   */
  repricingPerDiemOrFlatRateAmount?: string;
}

export interface ClaimSubmission {
  /**
   * Loop: 2000A
   */
  billing: ClaimSubmission.Billing;

  /**
   * Loop2300
   */
  claimInformation: ClaimSubmission.ClaimInformation;

  /**
   * Header, Segment: ST02 (no loop), Notes: Transaction Set Control Number
   */
  controlNumber: string;

  /**
   * Loop: 1000B
   */
  receiver: ClaimSubmission.Receiver;

  /**
   * Loop: 1000A
   */
  submitter: ClaimSubmission.Submitter;

  /**
   * Loop: 2000B
   */
  subscriber: ClaimSubmission.Subscriber;

  /**
   * LOOP 2000C
   */
  dependent?: ClaimSubmission.Dependent;

  /**
   * @deprecated Loop: 2420E, Setting ProviderType equal to OrderingProvider is
   * deprecated, please use ClaimInformation.serviceLines.orderingProvider
   */
  ordering?: ClaimSubmission.Ordering;

  /**
   * N3 and N4
   */
  payerAddress?: Address;

  /**
   * N3 and N4
   */
  payToAddress?: Address;

  /**
   * 2010AC
   */
  payToPlan?: ClaimSubmission.PayToPlan;

  /**
   * @deprecated setting providers deprecated, please set all providers individually
   * by it's type.
   */
  providers?: Array<Supervising>;

  /**
   * Loop: 2420F
   */
  referring?: ClaimSubmission.Referring;

  /**
   * Loop: 2420A
   */
  rendering?: ClaimSubmission.Rendering;

  /**
   * Loop: 2420D
   */
  supervising?: Supervising;

  /**
   * Loop 2010BB NM103
   */
  tradingPartnerName?: string;

  /**
   * Loop: 2010BB Segment: NM1, Element: NM109, Notes: we send this as MN108 as PI =
   * Payer Identification
   */
  tradingPartnerServiceId?: string;

  /**
   * Interchange Usage Indicator ISA15; T-Test Data, P-Production Data
   */
  usageIndicator?: string;
}

export namespace ClaimSubmission {
  /**
   * Loop: 2000A
   */
  export interface Billing {
    providerType: string;

    /**
     * N3 and N4
     */
    address?: V3API.Address;

    /**
     * Loop: 2010AC, Segment: REF, Element: REF02 when REF01=FY
     */
    claimOfficeNumber?: string;

    /**
     * REF02 when REF01=G2
     */
    commercialNumber?: string;

    /**
     * PER
     */
    contactInformation?: V3API.ContactInformation;

    /**
     * REF02 when REF01=EI, Notes: The Employer Identification Number must be a string
     * of exactly nine numbers with no separators
     */
    employerId?: string;

    /**
     * LOOP: 2010AC, Segment: REF, Element: REF02 when REF01=EI
     */
    employerIdentificationNumber?: string;

    /**
     * NM104
     */
    firstName?: string;

    /**
     * NM103
     */
    lastName?: string;

    /**
     * REF02 when REF01=LU
     */
    locationNumber?: string;

    /**
     * NM105
     */
    middleName?: string;

    /**
     * Loop: 2010AC, Segment: REF, Element: REF02 when REF01=NF, Notes: National
     * Association of Insurance Commissioners (NAIC) Code
     */
    naic?: string;

    /**
     * NM109, Notes: National Provider Identifier
     */
    npi?: string;

    /**
     * NM103
     */
    organizationName?: string;

    /**
     * LOOP: 2010AC, Segment: REF, Element: REF02 when REF01=2U
     */
    payerIdentificationNumber?: string;

    /**
     * REF02 when REF01=1G, Notes: UPINs must be formatted as either X99999 or XXX999
     */
    providerUpinNumber?: string;

    /**
     * REF02 when REF01=SY, Notes: The Social Security Number must be a string of nine
     * numbers with no separators
     */
    ssn?: string;

    /**
     * REF02 when REF01=0B
     */
    stateLicenseNumber?: string;

    /**
     * NM107
     */
    suffix?: string;

    /**
     * PRV03
     */
    taxonomyCode?: string;
  }

  /**
   * Loop2300
   */
  export interface ClaimInformation {
    /**
     * Loop 2300, Segment: CLM, Element: CLM08, Note: Allowed Values are: 'N' No, 'W'
     * Not Applicable - Use code 'W' when the patient refuses to assign benefits, 'Y'
     * Yes
     */
    benefitsAssignmentCertificationIndicator: 'N' | 'W' | 'Y';

    /**
     * Loop 2300, Segment: CLM, Element: CLM02
     */
    claimChargeAmount: string;

    /**
     * Loop 2000B, Segment: SBR, Element: SBR09, Note: Allowed Values are: '11' Other
     * Non-Federal Programs, '12' Preferred Provider Organization (PPO), '13' Point of
     * Service (POS), '14' Exclusive Provider Organization (EPO), '15' Indemnity
     * Insurance, '16' Health Maintenance Organization (HMO) Medicare Risk, '17' Dental
     * Maintenance Organization, 'AM' Automobile Medical, 'BL' Blue Cross/Blue Shield,
     * 'CH' Champus, 'CI' Commercial Insurance Co., 'DS' Disability, 'FI' Federal
     * Employees Program, 'HM' Health Maintenance Organization, 'LM' Liability Medical,
     * 'MA' Medicare Part A, 'MB' Medicare Part B, 'MC' Medicaid, 'OF' Other Federal
     * Program, 'TV' Title V, 'VA' Veterans Affairs Plan, 'WC' Workers' Compensation
     * Health Claim, 'ZZ' Mutually Defined
     */
    claimFilingCode:
      | '11'
      | '12'
      | '13'
      | '14'
      | '15'
      | '16'
      | '17'
      | 'AM'
      | 'BL'
      | 'CH'
      | 'CI'
      | 'DS'
      | 'FI'
      | 'HM'
      | 'LM'
      | 'MA'
      | 'MB'
      | 'MC'
      | 'OF'
      | 'TV'
      | 'VA'
      | 'WC'
      | 'ZZ';

    /**
     * Loop 2300, Segment: CLM, Element: CLM05-03
     */
    claimFrequencyCode: string;

    /**
     * Loop 2300, Segment: HI
     */
    healthCareCodeInformation: Array<ClaimInformation.HealthCareCodeInformation>;

    /**
     * Loop 2300, Segment: CLM, Element: CLM01
     */
    patientControlNumber: string;

    /**
     * Loop 2300, Segment: CLM, Element: CLM05-01
     */
    placeOfServiceCode: string;

    /**
     * Loop 2300, Segment: CLM, Element: CLM07, Note: Allowed Values are: 'A' Assigned,
     * 'B' Assignment Accepted on Clinical Lab Services Only, 'C' Not Assigned
     */
    planParticipationCode: 'A' | 'B' | 'C';

    /**
     * Loop 2300, Segment: CLM, Element: CLM09, Note: Allowed Values are: 'I' Informed
     * Consent to Release Medical Information for Conditions or Diagnoses Regulated by
     * Federal Statutes, 'Y' Yes
     */
    releaseInformationCode: 'I' | 'Y';

    /**
     * Loop 2400
     */
    serviceLines: Array<ClaimInformation.ServiceLine>;

    /**
     * Loop 2300, Segment: CLM, Element: CLM06, Note: Allowed Values are: 'N' NO, 'Y'
     * Yes
     */
    signatureIndicator: 'N' | 'Y';

    /**
     * Loop 2300, Segment: CRC
     */
    ambulanceCertification?: Array<V3API.AmbulanceCertification>;

    /**
     * N3 and N4
     */
    ambulanceDropOffLocation?: V3API.Address;

    /**
     * N3 and N4
     */
    ambulancePickUpLocation?: V3API.Address;

    /**
     * CR1
     */
    ambulanceTransportInformation?: V3API.AmbulanceTransportInformation;

    /**
     * Loop 2300, Segment: HI
     */
    anesthesiaRelatedSurgicalProcedure?: Array<string>;

    /**
     * Loop 2300, Segment: CLM, Element: CLM11-05, Note: When CLM11-1 or CLM11-2 = AA
     * and the accident occurred in a country other than US or Canada.
     */
    autoAccidentCountryCode?: string;

    /**
     * Loop 2300, Segment: CLM, Element: CLM11-04, Note: When CLM11-1 or CLM11-2 has a
     * value of 'AA' to identify the state, province or sub-country code in which the
     * automobile accident occurred.
     */
    autoAccidentStateCode?: 'AA' | 'EM' | 'OA';

    /**
     * Loop 2300, Segment: CN1
     */
    claimContractInformation?: ClaimInformation.ClaimContractInformation;

    /**
     * DTP
     */
    claimDateInformation?: ClaimInformation.ClaimDateInformation;

    /**
     * NTE
     */
    claimNote?: ClaimInformation.ClaimNote;

    /**
     * HCP
     */
    claimPricingRepricingInformation?: V3API.ClaimPricingRepricingInformation;

    /**
     * PWK and REF
     */
    claimSupplementalInformation?: ClaimInformation.ClaimSupplementalInformation;

    /**
     * Loop 2300, Segment: HI
     */
    conditionInformation?: Array<ClaimInformation.ConditionInformation>;

    /**
     * Loop 2000B and 2000C, Segment: PAT, Element: PAT06 and PAT05=D8
     */
    deathDate?: string;

    /**
     * Loop 2300, Segment: CLM, Element: CLM20, Note: Allowed Values are: '1' Proof of
     * Eligibility Unknown or Unavailable, '2' Litigation, '3' Authorization Delays,
     * '4' Delay in Certifying Provider, '5' Delay in Supplying Billing Forms, '6'
     * Delay in Delivery of Custom-made Appliances, '7' Third Party Processing Delay,
     * '8' Delay in Eligibility Determination, '9' Original Claim Rejected or Denied
     * Due to a Reason Unrelated to the Billing Limitation Rules, '10' Administration
     * Delay in the Prior Approval Process, '11' Other, '15' Natural Disaster
     */
    delayReasonCode?: '1' | '2' | '3' | '4' | '5' | '6' | '7' | '8' | '9' | '10' | '11' | '15';

    /**
     * CRC
     */
    epsdtReferral?: ClaimInformation.EpsdtReferral;

    /**
     * Loop 2300, Segment: K3, Element: K301
     */
    fileInformation?: string;

    /**
     * Loop 2300, Segment: K3, Element: K301
     */
    fileInformationList?: Array<string>;

    /**
     * Loop 2300, Segment: CRC
     */
    homeboundIndicator?: boolean;

    /**
     * Loop 2320
     */
    otherSubscriberInformation?: Array<ClaimInformation.OtherSubscriberInformation>;

    /**
     * Loop 2300, Segment: AMT, Element: AMT02
     */
    patientAmountPaid?: string;

    /**
     * Loop 2300, Segment: CRC
     */
    patientConditionInformationVision?: Array<ClaimInformation.PatientConditionInformationVision>;

    /**
     * Loop 2300, Segment: CLM, Element: CLM10, Note: Allowed Values are: 'P' Signature
     * generated by provider because the patient was not physically present for
     * services
     */
    patientSignatureSourceCode?: false;

    /**
     * Loop 2000B and 2000C, Segment: PAT, Element: PAT08 and PAT07=01
     */
    patientWeight?: string;

    /**
     * Loop 2000B and 2000C, Segment: PAT, Element: PAT09
     */
    pregnancyIndicator?: 'Y';

    /**
     * Loop 2010BA, Segment: REF, Element: REF02
     */
    propertyCasualtyClaimNumber?: string;

    /**
     * Loop 2300, Segment: CLM, Element: CLM11-01, CLM11-02, Note: Allowed Values are:
     * 'AA' Auto Accident, 'EM' Employment, 'OA' Other Accident
     */
    relatedCausesCode?: Array<'AA' | 'EM' | 'OA'>;

    serviceFacilityLocation?: V3API.ServiceFacilityLocation;

    /**
     * Loop 2300, Segment: CLM, Element: CLM12, Note: Allowed Values are: '02'
     * Physically Handicapped Children's Program, '03' Special Federal Funding, '05'
     * Disabolity, '09' Second Opinion or Surgery
     */
    specialProgramCode?: '02' | '03' | '05' | '09';

    /**
     * Loop 2300, Segment: CR2
     */
    spinalManipulationServiceInformation?: ClaimInformation.SpinalManipulationServiceInformation;
  }

  export namespace ClaimInformation {
    /**
     * HI
     */
    export interface HealthCareCodeInformation {
      /**
       * Loop: 2440, Segment: HI, Element: HI01-02 or HI02-02 or HI03-02 or HI04-02 or
       * HI05-02 or HI06-02 or HI07-02 or HI08-02 or HI09-02 or HI10-02 or HI11-02 or
       * HI12-02
       */
      diagnosisCode: string;

      /**
       * Loop: 2440, Segment: HI, Element: HI01-01 or HI02-01 or HI03-01 or HI04-01 or
       * HI05-01 or HI06-01 or HI07-01 or HI08-01 or HI09-01 or HI10-01 or HI11-01 or
       * HI12-01, Note: Allowed Values are: 'BK' International Classification of Diseases
       * Clinical Modification (ICD-9-CM) Principal Diagnosis, 'ABK' International
       * Classification of Diseases Clinical Modification (ICD-10-CM) Principal
       * Diagnosis, 'BF' International Classification of Diseases Clinical Modification
       * (ICD-9-CM) Diagnosis, 'ABF' International Classification of Diseases Clinical
       * Modification (ICD-10-CM) Diagnosis
       */
      diagnosisTypeCode: 'BK' | 'ABK' | 'BF' | 'ABF';
    }

    /**
     * Loop 2400
     */
    export interface ServiceLine {
      professionalService: ServiceLine.ProfessionalService;

      /**
       * Loop: 2400, Segment: DTP, Element: DTP03, Notes: When sent with serviceDateEnd
       * it will be used as the start date for Date Time period, if sent without
       * serviceDateEnd will use DTP02 = D8. Expressed in Format CCYYMMDD
       */
      serviceDate: string;

      /**
       * Loop: 2400, Segment: NTE, Element: NTE02 when NTE01=ADD
       */
      additionalNotes?: string;

      ambulanceCertification?: Array<V3API.AmbulanceCertification>;

      /**
       * N3 and N4
       */
      ambulanceDropOffLocation?: V3API.Address;

      /**
       * Loop: 2400, Segment: QTY, Element: QTY02 when QTY01=PT
       */
      ambulancePatientCount?: number;

      /**
       * N3 and N4
       */
      ambulancePickUpLocation?: V3API.Address;

      /**
       * CR1
       */
      ambulanceTransportInformation?: V3API.AmbulanceTransportInformation;

      /**
       * Loop: 2400, Segment: LX, Element: LX01
       */
      assignedNumber?: string;

      /**
       * CRC
       */
      conditionIndicatorDurableMedicalEquipment?: ServiceLine.ConditionIndicatorDurableMedicalEquipment;

      /**
       * CN1
       */
      contractInformation?: ServiceLine.ContractInformation;

      /**
       * LOOP 2410
       */
      drugIdentification?: ServiceLine.DrugIdentification;

      /**
       * PWK
       */
      durableMedicalEquipmentCertificateOfMedicalNecessity?: ServiceLine.DurableMedicalEquipmentCertificateOfMedicalNecessity;

      /**
       * CR3
       */
      durableMedicalEquipmentCertification?: ServiceLine.DurableMedicalEquipmentCertification;

      /**
       * SV5
       */
      durableMedicalEquipmentService?: ServiceLine.DurableMedicalEquipmentService;

      /**
       * Loop: 2400, Segment: K3, Element: K301
       */
      fileInformation?: Array<string>;

      formIdentification?: Array<ServiceLine.FormIdentification>;

      /**
       * Loop: 2400, Segment: NTE, Element: NTE02 when NTE01=DCP
       */
      goalRehabOrDischargePlans?: string;

      /**
       * Loop: 2400, Segment: CRC, Element: CRC02 Notes: True or False
       */
      hospiceEmployeeIndicator?: boolean;

      lineAdjudicationInformation?: Array<ServiceLine.LineAdjudicationInformation>;

      /**
       * HCP
       */
      linePricingRepricingInformation?: V3API.ClaimPricingRepricingInformation;

      /**
       * Loop: 2400, Segment: QTY, Element: QTY02 when QTY01=FL
       */
      obstetricAnesthesiaAdditionalUnits?: number;

      orderingProvider?: ServiceLine.OrderingProvider;

      /**
       * Loop: 2400, Segment: AMT, Element: AMT02 when AMT01=F4
       */
      postageTaxAmount?: string;

      /**
       * Loop: 2400, Segment: REF, Element: REF04-02 when REF01=6R
       */
      providerControlNumber?: string;

      purchasedServiceInformation?: ServiceLine.PurchasedServiceInformation;

      purchasedServiceProvider?: V3API.ServiceLineProvider;

      referringProvider?: V3API.ServiceLineProvider;

      renderingProvider?: V3API.ServiceLineProvider;

      /**
       * Loop: 2400, Segment: AMT, Element: AMT02 when AMT01=T
       */
      salesTaxAmount?: string;

      /**
       * Loop: 2400, Segment: DTP, Element: DTP03, Notes: Range of Dates Expressed in
       * Format CCYYMMDD
       */
      serviceDateEnd?: string;

      serviceFacilityLocation?: V3API.ServiceFacilityLocation;

      serviceLineDateInformation?: ServiceLine.ServiceLineDateInformation;

      serviceLineReferenceInformation?: ServiceLine.ServiceLineReferenceInformation;

      serviceLineSupplementalInformation?: Array<V3API.ReportInformation>;

      supervisingProvider?: V3API.ServiceLineProvider;

      testResults?: Array<ServiceLine.TestResult>;

      /**
       * Loop: 2400, Segment: NTE, Element: NTE02 when NTE01=TPO
       */
      thirdPartyOrganizationNotes?: string;
    }

    export namespace ServiceLine {
      export interface ProfessionalService {
        /**
         * SVC107
         */
        compositeDiagnosisCodePointers: ProfessionalService.CompositeDiagnosisCodePointers;

        /**
         * Loop 2400, Segment: SV1, Element: SV102, Notes: Required value for total charge
         * amount, '0' (Zero) is acceptable for this value
         */
        lineItemChargeAmount: string;

        /**
         * Loop 2400, Segment: SV1, Element: SV103, Notes: Allowed values are 'MJ' Minutes,
         * 'UN' Unit
         */
        measurementUnit: 'MJ' | 'UN';

        /**
         * Loop 2400, Segment: SV1, Element: SV101-02
         */
        procedureCode: string;

        /**
         * Loop: 2400, Segment: SV1, Element: SV101-01, Notes: Allowed Values are: 'ER'
         * Jurisdiction Specific Procedure and Supply Codes, 'HC' Health Care Financing
         * Administration Common Procedural Coding System (HCPCS) Codes, 'IV' Home Infusion
         * EDI Coalition (HIEC) Product/Service Code,'WK' Advanced Billing Concepts (ABC)
         * Codes
         */
        procedureIdentifier: 'ER' | 'HC' | 'IV' | 'WK';

        /**
         * Loop 2400, Segment: SV1, Element: SV104, Notes: When a decimal is needed to
         * report units, include it in this element
         */
        serviceUnitCount: string;

        /**
         * Loop 2400, Segment: SV1, Element: SV115
         */
        copayStatusCode?: '0';

        /**
         * Loop 2400, Segment: SV1, Element: SV101-07, Notes: A free form description to
         * clarify teh related data elements and their content
         */
        description?: string;

        /**
         * Loop 2400, Segment: SV1, Element: SV109
         */
        emergencyIndicator?: 'Y';

        /**
         * Loop 2400, Segment: SV1, Element: SV111
         */
        epsdtIndicator?: 'Y';

        /**
         * Loop 2400, Segment: SV1, Element: SV112
         */
        familyPlanningIndicator?: 'Y';

        /**
         * Loop 2400, Segment: SV1, Element: SV105
         */
        placeOfServiceCode?: string;

        /**
         * Loop 2400, Segment: SV1, Elements: SV101-03 to SV101-06, Notes: Required when
         * modifier clarifies or improves the reporting accuracy of the associated
         * procedure code. If not required then do not send
         */
        procedureModifiers?: Array<string>;
      }

      export namespace ProfessionalService {
        /**
         * SVC107
         */
        export interface CompositeDiagnosisCodePointers {
          /**
           * Loop: 2400, Segment: SV1, Element: SV107-01, SV107-02, SV107-03, SV107-04
           */
          diagnosisCodePointers: Array<string>;
        }
      }

      /**
       * CRC
       */
      export interface ConditionIndicatorDurableMedicalEquipment {
        /**
         * Loop 2400, Segment: CRC, Element: CRC02 and CRC01=09, Note: Allowed Values are:
         * 'N' No, 'Y' Yes
         */
        certificationConditionIndicator: 'Y' | 'N';

        /**
         * Loop 2400, Segment: CRC, Element: CRC03, Note: Allowed Values are: '38'
         * Certification signed by the physician is on file at the supplier's office, 'ZV'
         * Replacement Item
         */
        conditionIndicator: '38' | 'ZV';

        /**
         * Loop 2400, Segment: CRC, Element: CRC04, Note: Allowed Values are: '38'
         * Certification signed by the physician is on file at the supplier's office, 'ZV'
         * Replacement Item
         */
        conditionIndicatorCode?: '38' | 'ZV';
      }

      /**
       * CN1
       */
      export interface ContractInformation {
        /**
         * Segment: CN1, Element: CN101, Allowed Values are: '01' Diagnosis Related Group
         * (DRG), '02' Per Diem, '03' Variable Per Diem, '04' Flat, '05' Capitated, '06'
         * Percent, '09' Other
         */
        contractTypeCode: '01' | '02' | '03' | '04' | '05' | '06' | '09';

        /**
         * Segment: CN1, Element: CN102
         */
        contractAmount?: string;

        /**
         * Segment: CN1, Element: CN104
         */
        contractCode?: string;

        /**
         * Segment: CN1, Element: CN103
         */
        contractPercentage?: string;

        /**
         * Segment: CN1, Element: CN106
         */
        contractVersionIdentifier?: string;

        /**
         * Segment: CN1, Element: CN105
         */
        termsDiscountPercentage?: string;
      }

      /**
       * LOOP 2410
       */
      export interface DrugIdentification {
        /**
         * Loop: 2410, Segment: CTP05, Element: CTP05-01, Allowed Values are: 'F2'
         * International Unit, 'GR' Gram, 'ME' Milligram, 'ML' Milliliter, 'UN' Unit
         */
        measurementUnitCode: 'F2' | 'GR' | 'ME' | 'ML' | 'UN';

        /**
         * Loop: 2410, Segment: LIN, Element: LIN03
         */
        nationalDrugCode: string;

        /**
         * Loop: 2410, Segment: CTP, Element: CTP04
         */
        nationalDrugUnitCount: string;

        /**
         * Loop: 2410, Segment: LIN, Element: LIN02, Note: Allowed Values are: 'EN'
         * EAN/UCC - 13, 'EO' EAN/UCC - 8, 'HI' HIBC (Health Care Industry Bar Code)
         * Supplier Labeling Standard Primary Data Message, 'N4' National Drug Code in
         * 5-4-2 Format, 'ON' Customer Order Number, 'UK' GTIN 14-digit Data Structure,
         * 'UP' UCC - 12
         */
        serviceIdQualifier: 'EN' | 'EO' | 'HI' | 'N4' | 'ON' | 'UK' | 'UP';

        /**
         * Loop: 2410, Segment: REF, Element: REF02 when REF01=VY
         */
        linkSequenceNumber?: string;

        /**
         * Loop: 2410, Segment: REF, Element: REF02 when REF01=XZ
         */
        pharmacyPrescriptionNumber?: string;
      }

      /**
       * PWK
       */
      export interface DurableMedicalEquipmentCertificateOfMedicalNecessity {
        /**
         * Loop: 2400, Segment: PWK, Element: PWK02 when PWK01=CT, Note: Allowed Values
         * are: 'AB' Previously Submitted to Payer, 'AD' Certification Included in this
         * Claim, 'AF' Narrative Segment Included in this Claim, 'AG' No Documentation is
         * Required, 'NS' Not Specified
         */
        attachmentTransmissionCode: 'AB' | 'AD' | 'AF' | 'AG' | 'NS';
      }

      /**
       * CR3
       */
      export interface DurableMedicalEquipmentCertification {
        /**
         * Loop: 2400, Segment: CR3, Element: CR301, Note: Allowed Values are: 'I' Initial,
         * 'R' Renewal, 'S' Revised
         */
        certificationTypeCode: 'I' | 'R' | 'S';

        /**
         * Loop: 2400, Segment: CR3, Element: CR303 when CR302=MO
         */
        durableMedicalEquipmentDurationInMonths: string;
      }

      /**
       * SV5
       */
      export interface DurableMedicalEquipmentService {
        /**
         * Loop: 2410, Segment: SV5, Element: SV503
         */
        days: string;

        /**
         * Loop: 2410, Segment: SV5, Element: SV506, Note: Allowed Values are: '1' weekly,
         * '4' monthly, '6' daily
         */
        frequencyCode: '1' | '4' | '6';

        /**
         * Loop: 2410, Segment: SV5, Element: SV505
         */
        purchasePrice: string;

        /**
         * Loop: 2410, Segment: SV5, Element: SV504
         */
        rentalPrice: string;
      }

      /**
       * LQ and FRM
       */
      export interface FormIdentification {
        /**
         * Loop: 2440, Segment: LQ, Element: LQ02
         */
        formIdentifier: string;

        /**
         * Loop: 2440, Segment: LQ, Element: LQ01, Note: Allowed Values are:'AS' Form Type
         * Code, 'UT' Centers for Medicare and Medicaid Services (CMS) Durable Medical
         * Equipment Regional Carrier (DMERC) Certificate of Medical Necessity (CMN) Forms
         */
        formTypeCode: 'AS' | 'UT';

        /**
         * Loop: 2440, Segment: FRM
         */
        supportingDocumentation?: Array<FormIdentification.SupportingDocumentation>;
      }

      export namespace FormIdentification {
        /**
         * Loop: 2440, Segment: FRM
         */
        export interface SupportingDocumentation {
          /**
           * Loop: 2440, Segment: FRM, Element: FRM01
           */
          questionNumber: string;

          /**
           * Loop: 2440, Segment: FRM, Element: FRM03
           */
          questionResponse?: string;

          /**
           * Loop: 2440, Segment: FRM, Element: FRM04
           */
          questionResponseAsDate?: string;

          /**
           * Loop: 2440, Segment: FRM, Element: FRM05
           */
          questionResponseAsPercent?: string;

          /**
           * Loop: 2440, Segment: FRM, Element: FRM02, Notes: Allowed Values are: 'N' No, 'W'
           * Not Applicable, 'Y' Yes
           */
          questionResponseCode?: 'N' | 'W' | 'Y';
        }
      }

      /**
       * SVD, CAS, DTP and AMT
       */
      export interface LineAdjudicationInformation {
        /**
         * Loop: 2430, Segment: DTP, Element=DTP03 when DTP02=D8 and DTP01=573
         */
        adjudicationOrPaymentDate: string;

        /**
         * Loop: 2430, Segment: SVD, Element: SVD01
         */
        otherPayerPrimaryIdentifier: string;

        /**
         * Loop: 2430, Segment: SVD, Element: SVD05
         */
        paidServiceUnitCount: string;

        /**
         * Loop: 2430, Segment: SVD, Element: SVD03-02
         */
        procedureCode: string;

        /**
         * Loop: 2430, Segment: SVD, Element: SVD03-01, Note: Allowed Values are: 'ER'
         * Jurisdiction Specific Procedure and Supply Codes, 'HC' Health Care Financing
         * Administration Common Procedural Coding System (HCPCS) Codes, 'HP' Health
         * Insurance Prospective Payment System (HIPPS) Skilled Nursing Facility Rate Code,
         * 'IV' Home Infusion EDI Coalition (HIEC) Product/Service Code, 'WK' Advanced
         * Billing Concepts (ABC) Codes
         */
        serviceIdQualifier: 'ER' | 'HC' | 'HP' | 'IV' | 'WK';

        /**
         * Loop: 2430, Segment: SVD, Element: SVD02
         */
        serviceLinePaidAmount: string;

        /**
         * Loop: 2430, Segment: SVD, Element: SVD06
         */
        bundledOrUnbundledLineNumber?: string;

        /**
         * Loop: 2430, Segment: CAS
         */
        claimAdjustmentInformation?: Array<V3API.ClaimAdjustment>;

        /**
         * Loop: 2430, Segment: SVD, Element: SVD03-07
         */
        procedureCodeDescription?: string;

        procedureModifier?: Array<string>;

        /**
         * Loop: 2430, Segment: AMT, Element=AMT02 when AMT01=EAF
         */
        remainingPatientLiability?: string;
      }

      export interface OrderingProvider {
        providerType: string;

        /**
         * N3 and N4
         */
        address?: V3API.Address;

        /**
         * Loop: 2010AC, Segment: REF, Element: REF02 when REF01=FY
         */
        claimOfficeNumber?: string;

        /**
         * REF02 when REF01=G2
         */
        commercialNumber?: string;

        /**
         * PER
         */
        contactInformation?: OrderingProvider.ContactInformation;

        /**
         * REF02 when REF01=EI, Notes: The Employer Identification Number must be a string
         * of exactly nine numbers with no separators
         */
        employerId?: string;

        /**
         * LOOP: 2010AC, Segment: REF, Element: REF02 when REF01=EI
         */
        employerIdentificationNumber?: string;

        /**
         * NM104
         */
        firstName?: string;

        /**
         * NM103
         */
        lastName?: string;

        /**
         * REF02 when REF01=LU
         */
        locationNumber?: string;

        /**
         * NM105
         */
        middleName?: string;

        /**
         * Loop: 2010AC, Segment: REF, Element: REF02 when REF01=NF, Notes: National
         * Association of Insurance Commissioners (NAIC) Code
         */
        naic?: string;

        /**
         * NM109, Notes: National Provider Identifier
         */
        npi?: string;

        /**
         * NM103
         */
        organizationName?: string;

        otherIdentifier?: string;

        /**
         * LOOP: 2010AC, Segment: REF, Element: REF02 when REF01=2U
         */
        payerIdentificationNumber?: string;

        /**
         * REF02 when REF01=1G, Notes: UPINs must be formatted as either X99999 or XXX999
         */
        providerUpinNumber?: string;

        secondaryIdentifier?: Array<V3API.ReferenceIdentification>;

        /**
         * REF02 when REF01=SY, Notes: The Social Security Number must be a string of nine
         * numbers with no separators
         */
        ssn?: string;

        /**
         * REF02 when REF01=0B
         */
        stateLicenseNumber?: string;

        /**
         * NM107
         */
        suffix?: string;

        /**
         * PRV03
         */
        taxonomyCode?: string;
      }

      export namespace OrderingProvider {
        /**
         * PER
         */
        export interface ContactInformation {
          /**
           * Segment: PER, Element: PER02 and PER01=IC
           */
          name: string;

          /**
           * Segment: PER, Element: PER04 or PER06 or PER08, Note: This used in (Provider,
           * Submitter) when PER03=EM or PER05=EM or PER07=EM
           */
          email?: string;

          /**
           * Segment: PER, Element: PER04 or PER06 or PER08, Note: This is used in (Provider,
           * Submitter) when PER03=FX or PER05=FX or PER07=FX
           */
          faxNumber?: string;

          /**
           * Segment: PER, Element: PER06 or PER08, Note: PER05=EX or PER07=EX
           */
          phoneExtension?: string;

          /**
           * Segment: PER, Element: PER04 (Provider, Submitter, Subscriber, Dependent) or
           * PER06 (Provider, Submitter) or PER08 (Provider, Submitter), Note: Used when
           * PER03=TE (Provider, Submitter, Subscriber, Dependent) or PER05=TE (Provider,
           * Submitter) or PER07=TE (Provider, Submitter)
           */
          phoneNumber?: string;
        }
      }

      export interface PurchasedServiceInformation {
        /**
         * Loop: 2400, Segment: PS1, Element: PS102
         */
        purchasedServiceChargeAmount: string;

        /**
         * Loop: 2400, Segment: PS1, Element: PS101
         */
        purchasedServiceProviderIdentifier: string;
      }

      export interface ServiceLineDateInformation {
        /**
         * Loop: 2400, Segment: DPT, Element: DTP03 when DPT01=463, Notes: Date Expressed
         * in Format CCYYMMDD
         */
        beginTherapyDate?: string;

        /**
         * Loop: 2400, Segment: DPT, Element: DTP03 when DPT01=607, Notes: Date Expressed
         * in Format CCYYMMDD
         */
        certificationRevisionOrRecertificationDate?: string;

        /**
         * Loop: 2400, Segment: DPT, Element: DTP03 when DPT01=738, Notes: Date Expressed
         * in Format CCYYMMDD
         */
        hemoglobinTestDate?: string;

        /**
         * Loop: 2400, Segment: DPT, Element: DTP03 when DPT01=454, Notes: Date Expressed
         * in Format CCYYMMDD
         */
        initialTreatmentDate?: string;

        /**
         * Loop: 2400, Segment: DPT, Element: DTP03 when DPT01=461, Notes: Date Expressed
         * in Format CCYYMMDD
         */
        lastCertificationDate?: string;

        /**
         * Loop: 2400, Segment: DPT, Element: DTP03 when DPT01=455, Notes: Date Expressed
         * in Format CCYYMMDD
         */
        lastXRayDate?: string;

        /**
         * Loop: 2400, Segment: DPT, Element: DTP03 when DPT01=471, Notes: Date Expressed
         * in Format CCYYMMDD
         */
        prescriptionDate?: string;

        /**
         * Loop: 2400, Segment: DPT, Element: DTP03 when DPT01=739, Notes: Date Expressed
         * in Format CCYYMMDD
         */
        serumCreatineTestDate?: string;

        /**
         * Loop: 2400, Segment: DPT, Element: DTP03 when DPT01=011, Notes: Date Expressed
         * in Format CCYYMMDD
         */
        shippedDate?: string;

        /**
         * Loop: 2400, Segment: DPT, Element: DTP03 when DPT01=304, Notes: Date Expressed
         * in Format CCYYMMDD
         */
        treatmentOrTherapyDate?: string;
      }

      export interface ServiceLineReferenceInformation {
        /**
         * Loop: 2400, Segment: REF, Element: REF02 Note: When REF01=9D
         */
        adjustedRepricedLineItemReferenceNumber?: string;

        /**
         * Loop: 2400, Segment: REF, Element: REF02 Note: When REF01=X4
         */
        clinicalLaboratoryImprovementAmendmentNumber?: string;

        /**
         * Loop: 2400, Segment: REF, Element: REF02 Note: When REF01=BT
         */
        immunizationBatchNumber?: string;

        /**
         * Loop: 2400, Segment: REF, Element: REF02 Note: When REF01=EW
         */
        mammographyCertificationNumber?: string;

        /**
         * Loop 2400 REF
         */
        priorAuthorization?: Array<ServiceLineReferenceInformation.PriorAuthorization>;

        /**
         * Loop: 2400, Segment: REF, Element: REF Note: When REF01=9F
         */
        referralNumber?: Array<string>;

        /**
         * Loop: 2400, Segment: REF, Element: REF02 Note: When REF01=F4
         */
        referringCliaNumber?: string;

        /**
         * Loop: 2400, Segment: REF, Element: REF02 Notes: When REF01=9B
         */
        repricedLineItemReferenceNumber?: string;
      }

      export namespace ServiceLineReferenceInformation {
        /**
         * Loop 2400 REF
         */
        export interface PriorAuthorization {
          /**
           * Loop: 2400, Segment: REF, Element: REF02 when REF01=G1
           */
          priorAuthorizationOrReferralNumber: string;

          /**
           * Loop: 2400, Segment: REF, Element: REF04-2 when REF04-1=2U
           */
          otherPayerPrimaryIdentifier?: string;
        }
      }

      export interface TestResult {
        /**
         * Loop 2400, Segment: MEA; Element: MEA02, Notes: Allowable values are 'HT'
         * Height, 'R1' Hemoglobin, 'R2' Hematocrit, 'R3' Epoetin Starting Dosage, 'R4'
         * Creatinine
         */
        measurementQualifier: 'HT' | 'R1' | 'R2' | 'R3' | 'R4';

        /**
         * Loop 2400, Segment: MEA; Element: MEA01, Notes: Allowable values are 'OG'
         * Original and 'TR' Test Results
         */
        measurementReferenceIdentificationCode: 'OG' | 'TR';

        /**
         * Loop 2400, Segment: MEA; Element: MEA03
         */
        testResults: string;
      }
    }

    /**
     * Loop 2300, Segment: CN1
     */
    export interface ClaimContractInformation {
      /**
       * Loop: 2300,Segment: CN1, Element: CN101, Note: Allowed Values are: '01'
       * Diagnosis Related Group (DRG), '02' Per Diem, '03' Variable Per Diem, '04' Flat,
       * '05' Capitated, '06' Percent, '09' Other
       */
      contractTypeCode: '01' | '02' | '03' | '04' | '05' | '06' | '09';

      /**
       * Loop: 2300, Segment: CN1, Element: CN102
       */
      contractAmount?: string;

      /**
       * Loop: 2300, Segment: CN1, Element: CN104
       */
      contractCode?: string;

      /**
       * Loop: 2300, Segment: CN1, Element: CN103
       */
      contractPercentage?: string;

      /**
       * Loop: 2300, Segment: CN1, Element: CN106
       */
      contractVersionIdentifier?: string;

      /**
       * Loop: 2300, Segment: CN1, Element: CN105
       */
      termsDiscountPercentage?: string;
    }

    /**
     * DTP
     */
    export interface ClaimDateInformation {
      /**
       * Loop: 2300, Segment: DTP, Element: DTP03
       */
      accidentDate?: string;

      /**
       * Loop: 2300, Segment: DTP, Element: DTP03
       */
      acuteManifestationDate?: string;

      /**
       * Loop: 2300, Segment: DTP, Element: DTP03
       */
      admissionDate?: string;

      /**
       * Loop: 2300, Segment: DTP, Element: DTP03
       */
      assumedAndRelinquishedCareBeginDate?: string;

      /**
       * Loop: 2300, Segment: DTP, Element: DTP03
       */
      assumedAndRelinquishedCareEndDate?: string;

      /**
       * Loop: 2300, Segment: DTP, Element: DTP03
       */
      authorizedReturnToWorkDate?: string;

      /**
       * Loop: 2300, Segment: DTP, Element: DTP03
       */
      disabilityBeginDate?: string;

      /**
       * Loop: 2300, Segment: DTP, Element: DTP03
       */
      disabilityEndDate?: string;

      /**
       * Loop: 2300, Segment: DTP, Element: DTP03
       */
      dischargeDate?: string;

      /**
       * Loop: 2300, Segment: DTP, Element: DTP03
       */
      firstContactDate?: string;

      /**
       * Loop: 2300, Segment: DTP, Element: DTP03
       */
      hearingAndVisionPrescriptionDate?: string;

      /**
       * Loop: 2300, Segment: DTP, Element: DTP03
       */
      initialTreatmentDate?: string;

      /**
       * Loop: 2300, Segment: DTP, Element: DTP03
       */
      lastMenstrualPeriodDate?: string;

      /**
       * Loop: 2300, Segment: DTP, Element: DTP03
       */
      lastSeenDate?: string;

      /**
       * Loop: 2300, Segment: DTP, Element: DTP03
       */
      lastWorkedDate?: string;

      /**
       * Loop: 2300, Segment: DTP, Element: DTP03
       */
      lastXRayDate?: string;

      /**
       * Loop: 2300, Segment: DTP, Element: DTP03
       */
      repricerReceivedDate?: string;

      /**
       * Loop: 2300, Segment: DTP, Element: DTP03
       */
      symptomDate?: string;
    }

    /**
     * NTE
     */
    export interface ClaimNote {
      /**
       * Loop 2300, Segment: NTE, Element: NTE02, Note: NTE01=ADD
       */
      additionalInformation?: string;

      /**
       * Loop 2300, Segment: NTE, Element: NTE02, Note: NTE01=CER
       */
      certificationNarrative?: string;

      /**
       * Loop 2300, Segment: NTE, Element: NTE02, Note: NTE01=DGN
       */
      diagnosisDescription?: string;

      /**
       * Loop 2300, Segment: NTE, Element: NTE02, Note: NTE01=DCP
       */
      goalRehabOrDischargePlans?: string;

      /**
       * Loop 2300, Segment: NTE, Element: NTE02, Note: NTE01=TPO
       */
      thirdPartOrgNotes?: string;
    }

    /**
     * PWK and REF
     */
    export interface ClaimSupplementalInformation {
      /**
       * Loop: 2300, Segment: REF, Element: REF02 and REF01=9C
       */
      adjustedRepricedClaimNumber?: string;

      /**
       * Loop: 2300, Segment: REF, Element: REF02 and REF01=1J
       */
      carePlanOversightNumber?: string;

      /**
       * Loop: 2300, Segment: REF, Element: REF02 and REF01=F8
       */
      claimControlNumber?: string;

      /**
       * Loop: 2300, Segment: REF, Element: REF02 and REF01=D9
       */
      claimNumber?: string;

      /**
       * Loop: 2300, Segment: REF, Element: REF02 and REF01=X4
       */
      cliaNumber?: string;

      /**
       * Loop: 2300, Segment: REF, Element: REF02 and REF01=P4
       */
      demoProjectIdentifier?: string;

      /**
       * Loop: 2300, Segment: REF, Element: REF02 and REF01=LX
       */
      investigationalDeviceExemptionNumber?: string;

      /**
       * Loop: 2300, Segment: REF, Element: REF02 and REF01=EW
       */
      mammographyCertificationNumber?: string;

      /**
       * Loop: 2300, Segment: REF, Element: REF02 and REF01=EA
       */
      medicalRecordNumber?: string;

      /**
       * Loop: 2300, Segment: REF, Element: REF02 and REF01=F5
       */
      medicareCrossoverReferenceId?: string;

      /**
       * Loop: 2300, Segment: REF, Element: REF02 and REF01=G1
       */
      priorAuthorizationNumber?: string;

      /**
       * Loop: 2300, Segment: REF, Element: REF02 and REF01=9F
       */
      referralNumber?: string;

      reportInformation?: V3API.ReportInformation;

      /**
       * Loop: 2300, Segment: REF, Element: REF02 and REF01=9A
       */
      repricedClaimNumber?: string;

      /**
       * Loop: 2300, Segment: REF, Element: REF02 and REF01=4N, Note: '1'
       * Immediate/Urgent Care, '2' Services Rendered in a Retroactive Period, '3'
       * Emergency Care, '4' Client has Temporary Medicaid, '5' Request from County for
       * Second Opinion to Determine if Recipient Can Work, '6' Request for Override
       * Pending, '7' Special Handling, Null
       */
      serviceAuthorizationExceptionCode?: '1' | '2' | '3' | '4' | '5' | '6' | '7';
    }

    /**
     * HI
     */
    export interface ConditionInformation {
      conditionCodes: Array<string>;
    }

    /**
     * CRC
     */
    export interface EpsdtReferral {
      /**
       * Loop: 2300, Segment: CRC, Element: CRC02 When CRC01=ZZ, Note: 'N' No, 'Y' Yes
       */
      certificationConditionCodeAppliesIndicator: 'N' | 'Y';

      /**
       * Loop: 2300, Segment: CRC, Elements: CRC03, CRC04, CRC05 Note: Allowed Values
       * are: 'AV' Available- Not Used, 'NU' Not Used, 'S2' Under Treatment, 'ST' New
       * Services Requested
       */
      conditionCodes: Array<'AV' | 'NU' | 'S2' | 'ST'>;
    }

    /**
     * Loop 2320
     */
    export interface OtherSubscriberInformation {
      /**
       * Loop: 2320, Segment: OI, Element: OI03, Notes: Allowable values are: 'N' No, 'W'
       * Not Applicable, 'Y' Yes
       */
      benefitsAssignmentCertificationIndicator: 'N' | 'W' | 'Y';

      /**
       * Loop: 2320, Segment: SBR, Element: SBR09, Notes: Allowed Values are: '11' Other
       * Non-Federal Programs, '12' Preferred Provider Organization (PPO), '13' Point of
       * Service (POS), '14' Exclusive Provider Organization (EPO), '15' Indemnity
       * Insurance, '16' Health Maintenance Organization (HMO) Medicare Risk, '17' Dental
       * Maintenance Organization, 'AM' Automobile Medical, 'BL' Blue Cross/Blue Shield,
       * 'CH' Champus, 'CI' Commercial Insurance Co., 'DS' Disability, 'FI' Federal
       * Employees Program, 'HM' Health Maintenance Organization, 'LM' Liability Medical,
       * 'MA' Medicare Part A, 'MB' Medicare Part B,'MC' Medicare Part C, 'OF' Other
       * Federal Program, 'TV' Title V, 'VA' Veterans Affairs Plan, 'WC' Worker's
       * Compensation Health Claim, 'ZZ' Mutually Defined
       */
      claimFilingIndicatorCode:
        | '11'
        | '12'
        | '13'
        | '14'
        | '15'
        | '16'
        | '17'
        | 'AM'
        | 'BL'
        | 'CH'
        | 'CI'
        | 'DS'
        | 'FI'
        | 'HM'
        | 'LM'
        | 'MA'
        | 'MB'
        | 'MC'
        | 'OF'
        | 'TV'
        | 'VA'
        | 'WC'
        | 'ZZ';

      /**
       * Loop: 2320, Segment: SBR, Element: SBR02, Notes: Required when patient is the
       * subscriber, Notes: Allowed Values are: '01' Spouse, '18' Self, '19' Child, '20'
       * Employee, '21' Unknown, '39' Organ Donor, '40' Cadaver Donor, '53' Life Partner,
       * 'G8' Other Relationship
       */
      individualRelationshipCode: '01' | '18' | '19' | '20' | '21' | '39' | '40' | '53' | 'G8';

      /**
       * Loop: 2330B
       */
      otherPayerName: OtherSubscriberInformation.OtherPayerName;

      /**
       * Loop: 2330A
       */
      otherSubscriberName: OtherSubscriberInformation.OtherSubscriberName;

      /**
       * Loop: 2320, Segment: SBR, Element: SBR01, Notes: Allowable values are 'A' Payer
       * Responsibility Four, 'B' Payer Responsibility Five, 'C' Payer Responsibility
       * Six, 'D' Payer Responsibility Seven, 'E' Payer Responsibility Eight, 'F' Payer
       * Responsibility Nine, 'G' Payer Responsibility Ten, 'H' Payer Responsibility
       * Eleven, 'P' Primary, 'S' Secondary, 'T' Tertiary, and 'U' Unknown
       */
      paymentResponsibilityLevelCode: 'A' | 'B' | 'C' | 'D' | 'E' | 'F' | 'G' | 'H' | 'P' | 'S' | 'T' | 'U';

      /**
       * Loop: 2320, Segment: OI, Element: OI04, Notes: Allowable values are 'I' Informed
       * Consent to Release Medical Information, 'Y' Yes
       */
      releaseOfInformationCode: 'I' | 'Y';

      /**
       * Loop: 2320, Segment: CAS
       */
      claimLevelAdjustments?: Array<V3API.ClaimAdjustment>;

      /**
       * Loop: 2320, Segment: SBR, Element: SBR03
       */
      insuranceGroupOrPolicyNumber?: string;

      /**
       * Loop: 2320, Segment: SBR, Element: SBR05, Notes: Allowable Values are: '12'
       * Medicare Secondary Working Aged Beneficiary or Spouse with Employer Group Health
       * Plan, '13' Medicare Secondary End-Stage Renal Disease Beneficiary in the
       * Mandated Coordination Period, '14' Medicare Secondary, No-fault Insurance
       * including Auto is Primary, '15' Medicare Secondary Worker's Compensation, '16'
       * Medicare Secondary Public Health Service (PHS)or Other Federal Agency, '41'
       * Medicare Secondary Black Lung, '42' Medicare Secondary Veteran's Administration,
       * '43' Medicare Secondary Disabled Beneficiary Under Age 65 with Large Group
       * Health Plan (LGHP), '47' Medicare Secondary, Other Liability Insurance is
       * Primary
       */
      insuranceTypeCode?: '12' | '13' | '14' | '15' | '16' | '41' | '42' | '43' | '47';

      /**
       * Loop: 2320, Segment: MOA
       */
      medicareOutpatientAdjudication?: OtherSubscriberInformation.MedicareOutpatientAdjudication;

      /**
       * Loop: 2320, Segment: AMT, Element: AMT02 when AMT01=A8
       */
      nonCoveredChargeAmount?: string;

      /**
       * Loop: 2000B, Segment: SBR, Element: SBR04
       */
      otherInsuredGroupName?: string;

      otherPayerBillingProvider?: Array<OtherSubscriberInformation.OtherPayerBillingProvider>;

      otherPayerReferringProvider?: Array<OtherSubscriberInformation.OtherPayerReferringProvider>;

      otherPayerRenderingProvider?: Array<OtherSubscriberInformation.OtherPayerRenderingProvider>;

      otherPayerServiceFacilityLocation?: Array<OtherSubscriberInformation.OtherPayerServiceFacilityLocation>;

      otherPayerSupervisingProvider?: Array<OtherSubscriberInformation.OtherPayerSupervisingProvider>;

      /**
       * Loop: 2320, Segment: OI, Element: OI04, Notes: Allowable value is 'P' Signature
       * generated by provider because the patient was not physically present for
       * services
       */
      patientSignatureGeneratedForPatient?: boolean;

      /**
       * Loop: 2320, Segment: AMT, Element: AMT02 when AMT01=D, Notes: It is acceptable
       * to show '0' (Zero)
       */
      payerPaidAmount?: string;

      /**
       * Loop: 2320, Segment: AMT, Element: AMT02 when AMT01=EAF
       */
      remainingPatientLiability?: string;
    }

    export namespace OtherSubscriberInformation {
      /**
       * Loop: 2330B
       */
      export interface OtherPayerName {
        /**
         * Loop: 2330B; Segment: NM1, Element: NM109
         */
        otherPayerIdentifier: string;

        /**
         * Loop: 2330B; Segment: NM1, Element: NM108, Notes: Allowable values: 'PI' Payor
         * Identification and 'XV' Centers for Medicare/Medicaid Services PlanID
         */
        otherPayerIdentifierTypeCode: 'PI' | 'XV';

        /**
         * Loop: 2330B; Segment: NM1, Element: NM103
         */
        otherPayerOrganizationName: string;

        /**
         * Loop: 2330B; Segment: NM1, Element: NM111
         */
        otherInsuredAdditionalIdentifier?: string;

        /**
         * N3 and N4
         */
        otherPayerAddress?: V3API.Address;

        /**
         * Loop: 2330B, Segment: DTP, Element: DTP03
         */
        otherPayerAdjudicationOrPaymentDate?: string;

        /**
         * Loop: 2330B, Segment: REF, Element: REF02 when REF01=T4
         */
        otherPayerClaimAdjustmentIndicator?: boolean;

        /**
         * Loop: 2330B, Segment: REF, Element: REF02 when REF01=F8
         */
        otherPayerClaimControlNumber?: string;

        /**
         * Loop: 2330B, Segment: REF, Element: REF02 when REF01=G1
         */
        otherPayerPriorAuthorizationNumber?: string;

        /**
         * Loop: 2330B; Segment: REF, Element: REF02 when REF01=9F
         */
        otherPayerPriorAuthorizationOrReferralNumber?: string;

        /**
         * Loop: 2330B, Segment: REF
         */
        otherPayerSecondaryIdentifier?: Array<V3API.ReferenceIdentification>;
      }

      /**
       * Loop: 2330A
       */
      export interface OtherSubscriberName {
        /**
         * Loop: 2330A, Segment: NM1, Element: NM109
         */
        otherInsuredIdentifier: string;

        /**
         * Loop: 2330A, Segment: NM1, Element: NM108, Notes: Allowable values are: 'II'
         * Standard Unique HealthIdentifier for each individual in the United States and
         * 'MI' member identification number
         */
        otherInsuredIdentifierTypeCode: 'II' | 'MI';

        /**
         * Loop: 2330A, Segment: NM1, Element: NM103
         */
        otherInsuredLastName: string;

        /**
         * Loop: 2330A, Segment: NM1, Element: NM102, Notes: Allowed Values are: '1'
         * Person, '2' Non-Person Entity
         */
        otherInsuredQualifier: '1' | '2';

        /**
         * Loop: 2330A, Segment: REF, Element: REF02 when REF01=SY
         */
        otherInsuredAdditionalIdentifier?: string;

        /**
         * N3 and N4
         */
        otherInsuredAddress?: V3API.Address;

        /**
         * Loop: 2330A, Segment: NM1, Element: NM102, Notes: Required when NM102 = 1
         * (Person)
         */
        otherInsuredFirstName?: string;

        /**
         * Loop: 2330A, Segment: NM1, Element: NM105, Notes: Required when NM102 = 1
         * (Person)
         */
        otherInsuredMiddleName?: string;

        /**
         * Loop: 2330A, Segment: NM1, Element: NM107, Notes: Required when NM102 = 1
         * (Person)
         */
        otherInsuredNameSuffix?: string;
      }

      /**
       * Loop: 2320, Segment: MOA
       */
      export interface MedicareOutpatientAdjudication {
        /**
         * Loop: 2320: Segment: MOA, Element: MOA03 to MOA07
         */
        claimPaymentRemarkCode?: Array<string>;

        /**
         * Loop 2320, Segment: MOA; Element: MOA08
         */
        endStageRenalDiseasePaymentAmount?: string;

        /**
         * Loop 2320, Segment: MOA; Element: MOA02
         */
        hcpcsPayableAmount?: string;

        /**
         * Loop 2320, Segment: MOA; Element: MOA09
         */
        nonPayableProfessionalComponentBilledAmount?: string;

        /**
         * Loop 2320, Segment: MOA; Element: MOA01
         */
        reimbursementRate?: string;
      }

      /**
       * Loop 2330G
       */
      export interface OtherPayerBillingProvider {
        /**
         * Loop 2330G, Segment: NM1; Element: NM101, Notes: Code identifying an
         * organizational entity, a physical location, property or an individual.
         * Allowablevalues: '1' Person, '2' Non-Person Entity
         */
        entityTypeQualifier: '1' | '2';

        /**
         * Loop 2330G, Segment: NM1 and REF
         */
        otherPayerBillingProviderIdentifier: Array<V3API.ReferenceIdentification>;
      }

      /**
       * Loop 2330C
       */
      export interface OtherPayerReferringProvider {
        /**
         * Loop 2330E, Segment: NM1 and REF
         */
        otherPayerReferringProviderIdentifier: Array<V3API.ReferenceIdentification>;
      }

      /**
       * Loop 2330D
       */
      export interface OtherPayerRenderingProvider {
        /**
         * Loop: 2330D, Segment NM1, Element: NM102, Notes: Allowable values are '1' Person
         * and '2' Non-Person Entity
         */
        entityTypeQualifier: '1' | '2';

        /**
         * Loop 2330D, Segment: NM1 and REF
         */
        otherPayerRenderingProviderSecondaryIdentifier?: Array<V3API.ReferenceIdentification>;
      }

      /**
       * Loop 2330E
       */
      export interface OtherPayerServiceFacilityLocation {
        /**
         * Loop 2330E, Segments: NM1 and REF
         */
        otherPayerServiceFacilityLocationSecondaryIdentifier: Array<V3API.ReferenceIdentification>;
      }

      /**
       * Loop 2330F
       */
      export interface OtherPayerSupervisingProvider {
        /**
         * Loop 2330F, Segments: NM1 and REF
         */
        otherPayerSupervisingProviderIdentifier: Array<V3API.ReferenceIdentification>;
      }
    }

    /**
     * Loop 2300, Segment: CRC
     */
    export interface PatientConditionInformationVision {
      /**
       * Loop: 2300, Segment: CRC, Element: CRC02, Notes: Allowed Values are: 'N' No, 'Y'
       * Yes
       */
      certificationConditionIndicator: 'N' | 'Y';

      /**
       * Loop: 2300, Segment: CRC, Element: CRC01, Notes: Allowed Values are: 'E1'
       * Spectacle Lenses, 'E2' Contact Lenses, 'E3' Spectacle Frames
       */
      codeCategory: 'E1' | 'E2' | 'E3';

      /**
       * Loop: 2300, Segment: CRC, Element: CRC03 to CRC07, Notes: CRC03 is required,
       * others are situational. Allowed Values are: 'L1' General Standard of 20 Degree
       * or .5 Diopter Sphere or Cylinder Change Met, 'L2' Replacement Due to Loss or
       * Theft, 'L3' Replacement Due to Breakage or Damage, L4' Replacement Due to
       * Patient Preference, 'L5' Replacement Due to Medical Reason
       */
      conditionCodes: Array<'L1' | 'L2' | 'L3' | 'L4' | 'L5'>;
    }

    /**
     * Loop 2300, Segment: CR2
     */
    export interface SpinalManipulationServiceInformation {
      /**
       * Loop: 2300, Segment: CR, Element: CR208
       */
      patientConditionCode: string;

      /**
       * Loop: 2300, Segment: CR, Element: CR210 Note: Allowed Values are: 'A' Acute
       * Condition, 'C' Chronic Condition, 'D' Chronic Condition, 'E' Non-Life
       * Threatening, 'F' Routine, 'G' Symptomatic, 'M' Acute Manifestation of a Chronic
       * Condition
       */
      patientConditionDescription1?: 'A' | 'C' | 'D' | 'E' | 'F' | 'G' | 'M';

      /**
       * Loop: 2300, Segment: CR, Element: CR211
       */
      patientConditionDescription2?: string;
    }
  }

  /**
   * Loop: 1000B
   */
  export interface Receiver {
    /**
     * Loop: 1000B, Segment: NM1, Element: NM103
     */
    organizationName: string;
  }

  /**
   * Loop: 1000A
   */
  export interface Submitter {
    /**
     * PER
     */
    contactInformation: V3API.ContactInformation;

    /**
     * Loop: 1000A, Segment: NM1, Element: NM104
     */
    firstName?: string;

    /**
     * Loop: 1000A, Segment: NM1, Element: NM103
     */
    lastName?: string;

    /**
     * Loop: 1000A, Segment: NM1, Element: NM105
     */
    middleName?: string;

    /**
     * Loop: 1000A, Segment: NM1, Element: NM103
     */
    organizationName?: string;
  }

  /**
   * Loop: 2000B
   */
  export interface Subscriber {
    /**
     * Loop: 2000B, Segment: SBR, Element: SBR01, Allowed Values:'A' Payer
     * Responsibility Four 'B' Payer Responsibility Five 'C' Payer Responsibility Six
     * 'D' Payer Responsibility Seven 'E' Payer Responsibility Eight 'F' Payer
     * Responsibility Nine 'G' Payer Responsibility Ten 'H' Payer Responsibility Eleven
     * 'P' Primary 'S' Secondary 'T' Tertiary 'U' Unknown
     */
    paymentResponsibilityLevelCode: 'A' | 'B' | 'C' | 'D' | 'E' | 'F' | 'G' | 'H' | 'P' | 'S' | 'T' | 'U';

    /**
     * N3 and N4
     */
    address?: V3API.Address;

    /**
     * PER
     */
    contactInformation?: V3API.ContactInformation;

    /**
     * Loop: 2010BA, Segment: DMG, Element: DMG02
     */
    dateOfBirth?: string;

    /**
     * Loop: 2010BA, Segment: NM1, Element: NM104
     */
    firstName?: string;

    /**
     * Loop: 2010BA, Segment: DMG, Element: DMG03 Subscriber Gender, Notes: 'M' Male,
     * 'F' Female'U' Unknown
     */
    gender?: 'M' | 'F' | 'U';

    /**
     * Loop: 2010BA, Segment: SBR, Element: SBR04
     */
    groupNumber?: string;

    /**
     * Loop: 2000B, Segment: SBR, Element:SBR05 Notes: Allowed values: '12' Medicare
     * Secondary Working Aged Beneficiary or Spouse with Employer Group Health Plan,
     * '13' Medicare Secondary End-Stage Renal Disease Beneficiary in the Mandated
     * Coordination Period with an Employer's Group Health Plan, '14' Medicare
     * Secondary, No-fault Insurance including Auto is Primary, '15' Medicare Secondary
     * Worker's Compensation, '16' Medicare Secondary Public Health Service (PHS)or
     * Other Federal Agency, '41' Medicare Secondary Black Lung, '42' Medicare
     * Secondary Veteran's Administration, '43' Medicare Secondary Disabled Beneficiary
     * Under Age 65 with Large Group Health Plan (LGHP), '47' Medicare Secondary, Other
     * Liability Insurance is Primary
     */
    insuranceTypeCode?: '12' | '13' | '14' | '15' | '16' | '41' | '42' | '43' | '47';

    /**
     * Loop: 2010BA, Segment: NM1, Element: NM103
     */
    lastName?: string;

    /**
     * Loop: 2010BA, Segment: NM1, Element: NM109
     */
    memberId?: string;

    /**
     * Loop: 2010BA, Segment: NM, Element: NM105
     */
    middleName?: string;

    /**
     * Loop: 2010BA, Segment: NM1, Element: NM103 when NM102=2, Notes: when subscriber
     * is organization pass patient as dependent
     */
    organizationName?: string;

    /**
     * Loop: 2000B, Segment: SBR, Element: SBR03
     */
    policyNumber?: string;

    /**
     * Loop: 2010BA, Segment: REF, Element: REF02 when REF01=SY
     */
    ssn?: string;

    /**
     * Loop: 2000B, Segment: SBR, Element: SBR04 Notes: Freeform text
     */
    subscriberGroupName?: string;

    /**
     * Loop: 2010BA, Segment: NM, Element: NM107
     */
    suffix?: string;
  }

  /**
   * LOOP 2000C
   */
  export interface Dependent {
    /**
     * Loop: 2010CA, Segment: DMG, Element: DMG02 when DMG01=D8
     */
    dateOfBirth: string;

    /**
     * Loop: 2010CA, Segment: NM1, Element: NM104
     */
    firstName: string;

    /**
     * Loop: 2010CA, Segment: DMG, Element: DMG03, Note: Allowed Values are: 'M' Male,
     * 'F' Female, 'U' Unknown
     */
    gender: 'M' | 'F' | 'U';

    /**
     * Loop: 2010CA, Segment: NM1, Element: NM103
     */
    lastName: string;

    /**
     * Loop: 2000C, Segment: PAT, Element: PAT01, Note: Allowed Values are: '01'
     * Spouse, '19' Child, '20' Employee, '21' Unknown, '39' Organ Donor, '40' Cadaver
     * Donor, '53' Life Partner, 'G8' Other Relationship
     */
    relationshipToSubscriberCode: '01' | '19' | '20' | '39' | '40' | '53' | 'G8';

    /**
     * N3 and N4
     */
    address?: V3API.Address;

    /**
     * PER
     */
    contactInformation?: V3API.ContactInformation;

    /**
     * Loop: 2010CA, Segment: REF, Element: REF02 when REF01=1W
     */
    memberId?: string;

    /**
     * Loop: 2010CA, Segment: NM1, Element: NM105
     */
    middleName?: string;

    /**
     * Loop: 2010CA, Segment: REF, Element: REF02 when REF01=SY
     */
    ssn?: string;

    /**
     * Loop: 2010CA, Segment: NM, Element: NM107
     */
    suffix?: string;
  }

  /**
   * @deprecated Loop: 2420E, Setting ProviderType equal to OrderingProvider is
   * deprecated, please use ClaimInformation.serviceLines.orderingProvider
   */
  export interface Ordering {
    providerType: string;

    /**
     * N3 and N4
     */
    address?: V3API.Address;

    /**
     * Loop: 2010AC, Segment: REF, Element: REF02 when REF01=FY
     */
    claimOfficeNumber?: string;

    /**
     * REF02 when REF01=G2
     */
    commercialNumber?: string;

    /**
     * PER
     */
    contactInformation?: V3API.ContactInformation;

    /**
     * REF02 when REF01=EI, Notes: The Employer Identification Number must be a string
     * of exactly nine numbers with no separators
     */
    employerId?: string;

    /**
     * LOOP: 2010AC, Segment: REF, Element: REF02 when REF01=EI
     */
    employerIdentificationNumber?: string;

    /**
     * NM104
     */
    firstName?: string;

    /**
     * NM103
     */
    lastName?: string;

    /**
     * REF02 when REF01=LU
     */
    locationNumber?: string;

    /**
     * NM105
     */
    middleName?: string;

    /**
     * Loop: 2010AC, Segment: REF, Element: REF02 when REF01=NF, Notes: National
     * Association of Insurance Commissioners (NAIC) Code
     */
    naic?: string;

    /**
     * NM109, Notes: National Provider Identifier
     */
    npi?: string;

    /**
     * NM103
     */
    organizationName?: string;

    /**
     * LOOP: 2010AC, Segment: REF, Element: REF02 when REF01=2U
     */
    payerIdentificationNumber?: string;

    /**
     * REF02 when REF01=1G, Notes: UPINs must be formatted as either X99999 or XXX999
     */
    providerUpinNumber?: string;

    /**
     * REF02 when REF01=SY, Notes: The Social Security Number must be a string of nine
     * numbers with no separators
     */
    ssn?: string;

    /**
     * REF02 when REF01=0B
     */
    stateLicenseNumber?: string;

    /**
     * NM107
     */
    suffix?: string;

    /**
     * PRV03
     */
    taxonomyCode?: string;
  }

  /**
   * 2010AC
   */
  export interface PayToPlan {
    /**
     * N3 and N4
     */
    address: V3API.Address;

    /**
     * Loop: 2010AC, Segment: NM1, Element: NM103
     */
    organizationName: string;

    /**
     * Loop: 2010AC, Segment: NM1, Element: NM109
     */
    primaryIdentifier: string;

    /**
     * Loop: 2010AC, Segment: NM1, Element: NM108, Notes: 'PI' Payor Identification and
     * 'XV' Centers for Medicare/Medicaid Services PlanID
     */
    primaryIdentifierTypeCode: 'PI' | 'XV';

    /**
     * Loop: 2010AC, Segment: REF, Element: REF02 when REF01=EI
     */
    taxIdentificationNumber: string;

    /**
     * Loop: 2010AC, Segment: REF, Element: REF02
     */
    secondaryIdentifier?: string;

    /**
     * Loop: 2010AC, Segment: REF, Element: REF01, Notes: '2U Payer Identification
     * Number, 'FY' Claim Office Number, 'NF National Association of Insurance
     * Commissioners'
     */
    secondaryIdentifierTypeCode?: '2U' | 'FY' | 'NF';
  }

  /**
   * Loop: 2420F
   */
  export interface Referring {
    providerType: string;

    /**
     * N3 and N4
     */
    address?: V3API.Address;

    /**
     * Loop: 2010AC, Segment: REF, Element: REF02 when REF01=FY
     */
    claimOfficeNumber?: string;

    /**
     * REF02 when REF01=G2
     */
    commercialNumber?: string;

    /**
     * PER
     */
    contactInformation?: V3API.ContactInformation;

    /**
     * REF02 when REF01=EI, Notes: The Employer Identification Number must be a string
     * of exactly nine numbers with no separators
     */
    employerId?: string;

    /**
     * LOOP: 2010AC, Segment: REF, Element: REF02 when REF01=EI
     */
    employerIdentificationNumber?: string;

    /**
     * NM104
     */
    firstName?: string;

    /**
     * NM103
     */
    lastName?: string;

    /**
     * REF02 when REF01=LU
     */
    locationNumber?: string;

    /**
     * NM105
     */
    middleName?: string;

    /**
     * Loop: 2010AC, Segment: REF, Element: REF02 when REF01=NF, Notes: National
     * Association of Insurance Commissioners (NAIC) Code
     */
    naic?: string;

    /**
     * NM109, Notes: National Provider Identifier
     */
    npi?: string;

    /**
     * NM103
     */
    organizationName?: string;

    /**
     * LOOP: 2010AC, Segment: REF, Element: REF02 when REF01=2U
     */
    payerIdentificationNumber?: string;

    /**
     * REF02 when REF01=1G, Notes: UPINs must be formatted as either X99999 or XXX999
     */
    providerUpinNumber?: string;

    /**
     * REF02 when REF01=SY, Notes: The Social Security Number must be a string of nine
     * numbers with no separators
     */
    ssn?: string;

    /**
     * REF02 when REF01=0B
     */
    stateLicenseNumber?: string;

    /**
     * NM107
     */
    suffix?: string;

    /**
     * PRV03
     */
    taxonomyCode?: string;
  }

  /**
   * Loop: 2420A
   */
  export interface Rendering {
    providerType: string;

    /**
     * N3 and N4
     */
    address?: V3API.Address;

    /**
     * Loop: 2010AC, Segment: REF, Element: REF02 when REF01=FY
     */
    claimOfficeNumber?: string;

    /**
     * REF02 when REF01=G2
     */
    commercialNumber?: string;

    /**
     * PER
     */
    contactInformation?: V3API.ContactInformation;

    /**
     * REF02 when REF01=EI, Notes: The Employer Identification Number must be a string
     * of exactly nine numbers with no separators
     */
    employerId?: string;

    /**
     * LOOP: 2010AC, Segment: REF, Element: REF02 when REF01=EI
     */
    employerIdentificationNumber?: string;

    /**
     * NM104
     */
    firstName?: string;

    /**
     * NM103
     */
    lastName?: string;

    /**
     * REF02 when REF01=LU
     */
    locationNumber?: string;

    /**
     * NM105
     */
    middleName?: string;

    /**
     * Loop: 2010AC, Segment: REF, Element: REF02 when REF01=NF, Notes: National
     * Association of Insurance Commissioners (NAIC) Code
     */
    naic?: string;

    /**
     * NM109, Notes: National Provider Identifier
     */
    npi?: string;

    /**
     * NM103
     */
    organizationName?: string;

    /**
     * LOOP: 2010AC, Segment: REF, Element: REF02 when REF01=2U
     */
    payerIdentificationNumber?: string;

    /**
     * REF02 when REF01=1G, Notes: UPINs must be formatted as either X99999 or XXX999
     */
    providerUpinNumber?: string;

    /**
     * REF02 when REF01=SY, Notes: The Social Security Number must be a string of nine
     * numbers with no separators
     */
    ssn?: string;

    /**
     * REF02 when REF01=0B
     */
    stateLicenseNumber?: string;

    /**
     * NM107
     */
    suffix?: string;

    /**
     * PRV03
     */
    taxonomyCode?: string;
  }
}

/**
 * PER
 */
export interface ContactInformation {
  /**
   * Segment: PER, Element: PER02 and PER01=IC
   */
  name: string;

  /**
   * Segment: PER, Element: PER04 or PER06 or PER08, Note: This used in (Provider,
   * Submitter) when PER03=EM or PER05=EM or PER07=EM
   */
  email?: string;

  /**
   * Segment: PER, Element: PER04 or PER06 or PER08, Note: This is used in (Provider,
   * Submitter) when PER03=FX or PER05=FX or PER07=FX
   */
  faxNumber?: string;

  /**
   * Segment: PER, Element: PER06 (Provider, Submitter, Subscriber, Dependent) or
   * PER08 (Provider, Submitter),Note: Used when PER05=EX (Provider, Submitter,
   * Subscriber, Dependent) or PER07=EX (Provider, Submitter)
   */
  phoneExtension?: string;

  /**
   * Segment: PER, Element: PER04 (Provider, Submitter, Subscriber, Dependent) or
   * PER06 (Provider, Submitter) or PER08 (Provider, Submitter), Note: Used when
   * PER03=TE (Provider, Submitter, Subscriber, Dependent) or PER05=TE (Provider,
   * Submitter) or PER07=TE (Provider, Submitter)
   */
  phoneNumber?: string;
}

export interface RawX12Request {
  /**
   * For the x12 endpoint, the value should be a full 837 edi request.
   */
  x12?: string;
}

export interface ReferenceIdentification {
  /**
   * Segment: REF, Element: REF02
   */
  identifier: string;

  /**
   * Segment: REF, Element: REF01
   */
  qualifier: string;

  /**
   * Segment: REF, Element: REF03
   */
  otherIdentifier?: string;
}

export interface ReportInformation {
  /**
   * Loop: 2400, Segment: PWK, Element: PWK01, Notes: Allowed Values are: '03' Report
   * Justifying Treatment Beyond Utilization Guidelines, '04' Drugs Administered,
   * '05' Treatment Diagnosis, '06' Initial Assessment, '07' Functional Goals, '08'
   * Plan of Treatment, '09' Progress Report, '10' Continued Treatment, '11' Chemical
   * Analysis, '13' Certified Test Report, '15' Justification for Admission, '21'
   * Recovery Plan, 'A3' Allergies/Sensitivities Document, 'A4' Autopsy Report, 'AM'
   * Ambulance Certification, 'AS' Admission Summary, 'B2' Prescription, 'B3'
   * Physician Order, 'B4' Referral Form, 'BR' Benchmark Testing Results, 'BS'
   * Baseline, 'BT' Blanket Test Results, 'CB' Chiropractic Justification, 'CK'
   * Consent Form(s), 'CT' Certification, 'D2' Drug Profile Document, 'DA' Dental
   * Models, 'DB' Durable Medical Equipment Prescription, 'DG' Diagnostic Report,
   * 'DJ' Discharge Monitoring Report, 'DS' Discharge Summary, 'EB' Explanation of
   * Benefits (Coordination of Benefits or Medicare Secondary Payor), 'HC' Health
   * Certificate, 'HR' Health Clinic Records, 'I5' Immunization Record,'IR' State
   * School Immunization Records, 'LA' Laboratory Results, 'M1' Medical Record
   * Attachment, 'MT' Models, 'NM Nursing Notes', 'OB' Operative Note, 'OC' Oxygen
   * Content Averaging Report, 'OD' Orders and Treatments Document, 'OE' Objective
   * Physical Examination (including vital signs) Document, 'OX' Oxygen Therapy
   * Certification, 'OZ' Support Data for Claim, 'P4' Pathology Report, 'P5' Patient
   * Medical History Document, 'PE' Parenteral or Enteral Certification, 'PN'
   * Physical Therapy Notes, 'PO' Prosthetics or Orthotic Certification, 'PQ'
   * Paramedical Results, 'PY' Physician's Report, 'PZ' Physical Therapy
   * Certification, 'RB' Radiology Films, 'RR' Radiology Reports, 'RT' Report of
   * Tests and Analysis Report, 'RX' Renewable Oxygen Content Averaging Report, 'SG'
   * Symptoms Document, 'V5' Death Notification, 'XP' Photographs
   */
  attachmentReportTypeCode:
    | '03'
    | '04'
    | '05'
    | '06'
    | '07'
    | '08'
    | '09'
    | '10'
    | '11'
    | '13'
    | '15'
    | '21'
    | 'A3'
    | 'A4'
    | 'AM'
    | 'AS'
    | 'B2'
    | 'B3'
    | 'B4'
    | 'BR'
    | 'BS'
    | 'BT'
    | 'CB'
    | 'CK'
    | 'CT'
    | 'D2'
    | 'DA'
    | 'DB'
    | 'DG'
    | 'DJ'
    | 'DS'
    | 'EB'
    | 'HC'
    | 'HR'
    | 'I5'
    | 'IR'
    | 'LA'
    | 'M1'
    | 'MT'
    | 'NM'
    | 'OB'
    | 'OC'
    | 'OD'
    | 'OE'
    | 'OX'
    | 'OZ'
    | 'P4'
    | 'P5'
    | 'PE'
    | 'PN'
    | 'PO'
    | 'PQ'
    | 'PY'
    | 'PZ'
    | 'RB'
    | 'RR'
    | 'RT'
    | 'RX'
    | 'SG'
    | 'V5'
    | 'XP';

  /**
   * Loop: 2400, Segment: PWK, Element: PWK02 Allowed Values are: 'AA' Available on
   * Request at Provider Site, 'BM' By Mail,'EL' Electronically Only, 'EM' E-Mail,
   * 'FT' File Transfer, 'FX' By Fax
   */
  attachmentTransmissionCode: 'AA' | 'BM' | 'EL' | 'EM' | 'FT' | 'FX';

  /**
   * Loop 2400, Segment: PWK, Element: PWK05
   */
  attachmentControlNumber?: string;
}

export interface Response {
  /**
   * Collection of info specific to a given claim
   */
  claimReference?: Response.ClaimReference;

  /**
   * Transaction Set Control Number
   */
  controlNumber?: string;

  editResponses?: Array<Response.EditResponse>;

  editStatus?: string;

  /**
   * List of errors
   */
  errors?: Array<Response.Error>;

  failure?: Response.Failure;

  /**
   * meta data about the request
   */
  meta?: Response.Meta;

  payer?: Response.Payer;

  /**
   * Status of claim
   */
  status?: string;

  /**
   * Payer ID
   */
  tradingPartnerServiceId?: string;
}

export namespace Response {
  /**
   * Collection of info specific to a given claim
   */
  export interface ClaimReference {
    /**
     * Claim Type
     */
    claimType?: string;

    /**
     * Claim correlation ID
     */
    correlationId?: string;

    /**
     * Claim number
     */
    customerClaimNumber?: string;

    /**
     * Format version
     */
    formatVersion?: string;

    /**
     * Control number for claim
     */
    patientControlNumber?: string;

    /**
     * Payer ID
     */
    payerID?: string;

    rhclaimNumber?: string;

    /**
     * Submitter ID for transaction
     */
    submitterId?: string;

    /**
     * Time of response for claim
     */
    timeOfResponse?: string;
  }

  export interface EditResponse {
    allowOverride?: string;

    badData?: string;

    claimCorePath?: string;

    editActivity?: string;

    editName?: string;

    element?: string;

    errorDescription?: string;

    fieldIndex?: string;

    loop?: string;

    phaseID?: string;

    qualifierCode?: string;

    referenceID?: string;

    segment?: string;
  }

  export interface Error {
    /**
     * Error code
     */
    code?: string;

    /**
     * Description of error message.
     */
    description?: string;

    /**
     * The field related to the error
     */
    field?: string;

    /**
     * Follow up action to correct
     */
    followupAction?: string;

    /**
     * Location of error
     */
    location?: string;

    /**
     * Value for bad data error
     */
    value?: string;
  }

  export interface Failure {
    code?: string;

    description?: string;
  }

  /**
   * meta data about the request
   */
  export interface Meta {
    /**
     * Used by Optum to identify where this request can be found for support
     */
    applicationMode?: string;

    /**
     * billerId assigned to this request
     */
    billerId?: string;

    /**
     * senderId assigned to this request
     */
    senderId?: string;

    /**
     * submitterId assigned to this request
     */
    submitterId?: string;

    /**
     * Unique Id assigned to each request by Optum
     */
    traceId?: string;
  }

  export interface Payer {
    payerID?: string;

    payerName?: string;
  }
}

export interface ServiceFacilityLocation {
  /**
   * N3 and N4
   */
  address: Address;

  /**
   * Loop: 2420C, Segment: NM1, Element: NM103
   */
  organizationName: string;

  /**
   * Loop: 2420C, Segment: NM1, Element: NM109, Note: National Provider Identifier
   */
  npi?: string;

  /**
   * Loop: 2310C, Segment: PER, Element: PER06
   */
  phoneExtension?: string;

  /**
   * Loop: 2310C, Segment: PER, Element: PER02
   */
  phoneName?: string;

  /**
   * Loop: 2310C, Segment: PER, Element: PER04
   */
  phoneNumber?: string;

  /**
   * Loop: 2420C: Segment: REF, Notes: A list containing qualifier (REF01),
   * identifier (REF02), and otherIdentifier(REF04)
   */
  secondaryIdentifier?: Array<ReferenceIdentification>;
}

export interface ServiceLineProvider {
  providerType: string;

  /**
   * N3 and N4
   */
  address?: Address;

  /**
   * Loop: 2010AC, Segment: REF, Element: REF02 when REF01=FY
   */
  claimOfficeNumber?: string;

  /**
   * REF02 when REF01=G2
   */
  commercialNumber?: string;

  /**
   * PER
   */
  contactInformation?: ContactInformation;

  /**
   * REF02 when REF01=EI, Notes: The Employer Identification Number must be a string
   * of exactly nine numbers with no separators
   */
  employerId?: string;

  /**
   * LOOP: 2010AC, Segment: REF, Element: REF02 when REF01=EI
   */
  employerIdentificationNumber?: string;

  /**
   * NM104
   */
  firstName?: string;

  /**
   * NM103
   */
  lastName?: string;

  /**
   * REF02 when REF01=LU
   */
  locationNumber?: string;

  /**
   * NM105
   */
  middleName?: string;

  /**
   * Loop: 2010AC, Segment: REF, Element: REF02 when REF01=NF, Notes: National
   * Association of Insurance Commissioners (NAIC) Code
   */
  naic?: string;

  /**
   * NM109, Notes: National Provider Identifier
   */
  npi?: string;

  /**
   * NM103
   */
  organizationName?: string;

  otherIdentifier?: string;

  /**
   * LOOP: 2010AC, Segment: REF, Element: REF02 when REF01=2U
   */
  payerIdentificationNumber?: string;

  /**
   * REF02 when REF01=1G, Notes: UPINs must be formatted as either X99999 or XXX999
   */
  providerUpinNumber?: string;

  secondaryIdentifier?: Array<ReferenceIdentification>;

  /**
   * REF02 when REF01=SY, Notes: The Social Security Number must be a string of nine
   * numbers with no separators
   */
  ssn?: string;

  /**
   * REF02 when REF01=0B
   */
  stateLicenseNumber?: string;

  /**
   * NM107
   */
  suffix?: string;

  /**
   * PRV03
   */
  taxonomyCode?: string;
}

/**
 * Loop: 2420D
 */
export interface Supervising {
  providerType: string;

  /**
   * N3 and N4
   */
  address?: Address;

  /**
   * Loop: 2010AC, Segment: REF, Element: REF02 when REF01=FY
   */
  claimOfficeNumber?: string;

  /**
   * REF02 when REF01=G2
   */
  commercialNumber?: string;

  /**
   * PER
   */
  contactInformation?: ContactInformation;

  /**
   * REF02 when REF01=EI, Notes: The Employer Identification Number must be a string
   * of exactly nine numbers with no separators
   */
  employerId?: string;

  /**
   * LOOP: 2010AC, Segment: REF, Element: REF02 when REF01=EI
   */
  employerIdentificationNumber?: string;

  /**
   * NM104
   */
  firstName?: string;

  /**
   * NM103
   */
  lastName?: string;

  /**
   * REF02 when REF01=LU
   */
  locationNumber?: string;

  /**
   * NM105
   */
  middleName?: string;

  /**
   * Loop: 2010AC, Segment: REF, Element: REF02 when REF01=NF, Notes: National
   * Association of Insurance Commissioners (NAIC) Code
   */
  naic?: string;

  /**
   * NM109, Notes: National Provider Identifier
   */
  npi?: string;

  /**
   * NM103
   */
  organizationName?: string;

  /**
   * LOOP: 2010AC, Segment: REF, Element: REF02 when REF01=2U
   */
  payerIdentificationNumber?: string;

  /**
   * REF02 when REF01=1G, Notes: UPINs must be formatted as either X99999 or XXX999
   */
  providerUpinNumber?: string;

  /**
   * REF02 when REF01=SY, Notes: The Social Security Number must be a string of nine
   * numbers with no separators
   */
  ssn?: string;

  /**
   * REF02 when REF01=0B
   */
  stateLicenseNumber?: string;

  /**
   * NM107
   */
  suffix?: string;

  /**
   * PRV03
   */
  taxonomyCode?: string;
}

export type V3HealthCheckResponse = { [key: string]: string };

export interface V3SubmitClaimParams {
  /**
   * Body param: Loop: 2000A
   */
  billing: V3SubmitClaimParams.Billing;

  /**
   * Body param: Loop2300
   */
  claimInformation: V3SubmitClaimParams.ClaimInformation;

  /**
   * Body param: Header, Segment: ST02 (no loop), Notes: Transaction Set Control
   * Number
   */
  controlNumber: string;

  /**
   * Body param: Loop: 1000B
   */
  receiver: V3SubmitClaimParams.Receiver;

  /**
   * Body param: Loop: 1000A
   */
  submitter: V3SubmitClaimParams.Submitter;

  /**
   * Body param: Loop: 2000B
   */
  subscriber: V3SubmitClaimParams.Subscriber;

  /**
   * Body param: LOOP 2000C
   */
  dependent?: V3SubmitClaimParams.Dependent;

  /**
   * @deprecated Body param: Loop: 2420E, Setting ProviderType equal to
   * OrderingProvider is deprecated, please use
   * ClaimInformation.serviceLines.orderingProvider
   */
  ordering?: V3SubmitClaimParams.Ordering;

  /**
   * Body param: N3 and N4
   */
  payerAddress?: Address;

  /**
   * Body param: N3 and N4
   */
  payToAddress?: Address;

  /**
   * Body param: 2010AC
   */
  payToPlan?: V3SubmitClaimParams.PayToPlan;

  /**
   * @deprecated Body param: setting providers deprecated, please set all providers
   * individually by it's type.
   */
  providers?: Array<Supervising>;

  /**
   * Body param: Loop: 2420F
   */
  referring?: V3SubmitClaimParams.Referring;

  /**
   * Body param: Loop: 2420A
   */
  rendering?: V3SubmitClaimParams.Rendering;

  /**
   * Body param: Loop: 2420D
   */
  supervising?: Supervising;

  /**
   * Body param: Loop 2010BB NM103
   */
  tradingPartnerName?: string;

  /**
   * Body param: Loop: 2010BB Segment: NM1, Element: NM109, Notes: we send this as
   * MN108 as PI = Payer Identification
   */
  tradingPartnerServiceId?: string;

  /**
   * Body param: Interchange Usage Indicator ISA15; T-Test Data, P-Production Data
   */
  usageIndicator?: string;

  /**
   * Header param:
   */
  'x-chng-trace-id'?: string;
}

export namespace V3SubmitClaimParams {
  /**
   * Loop: 2000A
   */
  export interface Billing {
    providerType: string;

    /**
     * N3 and N4
     */
    address?: V3API.Address;

    /**
     * Loop: 2010AC, Segment: REF, Element: REF02 when REF01=FY
     */
    claimOfficeNumber?: string;

    /**
     * REF02 when REF01=G2
     */
    commercialNumber?: string;

    /**
     * PER
     */
    contactInformation?: V3API.ContactInformation;

    /**
     * REF02 when REF01=EI, Notes: The Employer Identification Number must be a string
     * of exactly nine numbers with no separators
     */
    employerId?: string;

    /**
     * LOOP: 2010AC, Segment: REF, Element: REF02 when REF01=EI
     */
    employerIdentificationNumber?: string;

    /**
     * NM104
     */
    firstName?: string;

    /**
     * NM103
     */
    lastName?: string;

    /**
     * REF02 when REF01=LU
     */
    locationNumber?: string;

    /**
     * NM105
     */
    middleName?: string;

    /**
     * Loop: 2010AC, Segment: REF, Element: REF02 when REF01=NF, Notes: National
     * Association of Insurance Commissioners (NAIC) Code
     */
    naic?: string;

    /**
     * NM109, Notes: National Provider Identifier
     */
    npi?: string;

    /**
     * NM103
     */
    organizationName?: string;

    /**
     * LOOP: 2010AC, Segment: REF, Element: REF02 when REF01=2U
     */
    payerIdentificationNumber?: string;

    /**
     * REF02 when REF01=1G, Notes: UPINs must be formatted as either X99999 or XXX999
     */
    providerUpinNumber?: string;

    /**
     * REF02 when REF01=SY, Notes: The Social Security Number must be a string of nine
     * numbers with no separators
     */
    ssn?: string;

    /**
     * REF02 when REF01=0B
     */
    stateLicenseNumber?: string;

    /**
     * NM107
     */
    suffix?: string;

    /**
     * PRV03
     */
    taxonomyCode?: string;
  }

  /**
   * Loop2300
   */
  export interface ClaimInformation {
    /**
     * Loop 2300, Segment: CLM, Element: CLM08, Note: Allowed Values are: 'N' No, 'W'
     * Not Applicable - Use code 'W' when the patient refuses to assign benefits, 'Y'
     * Yes
     */
    benefitsAssignmentCertificationIndicator: 'N' | 'W' | 'Y';

    /**
     * Loop 2300, Segment: CLM, Element: CLM02
     */
    claimChargeAmount: string;

    /**
     * Loop 2000B, Segment: SBR, Element: SBR09, Note: Allowed Values are: '11' Other
     * Non-Federal Programs, '12' Preferred Provider Organization (PPO), '13' Point of
     * Service (POS), '14' Exclusive Provider Organization (EPO), '15' Indemnity
     * Insurance, '16' Health Maintenance Organization (HMO) Medicare Risk, '17' Dental
     * Maintenance Organization, 'AM' Automobile Medical, 'BL' Blue Cross/Blue Shield,
     * 'CH' Champus, 'CI' Commercial Insurance Co., 'DS' Disability, 'FI' Federal
     * Employees Program, 'HM' Health Maintenance Organization, 'LM' Liability Medical,
     * 'MA' Medicare Part A, 'MB' Medicare Part B, 'MC' Medicaid, 'OF' Other Federal
     * Program, 'TV' Title V, 'VA' Veterans Affairs Plan, 'WC' Workers' Compensation
     * Health Claim, 'ZZ' Mutually Defined
     */
    claimFilingCode:
      | '11'
      | '12'
      | '13'
      | '14'
      | '15'
      | '16'
      | '17'
      | 'AM'
      | 'BL'
      | 'CH'
      | 'CI'
      | 'DS'
      | 'FI'
      | 'HM'
      | 'LM'
      | 'MA'
      | 'MB'
      | 'MC'
      | 'OF'
      | 'TV'
      | 'VA'
      | 'WC'
      | 'ZZ';

    /**
     * Loop 2300, Segment: CLM, Element: CLM05-03
     */
    claimFrequencyCode: string;

    /**
     * Loop 2300, Segment: HI
     */
    healthCareCodeInformation: Array<ClaimInformation.HealthCareCodeInformation>;

    /**
     * Loop 2300, Segment: CLM, Element: CLM01
     */
    patientControlNumber: string;

    /**
     * Loop 2300, Segment: CLM, Element: CLM05-01
     */
    placeOfServiceCode: string;

    /**
     * Loop 2300, Segment: CLM, Element: CLM07, Note: Allowed Values are: 'A' Assigned,
     * 'B' Assignment Accepted on Clinical Lab Services Only, 'C' Not Assigned
     */
    planParticipationCode: 'A' | 'B' | 'C';

    /**
     * Loop 2300, Segment: CLM, Element: CLM09, Note: Allowed Values are: 'I' Informed
     * Consent to Release Medical Information for Conditions or Diagnoses Regulated by
     * Federal Statutes, 'Y' Yes
     */
    releaseInformationCode: 'I' | 'Y';

    /**
     * Loop 2400
     */
    serviceLines: Array<ClaimInformation.ServiceLine>;

    /**
     * Loop 2300, Segment: CLM, Element: CLM06, Note: Allowed Values are: 'N' NO, 'Y'
     * Yes
     */
    signatureIndicator: 'N' | 'Y';

    /**
     * Loop 2300, Segment: CRC
     */
    ambulanceCertification?: Array<V3API.AmbulanceCertification>;

    /**
     * N3 and N4
     */
    ambulanceDropOffLocation?: V3API.Address;

    /**
     * N3 and N4
     */
    ambulancePickUpLocation?: V3API.Address;

    /**
     * CR1
     */
    ambulanceTransportInformation?: V3API.AmbulanceTransportInformation;

    /**
     * Loop 2300, Segment: HI
     */
    anesthesiaRelatedSurgicalProcedure?: Array<string>;

    /**
     * Loop 2300, Segment: CLM, Element: CLM11-05, Note: When CLM11-1 or CLM11-2 = AA
     * and the accident occurred in a country other than US or Canada.
     */
    autoAccidentCountryCode?: string;

    /**
     * Loop 2300, Segment: CLM, Element: CLM11-04, Note: When CLM11-1 or CLM11-2 has a
     * value of 'AA' to identify the state, province or sub-country code in which the
     * automobile accident occurred.
     */
    autoAccidentStateCode?: 'AA' | 'EM' | 'OA';

    /**
     * Loop 2300, Segment: CN1
     */
    claimContractInformation?: ClaimInformation.ClaimContractInformation;

    /**
     * DTP
     */
    claimDateInformation?: ClaimInformation.ClaimDateInformation;

    /**
     * NTE
     */
    claimNote?: ClaimInformation.ClaimNote;

    /**
     * HCP
     */
    claimPricingRepricingInformation?: V3API.ClaimPricingRepricingInformation;

    /**
     * PWK and REF
     */
    claimSupplementalInformation?: ClaimInformation.ClaimSupplementalInformation;

    /**
     * Loop 2300, Segment: HI
     */
    conditionInformation?: Array<ClaimInformation.ConditionInformation>;

    /**
     * Loop 2000B and 2000C, Segment: PAT, Element: PAT06 and PAT05=D8
     */
    deathDate?: string;

    /**
     * Loop 2300, Segment: CLM, Element: CLM20, Note: Allowed Values are: '1' Proof of
     * Eligibility Unknown or Unavailable, '2' Litigation, '3' Authorization Delays,
     * '4' Delay in Certifying Provider, '5' Delay in Supplying Billing Forms, '6'
     * Delay in Delivery of Custom-made Appliances, '7' Third Party Processing Delay,
     * '8' Delay in Eligibility Determination, '9' Original Claim Rejected or Denied
     * Due to a Reason Unrelated to the Billing Limitation Rules, '10' Administration
     * Delay in the Prior Approval Process, '11' Other, '15' Natural Disaster
     */
    delayReasonCode?: '1' | '2' | '3' | '4' | '5' | '6' | '7' | '8' | '9' | '10' | '11' | '15';

    /**
     * CRC
     */
    epsdtReferral?: ClaimInformation.EpsdtReferral;

    /**
     * Loop 2300, Segment: K3, Element: K301
     */
    fileInformation?: string;

    /**
     * Loop 2300, Segment: K3, Element: K301
     */
    fileInformationList?: Array<string>;

    /**
     * Loop 2300, Segment: CRC
     */
    homeboundIndicator?: boolean;

    /**
     * Loop 2320
     */
    otherSubscriberInformation?: Array<ClaimInformation.OtherSubscriberInformation>;

    /**
     * Loop 2300, Segment: AMT, Element: AMT02
     */
    patientAmountPaid?: string;

    /**
     * Loop 2300, Segment: CRC
     */
    patientConditionInformationVision?: Array<ClaimInformation.PatientConditionInformationVision>;

    /**
     * Loop 2300, Segment: CLM, Element: CLM10, Note: Allowed Values are: 'P' Signature
     * generated by provider because the patient was not physically present for
     * services
     */
    patientSignatureSourceCode?: false;

    /**
     * Loop 2000B and 2000C, Segment: PAT, Element: PAT08 and PAT07=01
     */
    patientWeight?: string;

    /**
     * Loop 2000B and 2000C, Segment: PAT, Element: PAT09
     */
    pregnancyIndicator?: 'Y';

    /**
     * Loop 2010BA, Segment: REF, Element: REF02
     */
    propertyCasualtyClaimNumber?: string;

    /**
     * Loop 2300, Segment: CLM, Element: CLM11-01, CLM11-02, Note: Allowed Values are:
     * 'AA' Auto Accident, 'EM' Employment, 'OA' Other Accident
     */
    relatedCausesCode?: Array<'AA' | 'EM' | 'OA'>;

    serviceFacilityLocation?: V3API.ServiceFacilityLocation;

    /**
     * Loop 2300, Segment: CLM, Element: CLM12, Note: Allowed Values are: '02'
     * Physically Handicapped Children's Program, '03' Special Federal Funding, '05'
     * Disabolity, '09' Second Opinion or Surgery
     */
    specialProgramCode?: '02' | '03' | '05' | '09';

    /**
     * Loop 2300, Segment: CR2
     */
    spinalManipulationServiceInformation?: ClaimInformation.SpinalManipulationServiceInformation;
  }

  export namespace ClaimInformation {
    /**
     * HI
     */
    export interface HealthCareCodeInformation {
      /**
       * Loop: 2440, Segment: HI, Element: HI01-02 or HI02-02 or HI03-02 or HI04-02 or
       * HI05-02 or HI06-02 or HI07-02 or HI08-02 or HI09-02 or HI10-02 or HI11-02 or
       * HI12-02
       */
      diagnosisCode: string;

      /**
       * Loop: 2440, Segment: HI, Element: HI01-01 or HI02-01 or HI03-01 or HI04-01 or
       * HI05-01 or HI06-01 or HI07-01 or HI08-01 or HI09-01 or HI10-01 or HI11-01 or
       * HI12-01, Note: Allowed Values are: 'BK' International Classification of Diseases
       * Clinical Modification (ICD-9-CM) Principal Diagnosis, 'ABK' International
       * Classification of Diseases Clinical Modification (ICD-10-CM) Principal
       * Diagnosis, 'BF' International Classification of Diseases Clinical Modification
       * (ICD-9-CM) Diagnosis, 'ABF' International Classification of Diseases Clinical
       * Modification (ICD-10-CM) Diagnosis
       */
      diagnosisTypeCode: 'BK' | 'ABK' | 'BF' | 'ABF';
    }

    /**
     * Loop 2400
     */
    export interface ServiceLine {
      professionalService: ServiceLine.ProfessionalService;

      /**
       * Loop: 2400, Segment: DTP, Element: DTP03, Notes: When sent with serviceDateEnd
       * it will be used as the start date for Date Time period, if sent without
       * serviceDateEnd will use DTP02 = D8. Expressed in Format CCYYMMDD
       */
      serviceDate: string;

      /**
       * Loop: 2400, Segment: NTE, Element: NTE02 when NTE01=ADD
       */
      additionalNotes?: string;

      ambulanceCertification?: Array<V3API.AmbulanceCertification>;

      /**
       * N3 and N4
       */
      ambulanceDropOffLocation?: V3API.Address;

      /**
       * Loop: 2400, Segment: QTY, Element: QTY02 when QTY01=PT
       */
      ambulancePatientCount?: number;

      /**
       * N3 and N4
       */
      ambulancePickUpLocation?: V3API.Address;

      /**
       * CR1
       */
      ambulanceTransportInformation?: V3API.AmbulanceTransportInformation;

      /**
       * Loop: 2400, Segment: LX, Element: LX01
       */
      assignedNumber?: string;

      /**
       * CRC
       */
      conditionIndicatorDurableMedicalEquipment?: ServiceLine.ConditionIndicatorDurableMedicalEquipment;

      /**
       * CN1
       */
      contractInformation?: ServiceLine.ContractInformation;

      /**
       * LOOP 2410
       */
      drugIdentification?: ServiceLine.DrugIdentification;

      /**
       * PWK
       */
      durableMedicalEquipmentCertificateOfMedicalNecessity?: ServiceLine.DurableMedicalEquipmentCertificateOfMedicalNecessity;

      /**
       * CR3
       */
      durableMedicalEquipmentCertification?: ServiceLine.DurableMedicalEquipmentCertification;

      /**
       * SV5
       */
      durableMedicalEquipmentService?: ServiceLine.DurableMedicalEquipmentService;

      /**
       * Loop: 2400, Segment: K3, Element: K301
       */
      fileInformation?: Array<string>;

      formIdentification?: Array<ServiceLine.FormIdentification>;

      /**
       * Loop: 2400, Segment: NTE, Element: NTE02 when NTE01=DCP
       */
      goalRehabOrDischargePlans?: string;

      /**
       * Loop: 2400, Segment: CRC, Element: CRC02 Notes: True or False
       */
      hospiceEmployeeIndicator?: boolean;

      lineAdjudicationInformation?: Array<ServiceLine.LineAdjudicationInformation>;

      /**
       * HCP
       */
      linePricingRepricingInformation?: V3API.ClaimPricingRepricingInformation;

      /**
       * Loop: 2400, Segment: QTY, Element: QTY02 when QTY01=FL
       */
      obstetricAnesthesiaAdditionalUnits?: number;

      orderingProvider?: ServiceLine.OrderingProvider;

      /**
       * Loop: 2400, Segment: AMT, Element: AMT02 when AMT01=F4
       */
      postageTaxAmount?: string;

      /**
       * Loop: 2400, Segment: REF, Element: REF04-02 when REF01=6R
       */
      providerControlNumber?: string;

      purchasedServiceInformation?: ServiceLine.PurchasedServiceInformation;

      purchasedServiceProvider?: V3API.ServiceLineProvider;

      referringProvider?: V3API.ServiceLineProvider;

      renderingProvider?: V3API.ServiceLineProvider;

      /**
       * Loop: 2400, Segment: AMT, Element: AMT02 when AMT01=T
       */
      salesTaxAmount?: string;

      /**
       * Loop: 2400, Segment: DTP, Element: DTP03, Notes: Range of Dates Expressed in
       * Format CCYYMMDD
       */
      serviceDateEnd?: string;

      serviceFacilityLocation?: V3API.ServiceFacilityLocation;

      serviceLineDateInformation?: ServiceLine.ServiceLineDateInformation;

      serviceLineReferenceInformation?: ServiceLine.ServiceLineReferenceInformation;

      serviceLineSupplementalInformation?: Array<V3API.ReportInformation>;

      supervisingProvider?: V3API.ServiceLineProvider;

      testResults?: Array<ServiceLine.TestResult>;

      /**
       * Loop: 2400, Segment: NTE, Element: NTE02 when NTE01=TPO
       */
      thirdPartyOrganizationNotes?: string;
    }

    export namespace ServiceLine {
      export interface ProfessionalService {
        /**
         * SVC107
         */
        compositeDiagnosisCodePointers: ProfessionalService.CompositeDiagnosisCodePointers;

        /**
         * Loop 2400, Segment: SV1, Element: SV102, Notes: Required value for total charge
         * amount, '0' (Zero) is acceptable for this value
         */
        lineItemChargeAmount: string;

        /**
         * Loop 2400, Segment: SV1, Element: SV103, Notes: Allowed values are 'MJ' Minutes,
         * 'UN' Unit
         */
        measurementUnit: 'MJ' | 'UN';

        /**
         * Loop 2400, Segment: SV1, Element: SV101-02
         */
        procedureCode: string;

        /**
         * Loop: 2400, Segment: SV1, Element: SV101-01, Notes: Allowed Values are: 'ER'
         * Jurisdiction Specific Procedure and Supply Codes, 'HC' Health Care Financing
         * Administration Common Procedural Coding System (HCPCS) Codes, 'IV' Home Infusion
         * EDI Coalition (HIEC) Product/Service Code,'WK' Advanced Billing Concepts (ABC)
         * Codes
         */
        procedureIdentifier: 'ER' | 'HC' | 'IV' | 'WK';

        /**
         * Loop 2400, Segment: SV1, Element: SV104, Notes: When a decimal is needed to
         * report units, include it in this element
         */
        serviceUnitCount: string;

        /**
         * Loop 2400, Segment: SV1, Element: SV115
         */
        copayStatusCode?: '0';

        /**
         * Loop 2400, Segment: SV1, Element: SV101-07, Notes: A free form description to
         * clarify teh related data elements and their content
         */
        description?: string;

        /**
         * Loop 2400, Segment: SV1, Element: SV109
         */
        emergencyIndicator?: 'Y';

        /**
         * Loop 2400, Segment: SV1, Element: SV111
         */
        epsdtIndicator?: 'Y';

        /**
         * Loop 2400, Segment: SV1, Element: SV112
         */
        familyPlanningIndicator?: 'Y';

        /**
         * Loop 2400, Segment: SV1, Element: SV105
         */
        placeOfServiceCode?: string;

        /**
         * Loop 2400, Segment: SV1, Elements: SV101-03 to SV101-06, Notes: Required when
         * modifier clarifies or improves the reporting accuracy of the associated
         * procedure code. If not required then do not send
         */
        procedureModifiers?: Array<string>;
      }

      export namespace ProfessionalService {
        /**
         * SVC107
         */
        export interface CompositeDiagnosisCodePointers {
          /**
           * Loop: 2400, Segment: SV1, Element: SV107-01, SV107-02, SV107-03, SV107-04
           */
          diagnosisCodePointers: Array<string>;
        }
      }

      /**
       * CRC
       */
      export interface ConditionIndicatorDurableMedicalEquipment {
        /**
         * Loop 2400, Segment: CRC, Element: CRC02 and CRC01=09, Note: Allowed Values are:
         * 'N' No, 'Y' Yes
         */
        certificationConditionIndicator: 'Y' | 'N';

        /**
         * Loop 2400, Segment: CRC, Element: CRC03, Note: Allowed Values are: '38'
         * Certification signed by the physician is on file at the supplier's office, 'ZV'
         * Replacement Item
         */
        conditionIndicator: '38' | 'ZV';

        /**
         * Loop 2400, Segment: CRC, Element: CRC04, Note: Allowed Values are: '38'
         * Certification signed by the physician is on file at the supplier's office, 'ZV'
         * Replacement Item
         */
        conditionIndicatorCode?: '38' | 'ZV';
      }

      /**
       * CN1
       */
      export interface ContractInformation {
        /**
         * Segment: CN1, Element: CN101, Allowed Values are: '01' Diagnosis Related Group
         * (DRG), '02' Per Diem, '03' Variable Per Diem, '04' Flat, '05' Capitated, '06'
         * Percent, '09' Other
         */
        contractTypeCode: '01' | '02' | '03' | '04' | '05' | '06' | '09';

        /**
         * Segment: CN1, Element: CN102
         */
        contractAmount?: string;

        /**
         * Segment: CN1, Element: CN104
         */
        contractCode?: string;

        /**
         * Segment: CN1, Element: CN103
         */
        contractPercentage?: string;

        /**
         * Segment: CN1, Element: CN106
         */
        contractVersionIdentifier?: string;

        /**
         * Segment: CN1, Element: CN105
         */
        termsDiscountPercentage?: string;
      }

      /**
       * LOOP 2410
       */
      export interface DrugIdentification {
        /**
         * Loop: 2410, Segment: CTP05, Element: CTP05-01, Allowed Values are: 'F2'
         * International Unit, 'GR' Gram, 'ME' Milligram, 'ML' Milliliter, 'UN' Unit
         */
        measurementUnitCode: 'F2' | 'GR' | 'ME' | 'ML' | 'UN';

        /**
         * Loop: 2410, Segment: LIN, Element: LIN03
         */
        nationalDrugCode: string;

        /**
         * Loop: 2410, Segment: CTP, Element: CTP04
         */
        nationalDrugUnitCount: string;

        /**
         * Loop: 2410, Segment: LIN, Element: LIN02, Note: Allowed Values are: 'EN'
         * EAN/UCC - 13, 'EO' EAN/UCC - 8, 'HI' HIBC (Health Care Industry Bar Code)
         * Supplier Labeling Standard Primary Data Message, 'N4' National Drug Code in
         * 5-4-2 Format, 'ON' Customer Order Number, 'UK' GTIN 14-digit Data Structure,
         * 'UP' UCC - 12
         */
        serviceIdQualifier: 'EN' | 'EO' | 'HI' | 'N4' | 'ON' | 'UK' | 'UP';

        /**
         * Loop: 2410, Segment: REF, Element: REF02 when REF01=VY
         */
        linkSequenceNumber?: string;

        /**
         * Loop: 2410, Segment: REF, Element: REF02 when REF01=XZ
         */
        pharmacyPrescriptionNumber?: string;
      }

      /**
       * PWK
       */
      export interface DurableMedicalEquipmentCertificateOfMedicalNecessity {
        /**
         * Loop: 2400, Segment: PWK, Element: PWK02 when PWK01=CT, Note: Allowed Values
         * are: 'AB' Previously Submitted to Payer, 'AD' Certification Included in this
         * Claim, 'AF' Narrative Segment Included in this Claim, 'AG' No Documentation is
         * Required, 'NS' Not Specified
         */
        attachmentTransmissionCode: 'AB' | 'AD' | 'AF' | 'AG' | 'NS';
      }

      /**
       * CR3
       */
      export interface DurableMedicalEquipmentCertification {
        /**
         * Loop: 2400, Segment: CR3, Element: CR301, Note: Allowed Values are: 'I' Initial,
         * 'R' Renewal, 'S' Revised
         */
        certificationTypeCode: 'I' | 'R' | 'S';

        /**
         * Loop: 2400, Segment: CR3, Element: CR303 when CR302=MO
         */
        durableMedicalEquipmentDurationInMonths: string;
      }

      /**
       * SV5
       */
      export interface DurableMedicalEquipmentService {
        /**
         * Loop: 2410, Segment: SV5, Element: SV503
         */
        days: string;

        /**
         * Loop: 2410, Segment: SV5, Element: SV506, Note: Allowed Values are: '1' weekly,
         * '4' monthly, '6' daily
         */
        frequencyCode: '1' | '4' | '6';

        /**
         * Loop: 2410, Segment: SV5, Element: SV505
         */
        purchasePrice: string;

        /**
         * Loop: 2410, Segment: SV5, Element: SV504
         */
        rentalPrice: string;
      }

      /**
       * LQ and FRM
       */
      export interface FormIdentification {
        /**
         * Loop: 2440, Segment: LQ, Element: LQ02
         */
        formIdentifier: string;

        /**
         * Loop: 2440, Segment: LQ, Element: LQ01, Note: Allowed Values are:'AS' Form Type
         * Code, 'UT' Centers for Medicare and Medicaid Services (CMS) Durable Medical
         * Equipment Regional Carrier (DMERC) Certificate of Medical Necessity (CMN) Forms
         */
        formTypeCode: 'AS' | 'UT';

        /**
         * Loop: 2440, Segment: FRM
         */
        supportingDocumentation?: Array<FormIdentification.SupportingDocumentation>;
      }

      export namespace FormIdentification {
        /**
         * Loop: 2440, Segment: FRM
         */
        export interface SupportingDocumentation {
          /**
           * Loop: 2440, Segment: FRM, Element: FRM01
           */
          questionNumber: string;

          /**
           * Loop: 2440, Segment: FRM, Element: FRM03
           */
          questionResponse?: string;

          /**
           * Loop: 2440, Segment: FRM, Element: FRM04
           */
          questionResponseAsDate?: string;

          /**
           * Loop: 2440, Segment: FRM, Element: FRM05
           */
          questionResponseAsPercent?: string;

          /**
           * Loop: 2440, Segment: FRM, Element: FRM02, Notes: Allowed Values are: 'N' No, 'W'
           * Not Applicable, 'Y' Yes
           */
          questionResponseCode?: 'N' | 'W' | 'Y';
        }
      }

      /**
       * SVD, CAS, DTP and AMT
       */
      export interface LineAdjudicationInformation {
        /**
         * Loop: 2430, Segment: DTP, Element=DTP03 when DTP02=D8 and DTP01=573
         */
        adjudicationOrPaymentDate: string;

        /**
         * Loop: 2430, Segment: SVD, Element: SVD01
         */
        otherPayerPrimaryIdentifier: string;

        /**
         * Loop: 2430, Segment: SVD, Element: SVD05
         */
        paidServiceUnitCount: string;

        /**
         * Loop: 2430, Segment: SVD, Element: SVD03-02
         */
        procedureCode: string;

        /**
         * Loop: 2430, Segment: SVD, Element: SVD03-01, Note: Allowed Values are: 'ER'
         * Jurisdiction Specific Procedure and Supply Codes, 'HC' Health Care Financing
         * Administration Common Procedural Coding System (HCPCS) Codes, 'HP' Health
         * Insurance Prospective Payment System (HIPPS) Skilled Nursing Facility Rate Code,
         * 'IV' Home Infusion EDI Coalition (HIEC) Product/Service Code, 'WK' Advanced
         * Billing Concepts (ABC) Codes
         */
        serviceIdQualifier: 'ER' | 'HC' | 'HP' | 'IV' | 'WK';

        /**
         * Loop: 2430, Segment: SVD, Element: SVD02
         */
        serviceLinePaidAmount: string;

        /**
         * Loop: 2430, Segment: SVD, Element: SVD06
         */
        bundledOrUnbundledLineNumber?: string;

        /**
         * Loop: 2430, Segment: CAS
         */
        claimAdjustmentInformation?: Array<V3API.ClaimAdjustment>;

        /**
         * Loop: 2430, Segment: SVD, Element: SVD03-07
         */
        procedureCodeDescription?: string;

        procedureModifier?: Array<string>;

        /**
         * Loop: 2430, Segment: AMT, Element=AMT02 when AMT01=EAF
         */
        remainingPatientLiability?: string;
      }

      export interface OrderingProvider {
        providerType: string;

        /**
         * N3 and N4
         */
        address?: V3API.Address;

        /**
         * Loop: 2010AC, Segment: REF, Element: REF02 when REF01=FY
         */
        claimOfficeNumber?: string;

        /**
         * REF02 when REF01=G2
         */
        commercialNumber?: string;

        /**
         * PER
         */
        contactInformation?: OrderingProvider.ContactInformation;

        /**
         * REF02 when REF01=EI, Notes: The Employer Identification Number must be a string
         * of exactly nine numbers with no separators
         */
        employerId?: string;

        /**
         * LOOP: 2010AC, Segment: REF, Element: REF02 when REF01=EI
         */
        employerIdentificationNumber?: string;

        /**
         * NM104
         */
        firstName?: string;

        /**
         * NM103
         */
        lastName?: string;

        /**
         * REF02 when REF01=LU
         */
        locationNumber?: string;

        /**
         * NM105
         */
        middleName?: string;

        /**
         * Loop: 2010AC, Segment: REF, Element: REF02 when REF01=NF, Notes: National
         * Association of Insurance Commissioners (NAIC) Code
         */
        naic?: string;

        /**
         * NM109, Notes: National Provider Identifier
         */
        npi?: string;

        /**
         * NM103
         */
        organizationName?: string;

        otherIdentifier?: string;

        /**
         * LOOP: 2010AC, Segment: REF, Element: REF02 when REF01=2U
         */
        payerIdentificationNumber?: string;

        /**
         * REF02 when REF01=1G, Notes: UPINs must be formatted as either X99999 or XXX999
         */
        providerUpinNumber?: string;

        secondaryIdentifier?: Array<V3API.ReferenceIdentification>;

        /**
         * REF02 when REF01=SY, Notes: The Social Security Number must be a string of nine
         * numbers with no separators
         */
        ssn?: string;

        /**
         * REF02 when REF01=0B
         */
        stateLicenseNumber?: string;

        /**
         * NM107
         */
        suffix?: string;

        /**
         * PRV03
         */
        taxonomyCode?: string;
      }

      export namespace OrderingProvider {
        /**
         * PER
         */
        export interface ContactInformation {
          /**
           * Segment: PER, Element: PER02 and PER01=IC
           */
          name: string;

          /**
           * Segment: PER, Element: PER04 or PER06 or PER08, Note: This used in (Provider,
           * Submitter) when PER03=EM or PER05=EM or PER07=EM
           */
          email?: string;

          /**
           * Segment: PER, Element: PER04 or PER06 or PER08, Note: This is used in (Provider,
           * Submitter) when PER03=FX or PER05=FX or PER07=FX
           */
          faxNumber?: string;

          /**
           * Segment: PER, Element: PER06 or PER08, Note: PER05=EX or PER07=EX
           */
          phoneExtension?: string;

          /**
           * Segment: PER, Element: PER04 (Provider, Submitter, Subscriber, Dependent) or
           * PER06 (Provider, Submitter) or PER08 (Provider, Submitter), Note: Used when
           * PER03=TE (Provider, Submitter, Subscriber, Dependent) or PER05=TE (Provider,
           * Submitter) or PER07=TE (Provider, Submitter)
           */
          phoneNumber?: string;
        }
      }

      export interface PurchasedServiceInformation {
        /**
         * Loop: 2400, Segment: PS1, Element: PS102
         */
        purchasedServiceChargeAmount: string;

        /**
         * Loop: 2400, Segment: PS1, Element: PS101
         */
        purchasedServiceProviderIdentifier: string;
      }

      export interface ServiceLineDateInformation {
        /**
         * Loop: 2400, Segment: DPT, Element: DTP03 when DPT01=463, Notes: Date Expressed
         * in Format CCYYMMDD
         */
        beginTherapyDate?: string;

        /**
         * Loop: 2400, Segment: DPT, Element: DTP03 when DPT01=607, Notes: Date Expressed
         * in Format CCYYMMDD
         */
        certificationRevisionOrRecertificationDate?: string;

        /**
         * Loop: 2400, Segment: DPT, Element: DTP03 when DPT01=738, Notes: Date Expressed
         * in Format CCYYMMDD
         */
        hemoglobinTestDate?: string;

        /**
         * Loop: 2400, Segment: DPT, Element: DTP03 when DPT01=454, Notes: Date Expressed
         * in Format CCYYMMDD
         */
        initialTreatmentDate?: string;

        /**
         * Loop: 2400, Segment: DPT, Element: DTP03 when DPT01=461, Notes: Date Expressed
         * in Format CCYYMMDD
         */
        lastCertificationDate?: string;

        /**
         * Loop: 2400, Segment: DPT, Element: DTP03 when DPT01=455, Notes: Date Expressed
         * in Format CCYYMMDD
         */
        lastXRayDate?: string;

        /**
         * Loop: 2400, Segment: DPT, Element: DTP03 when DPT01=471, Notes: Date Expressed
         * in Format CCYYMMDD
         */
        prescriptionDate?: string;

        /**
         * Loop: 2400, Segment: DPT, Element: DTP03 when DPT01=739, Notes: Date Expressed
         * in Format CCYYMMDD
         */
        serumCreatineTestDate?: string;

        /**
         * Loop: 2400, Segment: DPT, Element: DTP03 when DPT01=011, Notes: Date Expressed
         * in Format CCYYMMDD
         */
        shippedDate?: string;

        /**
         * Loop: 2400, Segment: DPT, Element: DTP03 when DPT01=304, Notes: Date Expressed
         * in Format CCYYMMDD
         */
        treatmentOrTherapyDate?: string;
      }

      export interface ServiceLineReferenceInformation {
        /**
         * Loop: 2400, Segment: REF, Element: REF02 Note: When REF01=9D
         */
        adjustedRepricedLineItemReferenceNumber?: string;

        /**
         * Loop: 2400, Segment: REF, Element: REF02 Note: When REF01=X4
         */
        clinicalLaboratoryImprovementAmendmentNumber?: string;

        /**
         * Loop: 2400, Segment: REF, Element: REF02 Note: When REF01=BT
         */
        immunizationBatchNumber?: string;

        /**
         * Loop: 2400, Segment: REF, Element: REF02 Note: When REF01=EW
         */
        mammographyCertificationNumber?: string;

        /**
         * Loop 2400 REF
         */
        priorAuthorization?: Array<ServiceLineReferenceInformation.PriorAuthorization>;

        /**
         * Loop: 2400, Segment: REF, Element: REF Note: When REF01=9F
         */
        referralNumber?: Array<string>;

        /**
         * Loop: 2400, Segment: REF, Element: REF02 Note: When REF01=F4
         */
        referringCliaNumber?: string;

        /**
         * Loop: 2400, Segment: REF, Element: REF02 Notes: When REF01=9B
         */
        repricedLineItemReferenceNumber?: string;
      }

      export namespace ServiceLineReferenceInformation {
        /**
         * Loop 2400 REF
         */
        export interface PriorAuthorization {
          /**
           * Loop: 2400, Segment: REF, Element: REF02 when REF01=G1
           */
          priorAuthorizationOrReferralNumber: string;

          /**
           * Loop: 2400, Segment: REF, Element: REF04-2 when REF04-1=2U
           */
          otherPayerPrimaryIdentifier?: string;
        }
      }

      export interface TestResult {
        /**
         * Loop 2400, Segment: MEA; Element: MEA02, Notes: Allowable values are 'HT'
         * Height, 'R1' Hemoglobin, 'R2' Hematocrit, 'R3' Epoetin Starting Dosage, 'R4'
         * Creatinine
         */
        measurementQualifier: 'HT' | 'R1' | 'R2' | 'R3' | 'R4';

        /**
         * Loop 2400, Segment: MEA; Element: MEA01, Notes: Allowable values are 'OG'
         * Original and 'TR' Test Results
         */
        measurementReferenceIdentificationCode: 'OG' | 'TR';

        /**
         * Loop 2400, Segment: MEA; Element: MEA03
         */
        testResults: string;
      }
    }

    /**
     * Loop 2300, Segment: CN1
     */
    export interface ClaimContractInformation {
      /**
       * Loop: 2300,Segment: CN1, Element: CN101, Note: Allowed Values are: '01'
       * Diagnosis Related Group (DRG), '02' Per Diem, '03' Variable Per Diem, '04' Flat,
       * '05' Capitated, '06' Percent, '09' Other
       */
      contractTypeCode: '01' | '02' | '03' | '04' | '05' | '06' | '09';

      /**
       * Loop: 2300, Segment: CN1, Element: CN102
       */
      contractAmount?: string;

      /**
       * Loop: 2300, Segment: CN1, Element: CN104
       */
      contractCode?: string;

      /**
       * Loop: 2300, Segment: CN1, Element: CN103
       */
      contractPercentage?: string;

      /**
       * Loop: 2300, Segment: CN1, Element: CN106
       */
      contractVersionIdentifier?: string;

      /**
       * Loop: 2300, Segment: CN1, Element: CN105
       */
      termsDiscountPercentage?: string;
    }

    /**
     * DTP
     */
    export interface ClaimDateInformation {
      /**
       * Loop: 2300, Segment: DTP, Element: DTP03
       */
      accidentDate?: string;

      /**
       * Loop: 2300, Segment: DTP, Element: DTP03
       */
      acuteManifestationDate?: string;

      /**
       * Loop: 2300, Segment: DTP, Element: DTP03
       */
      admissionDate?: string;

      /**
       * Loop: 2300, Segment: DTP, Element: DTP03
       */
      assumedAndRelinquishedCareBeginDate?: string;

      /**
       * Loop: 2300, Segment: DTP, Element: DTP03
       */
      assumedAndRelinquishedCareEndDate?: string;

      /**
       * Loop: 2300, Segment: DTP, Element: DTP03
       */
      authorizedReturnToWorkDate?: string;

      /**
       * Loop: 2300, Segment: DTP, Element: DTP03
       */
      disabilityBeginDate?: string;

      /**
       * Loop: 2300, Segment: DTP, Element: DTP03
       */
      disabilityEndDate?: string;

      /**
       * Loop: 2300, Segment: DTP, Element: DTP03
       */
      dischargeDate?: string;

      /**
       * Loop: 2300, Segment: DTP, Element: DTP03
       */
      firstContactDate?: string;

      /**
       * Loop: 2300, Segment: DTP, Element: DTP03
       */
      hearingAndVisionPrescriptionDate?: string;

      /**
       * Loop: 2300, Segment: DTP, Element: DTP03
       */
      initialTreatmentDate?: string;

      /**
       * Loop: 2300, Segment: DTP, Element: DTP03
       */
      lastMenstrualPeriodDate?: string;

      /**
       * Loop: 2300, Segment: DTP, Element: DTP03
       */
      lastSeenDate?: string;

      /**
       * Loop: 2300, Segment: DTP, Element: DTP03
       */
      lastWorkedDate?: string;

      /**
       * Loop: 2300, Segment: DTP, Element: DTP03
       */
      lastXRayDate?: string;

      /**
       * Loop: 2300, Segment: DTP, Element: DTP03
       */
      repricerReceivedDate?: string;

      /**
       * Loop: 2300, Segment: DTP, Element: DTP03
       */
      symptomDate?: string;
    }

    /**
     * NTE
     */
    export interface ClaimNote {
      /**
       * Loop 2300, Segment: NTE, Element: NTE02, Note: NTE01=ADD
       */
      additionalInformation?: string;

      /**
       * Loop 2300, Segment: NTE, Element: NTE02, Note: NTE01=CER
       */
      certificationNarrative?: string;

      /**
       * Loop 2300, Segment: NTE, Element: NTE02, Note: NTE01=DGN
       */
      diagnosisDescription?: string;

      /**
       * Loop 2300, Segment: NTE, Element: NTE02, Note: NTE01=DCP
       */
      goalRehabOrDischargePlans?: string;

      /**
       * Loop 2300, Segment: NTE, Element: NTE02, Note: NTE01=TPO
       */
      thirdPartOrgNotes?: string;
    }

    /**
     * PWK and REF
     */
    export interface ClaimSupplementalInformation {
      /**
       * Loop: 2300, Segment: REF, Element: REF02 and REF01=9C
       */
      adjustedRepricedClaimNumber?: string;

      /**
       * Loop: 2300, Segment: REF, Element: REF02 and REF01=1J
       */
      carePlanOversightNumber?: string;

      /**
       * Loop: 2300, Segment: REF, Element: REF02 and REF01=F8
       */
      claimControlNumber?: string;

      /**
       * Loop: 2300, Segment: REF, Element: REF02 and REF01=D9
       */
      claimNumber?: string;

      /**
       * Loop: 2300, Segment: REF, Element: REF02 and REF01=X4
       */
      cliaNumber?: string;

      /**
       * Loop: 2300, Segment: REF, Element: REF02 and REF01=P4
       */
      demoProjectIdentifier?: string;

      /**
       * Loop: 2300, Segment: REF, Element: REF02 and REF01=LX
       */
      investigationalDeviceExemptionNumber?: string;

      /**
       * Loop: 2300, Segment: REF, Element: REF02 and REF01=EW
       */
      mammographyCertificationNumber?: string;

      /**
       * Loop: 2300, Segment: REF, Element: REF02 and REF01=EA
       */
      medicalRecordNumber?: string;

      /**
       * Loop: 2300, Segment: REF, Element: REF02 and REF01=F5
       */
      medicareCrossoverReferenceId?: string;

      /**
       * Loop: 2300, Segment: REF, Element: REF02 and REF01=G1
       */
      priorAuthorizationNumber?: string;

      /**
       * Loop: 2300, Segment: REF, Element: REF02 and REF01=9F
       */
      referralNumber?: string;

      reportInformation?: V3API.ReportInformation;

      /**
       * Loop: 2300, Segment: REF, Element: REF02 and REF01=9A
       */
      repricedClaimNumber?: string;

      /**
       * Loop: 2300, Segment: REF, Element: REF02 and REF01=4N, Note: '1'
       * Immediate/Urgent Care, '2' Services Rendered in a Retroactive Period, '3'
       * Emergency Care, '4' Client has Temporary Medicaid, '5' Request from County for
       * Second Opinion to Determine if Recipient Can Work, '6' Request for Override
       * Pending, '7' Special Handling, Null
       */
      serviceAuthorizationExceptionCode?: '1' | '2' | '3' | '4' | '5' | '6' | '7';
    }

    /**
     * HI
     */
    export interface ConditionInformation {
      conditionCodes: Array<string>;
    }

    /**
     * CRC
     */
    export interface EpsdtReferral {
      /**
       * Loop: 2300, Segment: CRC, Element: CRC02 When CRC01=ZZ, Note: 'N' No, 'Y' Yes
       */
      certificationConditionCodeAppliesIndicator: 'N' | 'Y';

      /**
       * Loop: 2300, Segment: CRC, Elements: CRC03, CRC04, CRC05 Note: Allowed Values
       * are: 'AV' Available- Not Used, 'NU' Not Used, 'S2' Under Treatment, 'ST' New
       * Services Requested
       */
      conditionCodes: Array<'AV' | 'NU' | 'S2' | 'ST'>;
    }

    /**
     * Loop 2320
     */
    export interface OtherSubscriberInformation {
      /**
       * Loop: 2320, Segment: OI, Element: OI03, Notes: Allowable values are: 'N' No, 'W'
       * Not Applicable, 'Y' Yes
       */
      benefitsAssignmentCertificationIndicator: 'N' | 'W' | 'Y';

      /**
       * Loop: 2320, Segment: SBR, Element: SBR09, Notes: Allowed Values are: '11' Other
       * Non-Federal Programs, '12' Preferred Provider Organization (PPO), '13' Point of
       * Service (POS), '14' Exclusive Provider Organization (EPO), '15' Indemnity
       * Insurance, '16' Health Maintenance Organization (HMO) Medicare Risk, '17' Dental
       * Maintenance Organization, 'AM' Automobile Medical, 'BL' Blue Cross/Blue Shield,
       * 'CH' Champus, 'CI' Commercial Insurance Co., 'DS' Disability, 'FI' Federal
       * Employees Program, 'HM' Health Maintenance Organization, 'LM' Liability Medical,
       * 'MA' Medicare Part A, 'MB' Medicare Part B,'MC' Medicare Part C, 'OF' Other
       * Federal Program, 'TV' Title V, 'VA' Veterans Affairs Plan, 'WC' Worker's
       * Compensation Health Claim, 'ZZ' Mutually Defined
       */
      claimFilingIndicatorCode:
        | '11'
        | '12'
        | '13'
        | '14'
        | '15'
        | '16'
        | '17'
        | 'AM'
        | 'BL'
        | 'CH'
        | 'CI'
        | 'DS'
        | 'FI'
        | 'HM'
        | 'LM'
        | 'MA'
        | 'MB'
        | 'MC'
        | 'OF'
        | 'TV'
        | 'VA'
        | 'WC'
        | 'ZZ';

      /**
       * Loop: 2320, Segment: SBR, Element: SBR02, Notes: Required when patient is the
       * subscriber, Notes: Allowed Values are: '01' Spouse, '18' Self, '19' Child, '20'
       * Employee, '21' Unknown, '39' Organ Donor, '40' Cadaver Donor, '53' Life Partner,
       * 'G8' Other Relationship
       */
      individualRelationshipCode: '01' | '18' | '19' | '20' | '21' | '39' | '40' | '53' | 'G8';

      /**
       * Loop: 2330B
       */
      otherPayerName: OtherSubscriberInformation.OtherPayerName;

      /**
       * Loop: 2330A
       */
      otherSubscriberName: OtherSubscriberInformation.OtherSubscriberName;

      /**
       * Loop: 2320, Segment: SBR, Element: SBR01, Notes: Allowable values are 'A' Payer
       * Responsibility Four, 'B' Payer Responsibility Five, 'C' Payer Responsibility
       * Six, 'D' Payer Responsibility Seven, 'E' Payer Responsibility Eight, 'F' Payer
       * Responsibility Nine, 'G' Payer Responsibility Ten, 'H' Payer Responsibility
       * Eleven, 'P' Primary, 'S' Secondary, 'T' Tertiary, and 'U' Unknown
       */
      paymentResponsibilityLevelCode: 'A' | 'B' | 'C' | 'D' | 'E' | 'F' | 'G' | 'H' | 'P' | 'S' | 'T' | 'U';

      /**
       * Loop: 2320, Segment: OI, Element: OI04, Notes: Allowable values are 'I' Informed
       * Consent to Release Medical Information, 'Y' Yes
       */
      releaseOfInformationCode: 'I' | 'Y';

      /**
       * Loop: 2320, Segment: CAS
       */
      claimLevelAdjustments?: Array<V3API.ClaimAdjustment>;

      /**
       * Loop: 2320, Segment: SBR, Element: SBR03
       */
      insuranceGroupOrPolicyNumber?: string;

      /**
       * Loop: 2320, Segment: SBR, Element: SBR05, Notes: Allowable Values are: '12'
       * Medicare Secondary Working Aged Beneficiary or Spouse with Employer Group Health
       * Plan, '13' Medicare Secondary End-Stage Renal Disease Beneficiary in the
       * Mandated Coordination Period, '14' Medicare Secondary, No-fault Insurance
       * including Auto is Primary, '15' Medicare Secondary Worker's Compensation, '16'
       * Medicare Secondary Public Health Service (PHS)or Other Federal Agency, '41'
       * Medicare Secondary Black Lung, '42' Medicare Secondary Veteran's Administration,
       * '43' Medicare Secondary Disabled Beneficiary Under Age 65 with Large Group
       * Health Plan (LGHP), '47' Medicare Secondary, Other Liability Insurance is
       * Primary
       */
      insuranceTypeCode?: '12' | '13' | '14' | '15' | '16' | '41' | '42' | '43' | '47';

      /**
       * Loop: 2320, Segment: MOA
       */
      medicareOutpatientAdjudication?: OtherSubscriberInformation.MedicareOutpatientAdjudication;

      /**
       * Loop: 2320, Segment: AMT, Element: AMT02 when AMT01=A8
       */
      nonCoveredChargeAmount?: string;

      /**
       * Loop: 2000B, Segment: SBR, Element: SBR04
       */
      otherInsuredGroupName?: string;

      otherPayerBillingProvider?: Array<OtherSubscriberInformation.OtherPayerBillingProvider>;

      otherPayerReferringProvider?: Array<OtherSubscriberInformation.OtherPayerReferringProvider>;

      otherPayerRenderingProvider?: Array<OtherSubscriberInformation.OtherPayerRenderingProvider>;

      otherPayerServiceFacilityLocation?: Array<OtherSubscriberInformation.OtherPayerServiceFacilityLocation>;

      otherPayerSupervisingProvider?: Array<OtherSubscriberInformation.OtherPayerSupervisingProvider>;

      /**
       * Loop: 2320, Segment: OI, Element: OI04, Notes: Allowable value is 'P' Signature
       * generated by provider because the patient was not physically present for
       * services
       */
      patientSignatureGeneratedForPatient?: boolean;

      /**
       * Loop: 2320, Segment: AMT, Element: AMT02 when AMT01=D, Notes: It is acceptable
       * to show '0' (Zero)
       */
      payerPaidAmount?: string;

      /**
       * Loop: 2320, Segment: AMT, Element: AMT02 when AMT01=EAF
       */
      remainingPatientLiability?: string;
    }

    export namespace OtherSubscriberInformation {
      /**
       * Loop: 2330B
       */
      export interface OtherPayerName {
        /**
         * Loop: 2330B; Segment: NM1, Element: NM109
         */
        otherPayerIdentifier: string;

        /**
         * Loop: 2330B; Segment: NM1, Element: NM108, Notes: Allowable values: 'PI' Payor
         * Identification and 'XV' Centers for Medicare/Medicaid Services PlanID
         */
        otherPayerIdentifierTypeCode: 'PI' | 'XV';

        /**
         * Loop: 2330B; Segment: NM1, Element: NM103
         */
        otherPayerOrganizationName: string;

        /**
         * Loop: 2330B; Segment: NM1, Element: NM111
         */
        otherInsuredAdditionalIdentifier?: string;

        /**
         * N3 and N4
         */
        otherPayerAddress?: V3API.Address;

        /**
         * Loop: 2330B, Segment: DTP, Element: DTP03
         */
        otherPayerAdjudicationOrPaymentDate?: string;

        /**
         * Loop: 2330B, Segment: REF, Element: REF02 when REF01=T4
         */
        otherPayerClaimAdjustmentIndicator?: boolean;

        /**
         * Loop: 2330B, Segment: REF, Element: REF02 when REF01=F8
         */
        otherPayerClaimControlNumber?: string;

        /**
         * Loop: 2330B, Segment: REF, Element: REF02 when REF01=G1
         */
        otherPayerPriorAuthorizationNumber?: string;

        /**
         * Loop: 2330B; Segment: REF, Element: REF02 when REF01=9F
         */
        otherPayerPriorAuthorizationOrReferralNumber?: string;

        /**
         * Loop: 2330B, Segment: REF
         */
        otherPayerSecondaryIdentifier?: Array<V3API.ReferenceIdentification>;
      }

      /**
       * Loop: 2330A
       */
      export interface OtherSubscriberName {
        /**
         * Loop: 2330A, Segment: NM1, Element: NM109
         */
        otherInsuredIdentifier: string;

        /**
         * Loop: 2330A, Segment: NM1, Element: NM108, Notes: Allowable values are: 'II'
         * Standard Unique HealthIdentifier for each individual in the United States and
         * 'MI' member identification number
         */
        otherInsuredIdentifierTypeCode: 'II' | 'MI';

        /**
         * Loop: 2330A, Segment: NM1, Element: NM103
         */
        otherInsuredLastName: string;

        /**
         * Loop: 2330A, Segment: NM1, Element: NM102, Notes: Allowed Values are: '1'
         * Person, '2' Non-Person Entity
         */
        otherInsuredQualifier: '1' | '2';

        /**
         * Loop: 2330A, Segment: REF, Element: REF02 when REF01=SY
         */
        otherInsuredAdditionalIdentifier?: string;

        /**
         * N3 and N4
         */
        otherInsuredAddress?: V3API.Address;

        /**
         * Loop: 2330A, Segment: NM1, Element: NM102, Notes: Required when NM102 = 1
         * (Person)
         */
        otherInsuredFirstName?: string;

        /**
         * Loop: 2330A, Segment: NM1, Element: NM105, Notes: Required when NM102 = 1
         * (Person)
         */
        otherInsuredMiddleName?: string;

        /**
         * Loop: 2330A, Segment: NM1, Element: NM107, Notes: Required when NM102 = 1
         * (Person)
         */
        otherInsuredNameSuffix?: string;
      }

      /**
       * Loop: 2320, Segment: MOA
       */
      export interface MedicareOutpatientAdjudication {
        /**
         * Loop: 2320: Segment: MOA, Element: MOA03 to MOA07
         */
        claimPaymentRemarkCode?: Array<string>;

        /**
         * Loop 2320, Segment: MOA; Element: MOA08
         */
        endStageRenalDiseasePaymentAmount?: string;

        /**
         * Loop 2320, Segment: MOA; Element: MOA02
         */
        hcpcsPayableAmount?: string;

        /**
         * Loop 2320, Segment: MOA; Element: MOA09
         */
        nonPayableProfessionalComponentBilledAmount?: string;

        /**
         * Loop 2320, Segment: MOA; Element: MOA01
         */
        reimbursementRate?: string;
      }

      /**
       * Loop 2330G
       */
      export interface OtherPayerBillingProvider {
        /**
         * Loop 2330G, Segment: NM1; Element: NM101, Notes: Code identifying an
         * organizational entity, a physical location, property or an individual.
         * Allowablevalues: '1' Person, '2' Non-Person Entity
         */
        entityTypeQualifier: '1' | '2';

        /**
         * Loop 2330G, Segment: NM1 and REF
         */
        otherPayerBillingProviderIdentifier: Array<V3API.ReferenceIdentification>;
      }

      /**
       * Loop 2330C
       */
      export interface OtherPayerReferringProvider {
        /**
         * Loop 2330E, Segment: NM1 and REF
         */
        otherPayerReferringProviderIdentifier: Array<V3API.ReferenceIdentification>;
      }

      /**
       * Loop 2330D
       */
      export interface OtherPayerRenderingProvider {
        /**
         * Loop: 2330D, Segment NM1, Element: NM102, Notes: Allowable values are '1' Person
         * and '2' Non-Person Entity
         */
        entityTypeQualifier: '1' | '2';

        /**
         * Loop 2330D, Segment: NM1 and REF
         */
        otherPayerRenderingProviderSecondaryIdentifier?: Array<V3API.ReferenceIdentification>;
      }

      /**
       * Loop 2330E
       */
      export interface OtherPayerServiceFacilityLocation {
        /**
         * Loop 2330E, Segments: NM1 and REF
         */
        otherPayerServiceFacilityLocationSecondaryIdentifier: Array<V3API.ReferenceIdentification>;
      }

      /**
       * Loop 2330F
       */
      export interface OtherPayerSupervisingProvider {
        /**
         * Loop 2330F, Segments: NM1 and REF
         */
        otherPayerSupervisingProviderIdentifier: Array<V3API.ReferenceIdentification>;
      }
    }

    /**
     * Loop 2300, Segment: CRC
     */
    export interface PatientConditionInformationVision {
      /**
       * Loop: 2300, Segment: CRC, Element: CRC02, Notes: Allowed Values are: 'N' No, 'Y'
       * Yes
       */
      certificationConditionIndicator: 'N' | 'Y';

      /**
       * Loop: 2300, Segment: CRC, Element: CRC01, Notes: Allowed Values are: 'E1'
       * Spectacle Lenses, 'E2' Contact Lenses, 'E3' Spectacle Frames
       */
      codeCategory: 'E1' | 'E2' | 'E3';

      /**
       * Loop: 2300, Segment: CRC, Element: CRC03 to CRC07, Notes: CRC03 is required,
       * others are situational. Allowed Values are: 'L1' General Standard of 20 Degree
       * or .5 Diopter Sphere or Cylinder Change Met, 'L2' Replacement Due to Loss or
       * Theft, 'L3' Replacement Due to Breakage or Damage, L4' Replacement Due to
       * Patient Preference, 'L5' Replacement Due to Medical Reason
       */
      conditionCodes: Array<'L1' | 'L2' | 'L3' | 'L4' | 'L5'>;
    }

    /**
     * Loop 2300, Segment: CR2
     */
    export interface SpinalManipulationServiceInformation {
      /**
       * Loop: 2300, Segment: CR, Element: CR208
       */
      patientConditionCode: string;

      /**
       * Loop: 2300, Segment: CR, Element: CR210 Note: Allowed Values are: 'A' Acute
       * Condition, 'C' Chronic Condition, 'D' Chronic Condition, 'E' Non-Life
       * Threatening, 'F' Routine, 'G' Symptomatic, 'M' Acute Manifestation of a Chronic
       * Condition
       */
      patientConditionDescription1?: 'A' | 'C' | 'D' | 'E' | 'F' | 'G' | 'M';

      /**
       * Loop: 2300, Segment: CR, Element: CR211
       */
      patientConditionDescription2?: string;
    }
  }

  /**
   * Loop: 1000B
   */
  export interface Receiver {
    /**
     * Loop: 1000B, Segment: NM1, Element: NM103
     */
    organizationName: string;
  }

  /**
   * Loop: 1000A
   */
  export interface Submitter {
    /**
     * PER
     */
    contactInformation: V3API.ContactInformation;

    /**
     * Loop: 1000A, Segment: NM1, Element: NM104
     */
    firstName?: string;

    /**
     * Loop: 1000A, Segment: NM1, Element: NM103
     */
    lastName?: string;

    /**
     * Loop: 1000A, Segment: NM1, Element: NM105
     */
    middleName?: string;

    /**
     * Loop: 1000A, Segment: NM1, Element: NM103
     */
    organizationName?: string;
  }

  /**
   * Loop: 2000B
   */
  export interface Subscriber {
    /**
     * Loop: 2000B, Segment: SBR, Element: SBR01, Allowed Values:'A' Payer
     * Responsibility Four 'B' Payer Responsibility Five 'C' Payer Responsibility Six
     * 'D' Payer Responsibility Seven 'E' Payer Responsibility Eight 'F' Payer
     * Responsibility Nine 'G' Payer Responsibility Ten 'H' Payer Responsibility Eleven
     * 'P' Primary 'S' Secondary 'T' Tertiary 'U' Unknown
     */
    paymentResponsibilityLevelCode: 'A' | 'B' | 'C' | 'D' | 'E' | 'F' | 'G' | 'H' | 'P' | 'S' | 'T' | 'U';

    /**
     * N3 and N4
     */
    address?: V3API.Address;

    /**
     * PER
     */
    contactInformation?: V3API.ContactInformation;

    /**
     * Loop: 2010BA, Segment: DMG, Element: DMG02
     */
    dateOfBirth?: string;

    /**
     * Loop: 2010BA, Segment: NM1, Element: NM104
     */
    firstName?: string;

    /**
     * Loop: 2010BA, Segment: DMG, Element: DMG03 Subscriber Gender, Notes: 'M' Male,
     * 'F' Female'U' Unknown
     */
    gender?: 'M' | 'F' | 'U';

    /**
     * Loop: 2010BA, Segment: SBR, Element: SBR04
     */
    groupNumber?: string;

    /**
     * Loop: 2000B, Segment: SBR, Element:SBR05 Notes: Allowed values: '12' Medicare
     * Secondary Working Aged Beneficiary or Spouse with Employer Group Health Plan,
     * '13' Medicare Secondary End-Stage Renal Disease Beneficiary in the Mandated
     * Coordination Period with an Employer's Group Health Plan, '14' Medicare
     * Secondary, No-fault Insurance including Auto is Primary, '15' Medicare Secondary
     * Worker's Compensation, '16' Medicare Secondary Public Health Service (PHS)or
     * Other Federal Agency, '41' Medicare Secondary Black Lung, '42' Medicare
     * Secondary Veteran's Administration, '43' Medicare Secondary Disabled Beneficiary
     * Under Age 65 with Large Group Health Plan (LGHP), '47' Medicare Secondary, Other
     * Liability Insurance is Primary
     */
    insuranceTypeCode?: '12' | '13' | '14' | '15' | '16' | '41' | '42' | '43' | '47';

    /**
     * Loop: 2010BA, Segment: NM1, Element: NM103
     */
    lastName?: string;

    /**
     * Loop: 2010BA, Segment: NM1, Element: NM109
     */
    memberId?: string;

    /**
     * Loop: 2010BA, Segment: NM, Element: NM105
     */
    middleName?: string;

    /**
     * Loop: 2010BA, Segment: NM1, Element: NM103 when NM102=2, Notes: when subscriber
     * is organization pass patient as dependent
     */
    organizationName?: string;

    /**
     * Loop: 2000B, Segment: SBR, Element: SBR03
     */
    policyNumber?: string;

    /**
     * Loop: 2010BA, Segment: REF, Element: REF02 when REF01=SY
     */
    ssn?: string;

    /**
     * Loop: 2000B, Segment: SBR, Element: SBR04 Notes: Freeform text
     */
    subscriberGroupName?: string;

    /**
     * Loop: 2010BA, Segment: NM, Element: NM107
     */
    suffix?: string;
  }

  /**
   * LOOP 2000C
   */
  export interface Dependent {
    /**
     * Loop: 2010CA, Segment: DMG, Element: DMG02 when DMG01=D8
     */
    dateOfBirth: string;

    /**
     * Loop: 2010CA, Segment: NM1, Element: NM104
     */
    firstName: string;

    /**
     * Loop: 2010CA, Segment: DMG, Element: DMG03, Note: Allowed Values are: 'M' Male,
     * 'F' Female, 'U' Unknown
     */
    gender: 'M' | 'F' | 'U';

    /**
     * Loop: 2010CA, Segment: NM1, Element: NM103
     */
    lastName: string;

    /**
     * Loop: 2000C, Segment: PAT, Element: PAT01, Note: Allowed Values are: '01'
     * Spouse, '19' Child, '20' Employee, '21' Unknown, '39' Organ Donor, '40' Cadaver
     * Donor, '53' Life Partner, 'G8' Other Relationship
     */
    relationshipToSubscriberCode: '01' | '19' | '20' | '39' | '40' | '53' | 'G8';

    /**
     * N3 and N4
     */
    address?: V3API.Address;

    /**
     * PER
     */
    contactInformation?: V3API.ContactInformation;

    /**
     * Loop: 2010CA, Segment: REF, Element: REF02 when REF01=1W
     */
    memberId?: string;

    /**
     * Loop: 2010CA, Segment: NM1, Element: NM105
     */
    middleName?: string;

    /**
     * Loop: 2010CA, Segment: REF, Element: REF02 when REF01=SY
     */
    ssn?: string;

    /**
     * Loop: 2010CA, Segment: NM, Element: NM107
     */
    suffix?: string;
  }

  /**
   * @deprecated Loop: 2420E, Setting ProviderType equal to OrderingProvider is
   * deprecated, please use ClaimInformation.serviceLines.orderingProvider
   */
  export interface Ordering {
    providerType: string;

    /**
     * N3 and N4
     */
    address?: V3API.Address;

    /**
     * Loop: 2010AC, Segment: REF, Element: REF02 when REF01=FY
     */
    claimOfficeNumber?: string;

    /**
     * REF02 when REF01=G2
     */
    commercialNumber?: string;

    /**
     * PER
     */
    contactInformation?: V3API.ContactInformation;

    /**
     * REF02 when REF01=EI, Notes: The Employer Identification Number must be a string
     * of exactly nine numbers with no separators
     */
    employerId?: string;

    /**
     * LOOP: 2010AC, Segment: REF, Element: REF02 when REF01=EI
     */
    employerIdentificationNumber?: string;

    /**
     * NM104
     */
    firstName?: string;

    /**
     * NM103
     */
    lastName?: string;

    /**
     * REF02 when REF01=LU
     */
    locationNumber?: string;

    /**
     * NM105
     */
    middleName?: string;

    /**
     * Loop: 2010AC, Segment: REF, Element: REF02 when REF01=NF, Notes: National
     * Association of Insurance Commissioners (NAIC) Code
     */
    naic?: string;

    /**
     * NM109, Notes: National Provider Identifier
     */
    npi?: string;

    /**
     * NM103
     */
    organizationName?: string;

    /**
     * LOOP: 2010AC, Segment: REF, Element: REF02 when REF01=2U
     */
    payerIdentificationNumber?: string;

    /**
     * REF02 when REF01=1G, Notes: UPINs must be formatted as either X99999 or XXX999
     */
    providerUpinNumber?: string;

    /**
     * REF02 when REF01=SY, Notes: The Social Security Number must be a string of nine
     * numbers with no separators
     */
    ssn?: string;

    /**
     * REF02 when REF01=0B
     */
    stateLicenseNumber?: string;

    /**
     * NM107
     */
    suffix?: string;

    /**
     * PRV03
     */
    taxonomyCode?: string;
  }

  /**
   * 2010AC
   */
  export interface PayToPlan {
    /**
     * N3 and N4
     */
    address: V3API.Address;

    /**
     * Loop: 2010AC, Segment: NM1, Element: NM103
     */
    organizationName: string;

    /**
     * Loop: 2010AC, Segment: NM1, Element: NM109
     */
    primaryIdentifier: string;

    /**
     * Loop: 2010AC, Segment: NM1, Element: NM108, Notes: 'PI' Payor Identification and
     * 'XV' Centers for Medicare/Medicaid Services PlanID
     */
    primaryIdentifierTypeCode: 'PI' | 'XV';

    /**
     * Loop: 2010AC, Segment: REF, Element: REF02 when REF01=EI
     */
    taxIdentificationNumber: string;

    /**
     * Loop: 2010AC, Segment: REF, Element: REF02
     */
    secondaryIdentifier?: string;

    /**
     * Loop: 2010AC, Segment: REF, Element: REF01, Notes: '2U Payer Identification
     * Number, 'FY' Claim Office Number, 'NF National Association of Insurance
     * Commissioners'
     */
    secondaryIdentifierTypeCode?: '2U' | 'FY' | 'NF';
  }

  /**
   * Loop: 2420F
   */
  export interface Referring {
    providerType: string;

    /**
     * N3 and N4
     */
    address?: V3API.Address;

    /**
     * Loop: 2010AC, Segment: REF, Element: REF02 when REF01=FY
     */
    claimOfficeNumber?: string;

    /**
     * REF02 when REF01=G2
     */
    commercialNumber?: string;

    /**
     * PER
     */
    contactInformation?: V3API.ContactInformation;

    /**
     * REF02 when REF01=EI, Notes: The Employer Identification Number must be a string
     * of exactly nine numbers with no separators
     */
    employerId?: string;

    /**
     * LOOP: 2010AC, Segment: REF, Element: REF02 when REF01=EI
     */
    employerIdentificationNumber?: string;

    /**
     * NM104
     */
    firstName?: string;

    /**
     * NM103
     */
    lastName?: string;

    /**
     * REF02 when REF01=LU
     */
    locationNumber?: string;

    /**
     * NM105
     */
    middleName?: string;

    /**
     * Loop: 2010AC, Segment: REF, Element: REF02 when REF01=NF, Notes: National
     * Association of Insurance Commissioners (NAIC) Code
     */
    naic?: string;

    /**
     * NM109, Notes: National Provider Identifier
     */
    npi?: string;

    /**
     * NM103
     */
    organizationName?: string;

    /**
     * LOOP: 2010AC, Segment: REF, Element: REF02 when REF01=2U
     */
    payerIdentificationNumber?: string;

    /**
     * REF02 when REF01=1G, Notes: UPINs must be formatted as either X99999 or XXX999
     */
    providerUpinNumber?: string;

    /**
     * REF02 when REF01=SY, Notes: The Social Security Number must be a string of nine
     * numbers with no separators
     */
    ssn?: string;

    /**
     * REF02 when REF01=0B
     */
    stateLicenseNumber?: string;

    /**
     * NM107
     */
    suffix?: string;

    /**
     * PRV03
     */
    taxonomyCode?: string;
  }

  /**
   * Loop: 2420A
   */
  export interface Rendering {
    providerType: string;

    /**
     * N3 and N4
     */
    address?: V3API.Address;

    /**
     * Loop: 2010AC, Segment: REF, Element: REF02 when REF01=FY
     */
    claimOfficeNumber?: string;

    /**
     * REF02 when REF01=G2
     */
    commercialNumber?: string;

    /**
     * PER
     */
    contactInformation?: V3API.ContactInformation;

    /**
     * REF02 when REF01=EI, Notes: The Employer Identification Number must be a string
     * of exactly nine numbers with no separators
     */
    employerId?: string;

    /**
     * LOOP: 2010AC, Segment: REF, Element: REF02 when REF01=EI
     */
    employerIdentificationNumber?: string;

    /**
     * NM104
     */
    firstName?: string;

    /**
     * NM103
     */
    lastName?: string;

    /**
     * REF02 when REF01=LU
     */
    locationNumber?: string;

    /**
     * NM105
     */
    middleName?: string;

    /**
     * Loop: 2010AC, Segment: REF, Element: REF02 when REF01=NF, Notes: National
     * Association of Insurance Commissioners (NAIC) Code
     */
    naic?: string;

    /**
     * NM109, Notes: National Provider Identifier
     */
    npi?: string;

    /**
     * NM103
     */
    organizationName?: string;

    /**
     * LOOP: 2010AC, Segment: REF, Element: REF02 when REF01=2U
     */
    payerIdentificationNumber?: string;

    /**
     * REF02 when REF01=1G, Notes: UPINs must be formatted as either X99999 or XXX999
     */
    providerUpinNumber?: string;

    /**
     * REF02 when REF01=SY, Notes: The Social Security Number must be a string of nine
     * numbers with no separators
     */
    ssn?: string;

    /**
     * REF02 when REF01=0B
     */
    stateLicenseNumber?: string;

    /**
     * NM107
     */
    suffix?: string;

    /**
     * PRV03
     */
    taxonomyCode?: string;
  }
}

export interface V3SubmitRawX12ClaimParams {
  /**
   * Body param: For the x12 endpoint, the value should be a full 837 edi request.
   */
  x12?: string;

  /**
   * Header param:
   */
  'X-CHC-ClaimSubmission-BillerId'?: string;

  /**
   * Header param:
   */
  'X-CHC-ClaimSubmission-Pwd'?: string;

  /**
   * Header param:
   */
  'X-CHC-ClaimSubmission-SubmitterId'?: string;

  /**
   * Header param:
   */
  'X-CHC-ClaimSubmission-Username'?: string;

  /**
   * Header param:
   */
  'X-CHC-TraceId'?: string;

  /**
   * Header param:
   */
  'x-chng-trace-id'?: string;
}

export interface V3ValidateClaimParams {
  /**
   * Body param: Loop: 2000A
   */
  billing: V3ValidateClaimParams.Billing;

  /**
   * Body param: Loop2300
   */
  claimInformation: V3ValidateClaimParams.ClaimInformation;

  /**
   * Body param: Header, Segment: ST02 (no loop), Notes: Transaction Set Control
   * Number
   */
  controlNumber: string;

  /**
   * Body param: Loop: 1000B
   */
  receiver: V3ValidateClaimParams.Receiver;

  /**
   * Body param: Loop: 1000A
   */
  submitter: V3ValidateClaimParams.Submitter;

  /**
   * Body param: Loop: 2000B
   */
  subscriber: V3ValidateClaimParams.Subscriber;

  /**
   * Body param: LOOP 2000C
   */
  dependent?: V3ValidateClaimParams.Dependent;

  /**
   * @deprecated Body param: Loop: 2420E, Setting ProviderType equal to
   * OrderingProvider is deprecated, please use
   * ClaimInformation.serviceLines.orderingProvider
   */
  ordering?: V3ValidateClaimParams.Ordering;

  /**
   * Body param: N3 and N4
   */
  payerAddress?: Address;

  /**
   * Body param: N3 and N4
   */
  payToAddress?: Address;

  /**
   * Body param: 2010AC
   */
  payToPlan?: V3ValidateClaimParams.PayToPlan;

  /**
   * @deprecated Body param: setting providers deprecated, please set all providers
   * individually by it's type.
   */
  providers?: Array<Supervising>;

  /**
   * Body param: Loop: 2420F
   */
  referring?: V3ValidateClaimParams.Referring;

  /**
   * Body param: Loop: 2420A
   */
  rendering?: V3ValidateClaimParams.Rendering;

  /**
   * Body param: Loop: 2420D
   */
  supervising?: Supervising;

  /**
   * Body param: Loop 2010BB NM103
   */
  tradingPartnerName?: string;

  /**
   * Body param: Loop: 2010BB Segment: NM1, Element: NM109, Notes: we send this as
   * MN108 as PI = Payer Identification
   */
  tradingPartnerServiceId?: string;

  /**
   * Body param: Interchange Usage Indicator ISA15; T-Test Data, P-Production Data
   */
  usageIndicator?: string;

  /**
   * Header param:
   */
  'x-chng-trace-id'?: string;
}

export namespace V3ValidateClaimParams {
  /**
   * Loop: 2000A
   */
  export interface Billing {
    providerType: string;

    /**
     * N3 and N4
     */
    address?: V3API.Address;

    /**
     * Loop: 2010AC, Segment: REF, Element: REF02 when REF01=FY
     */
    claimOfficeNumber?: string;

    /**
     * REF02 when REF01=G2
     */
    commercialNumber?: string;

    /**
     * PER
     */
    contactInformation?: V3API.ContactInformation;

    /**
     * REF02 when REF01=EI, Notes: The Employer Identification Number must be a string
     * of exactly nine numbers with no separators
     */
    employerId?: string;

    /**
     * LOOP: 2010AC, Segment: REF, Element: REF02 when REF01=EI
     */
    employerIdentificationNumber?: string;

    /**
     * NM104
     */
    firstName?: string;

    /**
     * NM103
     */
    lastName?: string;

    /**
     * REF02 when REF01=LU
     */
    locationNumber?: string;

    /**
     * NM105
     */
    middleName?: string;

    /**
     * Loop: 2010AC, Segment: REF, Element: REF02 when REF01=NF, Notes: National
     * Association of Insurance Commissioners (NAIC) Code
     */
    naic?: string;

    /**
     * NM109, Notes: National Provider Identifier
     */
    npi?: string;

    /**
     * NM103
     */
    organizationName?: string;

    /**
     * LOOP: 2010AC, Segment: REF, Element: REF02 when REF01=2U
     */
    payerIdentificationNumber?: string;

    /**
     * REF02 when REF01=1G, Notes: UPINs must be formatted as either X99999 or XXX999
     */
    providerUpinNumber?: string;

    /**
     * REF02 when REF01=SY, Notes: The Social Security Number must be a string of nine
     * numbers with no separators
     */
    ssn?: string;

    /**
     * REF02 when REF01=0B
     */
    stateLicenseNumber?: string;

    /**
     * NM107
     */
    suffix?: string;

    /**
     * PRV03
     */
    taxonomyCode?: string;
  }

  /**
   * Loop2300
   */
  export interface ClaimInformation {
    /**
     * Loop 2300, Segment: CLM, Element: CLM08, Note: Allowed Values are: 'N' No, 'W'
     * Not Applicable - Use code 'W' when the patient refuses to assign benefits, 'Y'
     * Yes
     */
    benefitsAssignmentCertificationIndicator: 'N' | 'W' | 'Y';

    /**
     * Loop 2300, Segment: CLM, Element: CLM02
     */
    claimChargeAmount: string;

    /**
     * Loop 2000B, Segment: SBR, Element: SBR09, Note: Allowed Values are: '11' Other
     * Non-Federal Programs, '12' Preferred Provider Organization (PPO), '13' Point of
     * Service (POS), '14' Exclusive Provider Organization (EPO), '15' Indemnity
     * Insurance, '16' Health Maintenance Organization (HMO) Medicare Risk, '17' Dental
     * Maintenance Organization, 'AM' Automobile Medical, 'BL' Blue Cross/Blue Shield,
     * 'CH' Champus, 'CI' Commercial Insurance Co., 'DS' Disability, 'FI' Federal
     * Employees Program, 'HM' Health Maintenance Organization, 'LM' Liability Medical,
     * 'MA' Medicare Part A, 'MB' Medicare Part B, 'MC' Medicaid, 'OF' Other Federal
     * Program, 'TV' Title V, 'VA' Veterans Affairs Plan, 'WC' Workers' Compensation
     * Health Claim, 'ZZ' Mutually Defined
     */
    claimFilingCode:
      | '11'
      | '12'
      | '13'
      | '14'
      | '15'
      | '16'
      | '17'
      | 'AM'
      | 'BL'
      | 'CH'
      | 'CI'
      | 'DS'
      | 'FI'
      | 'HM'
      | 'LM'
      | 'MA'
      | 'MB'
      | 'MC'
      | 'OF'
      | 'TV'
      | 'VA'
      | 'WC'
      | 'ZZ';

    /**
     * Loop 2300, Segment: CLM, Element: CLM05-03
     */
    claimFrequencyCode: string;

    /**
     * Loop 2300, Segment: HI
     */
    healthCareCodeInformation: Array<ClaimInformation.HealthCareCodeInformation>;

    /**
     * Loop 2300, Segment: CLM, Element: CLM01
     */
    patientControlNumber: string;

    /**
     * Loop 2300, Segment: CLM, Element: CLM05-01
     */
    placeOfServiceCode: string;

    /**
     * Loop 2300, Segment: CLM, Element: CLM07, Note: Allowed Values are: 'A' Assigned,
     * 'B' Assignment Accepted on Clinical Lab Services Only, 'C' Not Assigned
     */
    planParticipationCode: 'A' | 'B' | 'C';

    /**
     * Loop 2300, Segment: CLM, Element: CLM09, Note: Allowed Values are: 'I' Informed
     * Consent to Release Medical Information for Conditions or Diagnoses Regulated by
     * Federal Statutes, 'Y' Yes
     */
    releaseInformationCode: 'I' | 'Y';

    /**
     * Loop 2400
     */
    serviceLines: Array<ClaimInformation.ServiceLine>;

    /**
     * Loop 2300, Segment: CLM, Element: CLM06, Note: Allowed Values are: 'N' NO, 'Y'
     * Yes
     */
    signatureIndicator: 'N' | 'Y';

    /**
     * Loop 2300, Segment: CRC
     */
    ambulanceCertification?: Array<V3API.AmbulanceCertification>;

    /**
     * N3 and N4
     */
    ambulanceDropOffLocation?: V3API.Address;

    /**
     * N3 and N4
     */
    ambulancePickUpLocation?: V3API.Address;

    /**
     * CR1
     */
    ambulanceTransportInformation?: V3API.AmbulanceTransportInformation;

    /**
     * Loop 2300, Segment: HI
     */
    anesthesiaRelatedSurgicalProcedure?: Array<string>;

    /**
     * Loop 2300, Segment: CLM, Element: CLM11-05, Note: When CLM11-1 or CLM11-2 = AA
     * and the accident occurred in a country other than US or Canada.
     */
    autoAccidentCountryCode?: string;

    /**
     * Loop 2300, Segment: CLM, Element: CLM11-04, Note: When CLM11-1 or CLM11-2 has a
     * value of 'AA' to identify the state, province or sub-country code in which the
     * automobile accident occurred.
     */
    autoAccidentStateCode?: 'AA' | 'EM' | 'OA';

    /**
     * Loop 2300, Segment: CN1
     */
    claimContractInformation?: ClaimInformation.ClaimContractInformation;

    /**
     * DTP
     */
    claimDateInformation?: ClaimInformation.ClaimDateInformation;

    /**
     * NTE
     */
    claimNote?: ClaimInformation.ClaimNote;

    /**
     * HCP
     */
    claimPricingRepricingInformation?: V3API.ClaimPricingRepricingInformation;

    /**
     * PWK and REF
     */
    claimSupplementalInformation?: ClaimInformation.ClaimSupplementalInformation;

    /**
     * Loop 2300, Segment: HI
     */
    conditionInformation?: Array<ClaimInformation.ConditionInformation>;

    /**
     * Loop 2000B and 2000C, Segment: PAT, Element: PAT06 and PAT05=D8
     */
    deathDate?: string;

    /**
     * Loop 2300, Segment: CLM, Element: CLM20, Note: Allowed Values are: '1' Proof of
     * Eligibility Unknown or Unavailable, '2' Litigation, '3' Authorization Delays,
     * '4' Delay in Certifying Provider, '5' Delay in Supplying Billing Forms, '6'
     * Delay in Delivery of Custom-made Appliances, '7' Third Party Processing Delay,
     * '8' Delay in Eligibility Determination, '9' Original Claim Rejected or Denied
     * Due to a Reason Unrelated to the Billing Limitation Rules, '10' Administration
     * Delay in the Prior Approval Process, '11' Other, '15' Natural Disaster
     */
    delayReasonCode?: '1' | '2' | '3' | '4' | '5' | '6' | '7' | '8' | '9' | '10' | '11' | '15';

    /**
     * CRC
     */
    epsdtReferral?: ClaimInformation.EpsdtReferral;

    /**
     * Loop 2300, Segment: K3, Element: K301
     */
    fileInformation?: string;

    /**
     * Loop 2300, Segment: K3, Element: K301
     */
    fileInformationList?: Array<string>;

    /**
     * Loop 2300, Segment: CRC
     */
    homeboundIndicator?: boolean;

    /**
     * Loop 2320
     */
    otherSubscriberInformation?: Array<ClaimInformation.OtherSubscriberInformation>;

    /**
     * Loop 2300, Segment: AMT, Element: AMT02
     */
    patientAmountPaid?: string;

    /**
     * Loop 2300, Segment: CRC
     */
    patientConditionInformationVision?: Array<ClaimInformation.PatientConditionInformationVision>;

    /**
     * Loop 2300, Segment: CLM, Element: CLM10, Note: Allowed Values are: 'P' Signature
     * generated by provider because the patient was not physically present for
     * services
     */
    patientSignatureSourceCode?: false;

    /**
     * Loop 2000B and 2000C, Segment: PAT, Element: PAT08 and PAT07=01
     */
    patientWeight?: string;

    /**
     * Loop 2000B and 2000C, Segment: PAT, Element: PAT09
     */
    pregnancyIndicator?: 'Y';

    /**
     * Loop 2010BA, Segment: REF, Element: REF02
     */
    propertyCasualtyClaimNumber?: string;

    /**
     * Loop 2300, Segment: CLM, Element: CLM11-01, CLM11-02, Note: Allowed Values are:
     * 'AA' Auto Accident, 'EM' Employment, 'OA' Other Accident
     */
    relatedCausesCode?: Array<'AA' | 'EM' | 'OA'>;

    serviceFacilityLocation?: V3API.ServiceFacilityLocation;

    /**
     * Loop 2300, Segment: CLM, Element: CLM12, Note: Allowed Values are: '02'
     * Physically Handicapped Children's Program, '03' Special Federal Funding, '05'
     * Disabolity, '09' Second Opinion or Surgery
     */
    specialProgramCode?: '02' | '03' | '05' | '09';

    /**
     * Loop 2300, Segment: CR2
     */
    spinalManipulationServiceInformation?: ClaimInformation.SpinalManipulationServiceInformation;
  }

  export namespace ClaimInformation {
    /**
     * HI
     */
    export interface HealthCareCodeInformation {
      /**
       * Loop: 2440, Segment: HI, Element: HI01-02 or HI02-02 or HI03-02 or HI04-02 or
       * HI05-02 or HI06-02 or HI07-02 or HI08-02 or HI09-02 or HI10-02 or HI11-02 or
       * HI12-02
       */
      diagnosisCode: string;

      /**
       * Loop: 2440, Segment: HI, Element: HI01-01 or HI02-01 or HI03-01 or HI04-01 or
       * HI05-01 or HI06-01 or HI07-01 or HI08-01 or HI09-01 or HI10-01 or HI11-01 or
       * HI12-01, Note: Allowed Values are: 'BK' International Classification of Diseases
       * Clinical Modification (ICD-9-CM) Principal Diagnosis, 'ABK' International
       * Classification of Diseases Clinical Modification (ICD-10-CM) Principal
       * Diagnosis, 'BF' International Classification of Diseases Clinical Modification
       * (ICD-9-CM) Diagnosis, 'ABF' International Classification of Diseases Clinical
       * Modification (ICD-10-CM) Diagnosis
       */
      diagnosisTypeCode: 'BK' | 'ABK' | 'BF' | 'ABF';
    }

    /**
     * Loop 2400
     */
    export interface ServiceLine {
      professionalService: ServiceLine.ProfessionalService;

      /**
       * Loop: 2400, Segment: DTP, Element: DTP03, Notes: When sent with serviceDateEnd
       * it will be used as the start date for Date Time period, if sent without
       * serviceDateEnd will use DTP02 = D8. Expressed in Format CCYYMMDD
       */
      serviceDate: string;

      /**
       * Loop: 2400, Segment: NTE, Element: NTE02 when NTE01=ADD
       */
      additionalNotes?: string;

      ambulanceCertification?: Array<V3API.AmbulanceCertification>;

      /**
       * N3 and N4
       */
      ambulanceDropOffLocation?: V3API.Address;

      /**
       * Loop: 2400, Segment: QTY, Element: QTY02 when QTY01=PT
       */
      ambulancePatientCount?: number;

      /**
       * N3 and N4
       */
      ambulancePickUpLocation?: V3API.Address;

      /**
       * CR1
       */
      ambulanceTransportInformation?: V3API.AmbulanceTransportInformation;

      /**
       * Loop: 2400, Segment: LX, Element: LX01
       */
      assignedNumber?: string;

      /**
       * CRC
       */
      conditionIndicatorDurableMedicalEquipment?: ServiceLine.ConditionIndicatorDurableMedicalEquipment;

      /**
       * CN1
       */
      contractInformation?: ServiceLine.ContractInformation;

      /**
       * LOOP 2410
       */
      drugIdentification?: ServiceLine.DrugIdentification;

      /**
       * PWK
       */
      durableMedicalEquipmentCertificateOfMedicalNecessity?: ServiceLine.DurableMedicalEquipmentCertificateOfMedicalNecessity;

      /**
       * CR3
       */
      durableMedicalEquipmentCertification?: ServiceLine.DurableMedicalEquipmentCertification;

      /**
       * SV5
       */
      durableMedicalEquipmentService?: ServiceLine.DurableMedicalEquipmentService;

      /**
       * Loop: 2400, Segment: K3, Element: K301
       */
      fileInformation?: Array<string>;

      formIdentification?: Array<ServiceLine.FormIdentification>;

      /**
       * Loop: 2400, Segment: NTE, Element: NTE02 when NTE01=DCP
       */
      goalRehabOrDischargePlans?: string;

      /**
       * Loop: 2400, Segment: CRC, Element: CRC02 Notes: True or False
       */
      hospiceEmployeeIndicator?: boolean;

      lineAdjudicationInformation?: Array<ServiceLine.LineAdjudicationInformation>;

      /**
       * HCP
       */
      linePricingRepricingInformation?: V3API.ClaimPricingRepricingInformation;

      /**
       * Loop: 2400, Segment: QTY, Element: QTY02 when QTY01=FL
       */
      obstetricAnesthesiaAdditionalUnits?: number;

      orderingProvider?: ServiceLine.OrderingProvider;

      /**
       * Loop: 2400, Segment: AMT, Element: AMT02 when AMT01=F4
       */
      postageTaxAmount?: string;

      /**
       * Loop: 2400, Segment: REF, Element: REF04-02 when REF01=6R
       */
      providerControlNumber?: string;

      purchasedServiceInformation?: ServiceLine.PurchasedServiceInformation;

      purchasedServiceProvider?: V3API.ServiceLineProvider;

      referringProvider?: V3API.ServiceLineProvider;

      renderingProvider?: V3API.ServiceLineProvider;

      /**
       * Loop: 2400, Segment: AMT, Element: AMT02 when AMT01=T
       */
      salesTaxAmount?: string;

      /**
       * Loop: 2400, Segment: DTP, Element: DTP03, Notes: Range of Dates Expressed in
       * Format CCYYMMDD
       */
      serviceDateEnd?: string;

      serviceFacilityLocation?: V3API.ServiceFacilityLocation;

      serviceLineDateInformation?: ServiceLine.ServiceLineDateInformation;

      serviceLineReferenceInformation?: ServiceLine.ServiceLineReferenceInformation;

      serviceLineSupplementalInformation?: Array<V3API.ReportInformation>;

      supervisingProvider?: V3API.ServiceLineProvider;

      testResults?: Array<ServiceLine.TestResult>;

      /**
       * Loop: 2400, Segment: NTE, Element: NTE02 when NTE01=TPO
       */
      thirdPartyOrganizationNotes?: string;
    }

    export namespace ServiceLine {
      export interface ProfessionalService {
        /**
         * SVC107
         */
        compositeDiagnosisCodePointers: ProfessionalService.CompositeDiagnosisCodePointers;

        /**
         * Loop 2400, Segment: SV1, Element: SV102, Notes: Required value for total charge
         * amount, '0' (Zero) is acceptable for this value
         */
        lineItemChargeAmount: string;

        /**
         * Loop 2400, Segment: SV1, Element: SV103, Notes: Allowed values are 'MJ' Minutes,
         * 'UN' Unit
         */
        measurementUnit: 'MJ' | 'UN';

        /**
         * Loop 2400, Segment: SV1, Element: SV101-02
         */
        procedureCode: string;

        /**
         * Loop: 2400, Segment: SV1, Element: SV101-01, Notes: Allowed Values are: 'ER'
         * Jurisdiction Specific Procedure and Supply Codes, 'HC' Health Care Financing
         * Administration Common Procedural Coding System (HCPCS) Codes, 'IV' Home Infusion
         * EDI Coalition (HIEC) Product/Service Code,'WK' Advanced Billing Concepts (ABC)
         * Codes
         */
        procedureIdentifier: 'ER' | 'HC' | 'IV' | 'WK';

        /**
         * Loop 2400, Segment: SV1, Element: SV104, Notes: When a decimal is needed to
         * report units, include it in this element
         */
        serviceUnitCount: string;

        /**
         * Loop 2400, Segment: SV1, Element: SV115
         */
        copayStatusCode?: '0';

        /**
         * Loop 2400, Segment: SV1, Element: SV101-07, Notes: A free form description to
         * clarify teh related data elements and their content
         */
        description?: string;

        /**
         * Loop 2400, Segment: SV1, Element: SV109
         */
        emergencyIndicator?: 'Y';

        /**
         * Loop 2400, Segment: SV1, Element: SV111
         */
        epsdtIndicator?: 'Y';

        /**
         * Loop 2400, Segment: SV1, Element: SV112
         */
        familyPlanningIndicator?: 'Y';

        /**
         * Loop 2400, Segment: SV1, Element: SV105
         */
        placeOfServiceCode?: string;

        /**
         * Loop 2400, Segment: SV1, Elements: SV101-03 to SV101-06, Notes: Required when
         * modifier clarifies or improves the reporting accuracy of the associated
         * procedure code. If not required then do not send
         */
        procedureModifiers?: Array<string>;
      }

      export namespace ProfessionalService {
        /**
         * SVC107
         */
        export interface CompositeDiagnosisCodePointers {
          /**
           * Loop: 2400, Segment: SV1, Element: SV107-01, SV107-02, SV107-03, SV107-04
           */
          diagnosisCodePointers: Array<string>;
        }
      }

      /**
       * CRC
       */
      export interface ConditionIndicatorDurableMedicalEquipment {
        /**
         * Loop 2400, Segment: CRC, Element: CRC02 and CRC01=09, Note: Allowed Values are:
         * 'N' No, 'Y' Yes
         */
        certificationConditionIndicator: 'Y' | 'N';

        /**
         * Loop 2400, Segment: CRC, Element: CRC03, Note: Allowed Values are: '38'
         * Certification signed by the physician is on file at the supplier's office, 'ZV'
         * Replacement Item
         */
        conditionIndicator: '38' | 'ZV';

        /**
         * Loop 2400, Segment: CRC, Element: CRC04, Note: Allowed Values are: '38'
         * Certification signed by the physician is on file at the supplier's office, 'ZV'
         * Replacement Item
         */
        conditionIndicatorCode?: '38' | 'ZV';
      }

      /**
       * CN1
       */
      export interface ContractInformation {
        /**
         * Segment: CN1, Element: CN101, Allowed Values are: '01' Diagnosis Related Group
         * (DRG), '02' Per Diem, '03' Variable Per Diem, '04' Flat, '05' Capitated, '06'
         * Percent, '09' Other
         */
        contractTypeCode: '01' | '02' | '03' | '04' | '05' | '06' | '09';

        /**
         * Segment: CN1, Element: CN102
         */
        contractAmount?: string;

        /**
         * Segment: CN1, Element: CN104
         */
        contractCode?: string;

        /**
         * Segment: CN1, Element: CN103
         */
        contractPercentage?: string;

        /**
         * Segment: CN1, Element: CN106
         */
        contractVersionIdentifier?: string;

        /**
         * Segment: CN1, Element: CN105
         */
        termsDiscountPercentage?: string;
      }

      /**
       * LOOP 2410
       */
      export interface DrugIdentification {
        /**
         * Loop: 2410, Segment: CTP05, Element: CTP05-01, Allowed Values are: 'F2'
         * International Unit, 'GR' Gram, 'ME' Milligram, 'ML' Milliliter, 'UN' Unit
         */
        measurementUnitCode: 'F2' | 'GR' | 'ME' | 'ML' | 'UN';

        /**
         * Loop: 2410, Segment: LIN, Element: LIN03
         */
        nationalDrugCode: string;

        /**
         * Loop: 2410, Segment: CTP, Element: CTP04
         */
        nationalDrugUnitCount: string;

        /**
         * Loop: 2410, Segment: LIN, Element: LIN02, Note: Allowed Values are: 'EN'
         * EAN/UCC - 13, 'EO' EAN/UCC - 8, 'HI' HIBC (Health Care Industry Bar Code)
         * Supplier Labeling Standard Primary Data Message, 'N4' National Drug Code in
         * 5-4-2 Format, 'ON' Customer Order Number, 'UK' GTIN 14-digit Data Structure,
         * 'UP' UCC - 12
         */
        serviceIdQualifier: 'EN' | 'EO' | 'HI' | 'N4' | 'ON' | 'UK' | 'UP';

        /**
         * Loop: 2410, Segment: REF, Element: REF02 when REF01=VY
         */
        linkSequenceNumber?: string;

        /**
         * Loop: 2410, Segment: REF, Element: REF02 when REF01=XZ
         */
        pharmacyPrescriptionNumber?: string;
      }

      /**
       * PWK
       */
      export interface DurableMedicalEquipmentCertificateOfMedicalNecessity {
        /**
         * Loop: 2400, Segment: PWK, Element: PWK02 when PWK01=CT, Note: Allowed Values
         * are: 'AB' Previously Submitted to Payer, 'AD' Certification Included in this
         * Claim, 'AF' Narrative Segment Included in this Claim, 'AG' No Documentation is
         * Required, 'NS' Not Specified
         */
        attachmentTransmissionCode: 'AB' | 'AD' | 'AF' | 'AG' | 'NS';
      }

      /**
       * CR3
       */
      export interface DurableMedicalEquipmentCertification {
        /**
         * Loop: 2400, Segment: CR3, Element: CR301, Note: Allowed Values are: 'I' Initial,
         * 'R' Renewal, 'S' Revised
         */
        certificationTypeCode: 'I' | 'R' | 'S';

        /**
         * Loop: 2400, Segment: CR3, Element: CR303 when CR302=MO
         */
        durableMedicalEquipmentDurationInMonths: string;
      }

      /**
       * SV5
       */
      export interface DurableMedicalEquipmentService {
        /**
         * Loop: 2410, Segment: SV5, Element: SV503
         */
        days: string;

        /**
         * Loop: 2410, Segment: SV5, Element: SV506, Note: Allowed Values are: '1' weekly,
         * '4' monthly, '6' daily
         */
        frequencyCode: '1' | '4' | '6';

        /**
         * Loop: 2410, Segment: SV5, Element: SV505
         */
        purchasePrice: string;

        /**
         * Loop: 2410, Segment: SV5, Element: SV504
         */
        rentalPrice: string;
      }

      /**
       * LQ and FRM
       */
      export interface FormIdentification {
        /**
         * Loop: 2440, Segment: LQ, Element: LQ02
         */
        formIdentifier: string;

        /**
         * Loop: 2440, Segment: LQ, Element: LQ01, Note: Allowed Values are:'AS' Form Type
         * Code, 'UT' Centers for Medicare and Medicaid Services (CMS) Durable Medical
         * Equipment Regional Carrier (DMERC) Certificate of Medical Necessity (CMN) Forms
         */
        formTypeCode: 'AS' | 'UT';

        /**
         * Loop: 2440, Segment: FRM
         */
        supportingDocumentation?: Array<FormIdentification.SupportingDocumentation>;
      }

      export namespace FormIdentification {
        /**
         * Loop: 2440, Segment: FRM
         */
        export interface SupportingDocumentation {
          /**
           * Loop: 2440, Segment: FRM, Element: FRM01
           */
          questionNumber: string;

          /**
           * Loop: 2440, Segment: FRM, Element: FRM03
           */
          questionResponse?: string;

          /**
           * Loop: 2440, Segment: FRM, Element: FRM04
           */
          questionResponseAsDate?: string;

          /**
           * Loop: 2440, Segment: FRM, Element: FRM05
           */
          questionResponseAsPercent?: string;

          /**
           * Loop: 2440, Segment: FRM, Element: FRM02, Notes: Allowed Values are: 'N' No, 'W'
           * Not Applicable, 'Y' Yes
           */
          questionResponseCode?: 'N' | 'W' | 'Y';
        }
      }

      /**
       * SVD, CAS, DTP and AMT
       */
      export interface LineAdjudicationInformation {
        /**
         * Loop: 2430, Segment: DTP, Element=DTP03 when DTP02=D8 and DTP01=573
         */
        adjudicationOrPaymentDate: string;

        /**
         * Loop: 2430, Segment: SVD, Element: SVD01
         */
        otherPayerPrimaryIdentifier: string;

        /**
         * Loop: 2430, Segment: SVD, Element: SVD05
         */
        paidServiceUnitCount: string;

        /**
         * Loop: 2430, Segment: SVD, Element: SVD03-02
         */
        procedureCode: string;

        /**
         * Loop: 2430, Segment: SVD, Element: SVD03-01, Note: Allowed Values are: 'ER'
         * Jurisdiction Specific Procedure and Supply Codes, 'HC' Health Care Financing
         * Administration Common Procedural Coding System (HCPCS) Codes, 'HP' Health
         * Insurance Prospective Payment System (HIPPS) Skilled Nursing Facility Rate Code,
         * 'IV' Home Infusion EDI Coalition (HIEC) Product/Service Code, 'WK' Advanced
         * Billing Concepts (ABC) Codes
         */
        serviceIdQualifier: 'ER' | 'HC' | 'HP' | 'IV' | 'WK';

        /**
         * Loop: 2430, Segment: SVD, Element: SVD02
         */
        serviceLinePaidAmount: string;

        /**
         * Loop: 2430, Segment: SVD, Element: SVD06
         */
        bundledOrUnbundledLineNumber?: string;

        /**
         * Loop: 2430, Segment: CAS
         */
        claimAdjustmentInformation?: Array<V3API.ClaimAdjustment>;

        /**
         * Loop: 2430, Segment: SVD, Element: SVD03-07
         */
        procedureCodeDescription?: string;

        procedureModifier?: Array<string>;

        /**
         * Loop: 2430, Segment: AMT, Element=AMT02 when AMT01=EAF
         */
        remainingPatientLiability?: string;
      }

      export interface OrderingProvider {
        providerType: string;

        /**
         * N3 and N4
         */
        address?: V3API.Address;

        /**
         * Loop: 2010AC, Segment: REF, Element: REF02 when REF01=FY
         */
        claimOfficeNumber?: string;

        /**
         * REF02 when REF01=G2
         */
        commercialNumber?: string;

        /**
         * PER
         */
        contactInformation?: OrderingProvider.ContactInformation;

        /**
         * REF02 when REF01=EI, Notes: The Employer Identification Number must be a string
         * of exactly nine numbers with no separators
         */
        employerId?: string;

        /**
         * LOOP: 2010AC, Segment: REF, Element: REF02 when REF01=EI
         */
        employerIdentificationNumber?: string;

        /**
         * NM104
         */
        firstName?: string;

        /**
         * NM103
         */
        lastName?: string;

        /**
         * REF02 when REF01=LU
         */
        locationNumber?: string;

        /**
         * NM105
         */
        middleName?: string;

        /**
         * Loop: 2010AC, Segment: REF, Element: REF02 when REF01=NF, Notes: National
         * Association of Insurance Commissioners (NAIC) Code
         */
        naic?: string;

        /**
         * NM109, Notes: National Provider Identifier
         */
        npi?: string;

        /**
         * NM103
         */
        organizationName?: string;

        otherIdentifier?: string;

        /**
         * LOOP: 2010AC, Segment: REF, Element: REF02 when REF01=2U
         */
        payerIdentificationNumber?: string;

        /**
         * REF02 when REF01=1G, Notes: UPINs must be formatted as either X99999 or XXX999
         */
        providerUpinNumber?: string;

        secondaryIdentifier?: Array<V3API.ReferenceIdentification>;

        /**
         * REF02 when REF01=SY, Notes: The Social Security Number must be a string of nine
         * numbers with no separators
         */
        ssn?: string;

        /**
         * REF02 when REF01=0B
         */
        stateLicenseNumber?: string;

        /**
         * NM107
         */
        suffix?: string;

        /**
         * PRV03
         */
        taxonomyCode?: string;
      }

      export namespace OrderingProvider {
        /**
         * PER
         */
        export interface ContactInformation {
          /**
           * Segment: PER, Element: PER02 and PER01=IC
           */
          name: string;

          /**
           * Segment: PER, Element: PER04 or PER06 or PER08, Note: This used in (Provider,
           * Submitter) when PER03=EM or PER05=EM or PER07=EM
           */
          email?: string;

          /**
           * Segment: PER, Element: PER04 or PER06 or PER08, Note: This is used in (Provider,
           * Submitter) when PER03=FX or PER05=FX or PER07=FX
           */
          faxNumber?: string;

          /**
           * Segment: PER, Element: PER06 or PER08, Note: PER05=EX or PER07=EX
           */
          phoneExtension?: string;

          /**
           * Segment: PER, Element: PER04 (Provider, Submitter, Subscriber, Dependent) or
           * PER06 (Provider, Submitter) or PER08 (Provider, Submitter), Note: Used when
           * PER03=TE (Provider, Submitter, Subscriber, Dependent) or PER05=TE (Provider,
           * Submitter) or PER07=TE (Provider, Submitter)
           */
          phoneNumber?: string;
        }
      }

      export interface PurchasedServiceInformation {
        /**
         * Loop: 2400, Segment: PS1, Element: PS102
         */
        purchasedServiceChargeAmount: string;

        /**
         * Loop: 2400, Segment: PS1, Element: PS101
         */
        purchasedServiceProviderIdentifier: string;
      }

      export interface ServiceLineDateInformation {
        /**
         * Loop: 2400, Segment: DPT, Element: DTP03 when DPT01=463, Notes: Date Expressed
         * in Format CCYYMMDD
         */
        beginTherapyDate?: string;

        /**
         * Loop: 2400, Segment: DPT, Element: DTP03 when DPT01=607, Notes: Date Expressed
         * in Format CCYYMMDD
         */
        certificationRevisionOrRecertificationDate?: string;

        /**
         * Loop: 2400, Segment: DPT, Element: DTP03 when DPT01=738, Notes: Date Expressed
         * in Format CCYYMMDD
         */
        hemoglobinTestDate?: string;

        /**
         * Loop: 2400, Segment: DPT, Element: DTP03 when DPT01=454, Notes: Date Expressed
         * in Format CCYYMMDD
         */
        initialTreatmentDate?: string;

        /**
         * Loop: 2400, Segment: DPT, Element: DTP03 when DPT01=461, Notes: Date Expressed
         * in Format CCYYMMDD
         */
        lastCertificationDate?: string;

        /**
         * Loop: 2400, Segment: DPT, Element: DTP03 when DPT01=455, Notes: Date Expressed
         * in Format CCYYMMDD
         */
        lastXRayDate?: string;

        /**
         * Loop: 2400, Segment: DPT, Element: DTP03 when DPT01=471, Notes: Date Expressed
         * in Format CCYYMMDD
         */
        prescriptionDate?: string;

        /**
         * Loop: 2400, Segment: DPT, Element: DTP03 when DPT01=739, Notes: Date Expressed
         * in Format CCYYMMDD
         */
        serumCreatineTestDate?: string;

        /**
         * Loop: 2400, Segment: DPT, Element: DTP03 when DPT01=011, Notes: Date Expressed
         * in Format CCYYMMDD
         */
        shippedDate?: string;

        /**
         * Loop: 2400, Segment: DPT, Element: DTP03 when DPT01=304, Notes: Date Expressed
         * in Format CCYYMMDD
         */
        treatmentOrTherapyDate?: string;
      }

      export interface ServiceLineReferenceInformation {
        /**
         * Loop: 2400, Segment: REF, Element: REF02 Note: When REF01=9D
         */
        adjustedRepricedLineItemReferenceNumber?: string;

        /**
         * Loop: 2400, Segment: REF, Element: REF02 Note: When REF01=X4
         */
        clinicalLaboratoryImprovementAmendmentNumber?: string;

        /**
         * Loop: 2400, Segment: REF, Element: REF02 Note: When REF01=BT
         */
        immunizationBatchNumber?: string;

        /**
         * Loop: 2400, Segment: REF, Element: REF02 Note: When REF01=EW
         */
        mammographyCertificationNumber?: string;

        /**
         * Loop 2400 REF
         */
        priorAuthorization?: Array<ServiceLineReferenceInformation.PriorAuthorization>;

        /**
         * Loop: 2400, Segment: REF, Element: REF Note: When REF01=9F
         */
        referralNumber?: Array<string>;

        /**
         * Loop: 2400, Segment: REF, Element: REF02 Note: When REF01=F4
         */
        referringCliaNumber?: string;

        /**
         * Loop: 2400, Segment: REF, Element: REF02 Notes: When REF01=9B
         */
        repricedLineItemReferenceNumber?: string;
      }

      export namespace ServiceLineReferenceInformation {
        /**
         * Loop 2400 REF
         */
        export interface PriorAuthorization {
          /**
           * Loop: 2400, Segment: REF, Element: REF02 when REF01=G1
           */
          priorAuthorizationOrReferralNumber: string;

          /**
           * Loop: 2400, Segment: REF, Element: REF04-2 when REF04-1=2U
           */
          otherPayerPrimaryIdentifier?: string;
        }
      }

      export interface TestResult {
        /**
         * Loop 2400, Segment: MEA; Element: MEA02, Notes: Allowable values are 'HT'
         * Height, 'R1' Hemoglobin, 'R2' Hematocrit, 'R3' Epoetin Starting Dosage, 'R4'
         * Creatinine
         */
        measurementQualifier: 'HT' | 'R1' | 'R2' | 'R3' | 'R4';

        /**
         * Loop 2400, Segment: MEA; Element: MEA01, Notes: Allowable values are 'OG'
         * Original and 'TR' Test Results
         */
        measurementReferenceIdentificationCode: 'OG' | 'TR';

        /**
         * Loop 2400, Segment: MEA; Element: MEA03
         */
        testResults: string;
      }
    }

    /**
     * Loop 2300, Segment: CN1
     */
    export interface ClaimContractInformation {
      /**
       * Loop: 2300,Segment: CN1, Element: CN101, Note: Allowed Values are: '01'
       * Diagnosis Related Group (DRG), '02' Per Diem, '03' Variable Per Diem, '04' Flat,
       * '05' Capitated, '06' Percent, '09' Other
       */
      contractTypeCode: '01' | '02' | '03' | '04' | '05' | '06' | '09';

      /**
       * Loop: 2300, Segment: CN1, Element: CN102
       */
      contractAmount?: string;

      /**
       * Loop: 2300, Segment: CN1, Element: CN104
       */
      contractCode?: string;

      /**
       * Loop: 2300, Segment: CN1, Element: CN103
       */
      contractPercentage?: string;

      /**
       * Loop: 2300, Segment: CN1, Element: CN106
       */
      contractVersionIdentifier?: string;

      /**
       * Loop: 2300, Segment: CN1, Element: CN105
       */
      termsDiscountPercentage?: string;
    }

    /**
     * DTP
     */
    export interface ClaimDateInformation {
      /**
       * Loop: 2300, Segment: DTP, Element: DTP03
       */
      accidentDate?: string;

      /**
       * Loop: 2300, Segment: DTP, Element: DTP03
       */
      acuteManifestationDate?: string;

      /**
       * Loop: 2300, Segment: DTP, Element: DTP03
       */
      admissionDate?: string;

      /**
       * Loop: 2300, Segment: DTP, Element: DTP03
       */
      assumedAndRelinquishedCareBeginDate?: string;

      /**
       * Loop: 2300, Segment: DTP, Element: DTP03
       */
      assumedAndRelinquishedCareEndDate?: string;

      /**
       * Loop: 2300, Segment: DTP, Element: DTP03
       */
      authorizedReturnToWorkDate?: string;

      /**
       * Loop: 2300, Segment: DTP, Element: DTP03
       */
      disabilityBeginDate?: string;

      /**
       * Loop: 2300, Segment: DTP, Element: DTP03
       */
      disabilityEndDate?: string;

      /**
       * Loop: 2300, Segment: DTP, Element: DTP03
       */
      dischargeDate?: string;

      /**
       * Loop: 2300, Segment: DTP, Element: DTP03
       */
      firstContactDate?: string;

      /**
       * Loop: 2300, Segment: DTP, Element: DTP03
       */
      hearingAndVisionPrescriptionDate?: string;

      /**
       * Loop: 2300, Segment: DTP, Element: DTP03
       */
      initialTreatmentDate?: string;

      /**
       * Loop: 2300, Segment: DTP, Element: DTP03
       */
      lastMenstrualPeriodDate?: string;

      /**
       * Loop: 2300, Segment: DTP, Element: DTP03
       */
      lastSeenDate?: string;

      /**
       * Loop: 2300, Segment: DTP, Element: DTP03
       */
      lastWorkedDate?: string;

      /**
       * Loop: 2300, Segment: DTP, Element: DTP03
       */
      lastXRayDate?: string;

      /**
       * Loop: 2300, Segment: DTP, Element: DTP03
       */
      repricerReceivedDate?: string;

      /**
       * Loop: 2300, Segment: DTP, Element: DTP03
       */
      symptomDate?: string;
    }

    /**
     * NTE
     */
    export interface ClaimNote {
      /**
       * Loop 2300, Segment: NTE, Element: NTE02, Note: NTE01=ADD
       */
      additionalInformation?: string;

      /**
       * Loop 2300, Segment: NTE, Element: NTE02, Note: NTE01=CER
       */
      certificationNarrative?: string;

      /**
       * Loop 2300, Segment: NTE, Element: NTE02, Note: NTE01=DGN
       */
      diagnosisDescription?: string;

      /**
       * Loop 2300, Segment: NTE, Element: NTE02, Note: NTE01=DCP
       */
      goalRehabOrDischargePlans?: string;

      /**
       * Loop 2300, Segment: NTE, Element: NTE02, Note: NTE01=TPO
       */
      thirdPartOrgNotes?: string;
    }

    /**
     * PWK and REF
     */
    export interface ClaimSupplementalInformation {
      /**
       * Loop: 2300, Segment: REF, Element: REF02 and REF01=9C
       */
      adjustedRepricedClaimNumber?: string;

      /**
       * Loop: 2300, Segment: REF, Element: REF02 and REF01=1J
       */
      carePlanOversightNumber?: string;

      /**
       * Loop: 2300, Segment: REF, Element: REF02 and REF01=F8
       */
      claimControlNumber?: string;

      /**
       * Loop: 2300, Segment: REF, Element: REF02 and REF01=D9
       */
      claimNumber?: string;

      /**
       * Loop: 2300, Segment: REF, Element: REF02 and REF01=X4
       */
      cliaNumber?: string;

      /**
       * Loop: 2300, Segment: REF, Element: REF02 and REF01=P4
       */
      demoProjectIdentifier?: string;

      /**
       * Loop: 2300, Segment: REF, Element: REF02 and REF01=LX
       */
      investigationalDeviceExemptionNumber?: string;

      /**
       * Loop: 2300, Segment: REF, Element: REF02 and REF01=EW
       */
      mammographyCertificationNumber?: string;

      /**
       * Loop: 2300, Segment: REF, Element: REF02 and REF01=EA
       */
      medicalRecordNumber?: string;

      /**
       * Loop: 2300, Segment: REF, Element: REF02 and REF01=F5
       */
      medicareCrossoverReferenceId?: string;

      /**
       * Loop: 2300, Segment: REF, Element: REF02 and REF01=G1
       */
      priorAuthorizationNumber?: string;

      /**
       * Loop: 2300, Segment: REF, Element: REF02 and REF01=9F
       */
      referralNumber?: string;

      reportInformation?: V3API.ReportInformation;

      /**
       * Loop: 2300, Segment: REF, Element: REF02 and REF01=9A
       */
      repricedClaimNumber?: string;

      /**
       * Loop: 2300, Segment: REF, Element: REF02 and REF01=4N, Note: '1'
       * Immediate/Urgent Care, '2' Services Rendered in a Retroactive Period, '3'
       * Emergency Care, '4' Client has Temporary Medicaid, '5' Request from County for
       * Second Opinion to Determine if Recipient Can Work, '6' Request for Override
       * Pending, '7' Special Handling, Null
       */
      serviceAuthorizationExceptionCode?: '1' | '2' | '3' | '4' | '5' | '6' | '7';
    }

    /**
     * HI
     */
    export interface ConditionInformation {
      conditionCodes: Array<string>;
    }

    /**
     * CRC
     */
    export interface EpsdtReferral {
      /**
       * Loop: 2300, Segment: CRC, Element: CRC02 When CRC01=ZZ, Note: 'N' No, 'Y' Yes
       */
      certificationConditionCodeAppliesIndicator: 'N' | 'Y';

      /**
       * Loop: 2300, Segment: CRC, Elements: CRC03, CRC04, CRC05 Note: Allowed Values
       * are: 'AV' Available- Not Used, 'NU' Not Used, 'S2' Under Treatment, 'ST' New
       * Services Requested
       */
      conditionCodes: Array<'AV' | 'NU' | 'S2' | 'ST'>;
    }

    /**
     * Loop 2320
     */
    export interface OtherSubscriberInformation {
      /**
       * Loop: 2320, Segment: OI, Element: OI03, Notes: Allowable values are: 'N' No, 'W'
       * Not Applicable, 'Y' Yes
       */
      benefitsAssignmentCertificationIndicator: 'N' | 'W' | 'Y';

      /**
       * Loop: 2320, Segment: SBR, Element: SBR09, Notes: Allowed Values are: '11' Other
       * Non-Federal Programs, '12' Preferred Provider Organization (PPO), '13' Point of
       * Service (POS), '14' Exclusive Provider Organization (EPO), '15' Indemnity
       * Insurance, '16' Health Maintenance Organization (HMO) Medicare Risk, '17' Dental
       * Maintenance Organization, 'AM' Automobile Medical, 'BL' Blue Cross/Blue Shield,
       * 'CH' Champus, 'CI' Commercial Insurance Co., 'DS' Disability, 'FI' Federal
       * Employees Program, 'HM' Health Maintenance Organization, 'LM' Liability Medical,
       * 'MA' Medicare Part A, 'MB' Medicare Part B,'MC' Medicare Part C, 'OF' Other
       * Federal Program, 'TV' Title V, 'VA' Veterans Affairs Plan, 'WC' Worker's
       * Compensation Health Claim, 'ZZ' Mutually Defined
       */
      claimFilingIndicatorCode:
        | '11'
        | '12'
        | '13'
        | '14'
        | '15'
        | '16'
        | '17'
        | 'AM'
        | 'BL'
        | 'CH'
        | 'CI'
        | 'DS'
        | 'FI'
        | 'HM'
        | 'LM'
        | 'MA'
        | 'MB'
        | 'MC'
        | 'OF'
        | 'TV'
        | 'VA'
        | 'WC'
        | 'ZZ';

      /**
       * Loop: 2320, Segment: SBR, Element: SBR02, Notes: Required when patient is the
       * subscriber, Notes: Allowed Values are: '01' Spouse, '18' Self, '19' Child, '20'
       * Employee, '21' Unknown, '39' Organ Donor, '40' Cadaver Donor, '53' Life Partner,
       * 'G8' Other Relationship
       */
      individualRelationshipCode: '01' | '18' | '19' | '20' | '21' | '39' | '40' | '53' | 'G8';

      /**
       * Loop: 2330B
       */
      otherPayerName: OtherSubscriberInformation.OtherPayerName;

      /**
       * Loop: 2330A
       */
      otherSubscriberName: OtherSubscriberInformation.OtherSubscriberName;

      /**
       * Loop: 2320, Segment: SBR, Element: SBR01, Notes: Allowable values are 'A' Payer
       * Responsibility Four, 'B' Payer Responsibility Five, 'C' Payer Responsibility
       * Six, 'D' Payer Responsibility Seven, 'E' Payer Responsibility Eight, 'F' Payer
       * Responsibility Nine, 'G' Payer Responsibility Ten, 'H' Payer Responsibility
       * Eleven, 'P' Primary, 'S' Secondary, 'T' Tertiary, and 'U' Unknown
       */
      paymentResponsibilityLevelCode: 'A' | 'B' | 'C' | 'D' | 'E' | 'F' | 'G' | 'H' | 'P' | 'S' | 'T' | 'U';

      /**
       * Loop: 2320, Segment: OI, Element: OI04, Notes: Allowable values are 'I' Informed
       * Consent to Release Medical Information, 'Y' Yes
       */
      releaseOfInformationCode: 'I' | 'Y';

      /**
       * Loop: 2320, Segment: CAS
       */
      claimLevelAdjustments?: Array<V3API.ClaimAdjustment>;

      /**
       * Loop: 2320, Segment: SBR, Element: SBR03
       */
      insuranceGroupOrPolicyNumber?: string;

      /**
       * Loop: 2320, Segment: SBR, Element: SBR05, Notes: Allowable Values are: '12'
       * Medicare Secondary Working Aged Beneficiary or Spouse with Employer Group Health
       * Plan, '13' Medicare Secondary End-Stage Renal Disease Beneficiary in the
       * Mandated Coordination Period, '14' Medicare Secondary, No-fault Insurance
       * including Auto is Primary, '15' Medicare Secondary Worker's Compensation, '16'
       * Medicare Secondary Public Health Service (PHS)or Other Federal Agency, '41'
       * Medicare Secondary Black Lung, '42' Medicare Secondary Veteran's Administration,
       * '43' Medicare Secondary Disabled Beneficiary Under Age 65 with Large Group
       * Health Plan (LGHP), '47' Medicare Secondary, Other Liability Insurance is
       * Primary
       */
      insuranceTypeCode?: '12' | '13' | '14' | '15' | '16' | '41' | '42' | '43' | '47';

      /**
       * Loop: 2320, Segment: MOA
       */
      medicareOutpatientAdjudication?: OtherSubscriberInformation.MedicareOutpatientAdjudication;

      /**
       * Loop: 2320, Segment: AMT, Element: AMT02 when AMT01=A8
       */
      nonCoveredChargeAmount?: string;

      /**
       * Loop: 2000B, Segment: SBR, Element: SBR04
       */
      otherInsuredGroupName?: string;

      otherPayerBillingProvider?: Array<OtherSubscriberInformation.OtherPayerBillingProvider>;

      otherPayerReferringProvider?: Array<OtherSubscriberInformation.OtherPayerReferringProvider>;

      otherPayerRenderingProvider?: Array<OtherSubscriberInformation.OtherPayerRenderingProvider>;

      otherPayerServiceFacilityLocation?: Array<OtherSubscriberInformation.OtherPayerServiceFacilityLocation>;

      otherPayerSupervisingProvider?: Array<OtherSubscriberInformation.OtherPayerSupervisingProvider>;

      /**
       * Loop: 2320, Segment: OI, Element: OI04, Notes: Allowable value is 'P' Signature
       * generated by provider because the patient was not physically present for
       * services
       */
      patientSignatureGeneratedForPatient?: boolean;

      /**
       * Loop: 2320, Segment: AMT, Element: AMT02 when AMT01=D, Notes: It is acceptable
       * to show '0' (Zero)
       */
      payerPaidAmount?: string;

      /**
       * Loop: 2320, Segment: AMT, Element: AMT02 when AMT01=EAF
       */
      remainingPatientLiability?: string;
    }

    export namespace OtherSubscriberInformation {
      /**
       * Loop: 2330B
       */
      export interface OtherPayerName {
        /**
         * Loop: 2330B; Segment: NM1, Element: NM109
         */
        otherPayerIdentifier: string;

        /**
         * Loop: 2330B; Segment: NM1, Element: NM108, Notes: Allowable values: 'PI' Payor
         * Identification and 'XV' Centers for Medicare/Medicaid Services PlanID
         */
        otherPayerIdentifierTypeCode: 'PI' | 'XV';

        /**
         * Loop: 2330B; Segment: NM1, Element: NM103
         */
        otherPayerOrganizationName: string;

        /**
         * Loop: 2330B; Segment: NM1, Element: NM111
         */
        otherInsuredAdditionalIdentifier?: string;

        /**
         * N3 and N4
         */
        otherPayerAddress?: V3API.Address;

        /**
         * Loop: 2330B, Segment: DTP, Element: DTP03
         */
        otherPayerAdjudicationOrPaymentDate?: string;

        /**
         * Loop: 2330B, Segment: REF, Element: REF02 when REF01=T4
         */
        otherPayerClaimAdjustmentIndicator?: boolean;

        /**
         * Loop: 2330B, Segment: REF, Element: REF02 when REF01=F8
         */
        otherPayerClaimControlNumber?: string;

        /**
         * Loop: 2330B, Segment: REF, Element: REF02 when REF01=G1
         */
        otherPayerPriorAuthorizationNumber?: string;

        /**
         * Loop: 2330B; Segment: REF, Element: REF02 when REF01=9F
         */
        otherPayerPriorAuthorizationOrReferralNumber?: string;

        /**
         * Loop: 2330B, Segment: REF
         */
        otherPayerSecondaryIdentifier?: Array<V3API.ReferenceIdentification>;
      }

      /**
       * Loop: 2330A
       */
      export interface OtherSubscriberName {
        /**
         * Loop: 2330A, Segment: NM1, Element: NM109
         */
        otherInsuredIdentifier: string;

        /**
         * Loop: 2330A, Segment: NM1, Element: NM108, Notes: Allowable values are: 'II'
         * Standard Unique HealthIdentifier for each individual in the United States and
         * 'MI' member identification number
         */
        otherInsuredIdentifierTypeCode: 'II' | 'MI';

        /**
         * Loop: 2330A, Segment: NM1, Element: NM103
         */
        otherInsuredLastName: string;

        /**
         * Loop: 2330A, Segment: NM1, Element: NM102, Notes: Allowed Values are: '1'
         * Person, '2' Non-Person Entity
         */
        otherInsuredQualifier: '1' | '2';

        /**
         * Loop: 2330A, Segment: REF, Element: REF02 when REF01=SY
         */
        otherInsuredAdditionalIdentifier?: string;

        /**
         * N3 and N4
         */
        otherInsuredAddress?: V3API.Address;

        /**
         * Loop: 2330A, Segment: NM1, Element: NM102, Notes: Required when NM102 = 1
         * (Person)
         */
        otherInsuredFirstName?: string;

        /**
         * Loop: 2330A, Segment: NM1, Element: NM105, Notes: Required when NM102 = 1
         * (Person)
         */
        otherInsuredMiddleName?: string;

        /**
         * Loop: 2330A, Segment: NM1, Element: NM107, Notes: Required when NM102 = 1
         * (Person)
         */
        otherInsuredNameSuffix?: string;
      }

      /**
       * Loop: 2320, Segment: MOA
       */
      export interface MedicareOutpatientAdjudication {
        /**
         * Loop: 2320: Segment: MOA, Element: MOA03 to MOA07
         */
        claimPaymentRemarkCode?: Array<string>;

        /**
         * Loop 2320, Segment: MOA; Element: MOA08
         */
        endStageRenalDiseasePaymentAmount?: string;

        /**
         * Loop 2320, Segment: MOA; Element: MOA02
         */
        hcpcsPayableAmount?: string;

        /**
         * Loop 2320, Segment: MOA; Element: MOA09
         */
        nonPayableProfessionalComponentBilledAmount?: string;

        /**
         * Loop 2320, Segment: MOA; Element: MOA01
         */
        reimbursementRate?: string;
      }

      /**
       * Loop 2330G
       */
      export interface OtherPayerBillingProvider {
        /**
         * Loop 2330G, Segment: NM1; Element: NM101, Notes: Code identifying an
         * organizational entity, a physical location, property or an individual.
         * Allowablevalues: '1' Person, '2' Non-Person Entity
         */
        entityTypeQualifier: '1' | '2';

        /**
         * Loop 2330G, Segment: NM1 and REF
         */
        otherPayerBillingProviderIdentifier: Array<V3API.ReferenceIdentification>;
      }

      /**
       * Loop 2330C
       */
      export interface OtherPayerReferringProvider {
        /**
         * Loop 2330E, Segment: NM1 and REF
         */
        otherPayerReferringProviderIdentifier: Array<V3API.ReferenceIdentification>;
      }

      /**
       * Loop 2330D
       */
      export interface OtherPayerRenderingProvider {
        /**
         * Loop: 2330D, Segment NM1, Element: NM102, Notes: Allowable values are '1' Person
         * and '2' Non-Person Entity
         */
        entityTypeQualifier: '1' | '2';

        /**
         * Loop 2330D, Segment: NM1 and REF
         */
        otherPayerRenderingProviderSecondaryIdentifier?: Array<V3API.ReferenceIdentification>;
      }

      /**
       * Loop 2330E
       */
      export interface OtherPayerServiceFacilityLocation {
        /**
         * Loop 2330E, Segments: NM1 and REF
         */
        otherPayerServiceFacilityLocationSecondaryIdentifier: Array<V3API.ReferenceIdentification>;
      }

      /**
       * Loop 2330F
       */
      export interface OtherPayerSupervisingProvider {
        /**
         * Loop 2330F, Segments: NM1 and REF
         */
        otherPayerSupervisingProviderIdentifier: Array<V3API.ReferenceIdentification>;
      }
    }

    /**
     * Loop 2300, Segment: CRC
     */
    export interface PatientConditionInformationVision {
      /**
       * Loop: 2300, Segment: CRC, Element: CRC02, Notes: Allowed Values are: 'N' No, 'Y'
       * Yes
       */
      certificationConditionIndicator: 'N' | 'Y';

      /**
       * Loop: 2300, Segment: CRC, Element: CRC01, Notes: Allowed Values are: 'E1'
       * Spectacle Lenses, 'E2' Contact Lenses, 'E3' Spectacle Frames
       */
      codeCategory: 'E1' | 'E2' | 'E3';

      /**
       * Loop: 2300, Segment: CRC, Element: CRC03 to CRC07, Notes: CRC03 is required,
       * others are situational. Allowed Values are: 'L1' General Standard of 20 Degree
       * or .5 Diopter Sphere or Cylinder Change Met, 'L2' Replacement Due to Loss or
       * Theft, 'L3' Replacement Due to Breakage or Damage, L4' Replacement Due to
       * Patient Preference, 'L5' Replacement Due to Medical Reason
       */
      conditionCodes: Array<'L1' | 'L2' | 'L3' | 'L4' | 'L5'>;
    }

    /**
     * Loop 2300, Segment: CR2
     */
    export interface SpinalManipulationServiceInformation {
      /**
       * Loop: 2300, Segment: CR, Element: CR208
       */
      patientConditionCode: string;

      /**
       * Loop: 2300, Segment: CR, Element: CR210 Note: Allowed Values are: 'A' Acute
       * Condition, 'C' Chronic Condition, 'D' Chronic Condition, 'E' Non-Life
       * Threatening, 'F' Routine, 'G' Symptomatic, 'M' Acute Manifestation of a Chronic
       * Condition
       */
      patientConditionDescription1?: 'A' | 'C' | 'D' | 'E' | 'F' | 'G' | 'M';

      /**
       * Loop: 2300, Segment: CR, Element: CR211
       */
      patientConditionDescription2?: string;
    }
  }

  /**
   * Loop: 1000B
   */
  export interface Receiver {
    /**
     * Loop: 1000B, Segment: NM1, Element: NM103
     */
    organizationName: string;
  }

  /**
   * Loop: 1000A
   */
  export interface Submitter {
    /**
     * PER
     */
    contactInformation: V3API.ContactInformation;

    /**
     * Loop: 1000A, Segment: NM1, Element: NM104
     */
    firstName?: string;

    /**
     * Loop: 1000A, Segment: NM1, Element: NM103
     */
    lastName?: string;

    /**
     * Loop: 1000A, Segment: NM1, Element: NM105
     */
    middleName?: string;

    /**
     * Loop: 1000A, Segment: NM1, Element: NM103
     */
    organizationName?: string;
  }

  /**
   * Loop: 2000B
   */
  export interface Subscriber {
    /**
     * Loop: 2000B, Segment: SBR, Element: SBR01, Allowed Values:'A' Payer
     * Responsibility Four 'B' Payer Responsibility Five 'C' Payer Responsibility Six
     * 'D' Payer Responsibility Seven 'E' Payer Responsibility Eight 'F' Payer
     * Responsibility Nine 'G' Payer Responsibility Ten 'H' Payer Responsibility Eleven
     * 'P' Primary 'S' Secondary 'T' Tertiary 'U' Unknown
     */
    paymentResponsibilityLevelCode: 'A' | 'B' | 'C' | 'D' | 'E' | 'F' | 'G' | 'H' | 'P' | 'S' | 'T' | 'U';

    /**
     * N3 and N4
     */
    address?: V3API.Address;

    /**
     * PER
     */
    contactInformation?: V3API.ContactInformation;

    /**
     * Loop: 2010BA, Segment: DMG, Element: DMG02
     */
    dateOfBirth?: string;

    /**
     * Loop: 2010BA, Segment: NM1, Element: NM104
     */
    firstName?: string;

    /**
     * Loop: 2010BA, Segment: DMG, Element: DMG03 Subscriber Gender, Notes: 'M' Male,
     * 'F' Female'U' Unknown
     */
    gender?: 'M' | 'F' | 'U';

    /**
     * Loop: 2010BA, Segment: SBR, Element: SBR04
     */
    groupNumber?: string;

    /**
     * Loop: 2000B, Segment: SBR, Element:SBR05 Notes: Allowed values: '12' Medicare
     * Secondary Working Aged Beneficiary or Spouse with Employer Group Health Plan,
     * '13' Medicare Secondary End-Stage Renal Disease Beneficiary in the Mandated
     * Coordination Period with an Employer's Group Health Plan, '14' Medicare
     * Secondary, No-fault Insurance including Auto is Primary, '15' Medicare Secondary
     * Worker's Compensation, '16' Medicare Secondary Public Health Service (PHS)or
     * Other Federal Agency, '41' Medicare Secondary Black Lung, '42' Medicare
     * Secondary Veteran's Administration, '43' Medicare Secondary Disabled Beneficiary
     * Under Age 65 with Large Group Health Plan (LGHP), '47' Medicare Secondary, Other
     * Liability Insurance is Primary
     */
    insuranceTypeCode?: '12' | '13' | '14' | '15' | '16' | '41' | '42' | '43' | '47';

    /**
     * Loop: 2010BA, Segment: NM1, Element: NM103
     */
    lastName?: string;

    /**
     * Loop: 2010BA, Segment: NM1, Element: NM109
     */
    memberId?: string;

    /**
     * Loop: 2010BA, Segment: NM, Element: NM105
     */
    middleName?: string;

    /**
     * Loop: 2010BA, Segment: NM1, Element: NM103 when NM102=2, Notes: when subscriber
     * is organization pass patient as dependent
     */
    organizationName?: string;

    /**
     * Loop: 2000B, Segment: SBR, Element: SBR03
     */
    policyNumber?: string;

    /**
     * Loop: 2010BA, Segment: REF, Element: REF02 when REF01=SY
     */
    ssn?: string;

    /**
     * Loop: 2000B, Segment: SBR, Element: SBR04 Notes: Freeform text
     */
    subscriberGroupName?: string;

    /**
     * Loop: 2010BA, Segment: NM, Element: NM107
     */
    suffix?: string;
  }

  /**
   * LOOP 2000C
   */
  export interface Dependent {
    /**
     * Loop: 2010CA, Segment: DMG, Element: DMG02 when DMG01=D8
     */
    dateOfBirth: string;

    /**
     * Loop: 2010CA, Segment: NM1, Element: NM104
     */
    firstName: string;

    /**
     * Loop: 2010CA, Segment: DMG, Element: DMG03, Note: Allowed Values are: 'M' Male,
     * 'F' Female, 'U' Unknown
     */
    gender: 'M' | 'F' | 'U';

    /**
     * Loop: 2010CA, Segment: NM1, Element: NM103
     */
    lastName: string;

    /**
     * Loop: 2000C, Segment: PAT, Element: PAT01, Note: Allowed Values are: '01'
     * Spouse, '19' Child, '20' Employee, '21' Unknown, '39' Organ Donor, '40' Cadaver
     * Donor, '53' Life Partner, 'G8' Other Relationship
     */
    relationshipToSubscriberCode: '01' | '19' | '20' | '39' | '40' | '53' | 'G8';

    /**
     * N3 and N4
     */
    address?: V3API.Address;

    /**
     * PER
     */
    contactInformation?: V3API.ContactInformation;

    /**
     * Loop: 2010CA, Segment: REF, Element: REF02 when REF01=1W
     */
    memberId?: string;

    /**
     * Loop: 2010CA, Segment: NM1, Element: NM105
     */
    middleName?: string;

    /**
     * Loop: 2010CA, Segment: REF, Element: REF02 when REF01=SY
     */
    ssn?: string;

    /**
     * Loop: 2010CA, Segment: NM, Element: NM107
     */
    suffix?: string;
  }

  /**
   * @deprecated Loop: 2420E, Setting ProviderType equal to OrderingProvider is
   * deprecated, please use ClaimInformation.serviceLines.orderingProvider
   */
  export interface Ordering {
    providerType: string;

    /**
     * N3 and N4
     */
    address?: V3API.Address;

    /**
     * Loop: 2010AC, Segment: REF, Element: REF02 when REF01=FY
     */
    claimOfficeNumber?: string;

    /**
     * REF02 when REF01=G2
     */
    commercialNumber?: string;

    /**
     * PER
     */
    contactInformation?: V3API.ContactInformation;

    /**
     * REF02 when REF01=EI, Notes: The Employer Identification Number must be a string
     * of exactly nine numbers with no separators
     */
    employerId?: string;

    /**
     * LOOP: 2010AC, Segment: REF, Element: REF02 when REF01=EI
     */
    employerIdentificationNumber?: string;

    /**
     * NM104
     */
    firstName?: string;

    /**
     * NM103
     */
    lastName?: string;

    /**
     * REF02 when REF01=LU
     */
    locationNumber?: string;

    /**
     * NM105
     */
    middleName?: string;

    /**
     * Loop: 2010AC, Segment: REF, Element: REF02 when REF01=NF, Notes: National
     * Association of Insurance Commissioners (NAIC) Code
     */
    naic?: string;

    /**
     * NM109, Notes: National Provider Identifier
     */
    npi?: string;

    /**
     * NM103
     */
    organizationName?: string;

    /**
     * LOOP: 2010AC, Segment: REF, Element: REF02 when REF01=2U
     */
    payerIdentificationNumber?: string;

    /**
     * REF02 when REF01=1G, Notes: UPINs must be formatted as either X99999 or XXX999
     */
    providerUpinNumber?: string;

    /**
     * REF02 when REF01=SY, Notes: The Social Security Number must be a string of nine
     * numbers with no separators
     */
    ssn?: string;

    /**
     * REF02 when REF01=0B
     */
    stateLicenseNumber?: string;

    /**
     * NM107
     */
    suffix?: string;

    /**
     * PRV03
     */
    taxonomyCode?: string;
  }

  /**
   * 2010AC
   */
  export interface PayToPlan {
    /**
     * N3 and N4
     */
    address: V3API.Address;

    /**
     * Loop: 2010AC, Segment: NM1, Element: NM103
     */
    organizationName: string;

    /**
     * Loop: 2010AC, Segment: NM1, Element: NM109
     */
    primaryIdentifier: string;

    /**
     * Loop: 2010AC, Segment: NM1, Element: NM108, Notes: 'PI' Payor Identification and
     * 'XV' Centers for Medicare/Medicaid Services PlanID
     */
    primaryIdentifierTypeCode: 'PI' | 'XV';

    /**
     * Loop: 2010AC, Segment: REF, Element: REF02 when REF01=EI
     */
    taxIdentificationNumber: string;

    /**
     * Loop: 2010AC, Segment: REF, Element: REF02
     */
    secondaryIdentifier?: string;

    /**
     * Loop: 2010AC, Segment: REF, Element: REF01, Notes: '2U Payer Identification
     * Number, 'FY' Claim Office Number, 'NF National Association of Insurance
     * Commissioners'
     */
    secondaryIdentifierTypeCode?: '2U' | 'FY' | 'NF';
  }

  /**
   * Loop: 2420F
   */
  export interface Referring {
    providerType: string;

    /**
     * N3 and N4
     */
    address?: V3API.Address;

    /**
     * Loop: 2010AC, Segment: REF, Element: REF02 when REF01=FY
     */
    claimOfficeNumber?: string;

    /**
     * REF02 when REF01=G2
     */
    commercialNumber?: string;

    /**
     * PER
     */
    contactInformation?: V3API.ContactInformation;

    /**
     * REF02 when REF01=EI, Notes: The Employer Identification Number must be a string
     * of exactly nine numbers with no separators
     */
    employerId?: string;

    /**
     * LOOP: 2010AC, Segment: REF, Element: REF02 when REF01=EI
     */
    employerIdentificationNumber?: string;

    /**
     * NM104
     */
    firstName?: string;

    /**
     * NM103
     */
    lastName?: string;

    /**
     * REF02 when REF01=LU
     */
    locationNumber?: string;

    /**
     * NM105
     */
    middleName?: string;

    /**
     * Loop: 2010AC, Segment: REF, Element: REF02 when REF01=NF, Notes: National
     * Association of Insurance Commissioners (NAIC) Code
     */
    naic?: string;

    /**
     * NM109, Notes: National Provider Identifier
     */
    npi?: string;

    /**
     * NM103
     */
    organizationName?: string;

    /**
     * LOOP: 2010AC, Segment: REF, Element: REF02 when REF01=2U
     */
    payerIdentificationNumber?: string;

    /**
     * REF02 when REF01=1G, Notes: UPINs must be formatted as either X99999 or XXX999
     */
    providerUpinNumber?: string;

    /**
     * REF02 when REF01=SY, Notes: The Social Security Number must be a string of nine
     * numbers with no separators
     */
    ssn?: string;

    /**
     * REF02 when REF01=0B
     */
    stateLicenseNumber?: string;

    /**
     * NM107
     */
    suffix?: string;

    /**
     * PRV03
     */
    taxonomyCode?: string;
  }

  /**
   * Loop: 2420A
   */
  export interface Rendering {
    providerType: string;

    /**
     * N3 and N4
     */
    address?: V3API.Address;

    /**
     * Loop: 2010AC, Segment: REF, Element: REF02 when REF01=FY
     */
    claimOfficeNumber?: string;

    /**
     * REF02 when REF01=G2
     */
    commercialNumber?: string;

    /**
     * PER
     */
    contactInformation?: V3API.ContactInformation;

    /**
     * REF02 when REF01=EI, Notes: The Employer Identification Number must be a string
     * of exactly nine numbers with no separators
     */
    employerId?: string;

    /**
     * LOOP: 2010AC, Segment: REF, Element: REF02 when REF01=EI
     */
    employerIdentificationNumber?: string;

    /**
     * NM104
     */
    firstName?: string;

    /**
     * NM103
     */
    lastName?: string;

    /**
     * REF02 when REF01=LU
     */
    locationNumber?: string;

    /**
     * NM105
     */
    middleName?: string;

    /**
     * Loop: 2010AC, Segment: REF, Element: REF02 when REF01=NF, Notes: National
     * Association of Insurance Commissioners (NAIC) Code
     */
    naic?: string;

    /**
     * NM109, Notes: National Provider Identifier
     */
    npi?: string;

    /**
     * NM103
     */
    organizationName?: string;

    /**
     * LOOP: 2010AC, Segment: REF, Element: REF02 when REF01=2U
     */
    payerIdentificationNumber?: string;

    /**
     * REF02 when REF01=1G, Notes: UPINs must be formatted as either X99999 or XXX999
     */
    providerUpinNumber?: string;

    /**
     * REF02 when REF01=SY, Notes: The Social Security Number must be a string of nine
     * numbers with no separators
     */
    ssn?: string;

    /**
     * REF02 when REF01=0B
     */
    stateLicenseNumber?: string;

    /**
     * NM107
     */
    suffix?: string;

    /**
     * PRV03
     */
    taxonomyCode?: string;
  }
}

export interface V3ValidateRawX12ClaimParams {
  /**
   * Body param: For the x12 endpoint, the value should be a full 837 edi request.
   */
  x12?: string;

  /**
   * Header param:
   */
  'X-CHC-ClaimSubmission-BillerId'?: string;

  /**
   * Header param:
   */
  'X-CHC-ClaimSubmission-Pwd'?: string;

  /**
   * Header param:
   */
  'X-CHC-ClaimSubmission-SubmitterId'?: string;

  /**
   * Header param:
   */
  'X-CHC-ClaimSubmission-Username'?: string;

  /**
   * Header param:
   */
  'X-CHC-TraceId'?: string;

  /**
   * Header param:
   */
  'x-chng-trace-id'?: string;
}

export declare namespace V3 {
  export {
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
