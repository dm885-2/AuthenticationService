import river from "@ovcina/rapidriver";
import jwt from "jsonwebtoken";

const SECRET = process.env.SECRET ?? `3(?<,t2mZxj$5JT47naQFTXwqNWP#W>'*Kr!X!(_M3N.u8v}%N/JYGHC.Zwq.!v-`;  // JWT Token
const host = process.env.riverUrl ?? `amqp://localhost`;  // RabbitMQ url

/**
 * 
 * @param {*} username 
 * @param {*} password 
 * @returns 
 */
async function login(username, password)
{
    if(1)
    {
        const token = jwt.sign({ 
            username,
            rank: 0,
         }, SECRET, {
             expiresIn: 60 * 60 * 2,
             issuer: "",
         });

        return {
            error: false,
            rank: 0,
            key: token,
        };
    }

    return {
        error: true,
    };
}

river.subscribe(host, "auth", async (msg, channel) => {
    const response = await login(msg.username, msg.password);
    channel.publish("auth-response", response);
});