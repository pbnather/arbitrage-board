import './App.css';
import { ethers, BigNumber } from "ethers";
import "arb-ts";
import React from 'react';
import { Helmet } from "react-helmet";

const TEN_TO_18 = "1000000000000000000";

class App extends React.Component {
  constructor(props) {
    super(props);
    this.ethProvider = new ethers.providers.InfuraProvider("homestead", {
      projectId: "3923170be82d41b79116ea43dad8774e"
    });
    this.arbProvider = new ethers.providers.JsonRpcProvider("https://arb1.arbitrum.io/rpc");
    this.addresses = {
      "eth": {
        "sushi_router": "0xd9e1cE17f2641f24aE83637ab66a2cca9C378B9F",
        "weth": "0xc02aaa39b223fe8d0a0e5c4f27ead9083c756cc2",
        "spell": "0x090185f2135308bad17527004364ebcc2d37e5f6",
      },
      "arb": {
        "sushi_router": "0x1b02dA8Cb0d097eB8D57A175b88c7D8b47997506",
        "weth": "0x82af49447d8a07e3bd95bd0d56f35241523fbab1",
        "spell": "0x3e6648c5a70a150a88bce65f4ad4d506fe15d2af"
      }
    };
    this.contracts = {
      "eth": {
        "sushiswap_router": new ethers.Contract(
          this.addresses["eth"]["sushi_router"],
          [
            'function getAmountsOut(uint amountIn, address[] memory path) public view returns (uint[] memory amounts)'
          ],
          this.ethProvider
        )
      },
      "arb": {
        "sushiswap_router": new ethers.Contract(
          this.addresses["arb"]["sushi_router"],
          [
            'function getAmountsOut(uint amountIn, address[] memory path) public view returns (uint[] memory amounts)'
          ],
          this.arbProvider
        )
      }
    }

    this.state = {
      seconds: parseInt(props.startTimeInSeconds, 10) || 15,
      ethPrice: 0.0,
      arPrice: 0.0,
      arbitrage: 0.0,
      spellAmount: "1000000",
      fetching: true
    };
    this.updatePrice(this.state.spellAmount);
  }

  async getExchangeRate(network, amount = TEN_TO_18, token0 = "weth", token1 = "spell") {
    return this.contracts[network]["sushiswap_router"].getAmountsOut(
      BigNumber.from(amount),
      [this.addresses[network][token0], this.addresses[network][token1]]
    );
  }

  async updatePrice(amount = TEN_TO_18) {
    amount = ethers.utils.parseUnits(amount, 18)
    this.setState(() => ({ fetching: true }));

    const ethPrice = await this.getExchangeRate("eth", amount, "spell", "weth");
    const arbPrice = await this.getExchangeRate("arb", ethPrice[1]);

    const ethPriceN = parseFloat(ethers.utils.formatUnits(ethPrice[1], 18));
    const arbPriceN = parseFloat(ethers.utils.formatUnits(arbPrice[1], 18));
    const price = ethers.utils.parseUnits(this.state.spellAmount, 18).div(BigNumber.from(TEN_TO_18)).toNumber();
    var arbitrageOpportunity = (((arbPriceN / price).toPrecision(5) - 1) * 100).toPrecision(3);

    console.log(ethPriceN, arbPriceN, arbitrageOpportunity);

    this.setState(() => ({
      ethPrice: ethPriceN.toFixed(4),
      arbPrice: arbPriceN.toFixed(2),
      arbitrage: arbitrageOpportunity,
      seconds: 15,
      fetching: false
    }));

    document.title = arbitrageOpportunity + "% ETH/SPELL arbitrage";
  }

  tick() {
    this.setState(state => ({
      seconds: state.seconds - 1
    }));
    if (this.state.seconds === 0) {
      this.updatePrice(this.state.spellAmount);

    }
  }

  componentDidMount() {
    this.interval = setInterval(() => this.tick(), 1000);
  }

  componentWillUnmount() {
    clearInterval(this.interval);
  }

  formatTime(secs) {
    let hours = Math.floor(secs / 3600);
    let minutes = Math.floor(secs / 60) % 60;
    let seconds = secs % 60;
    return [hours, minutes, seconds]
      .map(v => ('' + v).padStart(2, '0'))
      .filter((v, i) => v !== '00' || i > 0)
      .join(':');
  }

  render() {
    return (
      <div className="App">
        <Helmet>
          <title>ETH/SPELL arbitrage</title>
        </Helmet>
        <header className="App-header">
          <p>
            Current arbitrage opportunity on ETH/SPELL:
          </p>
          <p>
            Next refresh: {this.state.fetching ? "Checking..." : this.formatTime(this.state.seconds)}
          </p>
        </header>
        <div className="App-div">
          <div className="Boxx">
            <div>
              <label>Enter SPELL amount:
                <input
                  className="inputTokenField"
                  type="number"
                  value={this.state.spellAmount}
                  onChange={(e) => {
                    if (e.target.value > 0) {
                      this.setState({ spellAmount: e.target.value });
                    }
                  }}
                  onKeyPress={(e) => {
                    if (e.code === "Enter") {
                      this.updatePrice(this.state.spellAmount);
                    }
                  }}
                />
              </label>
              <button
                className="RefreshButton"
                onClick={() => this.updatePrice(this.state.spellAmount)}>
                refresh
              </button>
            </div>
            <div>
              <div className="ArbitrageBox">
                <p>{this.state.arbitrage}%</p>
              </div>
              <div className="PriceBox">
                Sell SPELL for {this.state.ethPrice} ETH
              </div>
              <div className="PriceBox">
                Sell ETH for {this.state.arbPrice} SPELL
              </div>
            </div>
          </div>
        </div>
        <div className="Footer">
          <p style={{ display: "inline" }}>Copyright by </p>
          <a style={{ display: "inline" }} href="https://twitter.com/pbnather">@pbnather</a>
          <p style={{ display: "inline" }}> — code available at </p>
          <a style={{ display: "inline" }} href="https://github.com/pbnather/arbitrage-board">GitHub</a>
        </div>
      </div >
    );
  }
}

export default App;
