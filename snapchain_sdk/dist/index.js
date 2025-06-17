import { Buffer } from "buffer";
import { Client as ContractClient, Spec as ContractSpec, } from '@stellar/stellar-sdk/minimal/contract';
if (typeof window !== 'undefined') {
    //@ts-ignore Buffer exists
    window.Buffer = window.Buffer || Buffer;
}
export const networks = {
    testnet: {
        networkPassphrase: "Test SDF Network ; September 2015",
        contractId: "CCJQZEFEVYNROQZPGTJJOSCDRVWITFOTEDZQZT5YRWIDBLSKPJ3B3PDJ",
    }
};
export const Errors = {};
export class Client extends ContractClient {
    options;
    static async deploy(
    /** Options for initalizing a Client as well as for calling a method, with extras specific to deploying. */
    options) {
        return ContractClient.deploy(null, options);
    }
    constructor(options) {
        super(new ContractSpec(["AAAAAgAAAAAAAAAAAAAAB1N0b3JhZ2UAAAAAAQAAAAEAAAAAAAAABENoYXQAAAABAAAABA==",
            "AAAAAQAAAAAAAAAAAAAAC0NoYXRNZXNzYWdlAAAAAAMAAAAAAAAABmF1dGhvcgAAAAAAEwAAAAAAAAAHbWVzc2FnZQAAAAAQAAAAAAAAAAl0aW1lc3RhbXAAAAAAAAAG",
            "AAAAAAAAAAAAAAAEc2VuZAAAAAIAAAAAAAAABmF1dGhvcgAAAAAAEwAAAAAAAAAHbWVzc2FnZQAAAAAQAAAAAA=="]), options);
        this.options = options;
    }
    fromJSON = {
        send: (this.txFromJSON)
    };
}
