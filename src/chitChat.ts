import { scrollToBottom } from "./utils";
import { account, server } from "./passkeys";
import { Client as SnapchainClient, networks, type ChatMessage } from "snapchain_sdk";
import { Api } from "@stellar/stellar-sdk/rpc";
import { createChatLedgerKeys, getNextIndex, rpc, stellarExpertLink } from "./stellar";
import { scValToNative } from "@stellar/stellar-sdk";

const snapchain = new SnapchainClient({
    rpcUrl: import.meta.env.VITE_RPC_URL,
    contractId: networks.testnet.contractId,
    networkPassphrase: import.meta.env.VITE_NETWORK_PASSPHRASE,
});

export class ChatLog {
    element: HTMLDivElement;
    latestLedger: number | undefined;
    nextIndex: number | undefined;
    messages: Record<number, {message: ChatMessage; expiration: number|undefined}> = {};

    constructor(element: HTMLDivElement) {
        this.element = element
        this.refreshChatHistory()
            .then(scrollToBottom)
    }

    renderMessages() {
        if (!Object.keys(this.messages).length) {
            this.element.innerHTML = `<p>No messages to display...</p>`
            return
        }

        for (let i = 0; i < this.nextIndex!; i++) {
            if (this.messages[i]) {
                console.log('found i', i)
            }
        }
        let messageElements = Object.entries(this.messages)
            .map(([index, chatMessage]) => renderMessage(Number(index), chatMessage.message, this.latestLedger ?? 0, chatMessage.expiration ?? 0))
        this.element.replaceChildren(...messageElements)
    }

    async sendMessage(message: string, author: string, keyId: string) {
        if (!account.wallet?.options) {
            account.connectWallet({ keyId, })
        }

        let at = await snapchain.send({
            author,
            message,
        })

        let tx = await account.sign(at.built!, { keyId })
        await server.send(tx)

        this.refreshChatHistory()
    }

    async fetchMessages() {
        if (!this.nextIndex || this.nextIndex === 0) {
            console.error('no chats yet')
            return
        }

        let possibleChats = createChatLedgerKeys(this.nextIndex - 1);
        let entries: Api.LedgerEntryResult[] = []

        if (possibleChats.length <= 200) {
            // not too many chats, make a single request
            const response = await rpc.getLedgerEntries(...possibleChats)
            entries = response.entries
            this.latestLedger = response.latestLedger
        } else {
            // more than 200 chat history, do some iterating
            while (possibleChats.length) {
                let tempChats = possibleChats.slice(0, 200);
                possibleChats = possibleChats.slice(200)
                const response = await rpc.getLedgerEntries(...tempChats)
                entries = entries.concat(entries, response.entries)
                this.latestLedger = response.latestLedger
            }
        }

        this.messages = {}
        entries.forEach((e) => {
            const chatIndex = scValToNative(e.key.contractData().key())[1]
            const chatMessage: ChatMessage = scValToNative(e.val.contractData().val())
            this.messages[chatIndex] = {
                expiration: e.liveUntilLedgerSeq,
                message: chatMessage
            }
        })
    }

    async refreshChatHistory() {
        this.nextIndex = await getNextIndex()
        await this.fetchMessages()
        this.renderMessages()
    }
}

function renderMessage(index: number, chatMessage: ChatMessage, latest: number, expiration: number): HTMLElement {
    const showExpirationStuff = latest > 0 && expiration > 0;

    // create the main chunks of a message card
    const article = document.createElement('article')
    article.classList.add('chat-card')
    const header = document.createElement('header')
    const nav = document.createElement('nav')
    const footer = document.createElement('footer')

    // fill in the "header" of the message card
    const smallTitle = document.createElement('small')
    const chatTitle = document.createElement('code')
    chatTitle.textContent = `Chat(${index})`
    smallTitle.append(chatTitle)
    const smallAuthor = document.createElement('small')
    const authorLink = stellarExpertLink(chatMessage.author)
    smallAuthor.append(authorLink)
    const smallTimestamp = document.createElement('small')
    smallTimestamp.textContent = new Date(Number(chatMessage.timestamp) * 1_000).toLocaleString()

    // create he message paragraph element
    const messageP = document.createElement('p')
    messageP.textContent = chatMessage.message

    // TODO: Add some kind of "save message" button that will extend the ledger entry's TTL
    if (showExpirationStuff) {
        const footerSmall = document.createElement('small')
        const footerCode = document.createElement('code')
        footerCode.textContent = (expiration - latest).toString()
        footerSmall.append("expires in ", footerCode, " ledgers")
        footer.append(footerSmall)
    }

    // assemble the card
    nav.append(smallTitle, smallAuthor, smallTimestamp)
    header.append(nav)
    article.append(header)
    article.append(messageP)
    showExpirationStuff && article.append(footer)

    // return the constructed message card
    return article
}
