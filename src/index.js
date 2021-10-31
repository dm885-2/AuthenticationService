import rapid from "@ovcina/rapidriver";
import jwt from "jsonwebtoken";

const SECRET = process.env.SECRET ?? `3(?<,t2mZxj$5JT47naQFTXwqNWP#W>'*Kr!X!(_M3N.u8v}%N/JYGHC.Zwq.!v-`;  // JWT Token
const host = process.env.riverUrl ?? `amqp://localhost`;  // RabbitMQ url

async function login(username, password)
{
    if(1)
    {
        const token = jwt.sign({ 
            username,
            rank: 0,
         }, SECRET, {
             expiresIn: 60 * 60 * 2, // 2 hours
             issuer: "",
         });

        return {
            token,
        };
    }

    return {
        token: false,
    };
}

rapid.subscribe(host, "auth", async (msg, publish) => {
    const response = await login(msg.username, msg.password);
    publish("auth-response", response);
});