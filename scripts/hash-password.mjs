import { pbkdf2Sync, randomBytes } from "node:crypto";

const password = process.argv[2];
if (!password || password.length < 12) {
  console.error("사용법: npm run auth:hash -- \"12자 이상의 비밀번호\"");
  process.exit(1);
}
const iterations = 210000;
const salt = randomBytes(16).toString("hex");
const hash = pbkdf2Sync(password, salt, iterations, 32, "sha256").toString("hex");
console.log(`${iterations}:${salt}:${hash}`);
