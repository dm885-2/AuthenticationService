import jwt from "jsonwebtoken";
import mysql from "mysql";

export const SECRET = process.env.SECRET ?? `3(?<,t2mZxj$5JT47naQFTXwqNWP#W>'*Kr!X!(_M3N.u8v}%N/JYGHC.Zwq.!v-`;  // JWT secret
export const host = process.env.riverUrl ?? `amqp://localhost`;  // RabbitMQ url

/**
 * Returns the token payload if its valid, otherwise it returns false.
 * @param String token 
 * @returns Promise<false|TokenData>
 */
export function getTokenData(token, secretOrPublicKey = SECRET)
{
    return new Promise(resolve => jwt.verify(token, secretOrPublicKey, (err, data) => resolve(err ? false : data)));
}

let connection;
if(process.env.mysqlHost)
{
    connection = mysql.createConnection({
        host     : process.env.mysqlHost,
        user     : process.env.mysqlUser,
        password : process.env.mysqlPass,
        database : 'db'
    });
    connection.connect();
}

/**
 * Runs a SQL query on the DB. 
 * @param string stmt 
 * @param ?string[] WHERE 
 * @returns results[]|false
 */
export function query(stmt, WHERE = [])
{
    return new Promise(r => connection.query(stmt, WHERE, (err, results) => r(err ? false : results)));
}