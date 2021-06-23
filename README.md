# Angular with Node.js and TypeScript

## Summary
> This is a template for creating an Angular application with a single Node.js Express API using TypeScript. The finished build generates a Node.js server serving the Angular application at the root and all endpoints at the ```/api/*``` route. Using TypeScript in the API allows the use of shared DTO models between server and client. The development environment is configured with concurrent server/client hot reload using ```nodemon```. The root package.json configures the dev environment and allows you to build the container locally using npm scripts eliminating the need for shell scripts and providing easy CI/CD integration.

## Usage
The following three commands can be run from inside the ```/app``` directory:  
This project includes three packages, so to install dependencies in all three run:
```bash
npm run i
```
To start the development server on [http://localhost:4200](http://localhost:4200) run:
```bash
npm run dev
```
To build and start the docker container on [http://localhost:3000](http://localhost:3000) run:
```bash
npm run docker
```

## Step by step setup
1. Make sure you have an up-to-date version of [Node.js](https://nodejs.org/en/) installed.
2. If you don't already have it, install the Angular CLI with:
```bash
npm i -g @angular/cli
```
4. Create a project directory. I'll call it ```/app```.
5. From inside ```/app```, run ```ng new client``` to generate the client app. Configure the settings any way you like.
6. To avoid nested git repos you may want to delete the ```/app/client/.git``` directory and initialize a new repo at ```/app```.
7. Add ```/app/client/proxy.conf.json```:
```json
{
  "/api/*": {
    "target": "http://localhost:3000",
    "secure": false
  }
}
```
4. Add the ```dev``` script to ```/app/client/package.json```:
```json
  "scripts": {
    "ng": "ng",
    "dev": "ng serve --proxy-config proxy.conf.json", <-- add this one
    "start": "ng serve",
    "build": "ng build",
    "watch": "ng build --watch --configuration development",
    "test": "ng test"
  },
```
5. Create a directory for the server in the root directory. I'll call it ```/app/server```.
6. From inside ```/app/server``` run:
```
npm init -y
```
7. Install dependencies by running: 
```bash
npm i --save express body-parser helmet
npm i --save-dev ts-node typescript webpack webpack-cli nodemon @types/body-parser @types/express @types/node
```
8. Add ```/app/server/tsconfig.json```:
```json
{
  "compilerOptions": {
    "module": "commonjs",
    "moduleResolution": "node",
    "esModuleInterop": true,
    "outDir": "build",
    "target": "es2016"
  },
  "include": ["src"]
}
```
9. Add ```/app/server/nodemon.json```:
```json
{
  "ignore": ["**/*.test.ts", "**/*.spec.ts", "node_modules"],
  "watch": ["src"],
  "exec": "npm start",
  "ext": "ts"
}
```
10. Add ```/app/server/webpack.config.js```:
```js
const path = require('path')

module.exports = {
  target: 'node',
  entry: './build/server/src/index.js',
  output: {
    path: path.join(__dirname, 'bundle'),
    filename: 'index.js',
  },
  optimization: {
    minimize: true,
  },
}

```
11. Add the following three scripts to ```/app/server/package.json```:
```json
  "scripts": {
    "dev": "nodemon",
    "start": "ts-node src/index.ts",
    "build": "npx tsc && webpack"
  },
```
12. Create the ```/app/dtos``` directory and add a sample shared model at ```/app/dtos/person.ts```:
```typescript
export interface PersonProperties {
  lastName: string
  firstName: string
}
export interface Person extends PersonProperties {
  id: string
}
```
13. Create the server index file at ```/app/server/src/index.ts```:
```typescript
import express from 'express'
import { Person } from '../../dtos/person'
import { Request, Response } from 'express'

const app = express()
const PORT = 3000

app.use(express.static('public'))

app.get('/api/people', (_req: Request, res: Response) =>
  res.send([
    {
      lastName: 'Smith',
      firstName: 'John',
      id: '123',
    },
    {
      lastName: 'Doe',
      firstName: 'Jane',
      id: '345',
    },
  ] as Person[])
)

app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`)
})
```
14. In the Angular client, add a sample call to the server in three steps:  
- Import the http client in ```app/client/src/app/app.module.ts```:
- Add the API call to ```app/client/src/app/app.component.ts```:
- Display results in ```app/client/src/app/app.component.html```:
```typescript
import { NgModule } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';
import { HttpClientModule } from '@angular/common/http';

import { AppComponent } from './app.component';

