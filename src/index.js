import jwt from "jsonwebtoken";
import bcrypt from "bcrypt";
import rapidriver from "@ovcina/rapidriver";
import helpers from "./helpers.js";

const REFRESH_SECRET = process.env.refreshSecret ?? `$[/AJLN;A~djDLh,/kDg?K$Y=*dY44B4)TV*u*X5jjug9#.k>3QLzN;C9K2J36_:`;  // JWT refresh secret

/**
 * Generates a AccessToken if the RefreshToken is valid.
 * @param string refreshToken
 * @returns AccessToken|false
 */
export async function generateAccessToken(refreshToken)
{
    let ret = false;
    const token = await helpers.getTokenData(refreshToken, REFRESH_SECRET);
    if(token)
    {

        const userStmt = await helpers.query("SELECT * FROM `users` WHERE `id` = ?", [
            token.uid
        ]);
        if(userStmt.length > 0)
        {
            const userData = userStmt[0];
            
            ret = jwt.sign({
                uid: userData.id,
                rank: userData.rank,
                solverLimit: userData.solverLimit,
            }, helpers.SECRET, {
                expiresIn: 60 * 15, // 15 minutes
                issuer: "",
            });
        }
    }

    return {
        refreshToken: ret,
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
        const userStmt = await helpers.query("SELECT `id`, `rank`, `password` FROM `users` WHERE `email` = ?", [username.toLowerCase()]);
        if(userStmt && userStmt.length > 0)
        {
            const userData = userStmt[0];
            const correct = await bcrypt.compare(password, userData.password);
            if(correct)
            {
                ret.rank = userData.rank;
                ret.token = jwt.sign({
                    uid: userData.id,
                }, REFRESH_SECRET, {
                    issuer: "",
                });
            }
        }
    }

    return ret;
}

/**
 * Returns the data of the given userID, if it exists.
 * @param string username
 * @param string password
 * @returns UserData|false
 */
export async function getUser(id)
{
    const stmt = await helpers.query("SELECT * FROM `users` WHERE `id` = ?", [id]);
    return {
        data: stmt && stmt.length > 0 ? stmt[0] : false,
    };
}

/**
 * Sets the solver limit for the given user-id.
 */
export async function setSolverLimit(id, val)
{
    const stmt = await helpers.query("UPDATE `users` SET `solverLimit` = ? WHERE `id` = ?", [val, id]);
    return {
        error: !!stmt,
    };
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
    if(username && password && username.length > 0 && password.length > 0)
    {
        const userStmt = await helpers.query("SELECT `email` FROM `users` WHERE `email` = ?", [username.toLowerCase()]);
        if(userStmt && userStmt.length === 0)
        {
            const hashedPass = await bcrypt.hash(password, 10);
            const newUserStmt = await helpers.query("INSERT INTO users (`email`, `password`, `rank`) VALUES (?, ?, ?)", [
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
/**
 * Returns all the users.
 * @returns [users]|false
 */
export async function getUsers(){
    const userStmt = await helpers.query("SELECT * FROM `users`");
    
    return {
        data: (userStmt ? userStmt : []).map(user => {
            delete user.password;
            return user;
        }),
    };
}

export async function deleteUser(id, publish) {
    let userId = Number(id);
    let stmt = await helpers.query("DELETE FROM `users` WHERE `id` = ? ", [id]);

    if(stmt)
    {
        // Delete all its jobs
        const {data: jobsHistory} = await helpers.publishAndWait("job-history", "job-history-response", -1, {
            userID: userId
        }, -1)
        jobsHistory.forEach(job => publish("remove-job", {
            id: job.id
        }));;

        const [dataContent, modelContent] = await Promise.all([
            helpers.publishAndWait("get-all-files", "get-all-files-response", -1, {
                userId: userId,
                filetype: 0
            }, -1),
            helpers.publishAndWait("get-all-files", "get-all-files-response", -2, {
                userId: userId,
                filetype: 1
            }, -1)
        ]);

        // For each filee in dataContent, delete the file
        dataContent.forEach(file => rapidriver.publish(host, "delete-file", {
            fileId: Number(file.fileId)
        }));

        // For each file in modelContent, delete the file
        modelContent.forEach(file => rapidriver.publish(host, "delete-file", {
            fileId: Number(file.fileId)
        }));
    }

    return {
        error: !stmt,
        message: "User deleted succesfully"
    
    };
}

setImmediate(() => {
    signUp(process.env.userUsername, process.env.userPassword, 0);
    signUp(process.env.adminUsername, process.env.adminPassword, 1);    
});

if(process.env.RAPID)
{
    helpers.subscriber(helpers.host, [
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
        {
            river: "auth",
            event: "getUsers",
            work: async (msg, publish) => publish("getUsers-response", await getUsers()),
        },
        {
            river: "auth",
            event: "getUser",
            work: async (msg, publish) => publish("getUser-response", await getUser(msg.id)),
        },
        {
            river: "auth",
            event: "set-solver-limit",
            work: async (msg, publish) => publish("set-solver-limit-response", await setSolverLimit(msg.id, msg.value)),
        },
        {
            river: "auth",
            event: "delete-user",
            work: async (msg, publish) => publish("delete-user-response", await deleteUser(msg.id, publish)),
        },
    ]);
}
