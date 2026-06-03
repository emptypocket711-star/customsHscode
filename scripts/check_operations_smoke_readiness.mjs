#!/usr/bin/env node

import fs from "node:fs";

const accountsFile = process.env.OPERATIONS_SMOKE_ACCOUNTS_FILE || "tmp/test-accounts.json";
const developerEmail = (process.env.OPERATIONS_DEVELOPER_EMAIL || "emptypocket711@gmail.com").trim().toLowerCase();
const envEmail = (process.env.SMOKE_OPERATIONS_EMAIL || "").trim().toLowerCase();
const envPassword = process.env.SMOKE_OPERATIONS_PASSWORD || "";

function readAccounts(filePath) {
  if (!fs.existsSync(filePath)) return [];

  const payload = JSON.parse(fs.readFileSync(filePath, "utf8"));
  if (Array.isArray(payload.accounts)) return payload.accounts;
  return Object.values(payload.accounts || {});
}

const accounts = readAccounts(accountsFile);
const developerAccount = accounts.find((account) => String(account.email || "").trim().toLowerCase() === developerEmail);
const envReady = envEmail === developerEmail && Boolean(envPassword);
const fileReady = Boolean(developerAccount?.password);
const ready = envReady || fileReady;

console.log("HS Finder operations smoke readiness");
console.log(`developerEmail=${developerEmail}`);
console.log(`accountsFile=${accountsFile}`);
console.log(`accountsFileExists=${fs.existsSync(accountsFile)}`);
console.log(`developerAccountInFile=${Boolean(developerAccount)}`);
console.log(`developerPasswordInFile=${fileReady}`);
console.log(`operationsEnvEmailMatches=${envEmail ? envEmail === developerEmail : false}`);
console.log(`operationsEnvPasswordPresent=${Boolean(envPassword)}`);
console.log(`ready=${ready}`);

if (!ready) {
  console.log("nextAction=SMOKE_OPERATIONS_EMAIL에는 지정 개발자 이메일을, SMOKE_OPERATIONS_PASSWORD에는 해당 계정 비밀번호를 설정한 뒤 smoke:production을 실행하세요.");
  process.exitCode = 1;
}