@NgModule({
  declarations: [AppComponent],
  imports: [BrowserModule, HttpClientModule],
  providers: [],
  bootstrap: [AppComponent],
})
export class AppModule {}
```
```typescript
import { Component } from '@angular/core';
import { HttpClient } from '@angular/common/http';
// Note server and client both reference the same model
import { Person } from '../../../dtos/person' 

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.css'],
})
export class AppComponent {
  constructor(private httpClient: HttpClient) {}
  people$ = this.httpClient.get<Person[]>('/api/people');
}
```
```html
<ul *ngFor="let person of people$ | async">
  <li>{{ person.firstName }} {{ person.lastName }} ({{ person.id }})</li>
</ul>
```
15. From the ```/app``` directory run:
```bash
npm init -y
```
16. Install ```concurrently``` with:
```bash
npm i --save-dev concurrently
```
17. Add the scripts to ```app/package.json```:
```json
  "scripts": {
    "server-watch": "npm --prefix server run dev",
    "client-watch": "npm --prefix client run dev",
    "i": "npm i && npm --prefix server i && npm --prefix client i",
    "dev": "concurrently npm:*-watch",
    "docker": "docker build -t angular-node . && docker rm -f angular-node && docker run -it -p 3000:3000 --name angular-node angular-node"
  },
```
18. Add ```/app/dockerfile```. Update with newer versions if needed:
```dockerfile
FROM node:16-alpine AS client-build
RUN npm install -g @angular/cli@^12.0.4
COPY . ./src
WORKDIR /src/client
RUN npm i
RUN ng build

FROM node:16-alpine AS server-build
COPY . ./src
WORKDIR /src/api
RUN npm i
RUN npm run build

FROM node:16-alpine
WORKDIR /app
COPY --from=server-build /src/api/bundle .
COPY --from=client-build /src/client/dist/client ./public
CMD [ "node", "index.js"]
```



## How it works
You end up with three packages; server, client and app, which contains both. The ```npm run dev``` and ```npm run docker``` are configured in the app packages ```/app/package.json``` file shown here:
```json
{
  "scripts": {
    "server-watch": "npm --prefix server run dev",
    "client-watch": "npm --prefix client run dev",
    "i": "npm i && npm --prefix server i && npm --prefix client i",
    "dev": "concurrently npm:*-watch",
    "docker": "docker build -t angular-node . && docker rm -f angular-node && docker run -it -p 3000:3000 --name angular-node angular-node"
  },
  "devDependencies": {
    "concurrently": "^6.2.0"
  }
}
```
The ```/app/package.json``` has one dev dependency, ```concurrently```, which allows you to run the ```client-watch``` and ```server-watch``` scripts at the same time in one console. This is just for convenience. The ```server-watch``` and ```client-watch``` scripts call npm scripts in the ```app/server``` and ```app/client``` packages respectively using the ```--prefix``` flag to call outside of the working directory. So when you run ```npm run dev``` it launches the development environment which includes the server and client, both with hot reload. You'll notice you can also run ```npm run i``` to install all dependencies using the same method. The ```docker``` script just builds the container locally so you can see it working. A build server or deploy script will be able to us the same docker file.
## Configuring the development environment

## 1. The client
In order for the Angular development server running on port ```4200``` to know how to find the api server on port ```3000``` without fully qualifying the url, Angular provides a server proxy. This is only used in dev since our finished bundle will host the Angular app and the API from the same origin. To enable the proxy, add a ```proxy.config.json``` file to the root of the Angular client directory:
```json
{
  "/api/*": {                           <-- calls prefixed with /api will be proxied
    "target": "http://localhost:3000",  <-- where your api will be running
    "secure": false                     <-- no https
  }
}
```
You can tell Angular to use this proxy configuration with ```ng serve --proxy-config proxy.conf.json```. For convenience, this is added to Angular's ```package.json``` scripts section allowing you to just run ```npm run dev```, which is what the root script is calling with ```client-watch```. With this set up, API calls to ```/api``` will hit the dev server.
That's it for the client. The Angular CLI will take care of the bundling part for deployment.

## 2. The API
Here, we have three goals:
1. Enable TypeScript so that we can share DTO models between client and server.
2. Configure live reload on the server so we can work on everything without rebuilding.
3. Configure single file bundling to make Docker deployment easier.  

First, here are the dependencies that need to be installed to make this happen. Note that the TypeScript dependencies are install as dev, because TypeScript gets compiled out:
```json
{
  "dependencies": {
    "express": "^4.17.1",            <-- the server library
    "body-parser": "^1.19.0",        <-- for request handling
    "helmet": "^4.6.0"               <-- for request handling
  },
  "devDependencies": {
    "ts-node": "^10.0.0",            <-- for TypeScript
    "typetcript": "^4.3.4",          <-- for TypeScript
    "webpack": "^5.39.1",            <-- for bundling 
    "webpack-cli": "^4.7.2",         <-- for bundling
    "nodemon": "^2.0.7",             <-- for live reload
    "@types/body-parser": "^1.19.0", <-- to use types
    "@types/express": "^4.17.12",    <-- to use types
    "@types/node": "^15.12.2",       <-- to use types
  }
}
```
With TypeScript installed, we configure it by adding a ```tsconfig.json``` file to the root of the package:
```json
{
  "compilerOptions": {
    "module": "commonjs",
    "moduleResolution": "node",
    "esModuleInterop": true,
    "outDir": "build",
    "target": "es2016"
  },
  "include": ["src"] <-- all the .ts files are here per the project structure
}
```
Now to start the server with ```src/index.ts``` as the entry point, we can run ```ts-node src/index.ts``` since we installed ```ts-node``` as our TypeScript executor. This means we can now run our dev server from ```.ts``` files without transpiling to ```.js``` first. For convenience, this script is registered in the ```package.json``` scripts as ``` "start": "ts-node src/index.ts"```.  

Live reload is handled using ```nodemon```, which we installed. We just need to tell it what files to watch and and how to restart the server. It's configured with a ```nodemon.json``` file at the root of the server package:
```json
{
  "ignore": ["**/*.test.ts", "**/*.spec.ts", "node_modules"],
  "watch": ["src"],     <-- where to watch
  "exec": "npm start",  <-- what to run when something changes
  "ext": "ts"           <-- what files to watch
}
```
With ```nodemon``` installed and the configuration file in place, we can just run ```nodemon``` to start the dev server.  

So, we add ```"dev": "nodemon"``` to our scripts to start the live server. This is what our root ```package.json``` calls ```server-watch```.

Finally, for bundling we'll need to add ```webpack.config.js``` to the root of the server package. Note the entrypoint targets a ```.js``` file not ```.ts``` since we will call ```npx tsc``` to compile TypeScript to JavaScript prior to bundling. The ```.tsconfig.json``` file specified that the output directory be ```/build```, so that's what is referenced here as the entrypoint for Webpack to create the bundle:
```js
const path = require('path')

