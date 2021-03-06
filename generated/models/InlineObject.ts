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
import {
    Def1,
    Def1FromJSON,
    Def1FromJSONTyped,
    Def1ToJSON,
} from './Def1';

/**
 * 
 * @export
 * @interface InlineObject
 */
export interface InlineObject {
    /**
     * 
     * @type {Def1}
     * @memberof InlineObject
     */
    route: Def1;
    /**
     * Wrap/unwrap SOL
     * @type {boolean}
     * @memberof InlineObject
     */
    wrapUnwrapSOL?: boolean;
    /**
     * fee account
     * @type {string}
     * @memberof InlineObject
     */
    feeAccount?: string;
    /**
     * custom token ledger account
     * @type {string}
     * @memberof InlineObject
     */
    tokenLedger?: string;
    /**
     * Public key of the user
     * @type {string}
     * @memberof InlineObject
     */
    userPublicKey: string;
}

export function InlineObjectFromJSON(json: any): InlineObject {
    return InlineObjectFromJSONTyped(json, false);
}

export function InlineObjectFromJSONTyped(json: any, ignoreDiscriminator: boolean): InlineObject {
    if ((json === undefined) || (json === null)) {
        return json;
    }
    return {
        
        'route': Def1FromJSON(json['route']),
        'wrapUnwrapSOL': !exists(json, 'wrapUnwrapSOL') ? undefined : json['wrapUnwrapSOL'],
        'feeAccount': !exists(json, 'feeAccount') ? undefined : json['feeAccount'],
        'tokenLedger': !exists(json, 'tokenLedger') ? undefined : json['tokenLedger'],
        'userPublicKey': json['userPublicKey'],
    };
}

export function InlineObjectToJSON(value?: InlineObject | null): any {
    if (value === undefined) {
        return undefined;
    }
    if (value === null) {
        return null;
    }
    return {
        
        'route': Def1ToJSON(value.route),
        'wrapUnwrapSOL': value.wrapUnwrapSOL,
        'feeAccount': value.feeAccount,
        'tokenLedger': value.tokenLedger,
        'userPublicKey': value.userPublicKey,
    };
}

