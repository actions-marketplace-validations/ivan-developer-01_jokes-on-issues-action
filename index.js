const core = require('@actions/core');
const github = require('@actions/github');
const Axios = require('axios');

console.log("workflow started....");

const github_token = core.getInput('GITHUB_TOKEN', { required: true });


const issue_msg = core.getInput("issue_msg", { required: false });
const PR_msg = core.getInput("PR_msg", { required: false });



const context = github.context;

const author = context.payload.sender.login;
const repoOwner = context.payload.repository.owner.login;

if (author.includes("[bot]") || author === repoOwner) {
    console.log("Avoiding issues/PR opened by bot/repo owner....");
    process.exit(0);
}

function randomNumber(min, max) {
    return Math.floor(Math.random() * (max - min) + min);
}

async function getRandomMeme() {
    const url = "https://raw.githubusercontent.com/deep5050/programming-memes/main/memes.json"
    try {
        const response = await Axios.get(url);
        var data = response.data;
        var random = randomNumber(0, data.length);
        var img_data = data[random];
        var image_url = "https://raw.githubusercontent.com/deep5050/programming-memes/main/" + img_data['path'];
        console.log(image_url);
        var html = `
        <div align=center>
        <img alt=meme src=${image_url} width=500px align=center >
        </div>
        `;
        return html;
    } catch (err) {
        core.setFailed(`Error:${err.message}`);
        console.log(`Error in getting a meme: ${err.message}`);
        return '';
    }
}



async function run(meme) {
    try {

        var event = github.context.eventName;
        var greetMsg;
        if (event === 'pull_request') {
            if (!PR_msg) {
                message = 'Hi, {{author}}, \nThanks for opening this PR :blue_heart: .\nContributors :people_holding_hands:  like you make the open source community :earth_africa:  such an amazing place to learn :book: , inspire :angel:, and create :art: .\nWe will review it :eyes: and get back to you as soon as possible :+1: . Just make sure you have followed the contribution guidelines.\n\nBy that time enjoy this meme :point_down: , hope you like it :smile:\n{{meme}}'
                core.debug("PR msg not set, appying default");
            }
            else {
                message = PR_msg;
                core.debug("PR msg is set");
            }
        }
        else if (event === 'issues') {
            if (!issue_msg) {
                message = 'Hi, {{author}}, \nThanks for your contribution :blue_heart: .\nContributors :people_holding_hands:  like you make the open source community :earth_africa:  such an amazing place to learn :book: , inspire :angel:, and create :art: .\nWe will investigate :eyes:  and get back to you as soon as possible :+1: . Just make sure you have given us sufficient information :information_source:.\n\nBy that time enjoy this meme :point_down: , hope you like it :smile:\n{{meme}}';
                core.debug("issue msg not set, applying default message");
            }
            else {
                message = issue_msg;
                core.debug("Issuer msg is set");

            }
        }

        console.log(`Running on ${event}......`);


        // console.log(`eventname: ${github.context.eventName}`)
        // console.log(`payload sender: ${JSON.stringify(github.context.payload.sender, undefined, 2)}`)
        // console.log(`workflow: ${github.context.workflow}`)
        // console.log(`payload: ${JSON.stringify(github.context.payload, undefined, 2)}`)


        var issueNumber;
        if (event === 'pull_request') {
            issueNumber = context.payload.pull_request.number;
        }
        else if (event === 'issues') {
            issueNumber = context.payload.issue.number;
        }

        const octokit = github.getOctokit(github_token);

        console.log(`got this meme: ${meme}`)
        console.log("commenting...")
        var messageBody = message.replace('{{author}}', '@' + author).replace('{{meme}}', meme);
        messageBody = messageBody + "\n\nUse this [action](https://github.com/deep5050/memes-on-issues-action) on your projects.";

        const comment = await octokit.issues.createComment({
            issue_number: issueNumber,
            owner: context.payload.repository.owner.login,
            repo: context.payload.repository.name,
            body: messageBody
        })
        core.setOutput('comment-url', comment.data.html_url);
    } catch (error) {
        core.setFailed(error.message);
    }
}




getRandomMeme().then((data) => {
    console.log(`meme: ${data}`);
    run(data);
}).catch((err) => {
    core.setFailed(`Error: ${err}`)
})