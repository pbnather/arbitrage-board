// import logo from './logo.svg';
import './App.css';
import { ethers, BigNumber } from "ethers";
import "arb-ts";
import React from 'react';

const ethProvider = new ethers.providers.InfuraProvider("homestead", {
  projectId: "3923170be82d41b79116ea43dad8774e"
});
const arbProvider = new ethers.providers.JsonRpcProvider("https://arbitrum-mainnet.infura.io/v3/3923170be82d41b79116ea43dad8774e");

const addresses = {
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

const contracts = {
  "eth": {
    "sushiswap_router": new ethers.Contract(
      addresses["eth"]["sushi_router"],
      [
        'function getAmountsOut(uint amountIn, address[] memory path) public view returns (uint[] memory amounts)'
      ],
      ethProvider
    )
  },
  "arb": {
    "sushiswap_router": new ethers.Contract(
      addresses["arb"]["sushi_router"],
      [
        'function getAmountsOut(uint amountIn, address[] memory path) public view returns (uint[] memory amounts)'
      ],
      arbProvider
    )
  }
}

function getExchangeRate(network, token0 = "weth", token1 = "spell") {
  return contracts[network]["sushiswap_router"].getAmountsOut(
    BigNumber.from("1000000000000000000"),
    [addresses[network][token0], addresses[network][token1]]
  );
}

class App extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      seconds: parseInt(props.startTimeInSeconds, 10) || 15,
      ethPrice: 0,
      arPrice: 0,
      arbitrage: 0.0
    };
    this.updatePrice();
  }

  async updatePrice() {
    const ethPrice = await getExchangeRate("eth");
    const arbPrice = await getExchangeRate("arb");

    const ethPriceN = ethPrice[1].div(BigNumber.from("1000000000000000000")).toNumber();
    const arbPriceN = arbPrice[1].div(BigNumber.from("1000000000000000000")).toNumber();
    var arbitrageOpportunity = (((arbPriceN / ethPriceN).toPrecision(5) - 1) * 100).toPrecision(3);

    console.log(ethPriceN, arbPriceN, arbitrageOpportunity);

    this.setState(() => ({
      ethPrice: ethPriceN,
      arbPrice: arbPriceN,
      arbitrage: arbitrageOpportunity,
      seconds: 15
    }));
  }

  tick() {
    this.setState(state => ({
      seconds: state.seconds - 1
    }));
    if (this.state.seconds === 0) {
      this.updatePrice();

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
        <header className="App-header">
          <p>
            Current arbitrage opportunity on ETH/SPELL:
          </p>
          <p>
            Next refresh: {this.formatTime(this.state.seconds)}
          </p>
        </header>
        <div className="App-div">
          <div className="Boxx">
            <div>
              <div className="PriceBox">
                Ethereum ETH/SPELL: {this.state.ethPrice}
              </div>
              <div className="PriceBox">
                Arbitrum ETH/SPELL: {this.state.arbPrice}
              </div>
            </div>
            <div className="ArbitrageBox">
              <p>{this.state.arbitrage}%</p>
            </div>
          </div>
        </div>
        <div className="Footer">
          <p style={{ display: "inline" }}>Copyright by </p>
          <a style={{ display: "inline" }} href="https://twitter.com/pbnather">@pbnather</a>
          <p style={{ display: "inline" }}> — code available at </p>
          <a style={{ display: "inline" }} href="https://twitter.com/pbnather">GitHub</a>
        </div>
      </div >
    );
  }
}

export default App;
