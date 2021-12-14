const IP = Cypress.env('DEV') == 1 ? "http://localhost:8080" : "http://localhost:3000";
const time = Date.now();
const login = {
    username: `u${time}`,
    password: `p${time}`,
};
let refreshToken;

describe('Authentication', () => {
    it("Cant login with wrong credentials", () => cy.request('POST', `${IP}/auth/login`, login).then((response) => expect(response.body).to.have.property('error', true)));

    it("Can create a user", () => cy.request('POST', `${IP}/auth/register`, {
        "username": login.username,
        "password": login.password,
        "passwordRepeat": login.password
    }).then((response) => expect(response.body).to.have.property('error', false)));

    it("Can login with new credentials", () => cy.request('POST', `${IP}/auth/login`, login).then((response) => {
        expect(response.body).to.have.property('error', false);
        refreshToken = response.body.refreshToken;
    }));

    it("Cant use an invalid refreshToken", () => cy.request('POST', `${IP}/auth/accessToken`, {
        refreshToken: "some-invalid-token",
    }).then((response) => expect(response.body).to.have.property('error', true)));

    it("Can use a valid refreshToken", () => {
        cy.request('POST', `${IP}/auth/accessToken`, {
            refreshToken
        }).then((response) => expect(response.body).to.have.property('error', false))
    });
});