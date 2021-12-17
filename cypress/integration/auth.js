const time = Date.now();
const login = {
    username: `u${time}`,
    password: `p${time}`,
};

describe('Authentication', () => {
    it("Cant login with wrong credentials", () => cy.request('POST', `/auth/login`, login).then((response) => expect(response.body).to.have.property('error', true)));

    it("Can create a user", () => cy.request('POST', `/auth/register`, {
        "username": login.username,
        "password": login.password,
        "passwordRepeat": login.password
    }).then((response) => expect(response.body).to.have.property('error', false)));

    it("Can login with new credentials", () => cy.request('POST', `/auth/login`, login).then((response) => {
        expect(response.body).to.have.property('error', false);
        Cypress.env('rtoken', response.body.refreshToken); 

    }));

    it("Cant use an invalid refreshToken", () => cy.request('POST', `/auth/accessToken`, {
        refreshToken: "some-invalid-token",
    }).then((response) => expect(response.body).to.have.property('error', true)));

    it("Can use a valid refreshToken", () => {
        cy.request('POST', `/auth/accessToken`, {
            refreshToken: Cypress.env('rtoken') 
        }).then((response) => expect(response.body).to.have.property('error', false))
    });
});