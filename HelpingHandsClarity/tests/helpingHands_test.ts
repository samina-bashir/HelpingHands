
import { Clarinet, Tx, Chain, Account, types } from 'https://deno.land/x/clarinet@v0.31.0/index.ts';
import { assertEquals } from 'https://deno.land/std@0.90.0/testing/asserts.ts';

Clarinet.test({
    name: "Ensure that needer can list his need",
    async fn(chain: Chain, accounts: Map<string, Account>) {
        const wallet1=accounts.get("wallet_1")!;
        let block = chain.mineBlock([
            Tx.contractCall("helpingHands","list-needer",[
                types.principal(wallet1.address),
                types.uint(20000),
                types.utf8("I need money .... . Here is the link to the proofs: 'https:xyz'"),
                types.some(types.ascii("email: abc@xyz.com Phone: +000 0000000"))
            ],
                wallet1.address)
        ]);
        assertEquals(block.receipts.length, 1);
        assertEquals(block.height, 2); 
        block.receipts[0].result.expectOk().expectUint(0);
    },
});

Clarinet.test({
    name: "Ensure that listed need info can be retrived",
    async fn(chain: Chain, accounts: Map<string, Account>) {
        const wallet1=accounts.get("wallet_1")!;
        const deployer=accounts.get("deployer")!;
        let block = chain.mineBlock([
            Tx.contractCall("helpingHands","list-needer",[
                types.principal(wallet1.address),
                types.uint(20000),
                types.utf8("I need money for ... .Here is the link to the proofs: ..."),
                types.some(types.ascii("email: abc@xyz.com Phone: +000 0000000"))
            ],
                wallet1.address)
        ]);
        assertEquals(block.receipts.length, 1);
        assertEquals(block.height, 2); 
     
        block.receipts[0].result.expectOk().expectUint(0);
        let listing = chain.callReadOnlyFn("helpingHands","get-listing-at",[types.uint(0)],deployer.address);
        const listingTuple=listing.result.expectOk().expectSome().expectTuple();
        assertEquals(listingTuple.needer,wallet1.address);
        assertEquals(listingTuple.amountNeeded,types.uint(20000));
        assertEquals(listingTuple.description,types.utf8("I need money for ... .Here is the link to the proofs: ..."));
        assertEquals(listingTuple.contactInfo,types.some((types.ascii("email: abc@xyz.com Phone: +000 0000000"))));
        assertEquals(listingTuple.amountCollected,types.uint(0));
    },
});

Clarinet.test({
    name: "Ensure that listed needs count can be retrived",
    async fn(chain: Chain, accounts: Map<string, Account>) {
        const wallet1=accounts.get("wallet_1")!;
        const deployer=accounts.get("deployer")!;
        let block = chain.mineBlock([
            Tx.contractCall("helpingHands","list-needer",[
                types.principal(wallet1.address),
                types.uint(20000),
                types.utf8("I need money for ... .Here is the link to the proofs: ..."),
                types.some(types.ascii("email: abc@xyz.com Phone: +000 0000000"))
            ],
                wallet1.address)
        ]);
        assertEquals(block.receipts.length, 1);
        assertEquals(block.height, 2); 
     
        block.receipts[0].result.expectOk().expectUint(0);
        let listingCount = chain.callReadOnlyFn("helpingHands","get-listing-count",[],deployer.address);
        listingCount.result.expectUint(1);
     
    },
});

Clarinet.test({
    name: "Ensure that error is generated if listing is undefined",
    async fn(chain: Chain, accounts: Map<string, Account>) {
        const wallet1=accounts.get("wallet_1")!;
        let listing = chain.callReadOnlyFn("helpingHands","get-listing-at",[types.uint(0)],wallet1.address);
        listing.result.expectErr().expectUint(100);
    },
});

