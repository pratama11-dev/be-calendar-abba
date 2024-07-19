## documentation in progress....

```sh
npx prisma generate --schema ./prisma/sap_schema.prisma
```

## Rules on this repo
#### 1. each `routes should be a lower case`
#### 2. `dont change any dockerfile or docker-compose` without my approval. you can always make your own dockerfile and compose but dont push it to git. there is .gitignore, you can add your folder there
#### 3. please make sure you `build it on your own machine before pushing it to dev or live branch` (in testing idc). any mistake you made on live or dev it should be on your behalf, if you dont build it first i wont help u lol (just kidding, just roll the fucking back).
#### 4. when `pushing to dev or live, make sure to npx prisma db push with the related env first`, ci cd doesnt cover it because it is dangerous
#### 5. most importantly, `dont change prisma.schema` without my approval!
#### 6. and second most importantly `dont npx prisma db pull`

## Debugging
sometimes large query and big function is making me want to go puke even though i was sober, so in order to overcome that i made some improvement in this repo:

### Step 1 :
```sh
npm run dev:debug
```

### Step 2 :
#### A. Using visual studio code :
```
ctrl + shift + d
```
- and then just click the play on attach to TS-Node,
- and you can start having similar experience like visual studio c# (breakpoint, continue, step over, step into, and stop out).
- and you can have extended console.log experience like you did in chrome.

#### B. Using visual studio code :
- well this is a lite version, just start chrome and type this address :
```
chrome://inspect
```
- wait 10s, in remote target, you should see something like this : PPIC-Api_node_modules_ts-node-dev_lib_wrap.js
- click on inspect
- it should have all the benefit like visual studio without ever installing visual studio code if you hate it.
