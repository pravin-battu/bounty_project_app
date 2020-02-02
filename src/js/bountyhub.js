const promisify = (inner) =>
  new Promise((resolve, reject) =>
    inner((err, res) => 
    {
      if (err) { reject(err) }
      resolve(res);
    })
  );

const getBalance = (account, at) => promisify(cb => web3.eth.getBalance(account, at, cb));

App = {
  web3Provider: null,
  contracts: {},
  bountyID: null,

  init: function() 
  {
    return App.initWeb3();
  },

  initWeb3: function() 
  {
    if (typeof web3 != 'undefined') 
    {
      App.web3Provider = web3.currentProvider;
    } else 
    {
      App.web3Provider = new Web3.providers.HttpProvider('http://localhost:8545');
    }
    
    web3 = new Web3(App.web3Provider);

    return App.initContract();
  },

  initContract: function() 
  {
    $.when(
      $.getJSON('AdminWindow.json', function(data) 
      {
        var AdminWindowArtifact = data;
        App.contracts.AdminWindow = TruffleContract(AdminWindowArtifact);
        App.contracts.AdminWindow.setProvider(App.web3Provider);
      }),

      $.getJSON('BountyHub.json', function(data) 
      {
        var BountyHubArtifact = data;
        App.contracts.BountyHub = TruffleContract(BountyHubArtifact);
        App.contracts.BountyHub.setProvider(App.web3Provider);
      })
    ).then(function() 
    {
      var vars = {};
      var parts = window.location.href.replace(/[?&]+([^=&]+)=([^&]*)/gi, function(m,key,value) 
      {
        vars[key] = value;
      });
      App.bountyID = vars["id"]; 

      return App.verifyBountyOwner();
    });
  },

  verifyBountyOwner: function() 
  {
    web3.eth.getAccounts(async function(error, accounts) 
    {
      if (error) 
      {
        console.log(error);
      }

      var acc = accounts[0];
      $('#currentAddress').text(acc);

      let BountyHubInstance = await App.contracts.BountyHub.deployed();
      let bountyOwner = await BountyHubInstance.getBountyOwner(App.bountyID, {from:acc});

      if (acc === bountyOwner) 
      {
        return App.defaultView();
      } else 
      {
        return App.bountyHunterView();
      }
    });
  },

  bountyHunterView: function() 
  {
    $('#bountyHunterView').attr('style', '');
    $('#defaultView').attr('style', 'display: none;');
    App.createSubmission();
    App.subListView();
  },

  defaultView: function() 
  {
    $('#bountyHunterView').attr('style', 'display: none;');
    App.subListView();
  },

  createSubmission: function() 
  {
    var BountyHubInstance;

    $('#createSub').submit(function(event) 
    {
      let URL = $("input#submissionURL").val();

      web3.eth.getAccounts(function(error, accounts) 
      {
        if (error) 
        {
          console.log(error);
        }
        var account = accounts[0];
        console.log(account);
        App.contracts.BountyHub.deployed().then(function(instance) 
        {
          BountyHubInstance = instance;
          console.log(account);
          return BountyHubInstance.createSubmission(App.bountyID, URL, {from: account});
        }).then(function()
        {
          location.reload();
        });
      });
      event.preventDefault();
    });
  },

  subListView: async function(e) 
  {
    var submissionDiv = $('#submission');
    var subTemplate = $('#subTemplate'); 
    var approvalForm = $('#approveSub');

    let accounts = web3.eth.accounts;
    let acc = accounts[0];
    let BountyHubInstance = await App.contracts.BountyHub.deployed();
    
    let bountyDesc = await BountyHubInstance.getBountyDesc(App.bountyID);
    let titleNew = "Bounty - " + bountyDesc;
    document.getElementById("pageTitle").innerHTML = titleNew;
    document.title = titleNew;

    let subIDarr = await BountyHubInstance.getSubsbyBounty(App.bountyID);
    //console.log(subIDarr);
    let uniqueSubIDs = new Set(subIDarr);
    let vals = uniqueSubIDs.values();
    let subIDs = Array.from(vals); 
    //console.log(subIDs);
    let bountyOwneraddr = await BountyHubInstance.getBountyOwner(App.bountyID);

    let desc = await BountyHubInstance.getBountyDesc(App.bountyID);
    let amt = await BountyHubInstance.getBountyAmt(App.bountyID);

    for(i=0; i<subIDs.length; i++) 
    {
      //console.log(subIDs[i].value);
      let URL = await BountyHubInstance.getSubmissionURL(subIDs[i], {from:acc});
      let subOwnerAddr = await BountyHubInstance.getSubmissionOwner(subIDs[i], {from:acc});
      subTemplate.find('#subID').text(subIDs[i]);
      subTemplate.find('#subOwner').text(subOwnerAddr);
      subTemplate.find('#subURL').text(URL);

      if (bountyOwneraddr === acc) 
      { 
        approvalForm.attr('style', '');
        approvalForm.find('#submissionID').attr("value", subIDs[i]);
      } 
      submissionDiv.append(subTemplate.html());
    }
    App.approveSub(amt);
    // App.deleteBounty();
  },

  approveSub: function(amt) 
  {
    var BountyHubInstance;

    $('#approveSub').submit(function(event) 
    {
      let subID = $(this).closest("form").find("input[name='id']").val();
      console.log(subID);
      web3.eth.getAccounts(function(error, accounts) 
      {
        if (error) 
        {
          console.log(error);
        }
        var acc = accounts[0];
        App.contracts.BountyHub.deployed().then(function(instance) 
        {
          BountyHubInstance = instance;
          console.log(acc);
          console.log(amt.toNumber());
          console.log(web3.toWei(amt));
          return BountyHubInstance.approveSubmission(App.bountyID, subID, {from: acc, value: amt});
        });
      });
      $('.btn-submit').prop('disabled', true);
      event.preventDefault();
    });
  },
};

$(function() 
{
  $(window).load(function() 
  {
    App.init();
  });
});