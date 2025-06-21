import { xdr, Address, nativeToScVal, Contract, scValToNative } from '@stellar/stellar-sdk'
import { Server } from '@stellar/stellar-sdk/rpc';
import { networks } from 'snapchain_sdk'
import { truncate } from './utils';

export const rpc = new Server(import.meta.env.VITE_RPC_URL);

export async function getNextIndex(): Promise<number> {
    const snapchainContract = new Contract(networks.testnet.contractId)
    const { entries } = await rpc.getLedgerEntries(snapchainContract.getFootprint())
    const nextIndex = entries[0].val
        .contractData()
        .val()
        .instance()
        .storage()
        ?.find((e) => scValToNative(e.key()) === 'INDEX');
    return nextIndex ? scValToNative(nextIndex.val()) : 0;
}

export function createChatLedgerKeys(latestIndex: number): xdr.LedgerKey[] {
    return Array.from({ length: latestIndex}, (_, i) => latestIndex - i).map((c) =>
        xdr.LedgerKey.contractData(
            new xdr.LedgerKeyContractData({
                contract: new Address(networks.testnet.contractId).toScAddress(),
                key: nativeToScVal([
                    nativeToScVal('Chat', { type: 'symbol' }),
                    nativeToScVal(c, { type: 'u32' }),
                ]),
                durability: xdr.ContractDataDurability.temporary(),
            })
        )
    );
}

export function stellarExpertUrl(address: string): string {
    return address.startsWith('C')
        ? `https://stellar.expert/explorer/${import.meta.env.VITE_NETWORK_NAME}/contract/${address}`
        : `https://stellar.expert/explorer/${import.meta.env.VITE_NETWORK_NAME}/address/${address}`
}

export function stellarExpertLink(address: string): HTMLAnchorElement {
    const anchor = document.createElement('a');
    anchor.href = stellarExpertUrl(address);
    anchor.target = '_blank';
    anchor.textContent = truncate(address);

    return anchor
}
