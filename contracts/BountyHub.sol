pragma solidity ^0.5.0;

import './AdminWindow.sol';
import "../node_modules/@openzeppelin/contracts/math/SafeMath.sol";

/*
* @title BountyHub
* @dev Hub for job posters to post bounties and enthusiasts to submit projects
*/
contract BountyHub
{
    using SafeMath for uint;

    //address public bountyOwner;
    AdminWindow public panelInstance;

    uint public bountyCount;
    uint public submissionCount;

    // maps bountyID to the owner
    mapping(uint => address) bountyIDtoOwnerMap;
    // map of bounty owners to the bounty IDs
    mapping(address => uint[]) ownerBountyIDMap;
    // map of bountyID to Bounties
    mapping(uint => Bounty) IDtoBountyMap;


    // maps bountyID to submissionIDs
    mapping(uint => uint[]) bountyIDtoSubIDmap;
    // maps submissionID to bountyID
    mapping(uint => uint) subIDtoBountyIDmap;
    // map of submission ID to submission creator
    mapping(uint => address payable) subIDtoCreatorMap;
    // map of subID to Submissions
    mapping(uint => Submission) IDtoSubMap;

    // Events associated with the project
    event LogBountyCreated(uint bountyID);
    event LogBountyDeleted(uint bountyID);
    event LogBountySubmitted(address bountyHunter, uint bountyID);
    event LogBountyAccepted(address bountyHunter, uint bountyID);
    event LogSubmissionAccepted(uint bountyID, uint submissionID);


    /** @dev Struct to hold bounty info
	* @param bountyID unique identifier
	* @param description Bounty details
    * @param bountyAmt Bounty amount
	* @param bountyOwner addr of bounty owner
	*/
    struct Bounty
    {
        uint bountyID;
        string description;
        uint bountyAmt;
        address payable bountyOwner;
        bool status;
    }

    /** @dev Struct to hold bounty info
    * @param submissionID unique submission ID
	* @param bountyID associated bounty ID
	* @param URL link to project
    * @param subOwner address of submission owner
    * @param accepted bool to indicate if submission was accepted
	*/
    struct Submission
    {
        uint submissionID;
        uint bountyID;
        string URL;
        address payable subOwner;
        bool accepted;
    }

    constructor(address adminAddr)
        public
    {
        panelInstance = AdminWindow(adminAddr);
        bountyCount = 0;
    }

    // Verifies if the function caller is an approved poster
    modifier verifyJobPoster()
    {
        require (panelInstance.checkPosterAccess(msg.sender) == 2, 'Please request access from Admin.');
        _;
    }

    // Verifies if the function caller created the bounty
    modifier verifyBountyOwner(uint bountyID)
    {
        require(bountyIDtoOwnerMap[bountyID] == msg.sender, 'You are not the owner of this bounty');
        _;
    }


    /** @dev Allows an approved Poster to create a bounty
	* @param _desc Bounty Description
    * @param _amt Prize money
	*/
    function createBounty(string memory _desc, uint _amt)
        public
        verifyJobPoster()
    {
        Bounty memory newBounty = Bounty(bountyCount, _desc, _amt, msg.sender, true);
        bountyIDtoOwnerMap[bountyCount] = msg.sender;
        ownerBountyIDMap[msg.sender].push(bountyCount);
        IDtoBountyMap[bountyCount] = newBounty;
        bountyCount++;
        emit LogBountyCreated(bountyCount);
    }

    /** @dev Allows Bounty owner to delete a bounty
	* @param bountyID unique BountyID
	*/
    function deleteBounty(uint bountyID)
        public
        verifyJobPoster()
        verifyBountyOwner(bountyID)
    {
        require(IDtoBountyMap[bountyID].status == true, 'Bounty is already inactive');
        IDtoBountyMap[bountyID].status = false;
        emit LogBountyDeleted(bountyID);
    }

    /** @dev Fetch list of bountyIDs
    * @return A list of bountyIDs associated with the owner
	*/
    function viewPostedBounties(address posterAddr)
        public
        view
        returns(uint[] memory)
    {
        return ownerBountyIDMap[posterAddr];
    }


    /** @dev Fetch the bountyCount
    * @return bountyCount that can be used to run a loop and fetch individual bounty details
	*/
    function getBountyCount()
        public
        view
        returns(uint)
    {
        return bountyCount;
    }

    /** @dev Fetches the bounty desc using the bountyID
	* @param bountyID unique BountyID
    * @return Bounty description
	*/
    function getBountyDesc(uint bountyID)
        public
        view
        returns(string memory)
    {
        return IDtoBountyMap[bountyID].description;
    }

    /** @dev Fetches the bounty amt using the bountyID
	* @param bountyID unique BountyID
    * @return Bounty amount
	*/
    function getBountyAmt(uint bountyID)
        public
        view
        returns(uint)
    {
        return IDtoBountyMap[bountyID].bountyAmt;
    }

    /** @dev Fetches the bounty owner addr using the bountyID
	* @param bountyID unique BountyID
    * @return Owner address
	*/
    function getBountyOwner(uint bountyID)
        public
        view
        returns(address)
    {
        return IDtoBountyMap[bountyID].bountyOwner;
    }

    /** @dev Fetches the bounty status using the bountyID
	* @param bountyID unique BountyID
    * @return returns a bool to indicate if bounty is active or not
	*/
    function getBountyStatus(uint bountyID)
        public
        view
        returns(bool)
    {
        return IDtoBountyMap[bountyID].status;
    }

    /** @dev Approve submission for a bounty
	* @param bountyID unique BountyID
	*/
    function approveSubmission(uint bountyID, uint submissionID)
        public
        payable
        verifyJobPoster()
        verifyBountyOwner(bountyID)
    {
        require(IDtoBountyMap[bountyID].status == true, 'Bounty is inactive');
        IDtoSubMap[submissionID].accepted = true;
        uint amt = IDtoBountyMap[bountyID].bountyAmt;

        require(msg.value >= amt, '');
        uint refund = msg.value - amt;
        
        address payable subOwner = IDtoSubMap[submissionID].subOwner;
        subOwner.transfer(amt);
        msg.sender.transfer(refund);

        deleteBounty(bountyID);
        emit LogSubmissionAccepted(bountyID, submissionID);
    }

    /** @dev Create a new submission for a bounty
	* @param bountyID unique BountyID
    * @param URL Submission URL
	*/
    function createSubmission(uint bountyID, string memory URL)
        public
    {
        IDtoSubMap[submissionCount] = Submission(submissionCount, bountyID, URL, msg.sender, false);
        subIDtoBountyIDmap[submissionCount] = bountyID;
        bountyIDtoSubIDmap[bountyID].push(submissionCount);
        submissionCount++;
    }

    /** @dev Get all submission associated with a bounty
	* @param bountyID unique BountyID
    * @return list of submission IDs
	*/
    function getSubsbyBounty(uint bountyID)
        public
        view
        returns (uint[] memory)
    {
        return bountyIDtoSubIDmap[bountyID];
    }


    /** @dev Get bounty ID corresponding to a submission
	* @param subID unique BountyID
    * @return Bounty ID
	*/
    function getSubsBountyID(uint subID)
        public
        view
        returns(uint)
    {
        return subIDtoBountyIDmap[subID];
    }


    /** @dev Get submission owner addr
	* @param subID unique BountyID
    * @return Address of submission owner
	*/
    function getSubmissionOwner(uint subID)
        public
        view
        returns(address)
    {
        return IDtoSubMap[subID].subOwner;
    }

    /** @dev Get submitted project's URL
	* @param subID unique BountyID
    * @return URL of submitted project
	*/
    function getSubmissionURL(uint subID)
        public
        view
        returns(string memory)
    {
        return IDtoSubMap[subID].URL;
    }

    /** @dev Get submission status
	* @param subID unique BountyID
    * @return bool to indicate whether bounty owner accepted the sub
	*/
    function getSubmissionStatus(uint subID)
        public
        view
        returns(bool)
    {
        return IDtoSubMap[subID].accepted;
    }




}