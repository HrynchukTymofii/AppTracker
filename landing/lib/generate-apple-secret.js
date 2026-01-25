import jwt from "jsonwebtoken";
import fs from "fs";

const privateKey = fs.readFileSync("./lib/AuthKey_WL9P3UXNTT.p8");

const token = jwt.sign(
  {
    iss: "7J5Y87455X",     
    iat: Math.floor(Date.now() / 1000),
    exp: Math.floor(Date.now() / 1000) + 86400 * 180,
    aud: "https://appleid.apple.com",
    sub: "com.hrynchuk.appblocker.signin", 
  },
  privateKey,
  {
    algorithm: "ES256",
    keyid: "WL9P3UXNTT",
  }
);

console.log(token);
