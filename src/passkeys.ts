import { PasskeyKit, PasskeyServer } from "passkey-kit";

export const account = new PasskeyKit({
    rpcUrl: import.meta.env.VITE_RPC_URL,
    networkPassphrase: import.meta.env.VITE_NETWORK_PASSPHRASE,
    walletWasmHash: import.meta.env.VITE_WALLET_WASM_HASH,
    timeoutInSeconds: 30,
})

export const server = new PasskeyServer({
    rpcUrl: import.meta.env.VITE_RPC_URL,
    launchtubeUrl: import.meta.env.VITE_LAUNCHTUBE_URL,
    launchtubeJwt: import.meta.env.VITE_LAUNCHTUBE_JWT,
})

import { clearContractId, clearPasskeyId, saveContractId, savePasskeyId } from "./storage";
export async function signup() {
    console.log('signing up')
    try {
        const { keyIdBase64, contractId, signedTx } = await account.createWallet(
            'SnapChain',
            'user123',
        );

        if (!signedTx) {
            throw 'built transaction missing'
        }

        await server.send(signedTx)

        savePasskeyId(keyIdBase64)
        saveContractId(contractId)

        window.location.reload()
    } catch (err: unknown) {
        console.error(err)

        alert(`error signing up: ${JSON.stringify(err)}`)
    }
}

export async function login() {
    console.log('logging in')
    try {
        const { keyIdBase64, contractId } = await account.connectWallet()

        savePasskeyId(keyIdBase64)
        saveContractId(contractId)

        window.location.reload()
    } catch (err: unknown) {
        console.error(err)

        alert('error logging in');
    }
}

export function logout() {
    console.log('logging out')

    clearPasskeyId()
    clearContractId()

    window.location.reload()
}
