// SPDX-License-Identifier: MIT
pragma solidity 0.8.30;

import "forge-std/Test.sol";
import "forge-std/console.sol";
import "./ProofOfChill.sol";

contract ProofOfChillTest is Test {
    ProofOfChill public proofOfChill;
    address public creator;
    address public user1;
    address public user2;
    address public user3;
    address public user4;

    uint256 public wrdAmount = 2 ether; // 1 WLD token

    // Setup function runs before each test
    function setUp() public {
        // Deploy the contract
        proofOfChill = new ProofOfChill();

        // Set up test addresses
        creator = address(this);
        user1 = address(0x1);
        user2 = address(0x2);
        user3 = address(0x3);

        // Give each test user some ether
        vm.deal(user1, 10 ether);
        vm.deal(user2, 10 ether);
        vm.deal(user3, 10 ether);
    }

    function testCreateHangout() public {
        vm.prank(creator);
        proofOfChill.createHangout(
            "Hangout 1",
            1,
            block.timestamp + 1 hours,
            block.timestamp + 2 hours
        );
        assertEq(proofOfChill.getTotalHangoutsCount(), 1);
    }

    function test_InvitePeople() public {
        // Create a hangout first
        vm.prank(creator);
        proofOfChill.createHangout(
            "Hangout 1",
            wrdAmount,
            block.timestamp + 1 hours,
            block.timestamp + 2 hours
        );

        // Creator joins their own hangout first
        vm.startPrank(creator);
        proofOfChill.joinHangout(0, wrdAmount);
        
        // Now creator can invite users
        proofOfChill.inviteToHangout(0, user1);
        proofOfChill.inviteToHangout(0, user2);
        proofOfChill.inviteToHangout(0, user3);
        vm.stopPrank();
        uint256[] memory user1Invites = proofOfChill.getUserInvitedHangouts(
            user1
        );
        uint256[] memory user2Invites = proofOfChill.getUserInvitedHangouts(
            user2
        );
        uint256[] memory user3Invites = proofOfChill.getUserInvitedHangouts(
            user3
        );

        assertEq(user1Invites.length, 1, "User1 should have 1 invited hangout");
        assertEq(user2Invites.length, 1, "User2 should have 1 invited hangout");
        assertEq(user3Invites.length, 1, "User3 should have 1 invited hangout");

        assertEq(user1Invites[0], 0, "User1 should be invited to hangout 0");
        assertEq(user2Invites[0], 0, "User2 should be invited to hangout 0");
        assertEq(user3Invites[0], 0, "User3 should be invited to hangout 0");
    }

    function test_liststuff() public {
        // First run the invite people test to set up the hangout and invites
        test_InvitePeople();
		
        // Have some users join the hangout
        vm.startPrank(user1);
        proofOfChill.joinHangout(0, wrdAmount);
        vm.stopPrank();

        vm.startPrank(user2);
        proofOfChill.joinHangout(0, wrdAmount);
        vm.stopPrank();

        // Get hangout details
        (
            string memory name,
            address hangoutCreator,
            uint256 amount,
            uint256 startTime,
            uint256 endTime,
            bool isClosed,
            uint256 participantCount,
            address[] memory participants,
            address[] memory invited
        ) = proofOfChill.getHangoutDetails(0);

        // Verify basic hangout details
		startTime;
		
        assertEq(name, "Hangout 1", "Hangout name should match");
        assertEq(hangoutCreator, creator, "Creator should match");
        assertEq(amount, wrdAmount, "WRD amount should match");
        assertEq(isClosed, false, "Hangout should not be closed");
        assertEq(
            participantCount,
            3,
            "Participant count should be 3 (creator + 2 joined users)"
        );

        // Verify participants array
        assertEq(participants.length, 3, "Should have 3 participants");
        // Since creator joins first, then user1, then user2
        assertEq(
            participants[0],
            creator,
            "First participant should be creator"
        );
        assertEq(participants[1], user1, "Second participant should be user1");
        assertEq(participants[2], user2, "Third participant should be user2");

        // Verify invited array - only user3 should remain in invited array since user1 and user2 joined
        assertEq(invited.length, 1, "Should have 1 invited user left");
        assertEq(invited[0], user3, "Only invited user should be user3");

        // Log details for debugging
        console.log("Hangout name:", name);
        console.log("Creator:", hangoutCreator);
        console.log("WRD amount:", amount);
        console.log("Participant count:", participantCount);
        console.log("Participants array length:", participants.length);
        console.log("Invited array length:", invited.length);
        
        // Log participants addresses
        console.log("\nParticipants:");
        for (uint i = 0; i < participants.length; i++) {
            console.log("Participant", i, ":", participants[i]);
        }
        
        // Log invited addresses
        console.log("\nInvited users:");
        for (uint i = 0; i < invited.length; i++) {
            console.log("Invited", i, ":", invited[i]);
        }
    }
}