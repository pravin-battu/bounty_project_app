App = {
  web3Provider: null,
  contracts: {},

  init: async function() 
  {
    return await App.initWeb3();
  },

  initWeb3: async function() 
  {
    // Modern dapp browsers...
    console.log('web3')
    if (window.ethereum) 
    {
      App.web3Provider = window.ethereum;
      try 
      {
        // Request account access
        await window.ethereum.enable();
      } catch (error)
      {
        // User denied account access...
        console.error("User denied account access")
      }
    }
    // Legacy dapp browsers...
    else if (window.web3) 
    {
      App.web3Provider = window.web3.currentProvider;
    }
    // If no injected web3 instance is detected, fall back to Ganache
    else 
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
      return App.verifyAdmin();
    });
    // return App.bindEvents();
  },

  // bindEvents: function() 
  // {
  //   $(document).on('click', '.btn-adopt', App.handleAdopt);
  // },

  verifyAdmin: function() 
  {
    var AdminWindowInstance;
    web3.eth.getAccounts(function(error, accounts) 
    {
      if (error) 
      {
        console.log(error);
      }

      var acc = accounts[0];
      $('#currentAddress').text(acc);

      App.contracts.AdminWindow.deployed().then(function(instance) 
      {
        AdminWindowInstance = instance;
        return AdminWindowInstance.isAdmin(acc);
      }).then(function(isAdmin) 
      {
        if (isAdmin) 
        {
          return App.adminView();
        } else 
        {
          return App.checkPoster();
        }
      });
    });
  },

  adminView: function() 
  {
    document.getElementById("pageTitle").innerHTML = "Admin View"
    $('#adminView').attr('style', '');
    $('#posterView').attr('style', 'display: none;');
    $('#defaultView').attr('style', 'display: none;');

    //App.deletePoster();
    App.approvedListView();
    return App.requesterListView();
  },

  checkPoster: function() 
  {
    var AdminWindowInstance;
    web3.eth.getAccounts(function(error, accounts) 
    {
      if (error) 
      {
        console.log(error);
      }
      var acc = accounts[0];

      App.contracts.AdminWindow.deployed().then(function(instance) 
      {
        AdminWindowInstance = instance;
        return AdminWindowInstance.checkPosterAccess(acc);
      }).then(function(value) 
      {
        if (value.toNumber() === 2) 
        {
          return App.posterView();
        } else 
        {
          return App.defaultView();
        }
      });
    });
  },

  posterView: function() 
  {
    document.getElementById("pageTitle").innerHTML = "Bounty Poster View"
    $('#posterView').attr('style', '');
    $('#adminView').attr('style', 'display: none;');
    $('#defaultView').attr('style', 'display: none;');
    App.postBounty();
    //App.deleteBounty();
    App.bountyListView();
  },

  defaultView: function() 
  {
    // console.log('default view')
    $('#defaultView').attr('style', '');
    $('#adminView').attr('style', 'display: none;');
    $('#posterView').attr('style', 'display: none;');

    web3.eth.getAccounts(async function(error, accounts) 
    {
      if (error) 
      {
        console.log(error);
      }

      $('.btn-request-access').attr('data-addr', accounts[0]);
      $('.btn-request-access').attr('style', '');
      let AdminWindowInstance = await App.contracts.AdminWindow.deployed();

      let BountyHubInstance = await App.contracts.BountyHub.deployed();
      let count = await BountyHubInstance.getBountyCount();
      count = Number(count);

      acc = accounts[0];
      let approvedStatus = await AdminWindowInstance.checkPosterAccess(acc);
      if(approvedStatus.toNumber() !== 0)
      {
        $('.btn-request-access').prop('disabled', true);
      }

      let bountyListDiv = $('#bountyList');
      let bountyTemplate = $('#bountyListItem');
      for(let i=0; i<count; i++) 
      {
        let bountyOwner = await BountyHubInstance.getBountyOwner(i);
        ///let status = await AdminWindowInstance.checkPosterAccess(bountyOwner);

        let status = await BountyHubInstance.getBountyStatus(i);
        console.log(status);
        ///if(status.toNumber() === 2)
        if(status)
        {
          let desc = await BountyHubInstance.getBountyDesc(i);
          bountyTemplate.find('#bountyListItemDesc').text(desc);
          bountyTemplate.find('#bountyListItemDesc').attr('href', "/bountyhub.html?id=" + i);
          bountyListDiv.append(bountyTemplate.html());
        }
        
      }
    });

    $('.btn-request-access').attr('data-addr', "test");
    $(document).on('click', '.btn-request-access', App.reqAccess);
  },

  requesterListView: function() 
  {
    var pendPostersDiv = $('#pendPosters');
    var requesterTemplate = $('#requesterTemplate'); 
    var approveButton = $('.btn-approve-requester');
    var rejectButton = $('.btn-reject-requester');
    var AdminWindowInstance;
    web3.eth.getAccounts(function(error, accounts) 
    {
      if (error) 
      {
        console.log(error);
      }

      var account = accounts[0];

      App.contracts.AdminWindow.deployed().then(function(instance) 
      {
        AdminWindowInstance = instance;
        return AdminWindowInstance.fetchPendingPosterNum({from:account});
      }).then(function(length) 
      {
        return App.getRequesters(length, account);
      }).then(function(requesters) 
      {
        for(i=0; i<requesters.length; i++) 
        {
          requesterTemplate.find('.requesterAddress').text(requesters[i]);
          approveButton.attr('data-addr', requesters[i]);
          rejectButton.attr('data-addr', requesters[i]);
          pendPostersDiv.append(requesterTemplate.html());
          $(document).on('click', '.btn-approve-requester', App.approveRequests);
          $(document).on('click', '.btn-reject-requester', App.rejectRequests);
        }
      })
    });
  },

  approvedListView: function() 
  {
    var approvedPostersDiv = $('#approvedPosters');
    var approvedTemplate = $('#approvedTemplate'); 
    var deleteButton = $('.btn-delete-poster');
    var AdminWindowInstance;
    web3.eth.getAccounts(function(error, accounts) 
    {
      if (error) 
      {
        console.log(error);
      }

      var account = accounts[0];

      App.contracts.AdminWindow.deployed().then(function(instance) 
      {
        AdminWindowInstance = instance;
        return AdminWindowInstance.fetchApprovedPosterNum({from:account});
      }).then(function(length) 
      {
        console.log(length.toNumber());
        return App.getApproved(length, account);
      }).then(function(approved) 
      {
        for(i=0; i<approved.length; i++) 
        {
          //console.log(i);
          approvedTemplate.find('.posterAddress').text(approved[i]);
          deleteButton.attr('data-addr', approved[i]);
          approvedPostersDiv.append(approvedTemplate.html());
          $(document).on('click', '.btn-delete-poster', App.deleteRequests);
        }
      })
    });
  },

  reqAccess: function(event) 
  {
    //console.log('Access Request function');
    var requesterAddr = $(event.target).data('addr');
    //console.log(requesterAddr);
    web3.eth.getAccounts(function(error, accounts) 
    {
      if (error) 
      {
        console.log(error);
      }
      var acc = accounts[0];
      var AdminWindowInstance;
      //console.log(acc);
      App.contracts.AdminWindow.deployed().then(function(instance)
      {
        console.log('Admin Panel check');
        AdminWindowInstance = instance;
        return AdminWindowInstance.reqAccessFromAdmin(acc, {from: acc});
      }).then(function()
      {
        $(event.target).text('Request sent').attr('disabled', true);
      });
    });
  },

  deleteRequests: function(event) 
  {
    var addr = $(event.target).data('addr');
    var AdminWindowInstance;

    web3.eth.getAccounts(function(error, accounts) 
    {
      if (error) 
      {
        console.log(error);
      }
      var account = accounts[0];
      App.contracts.AdminWindow.deployed().then(function(instance) 
      {
        AdminWindowInstance = instance;
        return AdminWindowInstance.deletePoster(addr, {from: account});
      }).then(function() 
      {
        $(event.target).text('Deleted!').attr('disabled', true);
        location.reload();
      })
    });
  },

  getRequesters: async function(length, account) 
  {
    let requesters = [];
    let AdminWindowInstance = await App.contracts.AdminWindow.deployed();

    for(i=0; i<length; i++) 
    {
      let requester = await AdminWindowInstance.fetchPendingPoster(i);
      let posterType = await AdminWindowInstance.checkPosterAccess(requester, {from:account});
      //console.log(posterType.toNumber());
      
      if (posterType.toNumber() === 1) 
      {
        requesters.push(requester);
      }
    }

    let set = new Set(requesters);
    let vals = set.values();
    return Array.from(vals);
  },


  getApproved: async function(length, account) 
  {
    let approved = [];
    let AdminWindowInstance = await App.contracts.AdminWindow.deployed();
    console.log(length)
    for(i=0; i<length; i++) 
    {
      let poster = await AdminWindowInstance.fetchApprovedPoster(i);
      let posterType = await AdminWindowInstance.checkPosterAccess(poster, {from:account});
      console.log(posterType.toNumber());
      
      if (posterType.toNumber() === 2) 
      {
        approved.push(poster);
      }
    }
    console.log(approved);
    let set = new Set(approved);
    console.log(set);
    let vals = set.values();
    console.log(vals);
    return Array.from(vals);
  },

  approveRequests: function(event) 
  {
    var addr = $(event.target).data('addr');
    var AdminWindowInstance;

    web3.eth.getAccounts(function(error, accounts) 
    {
      if (error) 
      {
        console.log(error);
      }
      var account = accounts[0];
      App.contracts.AdminWindow.deployed().then(function(instance) 
      {
        AdminWindowInstance = instance;
        return AdminWindowInstance.approvePoster(addr, {from: account});
      }).then(function() 
      {
        $(event.target).text('Approved!').attr('disabled', true);
        location.reload();
        // $('.btn-reject-requester').prop('disabled', true);
      })
    });
  },

  rejectRequests: function(event) 
  {
    var addr = $(event.target).data('addr');
    var AdminWindowInstance;

    web3.eth.getAccounts(function(error, accounts) 
    {
      if (error) 
      {
        console.log(error);
      }
      var account = accounts[0];
      App.contracts.AdminWindow.deployed().then(function(instance) 
      {
        AdminWindowInstance = instance;
        return AdminWindowInstance.rejectPoster(addr, {from: account});
      }).then(function() 
      {
        $(event.target).text('Rejected!').attr('disabled', true);
        location.reload();
        // $('.btn-approve-requester').prop('disabled', true);
        
      })
    });
  },

  postBounty: function() 
  {   
    var BountyHubInstance;

    $('#postBounty').submit(function(event) 
    {
      let desc = $("input#bountyDesc").val();
      let amt = $("input#bountyAmt").val();
      console.log(amt);
      console.log(Number(amt));
      console.log(web3.toWei(amt));
      console.log(web3.toWei(Number(amt)));
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
          console.log("in func");
          console.log(amt);
          return BountyHubInstance.createBounty(desc, web3.toWei(Number(amt)), {from: acc});
        }).then(function()
        {
          location.reload();
        });        
      });
      event.preventDefault();
    });
  },

  deleteBounty: function() 
  {
    var BountyHubInstance;
    var bountyID = $(event.target).data('id');

    console.log(bountyID);
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
        return BountyHubInstance.deleteBounty(bountyID, {from: acc});
      }).then(function()
      {
        //$(event.target).text('Deleted!').attr('disabled', true);
        location.reload();
      });
    });
  },
  

  bountyListView: async function(e) 
  {
    var bountiesDiv = $('#bounties');
    var bountyTemplate = $('#bountyTemplate'); 
    var deleteButton = $('.btn-delete-bounty');
    var withdrawForm = $('.wf');
    console.log('Bounty owner list');
    let accounts = web3.eth.accounts;
    let account = accounts[0];
    let BountyHubInstance = await App.contracts.BountyHub.deployed();
    let bountyList = await BountyHubInstance.viewPostedBounties(account, {from: account});
    console.log(bountyList);
    let bountySet = new Set(bountyList);
    let vals = bountySet.values();
    let bountyIDs = Array.from(vals); 
    console.log(bountyIDs);
    for(i=0; i<bountyIDs.length; i++) 
    {
      console.log(await BountyHubInstance.getBountyStatus(bountyIDs[i]));
      if(await BountyHubInstance.getBountyStatus(bountyIDs[i]))
      {
      let bountyDesc = await BountyHubInstance.getBountyDesc(bountyIDs[i]);
      let bountyAmt = await BountyHubInstance.getBountyAmt(bountyIDs[i]);
      bountyTemplate.find('#bountyID').text(bountyIDs[i]);
      //bountyTemplate.find('#bountyAmt').text(web3.fromWei(bountyAmt));
      bountyTemplate.find('#bountyAmt').text(web3.fromWei(bountyAmt));
      bountyTemplate.find('#bountyLink').text(bountyDesc);
      bountyTemplate.find('#bountyDesc').text(bountyDesc);
      
      bountyTemplate.find('#bountyLink').attr('href', "/bountyhub.html?id=" + bountyIDs[i]);

      deleteButton.attr('data-id', bountyIDs[i]);

      withdrawForm.find('#bountyID').attr("value", bountyIDs[i]);
      bountiesDiv.append(bountyTemplate.html());

      $(document).on('click', '.btn-delete-bounty', App.deleteBounty);
      }
    }
  },

};

$(function() 
{
  $(window).load(function() 
  {
    App.init();
  });
});