Clarinet.test({
    name: "Ensure that needer can change his contact Info",
    async fn(chain: Chain, accounts: Map<string, Account>) {
        const wallet1=accounts.get("wallet_1")!;
        let block = chain.mineBlock([
            Tx.contractCall("helpingHands","list-needer",[
                types.principal(wallet1.address),
                types.uint(20000),
                types.utf8("I need money for .... .Here is the link to the proofs: 'https:xyz'"),
                types.some(types.ascii("email: abc@xyz.com Phone: +000 0000000"))
            ],
                wallet1.address),
            Tx.contractCall("helpingHands","edit-contact-info",[types.uint(0),types.none()],wallet1.address)
        ]);
        assertEquals(block.receipts.length, 2);
        assertEquals(block.height, 2); 
        block.receipts[0].result.expectOk().expectUint(0);
        block.receipts[1].result.expectOk().expectBool(true);
        let listing = chain.callReadOnlyFn("helpingHands","get-listing-at",[types.uint(0)],wallet1.address);
        const listingTuple=listing.result.expectOk().expectSome().expectTuple();
        assertEquals(listingTuple.contactInfo,types.none());
    },
});

Clarinet.test({
    name: "Ensure that person other than needer cannot change his contact Info",
    async fn(chain: Chain, accounts: Map<string, Account>) {
        const wallet1=accounts.get("wallet_1")!;
        const deployer=accounts.get("deployer")!;
        let block = chain.mineBlock([
            Tx.contractCall("helpingHands","list-needer",[
                types.principal(wallet1.address),
                types.uint(20000),
                types.utf8("I need money for .... .Here is the link to the proofs: 'https:xyz'"),
                types.some(types.ascii("email: abc@xyz.com Phone: +000 0000000"))
            ],
                wallet1.address),
            Tx.contractCall("helpingHands","edit-contact-info",[types.uint(0),types.none()],deployer.address)
        ]);
        assertEquals(block.receipts.length, 2);
        assertEquals(block.height, 2); 
        block.receipts[0].result.expectOk().expectUint(0);
        block.receipts[1].result.expectErr().expectUint(101);
        let listing = chain.callReadOnlyFn("helpingHands","get-listing-at",[types.uint(0)],wallet1.address);
        const listingTuple=listing.result.expectOk().expectSome().expectTuple();
        assertEquals(listingTuple.contactInfo,types.some((types.ascii("email: abc@xyz.com Phone: +000 0000000"))));
    },
});

Clarinet.test({
    name: "Ensure that listing can be upvoted",
    async fn(chain: Chain, accounts: Map<string, Account>) {
        const wallet1=accounts.get("wallet_1")!;
        const deployer=accounts.get("deployer")!;
        let block = chain.mineBlock([
            Tx.contractCall("helpingHands","list-needer",[
                types.principal(wallet1.address),
                types.uint(20000),
                types.utf8("I need money for .... .Here is the link to the proofs: 'https:xyz'"),
                types.some(types.ascii("email: abc@xyz.com Phone: +000 0000000"))
            ],
                wallet1.address),
            Tx.contractCall(
                "helpingHands",
                "vote-listing",
                [types.uint(0), types.bool(true),types.utf8("I have personally ...")],
                deployer.address)
        ]);
        assertEquals(block.receipts.length, 2);
        assertEquals(block.height, 2); 
        block.receipts[0].result.expectOk().expectUint(0);
        block.receipts[1].result.expectOk().expectBool(true);
        let listing = chain.callReadOnlyFn("helpingHands","get-listing-at",[types.uint(0)],wallet1.address);
        const listingTuple=listing.result.expectOk().expectSome().expectTuple();
        assertEquals(listingTuple.upvoteCount,types.uint(1));
    },
});

