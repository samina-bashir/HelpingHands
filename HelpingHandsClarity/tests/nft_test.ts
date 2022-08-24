
import { Clarinet, Tx, Chain, Account, types } from 'https://deno.land/x/clarinet@v0.31.0/index.ts';
import { assertEquals } from 'https://deno.land/std@0.90.0/testing/asserts.ts';

Clarinet.test({
    name: "Ensure that nft can be minted!",
    async fn(chain: Chain, accounts: Map<string, Account>) {

        const deployer = accounts.get("deployer")!;
        const wallet2 = accounts.get("wallet_1")!;

        let block = chain.mineBlock([
           
           Tx.contractCall("nft", "mint", [types.principal(deployer.address),types.none()], deployer.address)
          
        ]);

        assertEquals(block.receipts.length, 1);
        assertEquals(block.height, 2);
        
        block.receipts[0].result.expectOk().expectUint(0);

        
        block.receipts[0].events.expectNonFungibleTokenMintEvent(types.uint(0), deployer.address, 
        `${deployer.address}.nft`, "NFT")

    },
});

Clarinet.test({
    name: "Ensure that minted nft uri can be retreived!",
    async fn(chain: Chain, accounts: Map<string, Account>) {

        const deployer = accounts.get("deployer")!;

        let block = chain.mineBlock([
           
            Tx.contractCall("nft", "mint", [
                types.principal(deployer.address),
                types.some(types.ascii("URI DATA..."))
            ], deployer.address)
          
        ]);

        assertEquals(block.receipts.length, 1);
        assertEquals(block.height, 2);
        
        block.receipts[0].result.expectOk().expectUint(0);
        
        let uri=chain.callReadOnlyFn("nft", "get-token-uri", [types.uint(0)], deployer.address)
        uri.result.expectOk().expectSome().expectAscii("URI DATA...");
        
    },
});

Clarinet.test({
    name: "Ensure that owner is correct!",
    async fn(chain: Chain, accounts: Map<string, Account>) {

        const deployer = accounts.get("deployer")!;

        let block = chain.mineBlock([
           
            Tx.contractCall("nft", "mint", [types.principal(deployer.address),types.none()], deployer.address),
            Tx.contractCall("nft", "get-owner", [types.uint(0)], deployer.address)
          
        ]);

        assertEquals(block.receipts.length, 2);
        assertEquals(block.height, 2);
        
        block.receipts[0].result.expectOk().expectUint(0);

        const owner = block.receipts[1].result.expectOk().expectSome()

        assertEquals(owner, deployer.address)
        
    },
});

Clarinet.test({
    name: "Ensure that nft can be transferred!",
    async fn(chain: Chain, accounts: Map<string, Account>) {

        const deployer = accounts.get("deployer")!;
        const wallet2 = accounts.get("wallet_1")!;

        let block = chain.mineBlock([
           
            Tx.contractCall("nft", "mint", [types.principal(deployer.address),types.none()], deployer.address),
            Tx.contractCall("nft", "transfer", [types.uint(0), types.principal(deployer.address), types.principal(wallet2.address)], deployer.address),
            Tx.contractCall("nft", "get-owner", [types.uint(0)], deployer.address)
          
        ]);

        assertEquals(block.receipts.length, 3);
        assertEquals(block.height, 2);
        
        block.receipts[0].result.expectOk().expectUint(0);
        block.receipts[1].result.expectOk().expectBool(true)

        block.receipts[1].events.expectNonFungibleTokenTransferEvent(
            types.uint(0),
            deployer.address, 
            wallet2.address, 
            `${deployer.address}.nft`,
            "NFT"
        )
        const owner = block.receipts[2].result.expectOk().expectSome()
        assertEquals(owner, wallet2.address)
        
    },
});

Clarinet.test({
    name: "Ensure that nft cannot be transferred if caller is not owner!",
    async fn(chain: Chain, accounts: Map<string, Account>) {

        const deployer = accounts.get("deployer")!;
        const wallet2 = accounts.get("wallet_1")!;

        let block = chain.mineBlock([
           
            Tx.contractCall("nft", "mint", [types.principal(wallet2.address),types.none()], deployer.address),
            Tx.contractCall("nft", "transfer", [types.uint(0), types.principal(deployer.address), types.principal(wallet2.address)], wallet2.address),
            Tx.contractCall("nft", "get-owner", [types.uint(0)], deployer.address)
          
        ]);

        assertEquals(block.receipts.length, 3);
        assertEquals(block.height, 2);
        
        block.receipts[0].result.expectOk().expectUint(0);
        block.receipts[1].result.expectErr().expectUint(1);


        const owner = block.receipts[2].result.expectOk().expectSome()

        assertEquals(owner, wallet2.address)
        
    },
});


Clarinet.test({
    name: "Ensure multiple mints work!",
    async fn(chain: Chain, accounts: Map<string, Account>) {

        const deployer = accounts.get("deployer")!;

        let block = chain.mineBlock([
           
            Tx.contractCall("nft", "mint", [types.principal(deployer.address),types.none()], deployer.address),
            Tx.contractCall("nft", "mint", [types.principal(deployer.address),types.none()], deployer.address),
            Tx.contractCall("nft", "mint", [types.principal(deployer.address),types.none()], deployer.address),
            
          
        ]);

        assertEquals(block.receipts.length, 3);
        assertEquals(block.height, 2);
        
        block.receipts[0].result.expectOk().expectUint(0);
        block.receipts[1].result.expectOk().expectUint(1);
        block.receipts[2].result.expectOk().expectUint(2);

        block.receipts[0].events.expectNonFungibleTokenMintEvent(types.uint(0), deployer.address, 
        `${deployer.address}.nft`, "NFT")
        block.receipts[1].events.expectNonFungibleTokenMintEvent(types.uint(1), deployer.address, 
        `${deployer.address}.nft`, "NFT")
        block.receipts[2].events.expectNonFungibleTokenMintEvent(types.uint(2), deployer.address, 
        `${deployer.address}.nft`, "NFT")
    },
});

Clarinet.test({
    name: "total count of nfts minted can be retreived!",
    async fn(chain: Chain, accounts: Map<string, Account>) {

        const deployer = accounts.get("deployer")!;

        let block = chain.mineBlock([
           
            Tx.contractCall("nft", "mint", [types.principal(deployer.address),types.none()], deployer.address),
            Tx.contractCall("nft", "mint", [types.principal(deployer.address),types.none()], deployer.address),
            Tx.contractCall("nft", "mint", [types.principal(deployer.address),types.none()], deployer.address),
            
          
        ]);

        assertEquals(block.receipts.length, 3);
        assertEquals(block.height, 2);
        
        block.receipts[0].result.expectOk().expectUint(0);
        block.receipts[1].result.expectOk().expectUint(1);
        block.receipts[2].result.expectOk().expectUint(2);

        block.receipts[0].events.expectNonFungibleTokenMintEvent(types.uint(0), deployer.address, 
        `${deployer.address}.nft`, "NFT")
        block.receipts[1].events.expectNonFungibleTokenMintEvent(types.uint(1), deployer.address, 
        `${deployer.address}.nft`, "NFT")
        block.receipts[2].events.expectNonFungibleTokenMintEvent(types.uint(2), deployer.address, 
        `${deployer.address}.nft`, "NFT")

        let count = chain.callReadOnlyFn("nft","get-last-token-id",[],deployer.address);
    },
});