pragma solidity ^0.5.0;

// import "@openzeppelin/contracts/math/SafeMath.sol";
import "../node_modules/@openzeppelin/contracts/math/SafeMath.sol";

/**
* @title AdminWindow
* @dev Allows Hub-admin to add and remove Job posters and allows Job posters to request access
*/
contract AdminWindow
{

    using SafeMath for uint;

    // Admin
    address admin;

    bool private stopped = false;

    // Map of Job posters approved by admin
    // 0 -> unapproved
    // 1 -> poster added to req queue
    // 2 -> poster approved by Admin
    mapping(address => uint) public posterAccess;

    // An array of posters that are yet to receive approval from admin
    address[] postersWaitingApproval;

    // An array of job posters approved by the admin
    address[] approvedPosters;


    // Events related to job posters
    event LogContractStateChange(bool state);
    event LogPosterDelete(address posterAddr);
    event LogPosterAccessReq(address posterAddr);
    event LogPosterApproved(address posterAddr);
    event LogPosterRejected(address posterAddr);


    // Checks if the caller is admin
    modifier verifyAdmin(){
        require(msg.sender == admin, 'Only admin can execute this task');
        _;
    }

    // Circuit breaker
    modifier stopInEmergency() {
        require(stopped == false, "Requests disabled by admin");
        _;
    }

    constructor()
        public
    {
        admin = msg.sender;
    }

    /** @dev Verify is an addr is admin
	* @param addr - Address to be checked
    * @return Bool to indicate whether addr is admin
	*/
    function isAdmin(address addr)
        public
        view
        returns (bool)
    {
        return(addr == admin);
    }


    /** @dev Toggles contract state in emergency
	*/
	function toggleContractState()
	    public
	    verifyAdmin()
	{
		stopped = !stopped;
        emit LogContractStateChange(stopped);
	}

    /** @dev Allows admin delete an already approved job poster
	* @param posterAddr - Address of the Job poster
	*/
    function deletePoster(address posterAddr)
        public
        verifyAdmin()
    {
        posterAccess[posterAddr] = 0;

        emit LogPosterDelete(posterAddr);
    }

    /** @dev Allows admin to approve job posters who request access
	* @param posterAddr - Address of the Job poster
	*/
    function approvePoster(address posterAddr)
        public
        verifyAdmin()
    {
        posterAccess[posterAddr] = 2;
        approvedPosters.push(posterAddr);
        emit LogPosterApproved(posterAddr);
    }

    /** @dev Allows admin to reject job posters who request access
	* @param posterAddr - Address of the Job poster
	*/
    function rejectPoster(address posterAddr)
        public
        verifyAdmin()
    {
        posterAccess[posterAddr] = 0;
        emit LogPosterRejected(posterAddr);
    }

    /** @dev Allows admin to fetch an approved posters addr using idx
	* @return address of the approved poster at the given idx
	*/
    function fetchApprovedPoster(uint idx)
        public
        view
        verifyAdmin
        returns (address)
    {
        return approvedPosters[idx];
    }

    /** @dev Allows admin to fetch the number of approved
	* @return length of array of approved posters
	*/
    function fetchApprovedPosterNum()
        public
        view
        verifyAdmin
        returns(uint)
    {
        return approvedPosters.length;
    }

    /** @dev Allows admin to fetch the addr posters pending approval
	* @return address of the approved poster at the given idx
	*/
    function fetchPendingPoster(uint idx)
        public
        view
        verifyAdmin
        returns(address)
    {
        return postersWaitingApproval[idx];
    }

    /** @dev Allows admin to fetch the number of posters pending approval
	* @return length of array of pending posters
	*/
    function fetchPendingPosterNum()
        public
        view
        verifyAdmin
        returns(uint)
    {
        return postersWaitingApproval.length;
    }

    /** @dev Allows job posters to req access from Admin
	* @param posterAddr - Address of the Job poster
    * @return bool to indicate if request was successful
	*/
    function reqAccessFromAdmin(address posterAddr)
        public
        stopInEmergency()
        returns(bool)
    {
        require(posterAccess[posterAddr] == 0, 'Poster is already approved or pending approval');
        posterAccess[posterAddr] = 1;
        postersWaitingApproval.push(posterAddr);
        emit LogPosterAccessReq(posterAddr);
        return true;
    }

    /** @dev Allows anyone to check a poster's access credentials
	* @param posterAddr - Address of the Job poster
    * @return uint value that indicates poster's access type
	*/
    function checkPosterAccess(address posterAddr)
        public
        view
        returns(uint)
    {
        return posterAccess[posterAddr];
    }

}