Clarinet.test({
    name: "Ensure that listing can be downvoted",
    async fn(chain: Chain, accounts: Map<string, Account>) {
        const wallet1=accounts.get("wallet_1")!;
        const deployer=accounts.get("deployer")!;
        let block = chain.mineBlock([
            Tx.contractCall("helpingHands","list-needer",[
                types.principal(wallet1.address),
                types.uint(20000),
                types.utf8("I need money for .... .Here is the link to the proofs: 'https:xyz'"),
                types.some(types.ascii("email: abc@xyz.com Phone: +000 0000000"))
            ],
                wallet1.address),
            Tx.contractCall(
                "helpingHands",
                "vote-listing",
                [types.uint(0), types.bool(false),types.utf8("This information is ...")],
                deployer.address)
        ]);
        assertEquals(block.receipts.length, 2);
        assertEquals(block.height, 2); 
        block.receipts[0].result.expectOk().expectUint(0);
        block.receipts[1].result.expectOk().expectBool(true);
        let listing = chain.callReadOnlyFn("helpingHands","get-listing-at",[types.uint(0)],wallet1.address);
        const listingTuple=listing.result.expectOk().expectSome().expectTuple();
        assertEquals(listingTuple.downvoteCount,types.uint(1));
    },
    
});
Clarinet.test({
    name: "Ensure that single listing cannot be voted twice by same person",
    async fn(chain: Chain, accounts: Map<string, Account>) {
        const wallet1=accounts.get("wallet_1")!;
        const deployer=accounts.get("deployer")!;
        let block = chain.mineBlock([
            Tx.contractCall("helpingHands","list-needer",[
                types.principal(wallet1.address),
                types.uint(20000),
                types.utf8("I need money for .... .Here is the link to the proofs: 'https:xyz'"),
                types.some(types.ascii("email: abc@xyz.com Phone: +000 0000000"))
            ],
                wallet1.address),
            Tx.contractCall(
                "helpingHands",
                "vote-listing",
                [types.uint(0), types.bool(false),types.utf8("This information is ...")],
                deployer.address),
            Tx.contractCall(
                "helpingHands",
                "vote-listing",
                [types.uint(0), types.bool(true),types.utf8("I have personally ...")],
                deployer.address)
        ]);
        assertEquals(block.receipts.length, 3);
        assertEquals(block.height, 2); 
        block.receipts[0].result.expectOk().expectUint(0);
        block.receipts[1].result.expectOk().expectBool(true);
        block.receipts[2].result.expectErr().expectUint(103);
    },
});

Clarinet.test({
    name: "Ensure that needer cannot vote on his listing",
    async fn(chain: Chain, accounts: Map<string, Account>) {
        const wallet1=accounts.get("wallet_1")!;
        let block = chain.mineBlock([
            Tx.contractCall("helpingHands","list-needer",[
                types.principal(wallet1.address),
                types.uint(20000),
                types.utf8("I need money for .... .Here is the link to the proofs: 'https:xyz'"),
                types.some(types.ascii("email: abc@xyz.com Phone: +000 0000000"))
            ],
                wallet1.address),
            Tx.contractCall(
                "helpingHands",
                "vote-listing",
                [types.uint(0), types.bool(true),types.utf8("I have personally ...")],
                wallet1.address)
        ]);
        assertEquals(block.receipts.length, 2);
        assertEquals(block.height, 2); 
        block.receipts[0].result.expectOk().expectUint(0);
        block.receipts[1].result.expectErr().expectUint(102);

    },
});

