/* tslint:disable */
/* eslint-disable */
/**
 * Jupiter API
 * Jupiter quote and swap API
 *
 * The version of the OpenAPI document: 0.0.0
 * 
 *
 * NOTE: This class is auto generated by OpenAPI Generator (https://openapi-generator.tech).
 * https://openapi-generator.tech
 * Do not edit the class manually.
 */

import { exists, mapValues } from '../runtime';
/**
 * Only returned when userPublicKey is given to /quote
 * @export
 * @interface InlineResponseDefaultFees
 */
export interface InlineResponseDefaultFees {
    /**
     * This inidicate the total amount needed for signing transaction(s). Value in lamports.
     * @type {number}
     * @memberof InlineResponseDefaultFees
     */
    signatureFee?: number;
    /**
     * This inidicate the total amount needed for deposit of serum order account(s). Value in lamports.
     * @type {Array<number>}
     * @memberof InlineResponseDefaultFees
     */
    openOrdersDeposits?: Array<number>;
    /**
     * This inidicate the total amount needed for deposit of associative token account(s). Value in lamports.
     * @type {Array<number>}
     * @memberof InlineResponseDefaultFees
     */
    ataDeposits?: Array<number>;
    /**
     * This inidicate the total lamports needed for fees and deposits above.
     * @type {number}
     * @memberof InlineResponseDefaultFees
     */
    totalFeeAndDeposits?: number;
    /**
     * This inidicate the minimum lamports needed for transaction(s). Might be used to create wrapped SOL and will be returned when the wrapped SOL is closed.
     * @type {number}
     * @memberof InlineResponseDefaultFees
     */
    minimumSOLForTransaction?: number;
}

export function InlineResponseDefaultFeesFromJSON(json: any): InlineResponseDefaultFees {
    return InlineResponseDefaultFeesFromJSONTyped(json, false);
}

export function InlineResponseDefaultFeesFromJSONTyped(json: any, ignoreDiscriminator: boolean): InlineResponseDefaultFees {
    if ((json === undefined) || (json === null)) {
        return json;
    }
    return {
        
        'signatureFee': !exists(json, 'signatureFee') ? undefined : json['signatureFee'],
        'openOrdersDeposits': !exists(json, 'openOrdersDeposits') ? undefined : json['openOrdersDeposits'],
        'ataDeposits': !exists(json, 'ataDeposits') ? undefined : json['ataDeposits'],
        'totalFeeAndDeposits': !exists(json, 'totalFeeAndDeposits') ? undefined : json['totalFeeAndDeposits'],
        'minimumSOLForTransaction': !exists(json, 'minimumSOLForTransaction') ? undefined : json['minimumSOLForTransaction'],
    };
}

export function InlineResponseDefaultFeesToJSON(value?: InlineResponseDefaultFees | null): any {
    if (value === undefined) {
        return undefined;
    }
    if (value === null) {
        return null;
    }
    return {
        
        'signatureFee': value.signatureFee,
        'openOrdersDeposits': value.openOrdersDeposits,
        'ataDeposits': value.ataDeposits,
        'totalFeeAndDeposits': value.totalFeeAndDeposits,
        'minimumSOLForTransaction': value.minimumSOLForTransaction,
    };
}

