import jwt from "jsonwebtoken";
import fs from "fs";

const privateKey = fs.readFileSync("./AuthKey_94FN2DBB7H.p8");

const token = jwt.sign(
  {
    iss: "7J5Y87455X",     
    iat: Math.floor(Date.now() / 1000),
    exp: Math.floor(Date.now() / 1000) + 86400 * 180,
    aud: "https://appleid.apple.com",
    sub: "com.satprepapp.app.signin", 
  },
  privateKey,
  {
    algorithm: "ES256",
    keyid: "94FN2DBB7H",
  }
);

console.log(token);
