import { Buffer } from "buffer";
import {
  AssembledTransaction,
  Client as ContractClient,
  ClientOptions as ContractClientOptions,
  MethodOptions,
  Spec as ContractSpec,
} from '@stellar/stellar-sdk/minimal/contract';
import type {
  u32,
  u64,
} from '@stellar/stellar-sdk/minimal/contract';
if (typeof window !== 'undefined') {
  //@ts-ignore Buffer exists
  window.Buffer = window.Buffer || Buffer;
}


export const networks = {
  testnet: {
    networkPassphrase: "Test SDF Network ; September 2015",
    contractId: "CCJQZEFEVYNROQZPGTJJOSCDRVWITFOTEDZQZT5YRWIDBLSKPJ3B3PDJ",
  }
} as const

export type Storage = {tag: "Chat", values: readonly [u32]};


export interface ChatMessage {
  author: string;
  message: string;
  timestamp: u64;
}

export const Errors = {

}

export interface Client {
  /**
   * Construct and simulate a send transaction. Returns an `AssembledTransaction` object which will have a `result` field containing the result of the simulation. If this transaction changes contract state, you will need to call `signAndSend()` on the returned object.
   */
  send: ({author, message}: {author: string, message: string}, options?: {
    /**
     * The fee to pay for the transaction. Default: BASE_FEE
     */
    fee?: number;

    /**
     * The maximum amount of time to wait for the transaction to complete. Default: DEFAULT_TIMEOUT
     */
    timeoutInSeconds?: number;

    /**
     * Whether to automatically simulate the transaction when constructing the AssembledTransaction. Default: true
     */
    simulate?: boolean;
  }) => Promise<AssembledTransaction<null>>

}
export class Client extends ContractClient {
  static async deploy<T = Client>(
    /** Options for initalizing a Client as well as for calling a method, with extras specific to deploying. */
    options: MethodOptions &
      Omit<ContractClientOptions, "contractId"> & {
        /** The hash of the Wasm blob, which must already be installed on-chain. */
        wasmHash: Buffer | string;
        /** Salt used to generate the contract's ID. Passed through to {@link Operation.createCustomContract}. Default: random. */
        salt?: Buffer | Uint8Array;
        /** The format used to decode `wasmHash`, if it's provided as a string. */
        format?: "hex" | "base64";
      }
  ): Promise<AssembledTransaction<T>> {
    return ContractClient.deploy(null, options)
  }
  constructor(public readonly options: ContractClientOptions) {
    super(
      new ContractSpec([ "AAAAAgAAAAAAAAAAAAAAB1N0b3JhZ2UAAAAAAQAAAAEAAAAAAAAABENoYXQAAAABAAAABA==",
        "AAAAAQAAAAAAAAAAAAAAC0NoYXRNZXNzYWdlAAAAAAMAAAAAAAAABmF1dGhvcgAAAAAAEwAAAAAAAAAHbWVzc2FnZQAAAAAQAAAAAAAAAAl0aW1lc3RhbXAAAAAAAAAG",
        "AAAAAAAAAAAAAAAEc2VuZAAAAAIAAAAAAAAABmF1dGhvcgAAAAAAEwAAAAAAAAAHbWVzc2FnZQAAAAAQAAAAAA==" ]),
      options
    )
  }
  public readonly fromJSON = {
    send: this.txFromJSON<null>
  }
}
