#!/bin/bash -e

function build() {
    lint 
    tsc -noEmit
    esbuild Common/src/TS/DI.ts --bundle --minify --outfile=out.js --platform=node --sourcemap
    test
}

function init() {
    npm install -g pnpm 
    npm install -g esbuild 
    pnpm install 
    pnpm setup 

}
function lint() {
    npx eslint . --fix
}
function test(){
    npx jest
}

build