Clarinet.test({
    name: "Ensure that vote on listing can be retreived",
    async fn(chain: Chain, accounts: Map<string, Account>) {
        const wallet1=accounts.get("wallet_1")!;
        const wallet2=accounts.get("wallet_2")!;
        const deployer=accounts.get("deployer")!;
        let block = chain.mineBlock([
            Tx.contractCall("helpingHands","list-needer",[
                types.principal(wallet1.address),
                types.uint(20000),
                types.utf8("I need money for .... .Here is the link to the proofs: 'https:xyz'"),
                types.some(types.ascii("email: abc@xyz.com Phone: +000 0000000"))
            ],
                wallet1.address),
            Tx.contractCall(
                "helpingHands",
                "vote-listing",
                [types.uint(0), types.bool(false),types.utf8("This information is ...")],
                deployer.address),
            Tx.contractCall(
                "helpingHands",
                "vote-listing",
                [types.uint(0), types.bool(true),types.utf8("I have personally ...")],
                wallet2.address)
        ]);
        assertEquals(block.receipts.length, 3);
        assertEquals(block.height, 2); 
        block.receipts[0].result.expectOk().expectUint(0);
        block.receipts[1].result.expectOk().expectBool(true);
        block.receipts[2].result.expectOk().expectBool(true);
        let listing = chain.callReadOnlyFn("helpingHands","get-listing-at",[types.uint(0)],wallet1.address);
        const listingTuple=listing.result.expectOk().expectSome().expectTuple();
        assertEquals(listingTuple.upvoteCount,types.uint(1));
        assertEquals(listingTuple.downvoteCount,types.uint(1));
        let vote1 = chain.callReadOnlyFn("helpingHands","get-vote",[types.uint(0),types.principal(deployer.address)],wallet1.address);
        vote1.result.expectOk().expectSome().expectTuple().upvote.expectBool(false);
        vote1.result.expectOk().expectSome().expectTuple().voteComment.expectUtf8("This information is ...");
        let vote2 = chain.callReadOnlyFn("helpingHands","get-vote",[types.uint(0),types.principal(wallet2.address)],wallet1.address);
        vote2.result.expectOk().expectSome().expectTuple().upvote.expectBool(true);
        vote2.result.expectOk().expectSome().expectTuple().voteComment.expectUtf8("I have personally ...");
    },
});

Clarinet.test({
    name: "Ensure that Error is thrown on trying to retrieve non existent vote..",
    async fn(chain: Chain, accounts: Map<string, Account>) {
        const wallet1=accounts.get("wallet_1")!;
        const wallet2=accounts.get("wallet_2")!;
        const deployer=accounts.get("deployer")!;
        let block = chain.mineBlock([
            Tx.contractCall("helpingHands","list-needer",[
                types.principal(wallet1.address),
                types.uint(20000),
                types.utf8("I need money for .... .Here is the link to the proofs: 'https:xyz'"),
                types.some(types.ascii("email: abc@xyz.com Phone: +000 0000000"))
            ],
                wallet1.address),
        ]);
        assertEquals(block.receipts.length, 1);
        assertEquals(block.height, 2); 
        block.receipts[0].result.expectOk().expectUint(0);
        let vote = chain.callReadOnlyFn("helpingHands","get-vote",[types.uint(0),types.principal(deployer.address)],wallet1.address);
        vote.result.expectErr().expectUint(104);

       
    },
});

Clarinet.test({
    name: "Ensure that stx can be donated against listed need",
    async fn(chain: Chain, accounts: Map<string, Account>) {
        const wallet1=accounts.get("wallet_1")!;
        const deployer=accounts.get("deployer")!;
        let block = chain.mineBlock([
            Tx.contractCall("helpingHands","list-needer",[
                types.principal(wallet1.address),
                types.uint(20000),
                types.utf8("I need money for ... .Here is the link to the proofs: ..."),
                types.some(types.ascii("email: abc@xyz.com Phone: +000 0000000"))
            ],
                wallet1.address),

            Tx.contractCall("helpingHands","donate-stx",[types.uint(0),types.uint(50)], deployer.address)
        ]);
        assertEquals(block.receipts.length, 2);
        assertEquals(block.height, 2); 
     
        block.receipts[0].result.expectOk().expectUint(0);
        block.receipts[1].result.expectOk().expectBool(true);
        block.receipts[1].events.expectSTXTransferEvent(50,deployer.address,wallet1.address);
        let listing = chain.callReadOnlyFn("helpingHands","get-listing-at",[types.uint(0)],deployer.address);
        const listingTuple=listing.result.expectOk().expectSome().expectTuple();
        assertEquals(listingTuple.needer,wallet1.address);
        assertEquals(listingTuple.amountNeeded,types.uint(20000));
        assertEquals(listingTuple.description,types.utf8("I need money for ... .Here is the link to the proofs: ..."));
        assertEquals(listingTuple.contactInfo,types.some((types.ascii("email: abc@xyz.com Phone: +000 0000000"))));
        assertEquals(listingTuple.amountCollected,types.uint(50));
    },
});

