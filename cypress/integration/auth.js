const IP = "http://localhost:8080";
const time = Date.now();
const login = {
    username: `u${time}`,
    password: `p${time}`,
};

describe('Authentication', () => {
    it("Cant login with wrong credentials", () => cy.request('POST', `${IP}/auth/login`, login).then((response) => expect(response.body).to.have.property('error', true)));

    it("Can create a user", () => cy.request('POST', `${IP}/auth/register`, {
        "username": login.username,
        "password": login.password,
        "passwordRepeat": login.password
    }).then((response) => expect(response.body).to.have.property('error', false)));

    it("Can login with new credentials", () => cy.request('POST', `${IP}/auth/login`, login).then((response) => {
        expect(response.body).to.have.property('error', false);
        cy.wrap(response.body.refreshToken).as('refreshToken');
    }));

    it("Cant use an invalid refreshToken", () => cy.request('POST', `${IP}/auth/accessToken`, {
        refreshToken: "some-invalid-token",
    }).then((response) => expect(response.body).to.have.property('error', true)));

    
    it("Can use a valid refreshToken", () => {
        // cy.get('@refreshToken').then(refreshToken => {
            cy.request('POST', `${IP}/auth/accessToken`, {
                refreshToken: this.refreshToken
            }).then((response) => expect(response.body).to.have.property('error', true))
        // });
    });
});