import axios from "axios";
import { coins } from "@cosmjs/launchpad";
import React from "react";
import { withRouter } from "next/router";

import Button from "../inputs/Button";
import Input from "../inputs/Input";
import StackableContainer from "../layout/StackableContainer";
import TextArea from "../inputs/TextArea";

class TransactionForm extends React.Component {
  constructor(props) {
    super(props);

    this.state = {
      toAddress: "",
      amount: 0,
      memo: "",
      gas: 200000,
      processing: false,
      addressError: "",
      rawCustomTx: "",
      parsedCustomTx: "",
      customError: "",
      customValidMessage: "",
    };
  }

  handleChange = (e) => {
    this.setState({
      [e.target.name]: e.target.value,
    });
  };

  createTransaction = (toAddress, amount, gas) => {
    const msgSend = {
      fromAddress: this.props.address,
      toAddress: toAddress,
      amount: coins(amount * 1000000, process.env.NEXT_PUBLIC_DENOM),
    };
    const msg = {
      typeUrl: "/cosmos.bank.v1beta1.MsgSend",
      value: msgSend,
    };
    const gasLimit = gas;
    const fee = {
      amount: coins(6000, process.env.NEXT_PUBLIC_DENOM),
      gas: gasLimit.toString(),
    };

    return {
      accountNumber: this.props.accountOnChain.accountNumber,
      sequence: this.props.accountOnChain.sequence,
      chainId: process.env.NEXT_PUBLIC_CHAIN_ID,
      msgs: [msg],
      fee: fee,
      memo: this.state.memo,
    };
  };

  handleCreate = async () => {
    let dataJSON = "";
    if (this.props.isCustom) {
      dataJSON = JSON.stringify(this.state.parsedCustomTx);
    } else {
      if (this.state.toAddress.length === 45) {
        this.setState({ processing: true });
        const tx = this.createTransaction(
          this.state.toAddress,
          this.state.amount,
          this.state.gas
        );
        console.log(tx);
        dataJSON = JSON.stringify(tx);
      } else {
        this.setState({ addressError: "Use a valid cosmos-hub address" });
      }
    }
    console.log("sending");
    const res = await axios.post("/api/transaction", { dataJSON });
    const { transactionID } = res.data;
    this.props.router.push(
      `${this.props.address}/transaction/${transactionID}`
    );
  };

  parseCustomTx = () => {
    try {
      const parsedTX = JSON.parse(this.state.rawCustomTx);
      this.setState({
        customError: "",
        parsedCustomTx: parsedTX,
        customValidMessage: "Valid JSON",
      });
    } catch (err) {
      console.log(err);
      this.setState({
        customError: "Not valid JSON",
        customValidMessage: "",
      });
    }
  };

  render() {
    return (
      <StackableContainer lessPadding>
        <button className="remove" onClick={this.props.closeForm}>
          ✕
        </button>
        <h2>
          {this.props.isCustom ? "Create Custom Transaction" : "Send Funds"}
        </h2>
        {this.props.isCustom ? (
          <>
            <StackableContainer lessPadding lessMargin>
              <p>
                Paste in the JSON for the custom transaction below. Only proceed
                if you know exactly what you are doing.
              </p>
            </StackableContainer>
            <div className="form-item">
              <TextArea
                label="Transaction JSON"
                name="rawCustomTx"
                value={this.state.rawCustomTx}
                onChange={this.handleChange}
                error={this.state.addressError}
                placeholder=""
                error={this.state.customError}
                onBlur={this.parseCustomTx}
                validMessage={this.state.customValidMessage}
              />
            </div>
          </>
        ) : (
          <>
            <div className="form-item">
              <Input
                label="To Address"
                name="toAddress"
                value={this.state.toAddress}
                onChange={this.handleChange}
                error={this.state.addressError}
                placeholder="cosmos1fjrzd7ycxzse05zme3r2zqwpsvcrskv80wj82h"
              />
            </div>
            <div className="form-item">
              <Input
                label="Amount (ATOM)"
                name="amount"
                type="number"
                value={this.state.amount}
                onChange={this.handleChange}
              />
            </div>
            <div className="form-item">
              <Input
                label="Gas Limit (UATOM)"
                name="gas"
                type="number"
                value={this.state.gas}
                onChange={this.handleChange}
              />
            </div>
            <div className="form-item">
              <Input
                label="Memo"
                name="memo"
                type="text"
                value={this.state.memo}
                onChange={this.handleChange}
              />
            </div>
          </>
        )}
        <Button label="Create Transaction" onClick={this.handleCreate} />
        <style jsx>{`
          .form-item {
            margin-top: 1.5em;
          }
          p {
            max-width: initial;
          }
          button.remove {
            background: rgba(255, 255, 255, 0.2);
            width: 30px;
            height: 30px;
            border-radius: 50%;
            border: none;
            color: white;
            position: absolute;
            right: 10px;
            top: 10px;
          }
        `}</style>
      </StackableContainer>
    );
  }
}

export default withRouter(TransactionForm);
