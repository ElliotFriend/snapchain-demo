# Stellar Smart Contract Demo: Snapchain


**Consensus 2025: Stellar Toronto Builder Summit - Snapchain Smart Contract Walkthrough**
<a href="https://www.youtube.com/watch?v=TB7ORkbxcpQ">
	<img width="873" alt="image" src="https://github.com/user-attachments/assets/22fb8e02-3cfd-4c30-94df-e37e0af193e9" />
</a>

Learn how to build smart contracts on the ✨ [Stellar Network](https://developers.stellar.org/)
with [smart wallets](https://developers.stellar.org/docs/build/apps/smart-wallets)
powered by Stellar Dev Tools
like the **Stellar CLI**, the **Stellar Javascript SDK**, **Passkey Kit** and **Launchtube**.

With a super-light front-end built with **Vite**.

**🛠️ Dev Tools**

- 💻 [Stellar CLI](https://developers.stellar.org/docs/tools/cli/install-cli)
	- Featuring: [Generating Bindings](https://developers.stellar.org/docs/tools/cli/stellar-cli#stellar-contract-bindings)
- ⚙️ [Stellar Javascript SDK](https://developers.stellar.org/docs/tools/sdks/client-sdks#javascript-sdk)
	- Featuring: [Stellar RPC Server](https://stellar.github.io/js-stellar-sdk/module-rpc.Server.html)
- 🔐 [Passkey Kit](https://github.com/kalepail/passkey-kit) - Seamless authentication
- 🚀 [Launchtube](https://github.com/stellar/launchtube) - Transaction submission and paymaster functionality

---

### 🔐 Passkey Kit: Simplifying UX

[Passkey Kit GitHub Repository](https://github.com/kalepail/passkey-kit)

Self-custody is too complicated for users.

**Passkey Kit** streamlines user experience leveraging biometric authentication for signing and
fine-grained authorization of Stellar transactions
with [Policy Signers](https://github.com/kalepail/passkey-kit/tree/next/contracts/sample-policy).

---

### 🚀 Launchtube: Get your Operation On-Chain

[Launchtube GitHub Repository](https://github.com/stellar/launchtube)

Launchtube is a super cool service that abstracts away the complexity of
submitting transactions.

1. **Transaction Lifecycle Management**:
	- Transaction Submission
	- Retries
	- Working around rate limits

2. **Paymaster Service**:
	- Pays transaction fees

---

## ✨ Stellar Smart Contract Snapchain Demo

Secure, passkey-powered, chat messages.
Message content is persisted in temporary contract storage.

**Path:** `contracts/snapchain`

### Build and Deploy your Smart Contract

[Local environment setup](https://developers.stellar.org/docs/build/smart-contracts/getting-started) is step one!

For support, visit our [Discord server](https://discord.gg/stellardev).

**Build contract:**

```bash
stellar contract build
```

**Deploy Snapchain contract:**

```bash
stellar contract deploy \
    --wasm target/wasm32-unknown-unknown/release/snapchain.wasm \
    --source alice \
    --network testnet
```

**Get your Deployed Contract ID:**

_Example terminal output:_

```terminaloutput
🔗 https://stellar.expert/explorer/testnet/contract/CBK6E4G3DCE3OR44ZYMKV36O35LMUIGH7LRV4GIUUMA5UDNWS57MAJN3
✅ Deployed!
CBK6E4G3DCE3OR44ZYMKV36O35LMUIGH7LRV4GIUUMA5UDNWS57MAJN3
```

## Snapchain `lib.rs` Walkthrough

Follow along [here](contracts/snapchain/src/lib.rs).

### Storing Data

How data is stored is an important consideration!

**Storage Key Definition:**

Unique key with which to store or retrieve data.

```rust
#[contracttype]
pub enum Storage {
	Chat(u32) // : ChatMessage
}
```

- [Enums in Rust](https://doc.rust-lang.org/book/ch06-01-defining-an-enum.html) define an enumeration, a limited set
  of possible values
- This `enum` defines a single possible variant of `Storage` keys of the type `Chat`
- This custom data type acts as a key to look up a stored value
- The `Chat` type is associated with a `u32`(unsigned 32-bit int)

All together, this gives us a unique, namedspaced custom data type to function as a key
to store and retrieve `ChatMessage` values from storage

Using the Data Key in the format `Namespace::Variant(Associated value)`:

```rust
let mut index: u32 = 1;
Storage::Chat(index)
```

**Storage Value Type Definition:**

Defines the interface for storing data.

```rust
#[contracttype]
pub struct ChatMessage {
	author: Address,
	message: String,
	timestamp: u64,
}
```

- [Structs in Rust](https://doc.rust-lang.org/book/ch05-01-defining-structs.html) define a type with multiple named associated values called **fields**
- The name of the struct, `ChatMessage` is a type that describes the purpose of the data grouping
- Each field is defined in the format `name: Type`
- This struct functions as an interface of key:value pairs that define an atomic piece of data to be stored
- Field definitions:
  - An `Address` type representing the author of the `ChatMessage`
  - A `soroban_sdk::string` type representing the message contents
  - A `u64` type representing the timestamp when the `ChatMessage` was sent

> **⚠️ Warning**
> 
> A common mistake is importing the `alloc::string::String` type which will cause 
> you all sorts of issues!
> 
> Make sure you import the `soroban_sdk::{String}` type!

**Instanciate a `ChatMessage` instance to store:**
```rust
ChatMessage {
	author,
	message,
	timestamp: env.ledger().timestamp(),
}
```

#### Storing Soroban Data using the `Env` Interface

How to store data on-chain:

```rust
env.storage().temporary().set::<Storage, ChatMessage>(
	&Storage::Chat(next_index), 
	&ChatMessage {
        author,
        message,
        timestamp: env.ledger().timestamp(),
	}
);

```

**Storing data on-chain**
- Your function definition will need to include a reference to the `Env` type
- The [soroban_sdk::env](https://docs.rs/soroban-sdk/latest/soroban_sdk/struct.Env.html) type provides ways to interact with the execution enviroment
  - **TL;DR;** Contracts talk to the Stellar network via the environment interface
- The `env.storage.temporary().set` function allows for storing data on-chain with a limited lifespan
  - Data that needs to be [stored permanantly](https://developers.stellar.org/docs/learn/encyclopedia/storage/persisting-data) should go into `persistent()` durability
  - Check out the docs for help on choosing the [right storage durability](https://developers.stellar.org/docs/learn/encyclopedia/storage/persisting-data#best-practices)
- The diamond notation `::<Storage, ChatMessage>` is an optional [generic](https://doc.rust-lang.org/book/ch10-01-syntax.html) for type-safety
  - Indicates the storage key will be of the type `Storage` and the stored value will be of the type `ChatMessage`
- The statement `&Storage::Chat(next_index)` defines a key to store and retrieve on-chain data
- The statement `&ChatMessage { author, message, timestamp: env.ledger().timestamp() }` defines the data to be stored

### `send()` Function Auth

**Auth**

Review line 24 in the contract, `contracts/snapchain/src/lib.rs`

**soroban_sdk::address::require_auth**

The `require_auth` statement controls access to who can invoke this function.

```rust
author.require_auth();
```

- Ensures the `Address` has authorized the current invocation(including all the invocation arguments)
- Provided by the Soroban Rust SDK
- Sensible built-in security

## Invoking your Smart Contract

Invoke your deployed contract `send()` function:

```bash
stellar contract invoke \
    --id CBUMOJAEAPLQUCWVIM6HJH5XKXW5OP7CRVOOYMJYSTZ6GFDNA72O2QW6 \
    --source alice2 \
    -- \
    send \
    --author GDCJMCMYNDZ2FV6UMSEYRMUSCX53KCG2AWPBFQ24EA2FFYBCEDMFCBCV \
    --message new-mesg-test2
```

---

## Using a Rpc Server to Look up `ChatMessage` Key Data

**Path:**  `src/stellar.ts`

`stellar.ts` provides an interface for calling a Stellar RPC server.
We will use it to manage contract storage key data.
It uses the [Stellar Javascript SDK](https://stellar.github.io/js-stellar-sdk/)

### Contract Data Storage Keys

Getting storage key index data and building objects to represent `ChatMessage` keys.

**Get Next Index** 

Let's get the index sequentially, where we would store a new `ChatMessage`.

This essentially functions as the length of the array of messages.

**Example(index -> message):**
* `0` -> `ChatMessage` 1
* `1` -> `ChatMessage` 2
* `2` -> `NextIndex`

Getting next index:

`src/stellar.ts`
```typescript
async function getNextIndex(): Promise<number> {
    // Define the deployed contract on testnet
	const snapchainContract = new Contract(networks.testnet.contractId)
	// Retrieve on-chain data owned by the contract
	const { entries } = await rpc.getLedgerEntries(snapchainContract.getFootprint())
	// Find the storage entry representing the current index + 1
	// i.e. Find the index that a new ChatMessage sequentially should be stored under
	const nextIndex = entries[0].val
	.contractData().val().instance().storage()
		?.find((e) => scValToNative(e.key()) === 'INDEX');
    // If there are no current ChatMessages, return 0
	return nextIndex ? scValToNative(nextIndex.val()) : 0;
}
```

**Chat Ledger Key Array**

Create an array of storage keys(`Storage::Chat(u32)`) used to look up ChatMessage storage entries.

`src/stellar.ts`

```typescript
function createChatLedgerKeys(latestIndex: number): xdr.LedgerKey[] {
    // Create an array of LedgerKey entries to look up all ChatMessages
    return Array.from({ length: latestIndex}, (_, i) => latestIndex - i).map((c) =>
        // Create an XDR entry representing the key used to look up ChatMessage storage entries
	    xdr.LedgerKey.contractData(
            // Define the deployed contract, storage key, and storage type
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
```

- [XDR](https://developers.stellar.org/docs/learn/encyclopedia/data-format/xdr) is a binary format used to represent on-chain externally like in a web app
- [LedgerKeyContractData](https://developers.stellar.org/docs/data/apis/rpc/api-reference/methods/getLedgerEntries) XDR objects are used to look up data on-chain that belongs to a contract
- A ledger key for contract data consists of 3 parts
  - The deployed contract ID
  - The storage key consisting of 
    - The custom data type name.  e.g. `Chat`
    - The associated value.  e.g. `u32`
  - Durability:  Either temporary, persistent or instance

---

## Fetch and Display `ChatMessage` Content

`src/stellar.ts` was used to build an array of lookup keys.  Now let's get the ChatMessage content
and display it in the UI.

**Path:**  `src/chitChat.ts`

`chitChat.ts` gets chat message data and displays it

### Fetch ChatMessage Contract Data 

Fetch chat message data for display in the UI.

```typescript
    async function fetchMessages() {

	// Get array of ledger keys used to lookup ChatMessages
    let possibleChats = createChatLedgerKeys(this.nextIndex - 1);
    let entries: Api.LedgerEntryResult[] = []

	// RPC limits 200 keys in a single request
    if (possibleChats.length <= 200) {
        // Pass in the Array of LedgerKeys retrieving chat messages
        entries = (await rpc.getLedgerEntries(...possibleChats)).entries
    } else {
        // Paginate in chunks of 200 chat messages
        while (possibleChats.length) {
            let tempChats = possibleChats.slice(0, 200);
            possibleChats = possibleChats.slice(200)
            entries = entries.concat(entries, (await rpc.getLedgerEntries(...tempChats)).entries)
        }
    }

    // Store retreived chat messages in Record<number, ChatMessage> array for display in UI
    this.messages = {}
    entries.forEach((e) => {
        const chatIndex = scValToNative(e.key.contractData().key())[1]
        const chatMessage: ChatMessage = scValToNative(e.val.contractData().val())
        this.messages[chatIndex] = chatMessage
    })
}
```

- Lookup `ChatMessage` entries using the `getLedgerEntries` rpc call
- Paginate entries in chunks of 200
- Transform rpc server response objects into `ChatMessage` objects for display in UI

---

## Front-end Display of ChatMessages

Review the following file:
`src/chitChat.ts`

Generate HTML markup code to display formatted chat message data:

```typescript
function renderMessage({author, message, timestamp}: ChatMessage): string {
    return `
        <article class="chat-card">
            <header><nav>
                <small>${truncate(author)}</small>
                <small>${new Date(Number(timestamp) * 1_000).toLocaleString()}</small>
            </nav></header>
            <p>${message}</p>
        </article>
    `
}
```

Insert rendered markup for each chat message into the placeholder element:

```typescript
    renderMessages() {
        let placeholder = ''
        Object.entries(this.messages)
            .forEach(([_, chatMessage]) => {
                placeholder += renderMessage(chatMessage)
            })
        this.element.innerHTML = placeholder
    }
```

---

For more details on how Passkeys and Launchtube work check out the example repo: https://github.com/kalepail/smart-stellar-demo

## 👀 Want to learn more?

Feel free to check [our documentation](https://developers.stellar.org/) or jump into
our [Discord server](https://discord.gg/stellardev).

---
