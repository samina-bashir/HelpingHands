;;implementedTrait
(impl-trait  .sip-010.sip010-ft-trait)

;;error constants
(define-constant err-notOwner (err u50))

;;constants
(define-constant name "SM-Coin")
(define-constant symbol "SM")
(define-constant decimal u2)
(define-constant owner tx-sender)

(define-fungible-token SM-Coin u1000)

;;read-only functions
(define-read-only (get-name)
	(ok name)
)
(define-read-only (get-symbol)
	(ok symbol)
)
(define-read-only (get-decimals)
	(ok decimal)
)
(define-read-only (get-balance (sender principal))
	(ok (ft-get-balance SM-Coin sender))
)
(define-read-only (get-total-supply)
	(ok (ft-get-supply SM-Coin))
)
(define-read-only (get-token-uri)
	(ok none)
)

;;public functions
(define-public (transfer (amount uint) (sender principal) (recipient principal) (memo (optional (buff 34))))
    (begin
        (try! (ft-transfer? SM-Coin amount sender recipient))
        (match memo to-print (print to-print) 0x)
        (ok true)
    )
)
(define-public (mint (amount uint) (recipient principal)) 
  (begin
    (asserts! (is-eq tx-sender owner) err-notOwner)
	  (ft-mint? SM-Coin amount recipient)
  )
)