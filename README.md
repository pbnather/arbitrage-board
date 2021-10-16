# Arbitrage Board

This project is intended to show the possible arbitrage opportunity on ETH/SPELL pair
using Sushiswap on Arbitrum and Ethereum networks. 

If you see positive arbitrage:
1. Sell SPELL for ETH on Ethereum network.
2. Bridge ETH to Arbitrum One using [official bridge](https://bridge.arbitrum.io/).
3. Buy SPELL using ETH on Arbitrum One.
4. Bridge you SPELL back to Ethereum.

For negative arbitrage, do otherwise (sell ETH and bridge SPELL).

##
Next steps:  
[ ] Set amount of ETH to arbitrage (currently 1 ETH).  
[ ] Add more pairs (possibly all available).  
[ ] Set up subgraph/AWS lambda to gather arbitrage history.  

## Running 
Install dependencies:  
`yarn install`

Start local server:  
`yarn start`
