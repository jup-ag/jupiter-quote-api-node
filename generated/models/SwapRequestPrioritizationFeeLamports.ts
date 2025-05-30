/* tslint:disable */
/* eslint-disable */
/**
 * Swap API
 * The heart and soul of Jupiter lies in the Quote and Swap API.  ### API Rate Limit Since 1 December 2024, we have updated our API structure. Please refer to [Developer Docs](https://dev.jup.ag/docs/) for further details on usage and rate limits.  ### API Usage - API Wrapper Typescript [@jup-ag/api](https://github.com/jup-ag/jupiter-quote-api-node)  ### Data Types To Note - Public keys are base58 encoded strings - Raw data such as Vec<u8\\> are base64 encoded strings 
 *
 * The version of the OpenAPI document: 1.0.0
 * 
 *
 * NOTE: This class is auto generated by OpenAPI Generator (https://openapi-generator.tech).
 * https://openapi-generator.tech
 * Do not edit the class manually.
 */

import { exists, mapValues } from '../runtime';
import type { SwapRequestPrioritizationFeeLamportsPriorityLevelWithMaxLamports } from './SwapRequestPrioritizationFeeLamportsPriorityLevelWithMaxLamports';
import {
    SwapRequestPrioritizationFeeLamportsPriorityLevelWithMaxLamportsFromJSON,
    SwapRequestPrioritizationFeeLamportsPriorityLevelWithMaxLamportsFromJSONTyped,
    SwapRequestPrioritizationFeeLamportsPriorityLevelWithMaxLamportsToJSON,
} from './SwapRequestPrioritizationFeeLamportsPriorityLevelWithMaxLamports';

/**
 * - To specify a level or amount of additional fees to prioritize the transaction
 * - It can be used for EITHER priority fee OR Jito tip (not both at the same time)
 * - If you want to include both, you will need to use `/swap-instructions` to add both at the same time
 * 
 * @export
 * @interface SwapRequestPrioritizationFeeLamports
 */
export interface SwapRequestPrioritizationFeeLamports {
    /**
     * 
     * @type {SwapRequestPrioritizationFeeLamportsPriorityLevelWithMaxLamports}
     * @memberof SwapRequestPrioritizationFeeLamports
     */
    priorityLevelWithMaxLamports?: SwapRequestPrioritizationFeeLamportsPriorityLevelWithMaxLamports;
    /**
     * - Exact amount of tip to use in a tip instruction
     * - Refer to Jito docs on how to estimate the tip amount based on percentiles
     * - It has to be used together with a connection to a Jito RPC
     * - [See their docs](https://docs.jito.wtf/)
     * 
     * @type {number}
     * @memberof SwapRequestPrioritizationFeeLamports
     */
    jitoTipLamports?: number;
}

/**
 * Check if a given object implements the SwapRequestPrioritizationFeeLamports interface.
 */
export function instanceOfSwapRequestPrioritizationFeeLamports(value: object): boolean {
    let isInstance = true;

    return isInstance;
}

export function SwapRequestPrioritizationFeeLamportsFromJSON(json: any): SwapRequestPrioritizationFeeLamports {
    return SwapRequestPrioritizationFeeLamportsFromJSONTyped(json, false);
}

export function SwapRequestPrioritizationFeeLamportsFromJSONTyped(json: any, ignoreDiscriminator: boolean): SwapRequestPrioritizationFeeLamports {
    if ((json === undefined) || (json === null)) {
        return json;
    }
    return {
        
        'priorityLevelWithMaxLamports': !exists(json, 'priorityLevelWithMaxLamports') ? undefined : SwapRequestPrioritizationFeeLamportsPriorityLevelWithMaxLamportsFromJSON(json['priorityLevelWithMaxLamports']),
        'jitoTipLamports': !exists(json, 'jitoTipLamports') ? undefined : json['jitoTipLamports'],
    };
}

export function SwapRequestPrioritizationFeeLamportsToJSON(value?: SwapRequestPrioritizationFeeLamports | null): any {
    if (value === undefined) {
        return undefined;
    }
    if (value === null) {
        return null;
    }
    return {
        
        'priorityLevelWithMaxLamports': SwapRequestPrioritizationFeeLamportsPriorityLevelWithMaxLamportsToJSON(value.priorityLevelWithMaxLamports),
        'jitoTipLamports': value.jitoTipLamports,
    };
}

