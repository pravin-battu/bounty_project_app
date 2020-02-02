
## **Bounty dApp**

  

Description: A bounty dApp for the job posters and hunters.  

There are 3 access types:  
1) Admin - Owns the portal and can approve, reject or delete job posters.  
  
2) Job Poster - Once approved by the admin, they can create a new bounty. They can set a bounty description and include the amount to be paid for a successful submission. They are able to view a list of bounties that they have already posted. By clicking on a bounty, they can review submissions by bounty hunters. They can approve a submission that fits their requirements. Accepting proposed work will pay the submitter the defined amount.  
  
3) Bounty Hunter - Any 3rd party can be a bounty hunter. On the portal, they can see a list of available bounties. Clicking on a bounty redirects to submission page, where they can submit solutions. They can submit multiple solutions to a single bounty.  
  
 

# Project Instructions

## Installation

1) Install [NodeJS](https://nodejs.org/en/) depending on your system

2) GanacheCLI

    `npm install -g ganache-cli`

3) Truffle

    `npm install -g truffle`

4) [Metamask Browser Extension](https://metamask.io/)

  

## Running the dApp

**Note - You may need to manually refresh pages to view UI updates or State changes. Also please update the indexes on webpage when multiple bounties created to reflect the actual status.**


git clone git@github.com:pravin-battu/bounty_project_app.git
cd bounty_project_app
npm install
Install Truffle and Ganache globally.

npm install -g truffle
npm install -g ganache-cli
Run Ganache with predefined seed words.

Configure metamask set it to a private network (localhost 8545).

In a second terminal tab compile and migrate the smart contracts.

truffle compile
truffle migrate --reset
Test the contract by running tests in truffle.

truffle test
Run the frontend (App will be available at http://localhost:3000).

npm start

1) Install Truffle and Ganache globally and start ganache-cli

    npm install -g truffle
    npm install -g ganache-cli

2) Configure atleast 3 accounts in Metamask using the credentials from the test blockchain. You can either import the mnemonic or manually import accounts using the private keys  

3) Clone this repo  

4) Open a new terminal and navigate to the repo cloned  

5) Execute `npm install` to install necessary packages(This step is important as project is using an external library from OpenZeppelin)  

6) Execute `truffle compile` to compile the contracts

7) Run `truffle migrate --reset` to deploy contracts to test blockchain

8) For evaluating the project, note that 1st acc belongs to admin, 2nd to Job Poster and 3rd to Bounty hunter.

9) Execute `npm run dev` to start the project. A new browser windows should open once everything is initialised. Otherwise, you can manually open [http://localhost:3000/](http://localhost:3000/) in your browser.

10) Interacting with the app

-- **Admin** account - Initially if you interact with the app using admin account, you'll see an empty panel. Admin only approves, rejects or deletes job posters. Switch to another account to send an approval request.  
-- **Job Poster** account - Use any account except the first account to access BountyHub. You can request access as a job poster by clicking on *Request for Job Post access* button. After requesting access, switch back to admin account using metamask, refresh the browser and approve/reject the Job poster's access using the Admin Panel.  
Once Job poster is approved, he/she can post Bounties and approve Submissions to bounties. Once a Job poster approves a submission, the bounty amount is transferred to the submitter and bounty is disabled.  
Note - Remember to Switch to Job Poster account to post bounties.  
-- **Bounty Hunter** account - Again use any account except Admin and Job poster to submit solutions to bounties. You can view all bounties on the hub. Click on a bounty to load the Submission panel. Provide a link to your submission and wait for Job Poster to approve it.

  

## Executing Test Cases

1) Run a development blockchain using Ganache/Ganache-CLI

2) `cd` to the project directory and run `truffle test`

3) There are a total of 12 testcases written in javascript. All should pass