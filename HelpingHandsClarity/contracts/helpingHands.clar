;;Traits used
(use-trait sip-009 .sip-009.sip009-nft-trait)
(use-trait sip-010 .sip-010.sip010-ft-trait)

;;Error Codes
(define-constant ERR_LISTING_UNDEFINED (err u100))
(define-constant ERR_NEEDER_ONLY (err u101))
(define-constant ERR_CANNOT_VOTE_YOURSELF (err u102))
(define-constant ERR_ALREADY_VOTED (err u103))
(define-constant ERR_NO_SUCH_VOTE (err u104))


;;variables
(define-data-var listingNonce uint u0)

;;maps
(define-map ListingData {listingId: uint} { 
         needer: principal,
         amountNeeded: uint,
         description: (string-utf8 4000),
         contactInfo: (optional (string-ascii 100)),
         amountCollected: uint,
         upvoteCount: uint,
         downvoteCount: uint
    }
)
(define-map HonestyVotes { 
    listingId: uint,voter: principal 
    } 
    { upvote: bool , voteComment: (string-utf8 100)}
)

;;private functions
(define-private (upvote (listingId uint))
    (map-set ListingData 
                {listingId: listingId} 
                (merge (unwrap-panic (map-get? ListingData {listingId: listingId})) 
                    {upvoteCount: (+ (get upvoteCount (unwrap-panic (map-get? ListingData {listingId: listingId}))) u1) } 
                ) 
    )
)
(define-private (downvote (listingId uint))
    (map-set ListingData 
                {listingId: listingId} 
                (merge (unwrap-panic (map-get? ListingData {listingId: listingId})) 
                    {downvoteCount: (+ (get downvoteCount (unwrap-panic (map-get? ListingData {listingId: listingId}))) u1) } 
                ) 
    )
)
;;read-only
(define-read-only (get-listing-at (listingID uint)) 
   (if (> (var-get listingNonce) listingID) 
       (ok (map-get? ListingData {listingId: listingID}))
       ERR_LISTING_UNDEFINED
   ) 
)
(define-read-only (get-listing-count)
   (var-get listingNonce)
)
(define-read-only (get-vote (listingId uint) (voter principal))
   (if (is-eq (map-get? HonestyVotes {listingId: listingId, voter: voter})  none)
       ERR_NO_SUCH_VOTE
       (ok (map-get? HonestyVotes {listingId: listingId, voter: voter}))
   )
)
;;public functions
(define-public (list-needer 
                  (needer principal) 
                  (amountNeeded uint) 
                  (description (string-utf8 4000))
                  (contactInfo (optional (string-ascii 100)))
                ) 
  
   (begin 
        (map-insert ListingData {listingId: (var-get listingNonce)} {
            needer: needer,
            amountNeeded: amountNeeded,
            description: description,
            contactInfo: contactInfo,
            amountCollected: u0,
            upvoteCount: u0,
            downvoteCount: u0
          }
        ) 
        (var-set listingNonce (+ (var-get listingNonce) u1))
        (ok (- (var-get listingNonce) u1))
    )
   
)

(define-public (edit-contact-info (listingId uint) (contactInfo (optional (string-ascii 100))))
    (begin
        (asserts! (is-eq tx-sender (get needer (unwrap! (map-get? ListingData {listingId: listingId}) ERR_LISTING_UNDEFINED)))
                  ERR_NEEDER_ONLY
        )
        (ok (map-set ListingData 
                {listingId: listingId} 
                (merge (unwrap-panic (map-get? ListingData {listingId: listingId})) 
                    {contactInfo: contactInfo} 
                ) 
            )
        )
    )
)

(define-public (vote-listing (listingId uint) (vote bool) (voteComment (string-utf8 100)) )
    (begin
        (asserts! 
           (not (is-eq tx-sender (get needer (unwrap! (map-get? ListingData {listingId: listingId}) ERR_LISTING_UNDEFINED)))) 
            ERR_CANNOT_VOTE_YOURSELF
        )
        (asserts! 
            (map-insert HonestyVotes {listingId: listingId, voter: tx-sender} {upvote: vote, voteComment: voteComment}) 
            ERR_ALREADY_VOTED
        )
        (if vote
            (ok (upvote listingId))
            (ok (downvote listingId))
        )
    )
)

(define-public (donate-stx (listingId uint) (amount uint)) 
    (let
        (
            (listing (unwrap! (map-get? ListingData {listingId: listingId}) ERR_LISTING_UNDEFINED))
        )
         (try! 
          (stx-transfer? amount tx-sender (get needer listing))
         )
         (ok (map-set ListingData 
                {listingId: listingId} 
                (merge listing 
                    {amountCollected: (+ (get amountCollected listing) amount) } 
                ) 
            )
        )
    )
)

(define-public (donate-ft (contract <sip-010>) (amount uint) (recipient principal)) 
   (contract-call? contract transfer amount tx-sender recipient none)
)

(define-public (donate-nft (contract <sip-009>) (tokenId uint) (recipient principal)) 
  (contract-call? contract transfer tokenId tx-sender recipient)
)