module.exports = {
  target: 'node', // since this is a general webpack config, we need to say it's for node
  entry: './build/server/src/index.js', // after TypeScript compiler runs, this is the .js entrypoint
  output: {
    path: path.join(__dirname, 'bundle'), // this can be any path and directory you want
    filename: 'index.js',
  },
  optimization: {
    minimize: true,
  },
}
```
So, bundling is a two step process:
1. Transpile the TypeScript to JavaScript with ```npx tsc```. This is available since you installed the ```typescript``` package.
2. Bundle by calling ```webpack```.  

We add ```"build": "npx tsc && webpack"``` to the scripts in ```package.json``` to do all of this. This will ultimatly create a single file bundle at ```bundle/index.js``` since that what we configured in ```webpack.config.js```.  

And that's it for configuration on the server side.  

The last thing to do is make sure our express server can also serve our Angular app. That's just one line in our ```index.ts``` main server file:
```js
app.use(express.static('public'))
```
This sets up the server to look for static files in ```/public``` and serve them at the root url. We'll need to make sure this is where we put the Angular bundle when we build the container.
## Packaging the container
All this happens in the ```dockerfile``` at the root of the app package. Since we can now create a single file bundle for our server and the Angular CLI can create the bundle for the client, it's just a matter of running our scripts and moving files around.
```dockerfile
FROM node:16-alpine AS client-build         # start with a node environment
RUN npm install -g @angular/cli@^12.0.4     # install the Angular CLI for bundling
COPY . ./src                                # copy in all the project source
WORKDIR /src/client                         # go to the client so you can execute scripts
RUN npm i                                   # install outside dependencies
RUN ng build                                # use the Angular CLI to generate the bundle

FROM node:16-alpine AS server-build         # start with a fresh node environment
COPY . ./src                                # copy in all the project source
WORKDIR /src/api                            # go to the client so you can execute scripts
RUN npm i                                   # install outside dependencies
RUN npm run build                           # call the script to generate the bundle

FROM node:16-alpine                         # another clean node environment
WORKDIR /app                                # set the app directory to /app
COPY --from=server-build /src/api/bundle .  # place your server index.js in /app
COPY --from=client-build /src/client/dist/client ./public  # and the Angular bundle in /api/public
CMD [ "node", "index.js"]                   # run it
```
Since the build uses pure Docker, it's an easy task for any build server.
## References
- [Configureing Nodemon on the server](https://samuelsson.dev/make-a-TypeScript-node-server-hot-reload-on-changes-with-nodemon/)
- [Setting up Express with TypeScript](https://ultimatecourses.com/blog/setup-TypeScript-nodejs-express)
- [Setting up Dev server proxy](https://www.positronx.io/setting-up-angular-proxy-configuration-via-angular-json/)
- [Bundling node app with webpack](https://jhol.medium.com/bundling-your-js-TypeScript-node-js-modules-code-withwebpack-f99e082ae10b)
