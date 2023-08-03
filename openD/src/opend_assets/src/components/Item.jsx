import React, { useEffect, useState } from "react";
import logo from "../../assets/logo.png";
import { Actor, HttpAgent } from "@dfinity/agent";
import { idlFactory } from "../../../declarations/nft";
import { idlFactory as tokenIdlFactory } from "../../../declarations/token";
import { Principal } from "@dfinity/principal";
import Button from "./Button";
import { opend } from "../../../declarations/opend/index";
import CURRENT_USER_ID from "../index";
import PriceLabel from "./PriceLabel";


function Item(props) {

  const id = props.id;

  const [name, setName] = useState();
  const [owner, setOwner] = useState();
  const [image, setImage] = useState();
  const [button, setButton] = useState();
  const [priceInput, setPriceInput] = useState();
  const [loaderHidden, setLoaderHidden] = useState(true);
  const [blur, setBlur] = useState();
  const [sellStatus, setSellStatus] = useState("");
  const [priceLabel, setPriceLabel] = useState();

  const localHost = "http://localhost:8080/";
  const agent = new HttpAgent({ host: localHost });
  // when deploy live, we have to delete the following line
  agent.fetchRootKey();
  let NFTActor;

  async function loadNFT() {

    NFTActor = await Actor.createActor(idlFactory, {
      agent,
      canisterId: id
    });

    const name = await NFTActor.getName();
    setName(name);

    const owner = await NFTActor.getOwner();
    setOwner(owner.toText());

    const imageData = await NFTActor.getAsset();
    const imageContent = new Uint8Array(imageData); // return type is Nat8 have to transfer to Uint8Array for js
    const image = URL.createObjectURL(new Blob([imageContent.buffer], { type: "image/png" })); // use URL.createObjectURL to transfer it into useable url for frontend by using blob to convert it from Uint8Array to a url
    setImage(image);

    if (props.role === "collection") {

      const nftIsListed = await opend.isListed(props.id);
      if (nftIsListed) {
        setOwner("OpenD");
        setBlur({ filter: "blur(4px)" });
        setSellStatus("Listed")
      } else {
        setButton(<Button handleClick={handleSell} text={"Sell"} />)
      }
    } else if (props.role === "discover") {

      const originalOwner = await opend.getOriginalOwner(props.id);
      if (originalOwner.toText() != CURRENT_USER_ID.toText()) {
        setButton(<Button handleClick={handleBuy} text={"Buy"} />)
      }

      const price = await opend.getListedNFTPrice(props.id);
      setPriceInput(<PriceLabel sellPrice={price.toString()} />)

    }

  }

  let price;
  function handleSell() {
    console.log("Sell Clicked ");
    setPriceInput(
      <input
        placeholder="Price in DANG"
        type="number"
        className="price-input"
        value={price}
        onChange={(e) => (price = e.target.value)}
      />
    )

    setButton(<Button handleClick={sellItem} text={"Confirm"} />)
  }


  async function sellItem() {

    setBlur({ filter: "blur(4px)" });
    setLoaderHidden(false);
    console.log("Price: " + price);
    const listingResult = await opend.listItem(props.id, Number(price));
    console.log("listing: " + listingResult);
    if (listingResult === "Success") {
      const OpendID = await opend.getOpenDCanisterID();
      const transerResult = await NFTActor.transferOwnership(OpendID);
      console.log("transfer: " + transerResult);

      if (transerResult === "Success") {
        setLoaderHidden(true);
        setButton();
        setPriceInput();
        setOwner("OpenD")
        setSellStatus("Listed")
      }
    }
  }

  async function handleBuy() {
    console.log("Buy was triggered");
    const tokenActor = await Actor.createActor(tokenIdlFactory, {
      agent,
      canisterId: Principal.fromText(renrk-eyaaa-aaaaa-aaada-cai),
    });

    const sellerId = await opend.getOriginalOwner(props.id);
    const itemPrice = await opend.getListedNFTPrice(props.id);

    const result =  await tokenActor.transfer(sellerId, itemPrice);
    console.log(result);

  }

  useEffect(() => {
    loadNFT();
  }, []);


  return (
    <div className="disGrid-item">
      <div className="disPaper-root disCard-root makeStyles-root-17 disPaper-elevation1 disPaper-rounded">
        <img
          className="disCardMedia-root makeStyles-image-19 disCardMedia-media disCardMedia-img"
          src={image}
          style={blur}
        />
        <div className="lds-ellipsis" hidden={loaderHidden}>
          <div></div>
          <div></div>
          <div></div>
          <div></div>
        </div>
        <div className="disCardContent-root">
          {priceLabel}
          <h2 className="disTypography-root makeStyles-bodyText-24 disTypography-h5 disTypography-gutterBottom">
            {name}<span className="purple-text"> {sellStatus} </span>
          </h2>
          <p className="disTypography-root makeStyles-bodyText-24 disTypography-body2 disTypography-colorTextSecondary">
            Owner: {owner}
          </p>
          {priceInput}
          {button}
        </div>
      </div>
    </div>
  );
}

export default Item;
