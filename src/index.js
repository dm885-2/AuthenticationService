import jwt from "jsonwebtoken";
import bcrypt from "bcrypt";
import rapidriver from "@ovcina/rapidriver";
import {host, getTokenData, SECRET, query, subscriber} from "./helpers.js";

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
 * @param string username
 * @param string password
 * @returns RefreshToken|false
 */
export async function login(username, password)
{
    let ret = {
        token: false,
    };
    if(username && password)
    {
        const userStmt = await query("SELECT `rank`, `password` FROM `users` WHERE `email` = ?", [username.toLowerCase()]);
        if(userStmt && userStmt.length > 0)
        {
            const userData = userStmt[0];
            const correct = await bcrypt.compare(password, userData.password);
            if(correct)
            {
                ret.rank = userData.rank;
                ret.token = jwt.sign({
                    username,
                    rank: userData.rank,
                }, REFRESH_SECRET, {
                    issuer: "",
                });
            }
        }
    }

    return ret;
}

/**
 * Creates a user if the user dosent exist.
 * @param string username
 * @param string password
 * @param number rank
 * @returns true|false depending on if the user was created.
 */
export async function signUp(username, password, rank)
{
    let error = true;
    console.log("Sign up!", username, password, rank);
    if(username && password)
    {
        console.log("Hehe");
        const userStmt = await query("SELECT `email` FROM `users` WHERE `email` = ?", [username.toLowerCase()]);
        if(userStmt && userStmt.length === 0)
        {
            const hashedPass = await bcrypt.hash(password, 10);
            const newUserStmt = await query("INSERT INTO users (`email`, `password`, `rank`) VALUES (?, ?, ?)", [
                username.toLowerCase(),
                hashedPass,
                rank
            ]);
            if(newUserStmt)
            {
                error = false;
            }
        }
    }
    return {
        error,
    };
}

if(process.env.RAPID)
{
    subscriber(host, [
        {
            river: "auth",
            event: "signIn",
            work: async (msg, publish) => publish("signIn-response", await login(msg.username, msg.password)),
        },
        {
            river: "auth",
            event: "signUp",
            work: async (msg, publish) => publish("signUp-response", await signUp(msg.username, msg.password, msg.rank)),
        },
        {
            river: "auth",
            event: "accessToken",
            work: async (msg, publish) => publish("accessToken-response", await generateAccessToken(msg.token)),
        },
    ]);
}
