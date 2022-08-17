#!/bin/bash -e

function debugBuild(){
    npx esbuild Common/src/TS/ --minify --outdir=build/ --platform=node --sourcemap
}

function buildRelease() {
    lint
    tsc -noEmit
    fastBuild
    test
}
function lintbuild(){
    lint
    build
}
function init() {
    npm install -g pnpm 
    npm install esbuild 
    pnpm install 
    pnpm setup 

}
function lint() {
    npx eslint --fix
}
function test(){
    
    npx uvu
}
debugBuild
