// SPDX-License-Identifier: MIT
pragma solidity 0.8.30;

import {IERC20} from "@openzeppelin/contracts/token/ERC20/IERC20.sol";

contract ProofOfChill {
    // ============ Custom Errors ============
    error WrongStakeAmount(uint256 provided, uint256 required);

    // ============ Constants ============
    address public constant DEFAULT_WLD_TOKEN = 0x2cFc85d8E48F8EAB294be644d9E25C3030863003;

    // ============ State Variables ============
    IERC20 public wldToken;
    struct Hangouts {
        uint256 hangoutId;
        address creator;
        string name;
        uint256 _wrdAmount;
        uint256 startTime;
        uint256 endTime;
        mapping(address => bool) isParticipant;
        mapping(address => bool) isInvited;
        mapping(address => bool) isVotedOut;
        mapping(address => bool) hasStaked;
        mapping(address => mapping(address => bool)) hasVotedToKick; // voter => target => has voted
        mapping(address => uint256) kickVotesCount; // target => number of votes
        uint256 participantCount; // Track total number of participants
        address[] participants;
        address[] invited;
        bool isClosed;
    }

    struct User {
        address userAddress;
        uint256[] createdHangouts;
        uint256[] participatedHangouts;
        uint256[] invitedHangouts;
    }

    // Main storage variables
    mapping(uint256 => Hangouts) public hangouts; // ID => Hangout
    mapping(address => User) public users; // User address => User
    uint256 public nextHangoutId; // Counter for creating new IDs

    // ============ Events ============
    event UserKicked(uint256 indexed hangoutId, address indexed kickedUser);
    event VoteSubmitted(
        uint256 indexed hangoutId,
        address indexed voter,
        address indexed target
    );
    event HangoutClosed(uint256 indexed hangoutId);
    event HangoutCreated(
        uint256 indexed hangoutId,
        address indexed creator,
        string name,
        uint256 wrdAmount
    );
    event UserJoined(uint256 indexed hangoutId, address indexed user);
    event UserInvited(uint256 indexed hangoutId, address indexed invitedUser);
    event UserStaked(
        uint256 indexed hangoutId,
        address indexed user,
        uint256 amount
    );
    event RefundClaimed(
        uint256 indexed hangoutId,
        address indexed user,
        uint256 amount
    );
    // ============ Constructor ============
    constructor() {
        wldToken = IERC20(DEFAULT_WLD_TOKEN);
    }
    
    // For testing purposes
    function setWldToken(address tokenAddress) external {
        wldToken = IERC20(tokenAddress);
    }
    
    // ============ Modifiers ============
    modifier onlyCreator(uint256 _hangoutId) {
        require(msg.sender == hangouts[_hangoutId].creator, "Not creator");
        _;
    }
    modifier onlyParticipant(uint256 _hangoutId) {
        require(
            hangouts[_hangoutId].isParticipant[msg.sender],
            "Not participant"
        );
        _;
    }

    modifier onlyInvited(uint256 _hangoutId) {
        require(hangouts[_hangoutId].isInvited[msg.sender], "Not invited");
        _;
    }

    modifier isHangoutClosed(uint256 _hangoutId) {
        require(hangouts[_hangoutId].isClosed == true, "Hangout is not closed");
        _;
    }

    // ============ Constructor ============

    // ============ External Functions ============

    function createHangout(
        string memory _name,
        uint256 _wrdAmonut,
        uint256 _startTime,
        uint256 _endTime
    ) external returns (uint256) {
        require(_wrdAmonut > 0, "Stake amount should be greater than 0");
        require(
            _startTime > block.timestamp,
            "Start time should be in the future"
        );
        require(
            _endTime > _startTime,
            "End time should be greater than start time"
        );

        uint256 hangoutId;

        hangoutId = nextHangoutId++;

        Hangouts storage hangout = hangouts[hangoutId];

        hangout.hangoutId = hangoutId;
        hangout.creator = msg.sender;
        hangout.name = _name;
        hangout.startTime = _startTime;
        hangout.endTime = _endTime;
        hangout._wrdAmount = _wrdAmonut;

        // Add creator as first participant
        hangout.isInvited[msg.sender] = true;
        // hangout.participantCount = 1;

        User storage userInfo = users[msg.sender];
        userInfo.userAddress = msg.sender;
        // userInfo.participatedHangouts.push(hangoutId);
        // hangout.participants.push(msg.sender);
        userInfo.invitedHangouts.push(hangoutId);
        userInfo.createdHangouts.push(hangoutId);

        emit HangoutCreated(hangoutId, msg.sender, _name, _wrdAmonut);

        return hangoutId;
    }

    // ============ Hangout functions ============

    function inviteToHangout(
        uint256 _hangoutId,
        address _user
    ) external onlyParticipant(_hangoutId) {
        require(!hangouts[_hangoutId].isInvited[_user], "User already invited");
        hangouts[_hangoutId].isInvited[_user] = true;
        hangouts[_hangoutId].invited.push(_user);
        // Update user's invited hangouts array
        User storage userInfo = users[_user];
        userInfo.userAddress = _user;
        userInfo.invitedHangouts.push(_hangoutId);

        emit UserInvited(_hangoutId, _user);
    }

    function joinHangout(
        uint256 _hangoutId,
        uint256 amount
    ) external onlyInvited(_hangoutId) {
        require(
            !hangouts[_hangoutId].isParticipant[msg.sender],
            "User already joined"
        );

        _stake(_hangoutId, amount);
        hangouts[_hangoutId].isParticipant[msg.sender] = true;
        hangouts[_hangoutId].participants.push(msg.sender);
        hangouts[_hangoutId].participantCount++;

        // Remove user from invited array
        _removeFromInvited(_hangoutId, msg.sender);

        // Update user info
        User storage user = users[msg.sender];
        user.userAddress = msg.sender;
        user.participatedHangouts.push(_hangoutId);

        emit UserJoined(_hangoutId, msg.sender);
    }

    function voteOut(
        uint256 _hangoutId,
        address _user
    ) external onlyParticipant(_hangoutId) {
        require(
            !hangouts[_hangoutId].isVotedOut[_user],
            "User already voted out"
        );
        require(
            !hangouts[_hangoutId].hasVotedToKick[msg.sender][_user],
            "User already voted against this "
        );

        hangouts[_hangoutId].hasVotedToKick[msg.sender][_user] = true;
        hangouts[_hangoutId].kickVotesCount[_user]++;

        if (
            hangouts[_hangoutId].kickVotesCount[_user] >=
            hangouts[_hangoutId].participantCount / 2
        ) {
            hangouts[_hangoutId].isVotedOut[_user] = true;

            // Remove user from participants array
            Hangouts storage hangout = hangouts[_hangoutId];
            for (uint256 i = 0; i < hangout.participants.length; i++) {
                if (hangout.participants[i] == _user) {
                    // Replace with the last element and then pop
                    hangout.participants[i] = hangout.participants[
                        hangout.participants.length - 1
                    ];
                    hangout.participants.pop();
                    break;
                }
            }
            hangouts[_hangoutId].participantCount--;
            emit UserKicked(_hangoutId, _user);
        }
        emit VoteSubmitted(_hangoutId, msg.sender, _user);
    }

    function closeHangout(
        uint256 _hangoutId
    ) external onlyParticipant(_hangoutId) {
        require(
            hangouts[_hangoutId].isClosed == false,
            "Hangout already closed"
        );
        if (block.timestamp >= hangouts[_hangoutId].endTime) {
            hangouts[_hangoutId].isClosed = true;
            
            // Distribute WLD tokens to eligible participants
            Hangouts storage hangout = hangouts[_hangoutId];
            uint256 eligibleCount = 0;
            address[] memory eligibleParticipants = new address[](hangout.participants.length);
            
            // Count eligible participants (not voted out)
            for (uint256 i = 0; i < hangout.participants.length; i++) {
                address participant = hangout.participants[i];
                if (hangout.isParticipant[participant] && !hangout.isVotedOut[participant]) {
                    eligibleParticipants[eligibleCount] = participant;
                    eligibleCount++;
                }
            }
            
            // Calculate token distribution
            if (eligibleCount > 0) {
                uint256 totalAmount = hangout._wrdAmount * hangout.participantCount;
                uint256 amountPerParticipant = totalAmount / eligibleCount;
                
                // Distribute tokens to eligible participants
                for (uint256 i = 0; i < eligibleCount; i++) {
                    address participant = eligibleParticipants[i];
                    uint256 amount = amountPerParticipant;
                    
                    // Give remainder to creator if they're eligible
                    if (participant == hangout.creator && i == eligibleCount - 1) {
                        amount += totalAmount % eligibleCount;
                    }
                    
                    // Transfer WLD tokens to participant
                    require(wldToken.transfer(participant, amount), "Token transfer failed");
                    emit RefundClaimed(_hangoutId, participant, amount);
                }
            }
            
            emit HangoutClosed(_hangoutId);
        }
    }

    function declineInvitation(
        uint256 _hangoutId
    ) external onlyInvited(_hangoutId) {
        _removeFromInvited(_hangoutId, msg.sender);
    }

    // ============ Public Functions ============

    // ============ Internal Functions ============
    function _removeFromInvited(uint256 _hangoutId, address _user) internal {
        Hangouts storage hangout = hangouts[_hangoutId];
        address[] storage invitedList = hangout.invited;

        // Find the user in the invited array
        for (uint256 i = 0; i < invitedList.length; i++) {
            if (invitedList[i] == _user) {
                // Replace the found user with the last element
                if (i < invitedList.length - 1) {
                    invitedList[i] = invitedList[invitedList.length - 1];
                }
                // Remove the last element
                invitedList.pop();
                // Also update the isInvited mapping
                hangout.isInvited[_user] = false;
                break;
            }
        }
    }

    function _stake(uint256 _hangoutId, uint256 amount) internal {
        require(
            !hangouts[_hangoutId].hasStaked[msg.sender],
            "User already staked"
        );
        if (amount != hangouts[_hangoutId]._wrdAmount) {
            revert WrongStakeAmount(amount, hangouts[_hangoutId]._wrdAmount);
        }

        hangouts[_hangoutId].hasStaked[msg.sender] = true;
        emit UserStaked(_hangoutId, msg.sender, amount);
    }

    // ============ View Functions ============

    // Get basic hangout details
    function getHangoutDetails(
        uint256 _hangoutId
    )
        external
        view
        returns (
            string memory name,
            address creator,
            uint256 wrdAmount,
            uint256 startTime,
            uint256 endTime,
            bool isClosed,
            uint256 participantCount,
            address[] memory participants,
            address[] memory invited
        )
    {
        Hangouts storage hangout = hangouts[_hangoutId];
        return (
            hangout.name,
            hangout.creator,
            hangout._wrdAmount,
            hangout.startTime,
            hangout.endTime,
            hangout.isClosed,
            hangout.participantCount,
            hangout.participants,
            hangout.invited
        );
    }

    // Get details for all hangouts a user is participating in
    function getUserParticipatedHangoutsDetails(
        address _user
    )
        external
        view
        returns (
            uint256[] memory hangoutIds,
            string[] memory names,
            address[] memory creators,
            uint256[] memory wrdAmounts,
            uint256[] memory startTimes,
            uint256[] memory endTimes,
            bool[] memory isClosed,
            uint256[] memory participantCounts
        )
    {
        uint256[] memory userHangouts = users[_user].participatedHangouts;
        uint256 length = userHangouts.length;

        // Initialize arrays with the correct length
        hangoutIds = new uint256[](length);
        names = new string[](length);
        creators = new address[](length);
        wrdAmounts = new uint256[](length);
        startTimes = new uint256[](length);
        endTimes = new uint256[](length);
        isClosed = new bool[](length);
        participantCounts = new uint256[](length);

        // Populate arrays with hangout details
        for (uint256 i = 0; i < length; i++) {
            uint256 hangoutId = userHangouts[i];
            Hangouts storage hangout = hangouts[hangoutId];

            hangoutIds[i] = hangoutId;
            names[i] = hangout.name;
            creators[i] = hangout.creator;
            wrdAmounts[i] = hangout._wrdAmount;
            startTimes[i] = hangout.startTime;
            endTimes[i] = hangout.endTime;
            isClosed[i] = hangout.isClosed;
            participantCounts[i] = hangout.participantCount;
        }

        return (
            hangoutIds,
            names,
            creators,
            wrdAmounts,
            startTimes,
            endTimes,
            isClosed,
            participantCounts
        );
    }

    // Get details for all hangouts a user is invited to
    function getUserInvitedHangoutsDetails(
        address _user
    )
        external
        view
        returns (
            uint256[] memory hangoutIds,
            string[] memory names,
            address[] memory creators,
            uint256[] memory wrdAmounts,
            uint256[] memory startTimes,
            uint256[] memory endTimes,
            bool[] memory isClosed,
            uint256[] memory participantCounts
        )
    {
        uint256[] memory userInvitedHangouts = users[_user].invitedHangouts;
        uint256 length = userInvitedHangouts.length;

        // Initialize arrays with the correct length
        hangoutIds = new uint256[](length);
        names = new string[](length);
        creators = new address[](length);
        wrdAmounts = new uint256[](length);
        startTimes = new uint256[](length);
        endTimes = new uint256[](length);
        isClosed = new bool[](length);
        participantCounts = new uint256[](length);

        // Populate arrays with hangout details
        for (uint256 i = 0; i < length; i++) {
            uint256 hangoutId = userInvitedHangouts[i];
            Hangouts storage hangout = hangouts[hangoutId];

            hangoutIds[i] = hangoutId;
            names[i] = hangout.name;
            creators[i] = hangout.creator;
            wrdAmounts[i] = hangout._wrdAmount;
            startTimes[i] = hangout.startTime;
            endTimes[i] = hangout.endTime;
            isClosed[i] = hangout.isClosed;
            participantCounts[i] = hangout.participantCount;
        }

        return (
            hangoutIds,
            names,
            creators,
            wrdAmounts,
            startTimes,
            endTimes,
            isClosed,
            participantCounts
        );
    }

    // Check if a user is a participant in a hangout
    function isParticipant(
        uint256 _hangoutId,
        address _user
    ) external view returns (bool) {
        return hangouts[_hangoutId].isParticipant[_user];
    }

    // Check if a user is invited to a hangout
    function isInvited(
        uint256 _hangoutId,
        address _user
    ) external view returns (bool) {
        return hangouts[_hangoutId].isInvited[_user];
    }

    // Check if a user has been voted out of a hangout
    function isVotedOut(
        uint256 _hangoutId,
        address _user
    ) external view returns (bool) {
        return hangouts[_hangoutId].isVotedOut[_user];
    }

    // Check if a user has staked in a hangout
    function isStaked(
        uint256 _hangoutId,
        address _user
    ) external view returns (bool) {
        return hangouts[_hangoutId].hasStaked[_user];
    }

    // Get the number of votes against a user in a hangout
    function getVotesAgainstUser(
        uint256 _hangoutId,
        address _user
    ) external view returns (uint256) {
        return hangouts[_hangoutId].kickVotesCount[_user];
    }

    // Check if a user has voted to kick another user
    function hasVotedToKick(
        uint256 _hangoutId,
        address _voter,
        address _target
    ) external view returns (bool) {
        return hangouts[_hangoutId].hasVotedToKick[_voter][_target];
    }

    // Calculate refund amount for a user
    function calculateRefundAmount(
        uint256 _hangoutId,
        address _user
    ) external view returns (uint256) {
        Hangouts storage hangout = hangouts[_hangoutId];

        if (
            !hangout.isClosed ||
            !hangout.isParticipant[_user] ||
            hangout.isVotedOut[_user]
        ) {
            return 0;
        }

        uint256 eligibleCount = 0;

        // Iterate through participants array
        for (uint256 i = 0; i < hangout.participants.length; i++) {
            address participant = hangout.participants[i];
            if (
                hangout.isParticipant[participant] &&
                !hangout.isVotedOut[participant]
            ) {
                eligibleCount++;
            }
        }

        // If no eligible participants (shouldn't happen), use total participant count
        if (eligibleCount == 0) {
            eligibleCount = hangout.participantCount;
        }

        uint256 amount = hangout._wrdAmount / eligibleCount;

        // Add remainder to creator's share if creator is eligible
        if (
            _user == hangout.creator &&
            !hangout.isVotedOut[hangout.creator] &&
            hangout._wrdAmount % eligibleCount > 0
        ) {
            amount += hangout._wrdAmount % eligibleCount;
        }

        return amount;
    }

    function distributeFunds(
        uint256 _hangoutId
    ) external onlyCreator(_hangoutId) {
        Hangouts storage hangout = hangouts[_hangoutId];
        require(hangout.isClosed, "Hangout must be closed");

        uint256 eligibleCount = 0;
        address[] memory eligibleParticipants = new address[](
            hangout.participants.length
        );

        // Collect eligible participants
        for (uint256 i = 0; i < hangout.participants.length; i++) {
            address participant = hangout.participants[i];
            if (
                hangout.isParticipant[participant] &&
                !hangout.isVotedOut[participant] &&
                hangout.hasStaked[participant]
            ) {
                eligibleParticipants[eligibleCount] = participant;
                eligibleCount++;
            }
        }

        emit HangoutClosed(_hangoutId);
    }

    // Get all hangouts a user has created
    function getUserCreatedHangouts(
        address _user
    ) external view returns (uint256[] memory) {
        return users[_user].createdHangouts;
    }

    // Get all hangouts a user is participating in
    function getUserParticipatedHangouts(
        address _user
    ) external view returns (uint256[] memory) {
        return users[_user].participatedHangouts;
    }

    // Get all hangouts a user is invited to
    function getUserInvitedHangouts(
        address _user
    ) external view returns (uint256[] memory) {
        return users[_user].invitedHangouts;
    }

    // Get the total number of hangouts created
    function getTotalHangoutsCount() external view returns (uint256) {
        return nextHangoutId;
    }

    // Get current block timestamp - useful for testing
    function getCurrentBlockTimestamp() public view returns (uint256) {
        return block.timestamp;
    }

    // Check if a hangout exists
    function hangoutExists(uint256 _hangoutId) external view returns (bool) {
        return _hangoutId < nextHangoutId;
    }

    // Check if a hangout is active (not closed and current time is between start and end)
    function isHangoutActive(uint256 _hangoutId) external view returns (bool) {
        Hangouts storage hangout = hangouts[_hangoutId];
        return
            !hangout.isClosed &&
            block.timestamp >= hangout.startTime &&
            block.timestamp <= hangout.endTime;
    }

    // Check if a hangout is open for joining (not closed and current time is before start)
    function isHangoutOpenForJoining(
        uint256 _hangoutId
    ) external view returns (bool) {
        Hangouts storage hangout = hangouts[_hangoutId];
        return !hangout.isClosed && block.timestamp < hangout.startTime;
    }

    // Check if a hangout has ended and can be closed
    function canCloseHangout(uint256 _hangoutId) external view returns (bool) {
        Hangouts storage hangout = hangouts[_hangoutId];
        return !hangout.isClosed && block.timestamp > hangout.endTime;
    }
}