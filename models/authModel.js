const connection = require('../db/db');

exports.findUserByEmailAndPassword = (email, password, callback) => {
    const query = 'SELECT * FROM user WHERE email = ? AND password = ?';
    connection.query(query, [email, password], (err, results) => {
        if (err) return callback(err);
        return callback(null, results[0]);
    });
};


// authModel.js 내에서 findUserById를 Promise로 변경
exports.findUserById = (user_id) => {
    return new Promise((resolve, reject) => {
        const query = 'SELECT * FROM user WHERE id = ?';
        connection.query(query, [user_id], (err, results) => {
            if (err) {
                console.error('쿼리 실행 오류:', err);
                return reject(err);  // 오류 발생 시 reject
            }

            if (results.length === 0) {
                console.error('사용자 찾기 실패');
                return reject(new Error('User not found'));  // 사용자 없으면 reject
            }
            resolve(results[0]);  // 정상적으로 사용자 반환
        });
    });
};




exports.createUser = (email, password, nickname, profile, callback) => {
    const query = 'INSERT INTO user (email, password, nickname, profile) VALUES (?, ?, ?, ?)';
    connection.query(query, [email, password, nickname, profile], (err, results) => {
        if (err) {
            console.error('쿼리 실행 오류:', err);  // 에러 발생 시 출력
        } else {
            console.log('쿼리 실행 결과:', results);  // 정상 실행된 결과 출력
        }
        return callback(err, results);  // 콜백으로 오류 및 결과 반환
    });
};

exports.deleteUser = (user_id, callback) => {
    const query = 'DELETE FROM user WHERE id = ?';
    connection.query(query, [user_id], callback);
};

exports.updateNickname = (user_id, nickname, callback) => {
    const query = 'UPDATE user SET nickname = ? WHERE id = ?';
    connection.query(query, [nickname, user_id], callback);
};

exports.updatePassword = (user_id, password, callback) => {
    const query = 'UPDATE user SET password = ? WHERE id = ?';
    connection.query(query, [password, user_id], callback);
};
