import { Queue } from "bullmq"

export const redisConn = {
    connection: {
        host: process.env.REDIS_HOST,
        port: parseInt(process.env.REDIS_PORT || '6379'),
        password: process.env.REDIS_PASSWORD
    },
}

export const SAPQueue = {
    "master item": new Queue("master item", redisConn),
    "business partner": new Queue("business partner", redisConn),
    // "purchase request": new Queue("purchase request", redisConn),
    // "purchase request docs": new Queue("purchase request docs", redisConn),
    // "purchase order": new Queue("purchase order", redisConn),
    // "purchase order docs": new Queue("purchase order docs", redisConn),
    // "goods receipt": new Queue("goods receipt", redisConn),
    // "goods receipt docs": new Queue("goods receipt docs", redisConn),
    // "sales order": new Queue("sales order", redisConn),
    // "sales order docs": new Queue("sales order docs", redisConn),
    // "production order": new Queue("production order", redisConn),
    // "production order docs": new Queue("production order docs", redisConn),
    "essentials": new Queue("essentials", redisConn),
    "inbound": new Queue("inbound", redisConn),
    "outbound": new Queue("outbound", redisConn),
    "pdo": new Queue("pdo", redisConn),
    "manual sync so": new Queue("manual sync so", redisConn),
    "manual sync po": new Queue("manual sync po", redisConn),
    "monthly-stock": new Queue("monthly-stock", redisConn),
};