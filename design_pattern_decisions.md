
# Implemented Design Patterns on Smart Contracts

1) Fail early and fail loud - `require` was used wherever necessary instead of `if`  

2) Restricting Access - function modifiers were used wherever necesarry to restrict access to admin specific functions.  
E.g. `verifyAdmin()` modifier in AdminWindow.sol  

3) Circuit Breaker - AdminWindow uses a circuit breaker that stops new Job Posters from requesting access until Admin re-enables the contract.  
  

