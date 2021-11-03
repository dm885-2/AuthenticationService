import jwt from "jsonwebtoken";
import rapid from "@ovcina/rapidriver";
import {host, getTokenData, SECRET} from "./helpers.js";

const REFRESH_SECRET = process.env.refreshSecret ?? `$[/AJLN;A~djDLh,/kDg?K$Y=*dY44B4)TV*u*X5jjug9#.k>3QLzN;C9K2J36_:`;  // JWT refresh secret

/**
 * Generates a AccessToken if the RefreshToken is valid.
 * @param string refreshToken 
 * @returns AccessToken|false
 */
export async function generateAccessToken(refreshToken)
{
    let ret = false;
    const token = await getTokenData(refreshToken, REFRESH_SECRET);
    if(token)
    {
        // Remove meta-data
        delete token.iss;
        delete token.iat;

        ret = jwt.sign({ 
            ...token,
         }, SECRET, {
             expiresIn: 60 * 15, // 15 minutes
             issuer: "",
         });
    }

    return {
        token: ret,
    };
}

/**
 * Returns a RefreshToken if the username and password is valid.
 * @param {*} username 
 * @param {*} password 
 * @returns 
 */
export async function login(username, password)
{
    let ret = {
        token: false,
    };
    if(1)
    {
        ret.token = jwt.sign({ 
            username,
            rank: 0,
         }, REFRESH_SECRET, {
             issuer: "",
         });
    }

    return ret;
}

if(process.env.RAPID)
{
    rapid.subscribe(host, "auth", async (msg, publish) => {
        const response = await login(msg.username, msg.password);
        publish("auth-response", response);
    });
    
    rapid.subscribe(host, "auth-token", async (msg, publish) => {
        const response = await generateAccessToken(msg.token);
        publish("auth-token-response", response);
    });
}