Clarinet.test({
    name: "Ensure that stx cannot be donated against listed need if donor has not enough balance",
    async fn(chain: Chain, accounts: Map<string, Account>) {
        const wallet1=accounts.get("wallet_1")!;
        const deployer=accounts.get("deployer")!;
        let block = chain.mineBlock([
            Tx.contractCall("helpingHands","list-needer",[
                types.principal(wallet1.address),
                types.uint(200),
                types.utf8("I need money for ... .Here is the link to the proofs: ..."),
                types.some(types.ascii("email: abc@xyz.com Phone: +000 0000000"))
            ],
                wallet1.address),

            Tx.contractCall("helpingHands","donate-stx",[types.uint(0),types.uint(100)], deployer.address)
        ]);
        assertEquals(block.receipts.length, 2);
        assertEquals(block.height, 2); 
     
        block.receipts[0].result.expectOk().expectUint(0);
        block.receipts[1].result.expectErr().expectUint(1);
        let listing = chain.callReadOnlyFn("helpingHands","get-listing-at",[types.uint(0)],deployer.address);
        const listingTuple=listing.result.expectOk().expectSome().expectTuple();
        assertEquals(listingTuple.needer,wallet1.address);
        assertEquals(listingTuple.amountCollected,types.uint(0));
    },
});

Clarinet.test({
    name: "Ensure that FT can be donated to specific address",
    async fn(chain: Chain, accounts: Map<string, Account>) {
        const wallet1=accounts.get("wallet_1")!;
        const deployer=accounts.get("deployer")!;
        let block = chain.mineBlock([
            Tx.contractCall("ft","mint",[types.uint(50),types.principal(deployer.address)],deployer.address),
        ]);
        assertEquals(block.receipts.length, 1);
        assertEquals(block.height, 2); 
        
        block.receipts[0].result.expectOk().expectBool(true);
        block.receipts[0].events.expectFungibleTokenMintEvent(50,deployer.address,"SM-Coin");
        
        const [ftContractPrincipal, ftId] = block.receipts[0].events[0].ft_mint_event.asset_identifier.split('::');
    
        let donate = chain.mineBlock([
           Tx.contractCall("helpingHands","donate-ft",[
            types.principal(ftContractPrincipal),
            types.uint(50),
            types.principal(wallet1.address)
           ], deployer.address)
        ]);
        donate.receipts[0].result.expectOk().expectBool(true);
        donate.receipts[0].events.expectFungibleTokenTransferEvent(50,deployer.address, wallet1.address, ftId);
    },
});


Clarinet.test({
    name: "Ensure that NFT can be donated to specific address",
    async fn(chain: Chain, accounts: Map<string, Account>) {
        const wallet1=accounts.get("wallet_1")!;
        const deployer=accounts.get("deployer")!;
        let block = chain.mineBlock([
            Tx.contractCall("nft", "mint", [types.principal(deployer.address),types.none()], deployer.address)
        ]);
        assertEquals(block.receipts.length, 1);
        assertEquals(block.height, 2); 
        
        block.receipts[0].result.expectOk().expectUint(0);   
        
        block.receipts[0].events.expectNonFungibleTokenMintEvent(types.uint(0), deployer.address, 
        `${deployer.address}.nft`,"NFT");

        const [nftContractPrincipal, nftId] = block.receipts[0].events[0].nft_mint_event.asset_identifier.split('::');

        let donate = chain.mineBlock([
           Tx.contractCall("helpingHands","donate-nft",[
            types.principal(nftContractPrincipal),
            types.uint(0),
            types.principal(wallet1.address)
           ], deployer.address)
        ]);
        donate.receipts[0].result.expectOk().expectBool(true);
        donate.receipts[0].events.expectNonFungibleTokenTransferEvent(
            types.uint(0),
            deployer.address, 
            wallet1.address, 
            nftContractPrincipal,
            nftId
        )
    },
});
