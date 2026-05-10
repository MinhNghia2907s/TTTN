import { env } from './env.js';

let mysqlModulePromise = null;
let poolPromise = null;
const UTF8_READY_FLAG = Symbol('utf8-ready');

/**
 * Lazy-load `mysql2` để project vẫn parse được code ngay cả khi dependency chưa được cài.
 */
async function loadMysqlModule() {
  if (!mysqlModulePromise) {
    mysqlModulePromise = import('mysql2/promise');
  }

  try {
    return await mysqlModulePromise;
  } catch (error) {
    if (error?.code === 'ERR_MODULE_NOT_FOUND' && String(error.message || '').includes('mysql2')) {
      const dependencyError = new Error(
        'Chưa tìm thấy dependency "mysql2". Hãy chạy "npm install mysql2" trong thư mục source để backend kết nối MySQL.',
      );
      dependencyError.cause = error;
      throw dependencyError;
    }

    throw error;
  }
}

/**
 * Tạo pool duy nhất cho toàn bộ backend, dùng chung cho mọi model query SQL.
 */
async function createPool() {
  const mysqlModule = await loadMysqlModule();
  const mysql = mysqlModule.default;

  return mysql.createPool({
    charset: 'utf8mb4_unicode_ci',
    database: env.dbName,
    dateStrings: true,
    decimalNumbers: true,
    host: env.dbHost,
    namedPlaceholders: false,
    password: env.dbPassword,
    port: env.dbPort,
    user: env.dbUser,
    waitForConnections: true,
  });
}

/**
 * Trả về pool singleton để tránh tạo nhiều kết nối MySQL không cần thiết.
 */
export async function getPool() {
  if (!poolPromise) {
    poolPromise = createPool();
  }

  return poolPromise;
}

/**
 * Đảm bảo session hiện tại luôn dùng UTF-8 đầy đủ để dữ liệu tiếng Việt có dấu
 * được đọc và ghi đúng trên mọi kết nối mới lấy từ pool.
 */
async function ensureUtf8Session(connection) {
  if (connection[UTF8_READY_FLAG]) {
    return connection;
  }

  await connection.query("SET NAMES utf8mb4 COLLATE utf8mb4_unicode_ci");
  connection[UTF8_READY_FLAG] = true;
  return connection;
}

/**
 * Nếu đang ở trong transaction thì dùng connection hiện tại.
 * Nếu không thì mượn tạm một connection từ pool, cấu hình UTF-8 rồi release sau khi query xong.
 */
async function useExecutor(connection, handler) {
  if (connection) {
    const preparedConnection = await ensureUtf8Session(connection);
    return handler(preparedConnection);
  }

  const pool = await getPool();
  const pooledConnection = await pool.getConnection();

  try {
    const preparedConnection = await ensureUtf8Session(pooledConnection);
    return await handler(preparedConnection);
  } finally {
    pooledConnection.release();
  }
}

/**
 * Chạy `SELECT` và trả về mảng rows đã được `mysql2` parse.
 */
export async function select(sql, params = [], connection = null) {
  return useExecutor(connection, async (executor) => {
    const [rows] = await executor.execute(sql, params);
    return rows;
  });
}

/**
 * Chạy `INSERT/UPDATE/DELETE` và trả về result object của MySQL.
 */
export async function execute(sql, params = [], connection = null) {
  return useExecutor(connection, async (executor) => {
    const [result] = await executor.execute(sql, params);
    return result;
  });
}

/**
 * Gom một nhóm thao tác DB vào cùng transaction để booking/payment không bị lệch trạng thái.
 */
export async function withTransaction(handler) {
  const pool = await getPool();
  const connection = await pool.getConnection();

  try {
    await ensureUtf8Session(connection);
    await connection.beginTransaction();
    const result = await handler(connection);
    await connection.commit();
    return result;
  } catch (error) {
    await connection.rollback();
    throw error;
  } finally {
    connection.release();
  }
}
