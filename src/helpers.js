import jwt from "jsonwebtoken";

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