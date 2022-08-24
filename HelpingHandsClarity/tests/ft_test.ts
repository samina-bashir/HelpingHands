
import { Clarinet, Tx, Chain, Account, types } from 'https://deno.land/x/clarinet@v0.31.0/index.ts';
import { assertEquals } from 'https://deno.land/std@0.90.0/testing/asserts.ts';

Clarinet.test({
    name: "Ensure that FT Asset Name is correct!",
    async fn(chain: Chain, accounts: Map<string, Account>) {
        const deployer = accounts.get("deployer")!;
        let block = chain.callReadOnlyFn("ft","get-name",[],deployer.address);
        block.result.expectOk().expectAscii("SM-Coin");  
    },
});

Clarinet.test({
    name: "Ensure that FT Symbol is correct!",
    async fn(chain: Chain, accounts: Map<string, Account>) {
        const deployer = accounts.get("deployer")!;
        let block = chain.callReadOnlyFn("ft","get-symbol",[],deployer.address);
        block.result.expectOk().expectAscii("SM");  
    },
});

Clarinet.test({
    name: "Ensure that FT Decimals are correct!",
    async fn(chain: Chain, accounts: Map<string, Account>) {
        const deployer = accounts.get("deployer")!;
        let block = chain.callReadOnlyFn("ft","get-decimals",[],deployer.address);
        block.result.expectOk().expectUint(2);  
    },
});

Clarinet.test({
    name: "Ensure that Contract owner can mint Fungible Token",
    async fn(chain: Chain, accounts: Map<string, Account>) {
        const deployer = accounts.get("deployer")!;
        let block = chain.mineBlock([
            Tx.contractCall("ft","mint",[types.uint(30),types.principal(deployer.address)],deployer.address)
        ]);
        assertEquals(block.receipts.length, 1);
        assertEquals(block.height, 2);
        block.receipts[0].result.expectOk().expectBool(true);
        block.receipts[0].events.expectFungibleTokenMintEvent(30,deployer.address,"SM-Coin");
    },
});

Clarinet.test({
    name: "Ensure that person other than Contract owner cannot mint FT",
    async fn(chain: Chain, accounts: Map<string, Account>) {
        const deployer = accounts.get("deployer")!;
        const wallet1 = accounts.get("wallet_1")!;
        let block = chain.mineBlock([
            Tx.contractCall("ft","mint",[types.uint(30),types.principal(deployer.address)],wallet1.address)
        ]);
        assertEquals(block.receipts.length, 1);
        assertEquals(block.height, 2);
        block.receipts[0].result.expectErr().expectUint(50);    
    },
});

Clarinet.test({
    name: "Ensure that FT Balance is correct!",
    async fn(chain: Chain, accounts: Map<string, Account>) {
        const deployer = accounts.get("deployer")!;
        let balanceBefore = chain.callReadOnlyFn("ft","get-balance",[types.principal(deployer.address)],deployer.address);
        balanceBefore.result.expectOk().expectUint(0);  
        let block = chain.mineBlock([
            Tx.contractCall("ft","mint",[types.uint(30),types.principal(deployer.address)],deployer.address)
        ]);
        assertEquals(block.receipts.length, 1);
        assertEquals(block.height, 2);
        block.receipts[0].result.expectOk().expectBool(true);
        let balanceAfter = chain.callReadOnlyFn("ft","get-balance",[types.principal(deployer.address)],deployer.address);
        balanceAfter.result.expectOk().expectUint(30);  
    },
});

Clarinet.test({
    name: "Ensure that FT total supply is correct!",
    async fn(chain: Chain, accounts: Map<string, Account>) {
        const deployer = accounts.get("deployer")!;
        const wallet1 = accounts.get("wallet_1")!;
        let block = chain.mineBlock([
            Tx.contractCall("ft","mint",[types.uint(30),types.principal(deployer.address)],deployer.address),
            Tx.contractCall("ft","mint",[types.uint(50),types.principal(wallet1.address)],deployer.address)
        ]);
        assertEquals(block.receipts.length, 2);
        assertEquals(block.height, 2);
        block.receipts[0].result.expectOk().expectBool(true);
        block.receipts[1].result.expectOk().expectBool(true);
        let totalSupply = chain.callReadOnlyFn("ft","get-total-supply",[],deployer.address);
        totalSupply.result.expectOk().expectUint(80);  
    },
});

Clarinet.test({
    name: "Get Token uri!",
    async fn(chain: Chain, accounts: Map<string, Account>) {
        const deployer = accounts.get("deployer")!;
        let block = chain.mineBlock([
            Tx.contractCall("ft","mint",[types.uint(30),types.principal(deployer.address)],deployer.address)
        ]);
        assertEquals(block.receipts.length, 1);
        assertEquals(block.height, 2);
        block.receipts[0].result.expectOk().expectBool(true);
        let uri = chain.callReadOnlyFn("ft","get-token-uri",[],deployer.address);
        uri.result.expectOk().expectNone();  
    },
});

Clarinet.test({
    name: "Ensure that FT can be transferred!",
    async fn(chain: Chain, accounts: Map<string, Account>) {
        const deployer = accounts.get("deployer")!;
        const wallet1 = accounts.get("wallet_1")!;
        let block = chain.mineBlock([
            Tx.contractCall("ft","mint",[types.uint(30),types.principal(deployer.address)],deployer.address),
            Tx.contractCall("ft","transfer",[
                types.uint(10),
                types.principal(deployer.address),
                types.principal(wallet1.address),
                types.none()
            ],deployer.address)
        ]);
        assertEquals(block.receipts.length, 2);
        assertEquals(block.height, 2);
        block.receipts[0].result.expectOk().expectBool(true);
        block.receipts[1].result.expectOk().expectBool(true);
        block.receipts[1].events.expectFungibleTokenTransferEvent(10,deployer.address,wallet1.address,"SM-Coin");
    },
});

Clarinet.test({
    name: "Ensure that FT cannot be transferred if sender does not have enough balance!",
    async fn(chain: Chain, accounts: Map<string, Account>) {
        const deployer = accounts.get("deployer")!;
        const wallet1 = accounts.get("wallet_1")!;
        let block = chain.mineBlock([
            Tx.contractCall("ft","mint",[types.uint(10),types.principal(deployer.address)],deployer.address),
            Tx.contractCall("ft","transfer",[
                types.uint(30),
                types.principal(deployer.address),
                types.principal(wallet1.address),
                types.none()
            ],deployer.address)
        ]);
        assertEquals(block.receipts.length, 2);
        assertEquals(block.height, 2);
        block.receipts[0].result.expectOk().expectBool(true);
        block.receipts[1].result.expectErr().expectUint(1);

    },
});