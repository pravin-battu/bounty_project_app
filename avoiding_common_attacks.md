
# Avoiding Common Attacks

The following attcks are taken care of

1) TxOrigin Attack - Not possible as `tx.origin` is not used anywhere in the code. Wherever required only `msg.sender` is used.  

2) Denial of Service Attack - Code does not loop over arrays and does not allow for any Denial of Service attack.  

3) Reentrancy Attack - Not possible.  

4) Integer Over/underflow - Not poosible as SafeMath library is used.
