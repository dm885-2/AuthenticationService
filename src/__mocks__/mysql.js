import {jest} from '@jest/globals';

const mysql = jest.createMockFromModule('mysql');


mysql.createConnection = jest.fn(() => {
    return {  // Fake connection
        query: jest.fn((stmt, where, callback) => {

            callback(false, []);
        }),
    };
});

export default mysql;