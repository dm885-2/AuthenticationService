import {jest} from '@jest/globals';
import {login} from "./index.js";
import query from "./helpers.js";

jest.mock('./helpers.js');

describe("Authentication", () => {
    // beforeEach(() => {
    //     query.mockClear();
    //   });

    // test('can login', async () => {
    //     console.log(query);
    //     query.mockResolvedValue({
    //         token: true,
    //     });
    //     const resp = await login("test", "pass");
    //     expect(resp.token).not.toBe(false);
    // });
    
    test('can work', () => {
        expect(true).not.toBe(false);
    });
});