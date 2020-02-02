var AdminWindow = artifacts.require('AdminWindow')
let catchRevert = require("./exceptionsHelpers.js").catchRevert
const BN = web3.utils.BN

contract('AdminWindow', accounts => {

    const admin = accounts[0]
    const jobPoster1 = accounts[1]
    const jobPoster2 = accounts[2]

    let instance

    before(async () => {
        instance = await AdminWindow.new()
    })

    it("Job poster can req access from Admin", async() => {
        await instance.reqAccessFromAdmin(jobPoster1, {from:jobPoster1});
        const posterAccess = await instance.checkPosterAccess.call(jobPoster1);
        assert.equal(posterAccess, 1, "Job poster status should  change to 1 to indicate pending approval");
    });

    it("Admin should be able to fetch addr of pending poster", async() => {
        const poster1Addr = await instance.fetchPendingPoster(0, {from:admin});
        assert.equal(poster1Addr, jobPoster1, "Poster 1 is pending approval & should be the first in pending queue");
    });

    it("Admin can approve a Job Poster", async() => {
        await instance.approvePoster(jobPoster1, {from:admin});
        const posterAccess = await instance.checkPosterAccess.call(jobPoster1);
        assert.equal(posterAccess, 2, "Job poster status should change to 2 to indicate admin approval")
    });

    it("Admin should be able to fetch addr of approved poster", async() => {
        const poster1Addr = await instance.fetchApprovedPoster.call(0, {from:admin});
        assert.equal(poster1Addr, jobPoster1, "Poster 1 is approved & should be the first in approved queue");
    });

    it("New Job posters can req access when others are already in queue", async() => {
        await instance.reqAccessFromAdmin(jobPoster2, {from:jobPoster2});
        const posterAccess = await instance.checkPosterAccess.call(jobPoster2);
        assert.equal(posterAccess, 1, "Job poster status should  change to 1 to indicate pending approval");
        const poster2Addr = await instance.fetchPendingPoster(1, {from:admin});
        assert.equal(poster2Addr, jobPoster2, "Poster 2 is pending approval & should be the second in pending queue");

    });

    it("Approved Poster cannot request approval again", async() => {
        await catchRevert(instance.reqAccessFromAdmin(jobPoster1, {from:jobPoster1}));
    });

    it("Admin can delete an approved Job Poster", async() => {
        await instance.deletePoster(jobPoster1, {from:admin});
        const posterAccess = await instance.checkPosterAccess.call(jobPoster1);
        assert.equal(posterAccess, 0, "Job poster status should change to 0 to indicate deleteion")
    });
})