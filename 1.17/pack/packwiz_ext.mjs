import {inspect} from 'util';
import fetch from 'node-fetch';
import * as fs from 'fs';
import * as crypto from 'crypto';

const argv = process.argv;
const hash_sum = crypto.createHash('sha256');

if (argv.length < 3 || (argv[2] === 'github' && argv.length < 6)) {
    console.log('Not enough arguments');
    console.log('');
    help();
    process.exit(1);
}

if (argv[2] === 'github') {
    let release_data = await get_github_release_data(argv[3], argv[4], argv[5]);
    let asset_data = get_file_asset(release_data);
    let asset_hash = await get_file_hash_from_asset(asset_data);

    console.log(`name = "${argv[4]}"`);
    console.log(`filename = "${asset_data.name}"`);
    console.log(`side = "both"`);
    console.log("");
    console.log("[download]");
    console.log(`url = "${asset_data.browser_download_url}"`);
    console.log('hash-format = "sha256"');
    console.log(`hash = "${asset_hash}"`);
} else {
    console.log('Unknown action');
    help();
}

function help() {
    console.log(`${argv[0]} ${argv[1]} github <user> <repo> <tag>`);
}

function build_github_api_link(user, repo, tag) {
    return `https://api.github.com/repos/${user}/${repo}/releases/tags/${tag}`;
}

async function get_github_release_data(user, repo, tag) {
    let response = await fetch(build_github_api_link(user, repo, tag),
        {
            headers: {Accept: 'application/vnd.github.v3+json'},
            method: 'GET'
        });

    let json = await response.json();
    
    return json;
}

function get_file_asset(github_json) {
    for (let asset of github_json.assets) {
        if (!asset.name.endsWith('-dev.jar') && !asset.name.endsWith('-javadoc.jar') 
            && !asset.name.endsWith('-sources.jar') && !asset.name.endsWith('-sources-dev.jar')
            && asset.name.endsWith('.jar'))
            return asset;
    }

    return null;
}

async function get_file_hash_from_asset(github_asset) {
    let response = await fetch(github_asset.browser_download_url,
        {
            method: 'GET'
        });

    let buffer = await response.buffer();
    hash_sum.update(buffer);
    return hash_sum.digest('hex');
}
